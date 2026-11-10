const mongoose = require("mongoose");
const HotelProperty = require("../models/hotelProperty.model");
const { sendSuccess, sendError } = require("../utils/responseHelper");

// Helper to compute Levenshtein distance for typo-tolerant matching
const levenshtein = (a, b) => {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = [];
  for (let i = 0; i <= bn; i++) matrix[i] = [i];
  for (let j = 0; j <= an; j++) matrix[0][j] = j;
  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1).toLowerCase() === a.charAt(j - 1).toLowerCase()) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[bn][an];
};

// Check if query fuzzily matches target text (allowing 1-2 character typos)
const isFuzzyMatch = (query, target) => {
  if (!query || !target) return false;
  const q = String(query).toLowerCase().trim();
  const t = String(target).toLowerCase().trim();
  if (t.includes(q)) return true;

  const tWords = t.split(/[^a-z0-9]+/i).filter(Boolean);
  const qWords = q.split(/[^a-z0-9]+/i).filter(Boolean);
  if (qWords.length === 0) return false;

  return qWords.every((qw) =>
    tWords.some((tw) => {
      if (tw.includes(qw) || (tw.length >= 3 && qw.includes(tw))) return true;
      const maxDist = qw.length <= 4 ? 1 : 2;
      return levenshtein(qw, tw) <= maxDist;
    })
  );
};

// Score and rank hotels so exact and prefix matches rank highest
const calculateMatchScore = (query, hotel) => {
  const q = String(query).toLowerCase().trim();
  const name = String(hotel.hotelName || '').toLowerCase().trim();
  const city = String(hotel.city || '').toLowerCase().trim();
  const addr = String(hotel.hotelAddress || '').toLowerCase().trim();

  let score = 0;
  if (name === q) score += 2000;
  else if (name.startsWith(q)) score += 1500;
  else if (name.includes(q)) score += 1000;

  if (city === q) score += 800;
  else if (city.startsWith(q)) score += 600;
  else if (city.includes(q)) score += 400;

  if (addr.includes(q)) score += 300;

  // Typo tolerance match score
  if (score === 0) {
    if (isFuzzyMatch(q, name)) score += 200;
    else if (isFuzzyMatch(q, city)) score += 150;
    else if (isFuzzyMatch(q, addr)) score += 100;
  }

  return score;
};

// Helper to find a hotel by MongoDB _id or hotelPropertyId
const findHotelById = async (id) => {
  let item = null;
  if (mongoose.isValidObjectId(id)) {
    item = await HotelProperty.findById(id);
  }
  if (!item) {
    item = await HotelProperty.findOne({ hotelPropertyId: id });
  }
  return item;
};

// GET /api/hotel-properties/public
// Public Guest API: Strictly returns ONLY approved hotels directly from database query
const getPublic = async (req, res) => {
  try {
    const items = await HotelProperty.find({ status: "approved" }).sort({ createdAt: -1 });
    sendSuccess(res, items);
  } catch (err) {
    sendError(res, err.message);
  }
};

// GET /api/hotel-properties/pending
// Super Admin only: Returns all pending hotel submissions
const getPending = async (req, res) => {
  try {
    const items = await HotelProperty.find({ status: "pending" }).sort({ createdAt: -1 });
    sendSuccess(res, items);
  } catch (err) {
    sendError(res, err.message);
  }
};

// GET /api/hotel-properties/search?q=...&status=...&hotelAdminId=...&limit=8
const search = async (req, res) => {
  try {
    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";

    const { q, query, status, limit = 8 } = req.query;
    const searchParam = (q || query || "").trim();

    // Do not return suggestions if query is less than 2 characters
    if (searchParam.length < 2) {
      return sendSuccess(res, []);
    }

    const baseFilter = {};

    // Multi-tenant isolation: clientadmin can only search within their own hotels
    if (!isSuperAdmin) {
      if (!caller.hotelAdminId) {
        return sendError(res, "Forbidden: No hotelAdminId associated with session", 403);
      }
      baseFilter.hotelAdminId = caller.hotelAdminId;
    } else {
      if (req.query.hotelAdminId) {
        baseFilter.hotelAdminId = req.query.hotelAdminId;
      }
    }

    if (status) baseFilter.status = status;

    const maxLimit = Math.min(Math.max(parseInt(limit, 10) || 8, 1), 50);

    // Escape regex special chars to prevent regex injection
    const escaped = searchParam.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");

    // 1. Direct Regex Match across hotelName, city, hotelAddress, hotelPropertyId
    const directFilter = {
      ...baseFilter,
      $or: [
        { hotelName: regex },
        { city: regex },
        { hotelAddress: regex },
        { hotelPropertyId: regex },
      ],
    };

    const directItems = await HotelProperty.find(directFilter).lean();

    // Map by unique ID to avoid duplicates
    const itemMap = new Map();
    for (const item of directItems) {
      const key = String(item.hotelPropertyId || item._id);
      itemMap.set(key, item);
    }

    // 2. Multi-word token match if search query has multiple words (e.g. "Royal Spa")
    const words = searchParam.split(/\s+/).filter((w) => w.length > 1);
    if (words.length > 1 && itemMap.size < maxLimit) {
      const tokenConditions = words.map((w) => {
        const escW = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const wRegex = new RegExp(escW, "i");
        return {
          $or: [
            { hotelName: wRegex },
            { city: wRegex },
            { hotelAddress: wRegex },
          ],
        };
      });

      const tokenItems = await HotelProperty.find({
        ...baseFilter,
        $and: tokenConditions,
      }).lean();

      for (const item of tokenItems) {
        const key = String(item.hotelPropertyId || item._id);
        if (!itemMap.has(key)) {
          itemMap.set(key, item);
        }
      }
    }

    // 3. Typo-tolerant fuzzy matching (e.g., "mngo" -> "mango", "emrald" -> "emerald")
    // If fewer than maxLimit results are found, evaluate candidate hotels
    if (itemMap.size < maxLimit) {
      const candidateHotels = await HotelProperty.find(baseFilter).limit(100).lean();
      for (const candidate of candidateHotels) {
        const key = String(candidate.hotelPropertyId || candidate._id);
        if (itemMap.has(key)) continue;

        if (
          isFuzzyMatch(searchParam, candidate.hotelName) ||
          isFuzzyMatch(searchParam, candidate.city) ||
          isFuzzyMatch(searchParam, candidate.hotelAddress)
        ) {
          itemMap.set(key, candidate);
        }
      }
    }

    // 4. Rank items so exact and prefix matches appear on top
    const allResults = Array.from(itemMap.values());
    allResults.sort((a, b) => {
      const scoreA = calculateMatchScore(searchParam, a);
      const scoreB = calculateMatchScore(searchParam, b);
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    const finalItems = allResults.slice(0, maxLimit);
    sendSuccess(res, finalItems);
  } catch (err) {
    sendError(res, err.message);
  }
};

// GET /api/hotel-properties?status=xxx&search=xxx
const getAll = async (req, res) => {
  try {
    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";

    const { status, search: searchQ, q } = req.query;
    const filter = {};

    // Multi-tenant isolation: clientadmin can only list their own hotels
    if (!isSuperAdmin) {
      if (!caller.hotelAdminId) {
        return sendError(res, "Forbidden: No hotelAdminId associated with session", 403);
      }
      filter.hotelAdminId = caller.hotelAdminId;
    } else {
      // Super Admin may optionally filter by hotelAdminId if provided in query
      if (req.query.hotelAdminId) {
        filter.hotelAdminId = req.query.hotelAdminId;
      }
    }

    if (status) filter.status = status;

    const searchTerm = (searchQ || q || "").trim();
    if (searchTerm) {
      const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [
        { hotelName: regex },
        { city: regex },
        { hotelAddress: regex },
        { hotelPropertyId: regex },
      ];
    }

    const items = await HotelProperty.find(filter).sort({ createdAt: -1 });
    sendSuccess(res, items);
  } catch (err) {
    sendError(res, err.message);
  }
};

// GET /api/hotel-properties/:id
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await findHotelById(id);
    if (!item) return sendError(res, "Not found", 404);

    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";

    // Multi-tenant isolation: clientadmin can only view their own hotel details
    if (!isSuperAdmin) {
      if (!caller.hotelAdminId || item.hotelAdminId !== caller.hotelAdminId) {
        return sendError(res, "Forbidden: You are not authorized to access this hotel property", 403);
      }
    }

    sendSuccess(res, item);
  } catch (err) {
    sendError(res, err.message);
  }
};

// POST /api/hotel-properties
const create = async (req, res) => {
  try {
    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";

    const payload = { ...req.body };

    // Enforce ownership: Non-superadmin cannot forge another owner's ID
    if (!isSuperAdmin) {
      payload.hotelAdminId = caller.hotelAdminId;
      payload.status = "pending"; // Always submitted as pending
      payload.rejectionReason = "";
    } else {
      payload.hotelAdminId = payload.hotelAdminId || caller.hotelAdminId || "admin";
      payload.status = payload.status || "approved";
    }

    if (!payload.hotelPropertyId) {
      payload.hotelPropertyId = String(Date.now());
    }

    const item = await HotelProperty.create(payload);
    sendSuccess(res, item, 201);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

// PUT /api/hotel-properties/:id
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";

    const existing = await findHotelById(id);
    if (!existing) return sendError(res, "Not found", 404);

    // Ownership security check: Hotel Owners can only modify their OWN hotel
    if (!isSuperAdmin && existing.hotelAdminId !== caller.hotelAdminId) {
      return sendError(res, "Forbidden: You are not authorized to modify this hotel property", 403);
    }

    const updateData = { ...req.body };

    // Prevent non-superadmin from self-approving or changing owner
    if (!isSuperAdmin) {
      delete updateData.hotelAdminId;
      // When hotel owner updates their hotel details, submit for re-approval as pending
      updateData.status = "pending";
      updateData.rejectionReason = "";
    }

    const updated = await HotelProperty.findByIdAndUpdate(existing._id, updateData, {
      new: true,
      runValidators: true,
    });

    sendSuccess(res, updated);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

// DELETE /api/hotel-properties/:id
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";

    const existing = await findHotelById(id);
    if (!existing) return sendError(res, "Not found", 404);

    // Ownership security check
    if (!isSuperAdmin && existing.hotelAdminId !== caller.hotelAdminId) {
      return sendError(res, "Forbidden: You are not authorized to delete this hotel property", 403);
    }

    await HotelProperty.findByIdAndDelete(existing._id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, err.message);
  }
};

// PATCH /api/hotel-properties/:id/approve
// Super Admin only: Approves hotel submission so it becomes publicly visible to guests
const approve = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await findHotelById(id);
    if (!existing) return sendError(res, "Not found", 404);

    existing.status = "approved";
    existing.rejectionReason = "";
    await existing.save();

    sendSuccess(res, existing);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

// PATCH /api/hotel-properties/:id/reject
// Super Admin only: Rejects hotel submission with an explanation
const reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const existing = await findHotelById(id);
    if (!existing) return sendError(res, "Not found", 404);

    existing.status = "rejected";
    existing.rejectionReason = (rejectionReason && String(rejectionReason).trim()) || "Submission does not meet portal criteria";
    await existing.save();

    sendSuccess(res, existing);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};


// GET /api/hotel-properties/discover?q=...&limit=8
// Discovers real hotels worldwide via Google Places API (New)
const discover = async (req, res) => {
  try {
    const { q, query, limit = 8 } = req.query;
    const searchParam = (q || query || "").trim();

    if (searchParam.length < 2) {
      return sendSuccess(res, { configured: true, results: [] });
    }

    const apiKey = (process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "").trim();
    if (!apiKey || apiKey.startsWith("dummy") || apiKey.startsWith("your_")) {
      return sendSuccess(res, {
        configured: false,
        message: "Google Places API key is not configured in backend/.env (GOOGLE_PLACES_API_KEY). To discover external hotels (e.g. Taj, Marriott, Hyatt), please add your valid Google Places API key to backend/.env.",
        results: [],
      });
    }

    const maxLimit = Math.min(Math.max(parseInt(limit, 10) || 8, 1), 20);
    const googleEndpoint = "https://places.googleapis.com/v1/places:searchText";
    const fieldMask = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.location",
      "places.rating",
      "places.userRatingCount",
      "places.photos",
      "places.types",
      "places.internationalPhoneNumber",
      "places.websiteUri",
    ].join(",");

    const response = await fetch(googleEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify({
        textQuery: `${searchParam} hotel`,
        maxResultCount: maxLimit,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson.error?.message || `Google Places API returned status ${response.status}`;
      return sendSuccess(res, {
        configured: true,
        error: errMsg,
        message: `Google Places API Error: ${errMsg}`,
        results: [],
      });
    }

    const data = await response.json();
    const rawPlaces = data.places || [];

    // Query registered hotels to prevent duplicate registrations
    const registeredHotels = await HotelProperty.find({}).lean();
    const registeredNameSet = new Set(
      registeredHotels.map((h) => String(h.hotelName || "").toLowerCase().trim())
    );
    const registeredIdSet = new Set(
      registeredHotels.map((h) => String(h.hotelPropertyId || "").trim())
    );

    const formatted = rawPlaces.map((p) => {
      const name = p.displayName?.text || "Unknown Hotel";
      const address = p.formattedAddress || "";
      const addressParts = address.split(",");
      const city = addressParts.length >= 3 ? addressParts[addressParts.length - 3].trim() : (addressParts[0] || "");
      const photoRef = p.photos && p.photos.length > 0 ? p.photos[0].name : null;
      const photoProxyUrl = photoRef ? `/api/hotel-properties/place-photo?ref=${encodeURIComponent(photoRef)}` : null;

      const normName = name.toLowerCase().trim();
      const isAlreadyRegistered = registeredNameSet.has(normName) || registeredIdSet.has(p.id);

      return {
        placeId: p.id,
        name: name,
        address: address,
        city: city,
        latitude: p.location?.latitude || null,
        longitude: p.location?.longitude || null,
        rating: p.rating || null,
        userRatingCount: p.userRatingCount || null,
        photoUrl: photoProxyUrl,
        photos: (p.photos || []).slice(0, 8).map((ph) => `/api/hotel-properties/place-photo?ref=${encodeURIComponent(ph.name)}`),
        websiteUrl: p.websiteUri || null,
        phone: p.internationalPhoneNumber || null,
        source: "google_places",
        isRegistered: isAlreadyRegistered,
      };
    });

    sendSuccess(res, {
      configured: true,
      message: `Discovered ${formatted.length} hotels via Google Places API`,
      results: formatted,
    });
  } catch (err) {
    sendError(res, err.message);
  }
};

// GET /api/hotel-properties/place-details/:placeId
const getPlaceDetails = async (req, res) => {
  try {
    const { placeId } = req.params;
    if (!placeId) return sendError(res, "Place ID is required", 400);

    const apiKey = (process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "").trim();
    if (!apiKey || apiKey.startsWith("dummy") || apiKey.startsWith("your_")) {
      return sendError(res, "Google Places API key is not configured in backend/.env", 400);
    }

    const fieldMask = [
      "id",
      "displayName",
      "formattedAddress",
      "location",
      "rating",
      "userRatingCount",
      "websiteUri",
      "internationalPhoneNumber",
      "regularOpeningHours",
      "photos",
    ].join(",");

    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      return sendError(res, errJson.error?.message || "Failed to fetch place details from Google Places", 400);
    }

    const p = await response.json();
    const name = p.displayName?.text || "Unknown Hotel";
    const address = p.formattedAddress || "";
    const addressParts = address.split(",");
    const city = addressParts.length >= 3 ? addressParts[addressParts.length - 3].trim() : (addressParts[0] || "");
    const photos = (p.photos || []).slice(0, 8).map((ph, idx) => ({
      id: String(Date.now() + idx),
      url: `/api/hotel-properties/place-photo?ref=${encodeURIComponent(ph.name)}`,
      caption: `Hotel Photo ${idx + 1}`,
    }));

    sendSuccess(res, {
      placeId: p.id,
      name: name,
      title: name,
      address: address,
      city: city,
      latitude: p.location?.latitude || null,
      longitude: p.location?.longitude || null,
      rating: p.rating || null,
      phone: p.internationalPhoneNumber || null,
      websiteUrl: p.websiteUri || null,
      photos: photos,
      images: photos.map((ph) => ph.url),
      imageLink: photos[0]?.url || "",
      source: "google_places",
    });
  } catch (err) {
    sendError(res, err.message);
  }
};

// GET /api/hotel-properties/place-photo?ref=...
// Streams the photo while keeping the private API key on the backend
const getPlacePhoto = async (req, res) => {
  try {
    const { ref } = req.query;
    if (!ref) return sendError(res, "Photo ref required", 400);

    const apiKey = (process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "").trim();
    if (!apiKey) return sendError(res, "Google Places API key is not configured", 400);

    const googlePhotoUrl = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=1200&key=${apiKey}`;
    const imgRes = await fetch(googlePhotoUrl);

    if (!imgRes.ok) {
      return res.status(imgRes.status).send("Failed to fetch photo from Google Places");
    }

    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400"); // 24-hour client cache

    const arrayBuffer = await imgRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    sendError(res, err.message);
  }
};

module.exports = {
  getPublic,
  getPending,
  getAll,
  search,
  discover,
  getPlaceDetails,
  getPlacePhoto,
  getById,
  create,
  update,
  remove,
  approve,
  reject,
};
