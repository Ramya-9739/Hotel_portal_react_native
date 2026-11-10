// =============================================================================
// backend/controllers/touristDestination.controller.js
// Centralized Controller for Global Tourist Destinations (Super Admin Managed)
// =============================================================================

const mongoose = require("mongoose");
const TouristDestination = require("../models/touristDestination.model");
const { sendSuccess, sendError } = require("../utils/responseHelper");

/**
 * Helper: Validate that an image is not a raw Base64 payload.
 */
function isBase64Image(str) {
  if (!str || typeof str !== "string") return false;
  return str.startsWith("data:image/") || (str.length > 1000 && !str.startsWith("http://") && !str.startsWith("https://") && !str.startsWith("/uploads/"));
}

/**
 * 1. GET /api/tourist-destinations/public
 * Public read-only listing of active destinations for guest portal.
 * Filters by state, city, category, or search keyword.
 * Strictly returns only isActive: true records.
 */
const getPublic = async (req, res) => {
  try {
    const { state, city, category, search } = req.query;
    const filter = { isActive: true, isDeleted: { $ne: true } };

    if (state && typeof state === "string" && state.trim()) {
      filter.state = { $regex: new RegExp(`^${state.trim()}$`, "i") };
    }
    if (city && typeof city === "string" && city.trim()) {
      filter.city = { $regex: new RegExp(`^${city.trim()}$`, "i") };
    }
    if (category && typeof category === "string" && category.trim()) {
      filter.category = { $regex: new RegExp(`^${category.trim()}$`, "i") };
    }
    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { city: { $regex: q, $options: "i" } },
        { state: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { address: { $regex: q, $options: "i" } },
      ];
    }

    const items = await TouristDestination.find(filter)
      .select("destinationId name state city description category address latitude longitude timings entryFee imageLink images rating createdAt")
      .sort({ state: 1, city: 1, name: 1 })
      .lean();

    return sendSuccess(res, items);
  } catch (err) {
    return sendError(res, err.message);
  }
};

/**
 * 2. GET /api/tourist-destinations/admin
 * Directory listing for Super Admin and Hotel Admin (read-only for hotel admin).
 * Super Admin sees both active and inactive destinations.
 */
const getAdminAll = async (req, res) => {
  try {
    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";

    const { state, city, category, isActive, search, includeDeleted } = req.query;
    const filter = {};

    if (includeDeleted !== "true") {
      filter.isDeleted = { $ne: true };
    }

    // Hotel Admins can only see active destinations in admin view
    if (!isSuperAdmin) {
      filter.isActive = true;
    } else if (isActive !== undefined && isActive !== null && isActive !== "") {
      filter.isActive = String(isActive) === "true";
    }

    if (state && typeof state === "string" && state.trim()) {
      filter.state = { $regex: new RegExp(`^${state.trim()}$`, "i") };
    }
    if (city && typeof city === "string" && city.trim()) {
      filter.city = { $regex: new RegExp(`^${city.trim()}$`, "i") };
    }
    if (category && typeof category === "string" && category.trim()) {
      filter.category = { $regex: new RegExp(`^${category.trim()}$`, "i") };
    }
    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { city: { $regex: q, $options: "i" } },
        { state: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { address: { $regex: q, $options: "i" } },
      ];
    }

    const items = await TouristDestination.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, items);
  } catch (err) {
    return sendError(res, err.message);
  }
};

/**
 * 3. GET /api/tourist-destinations/:id
 * Retrieve a single destination by destinationId or _id.
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    let item = null;
    if (mongoose.isValidObjectId(id)) {
      item = await TouristDestination.findById(id).lean();
    }
    if (!item) {
      item = await TouristDestination.findOne({ destinationId: id }).lean();
    }
    if (!item) {
      return sendError(res, "Tourist destination not found", 404);
    }
    return sendSuccess(res, item);
  } catch (err) {
    return sendError(res, err.message);
  }
};

/**
 * 4. POST /api/tourist-destinations
 * Create a new global tourist destination.
 * Strictly Super Admin only.
 */
const create = async (req, res) => {
  try {
    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";
    if (!isSuperAdmin) {
      return sendError(res, "Forbidden: Super Admin privileges required to create global destinations", 403);
    }

    const {
      name,
      state,
      city,
      description,
      category,
      address,
      latitude,
      longitude,
      timings,
      entryFee,
      imageLink,
      images,
      rating,
      isActive,
    } = req.body;

    // Required fields validation
    if (!name || !name.trim()) {
      return sendError(res, "Destination name is required", 400);
    }
    if (!state || !state.trim()) {
      return sendError(res, "Indian state is required", 400);
    }
    if (!city || !city.trim()) {
      return sendError(res, "City is required", 400);
    }

    // Coordinate validation
    let validLat = null;
    if (latitude !== undefined && latitude !== null && latitude !== "") {
      validLat = Number(latitude);
      if (isNaN(validLat) || validLat < -90 || validLat > 90) {
        return sendError(res, "Latitude must be a valid number between -90 and 90 degrees", 400);
      }
    }

    let validLng = null;
    if (longitude !== undefined && longitude !== null && longitude !== "") {
      validLng = Number(longitude);
      if (isNaN(validLng) || validLng < -180 || validLng > 180) {
        return sendError(res, "Longitude must be a valid number between -180 and 180 degrees", 400);
      }
    }

    // Base64 image rejection
    if (isBase64Image(imageLink)) {
      return sendError(res, "Base64 images are not supported in MongoDB. Please provide an image URL.", 400);
    }
    if (Array.isArray(images) && images.some(isBase64Image)) {
      return sendError(res, "Base64 images are not supported in MongoDB. Please provide image URLs.", 400);
    }

    // Accidental duplicate prevention
    const trimmedName = name.trim();
    const trimmedCity = city.trim();
    const trimmedState = state.trim();

    const existing = await TouristDestination.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
      city: { $regex: new RegExp(`^${trimmedCity}$`, "i") },
      state: { $regex: new RegExp(`^${trimmedState}$`, "i") },
    });

    if (existing) {
      return sendError(
        res,
        `A destination named "${trimmedName}" already exists in ${trimmedCity}, ${trimmedState}`,
        400
      );
    }

    // Generate unique destinationId
    const destinationId = `dest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdBy = caller.username || caller.hotelAdminId || "superadmin";

    const newDest = await TouristDestination.create({
      destinationId,
      name: trimmedName,
      state: trimmedState,
      city: trimmedCity,
      description: (description || "").trim(),
      category: (category || "Heritage & Palaces").trim(),
      address: (address || "").trim(),
      latitude: validLat,
      longitude: validLng,
      timings: (timings || "Open Daily").trim(),
      entryFee: (entryFee || "Verified on entry").trim(),
      imageLink: (imageLink || "").trim(),
      images: Array.isArray(images) ? images.filter((img) => !isBase64Image(img)) : [],
      rating: Number(rating) || 4.8,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdBy,
    });

    return sendSuccess(res, newDest, 201);
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, "Duplicate destination record detected", 400);
    }
    return sendError(res, err.message, 400);
  }
};

/**
 * 5. PUT /api/tourist-destinations/:id
 * Update an existing global tourist destination.
 * Strictly Super Admin only.
 */
const update = async (req, res) => {
  try {
    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";
    if (!isSuperAdmin) {
      return sendError(res, "Forbidden: Super Admin privileges required to update global destinations", 403);
    }

    const { id } = req.params;
    let existing = null;
    if (mongoose.isValidObjectId(id)) {
      existing = await TouristDestination.findById(id);
    }
    if (!existing) {
      existing = await TouristDestination.findOne({ destinationId: id });
    }
    if (!existing) {
      return sendError(res, "Tourist destination not found", 404);
    }

    const {
      name,
      state,
      city,
      description,
      category,
      address,
      latitude,
      longitude,
      timings,
      entryFee,
      imageLink,
      images,
      rating,
      isActive,
    } = req.body;

    const targetName = name !== undefined ? name.trim() : existing.name;
    const targetCity = city !== undefined ? city.trim() : existing.city;
    const targetState = state !== undefined ? state.trim() : existing.state;

    // Check duplicate if name/city/state changed
    if (
      targetName.toLowerCase() !== existing.name.toLowerCase() ||
      targetCity.toLowerCase() !== existing.city.toLowerCase() ||
      targetState.toLowerCase() !== existing.state.toLowerCase()
    ) {
      const duplicate = await TouristDestination.findOne({
        _id: { $ne: existing._id },
        name: { $regex: new RegExp(`^${targetName}$`, "i") },
        city: { $regex: new RegExp(`^${targetCity}$`, "i") },
        state: { $regex: new RegExp(`^${targetState}$`, "i") },
      });
      if (duplicate) {
        return sendError(
          res,
          `A destination named "${targetName}" already exists in ${targetCity}, ${targetState}`,
          400
        );
      }
    }

    // Coordinate validation
    if (latitude !== undefined && latitude !== null && latitude !== "") {
      const validLat = Number(latitude);
      if (isNaN(validLat) || validLat < -90 || validLat > 90) {
        return sendError(res, "Latitude must be a valid number between -90 and 90 degrees", 400);
      }
      existing.latitude = validLat;
    } else if (latitude === null || latitude === "") {
      existing.latitude = null;
    }

    if (longitude !== undefined && longitude !== null && longitude !== "") {
      const validLng = Number(longitude);
      if (isNaN(validLng) || validLng < -180 || validLng > 180) {
        return sendError(res, "Longitude must be a valid number between -180 and 180 degrees", 400);
      }
      existing.longitude = validLng;
    } else if (longitude === null || longitude === "") {
      existing.longitude = null;
    }

    // Base64 image rejection
    if (isBase64Image(imageLink)) {
      return sendError(res, "Base64 images are not supported in MongoDB. Please provide an image URL.", 400);
    }
    if (Array.isArray(images) && images.some(isBase64Image)) {
      return sendError(res, "Base64 images are not supported in MongoDB. Please provide image URLs.", 400);
    }

    if (name !== undefined) existing.name = targetName;
    if (state !== undefined) existing.state = targetState;
    if (city !== undefined) existing.city = targetCity;
    if (description !== undefined) existing.description = (description || "").trim();
    if (category !== undefined) existing.category = (category || "").trim();
    if (address !== undefined) existing.address = (address || "").trim();
    if (timings !== undefined) existing.timings = (timings || "").trim();
    if (entryFee !== undefined) existing.entryFee = (entryFee || "").trim();
    if (imageLink !== undefined) existing.imageLink = (imageLink || "").trim();
    if (images !== undefined && Array.isArray(images)) {
      existing.images = images.filter((img) => !isBase64Image(img));
    }
    if (rating !== undefined) existing.rating = Number(rating) || 4.8;
    if (isActive !== undefined) existing.isActive = Boolean(isActive);

    await existing.save();
    return sendSuccess(res, existing);
  } catch (err) {
    return sendError(res, err.message, 400);
  }
};

/**
 * 6. PATCH /api/tourist-destinations/:id/status
 * Activate / Deactivate a global destination.
 * Strictly Super Admin only.
 */
const toggleStatus = async (req, res) => {
  try {
    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";
    if (!isSuperAdmin) {
      return sendError(res, "Forbidden: Super Admin privileges required to toggle status", 403);
    }

    const { id } = req.params;
    let existing = null;
    if (mongoose.isValidObjectId(id)) {
      existing = await TouristDestination.findById(id);
    }
    if (!existing) {
      existing = await TouristDestination.findOne({ destinationId: id });
    }
    if (!existing) {
      return sendError(res, "Tourist destination not found", 404);
    }

    const { isActive } = req.body;
    existing.isActive = isActive !== undefined ? Boolean(isActive) : !existing.isActive;
    await existing.save();

    return sendSuccess(res, {
      destinationId: existing.destinationId,
      name: existing.name,
      isActive: existing.isActive,
    });
  } catch (err) {
    return sendError(res, err.message, 400);
  }
};

/**
 * 7. DELETE /api/tourist-destinations/:id
 * Reversible deactivation/archival of a global tourist destination.
 * Strictly Super Admin only.
 * Defaults to safe, reversible deactivation (isDeleted: true, isActive: false).
 * Optional ?permanent=true allows hard deletion if explicitly commanded.
 */
const remove = async (req, res) => {
  try {
    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";
    if (!isSuperAdmin) {
      return sendError(res, "Forbidden: Super Admin privileges required to delete global destinations", 403);
    }

    const { id } = req.params;
    const { permanent } = req.query;

    let existing = null;
    if (mongoose.isValidObjectId(id)) {
      existing = await TouristDestination.findById(id);
    }
    if (!existing) {
      existing = await TouristDestination.findOne({ destinationId: id });
    }
    if (!existing) {
      return sendError(res, "Tourist destination not found", 404);
    }

    if (permanent === "true") {
      // Explicit permanent hard delete
      await TouristDestination.findByIdAndDelete(existing._id);
      return sendSuccess(res, {
        deleted: true,
        permanent: true,
        destinationId: existing.destinationId,
        message: "Destination permanently deleted from database",
      });
    }

    // Default: Safe, reversible deactivation & archival preserving database records
    existing.isActive = false;
    existing.isDeleted = true;
    await existing.save();

    return sendSuccess(res, {
      deleted: true,
      reversible: true,
      destinationId: existing.destinationId,
      name: existing.name,
      isActive: false,
      isDeleted: true,
      message: "Destination safely deactivated and archived (reversible, not permanently destroyed)",
    });
  } catch (err) {
    return sendError(res, err.message);
  }
};

module.exports = {
  getPublic,
  getAdminAll,
  getById,
  create,
  update,
  toggleStatus,
  remove,
};

