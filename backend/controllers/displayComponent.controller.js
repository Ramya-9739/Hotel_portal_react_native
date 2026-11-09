const mongoose = require("mongoose");
const DisplayComponent = require("../models/displayComponent.model");
const { sendSuccess, sendError } = require("../utils/responseHelper");

const HotelProperty = require("../models/hotelProperty.model");

// GET /display-components?hotelPropertyId=xxx&category=xxx&componentTypeId=xxx
const getAll = async (req, res) => {
  try {
    const caller = req.hotelAdmin;
    const isSuperAdmin = caller && String(caller.role || "").toLowerCase() === "superadmin";
    const isClientAdmin = caller && !isSuperAdmin;

    const { hotelPropertyId, category, componentTypeId } = req.query;
    const filter = {};
    if (category) {
      const c = String(category).toLowerCase();
      if (c === 'dining' || c === 'restaurants' || c === 'restaurant') {
        filter.category = { $in: ['dining', 'restaurants', 'restaurant'] };
      } else if (c === 'takeaway' || c === 'takeaways') {
        filter.category = { $in: ['takeaway', 'takeaways'] };
      } else if (c === 'pools' || c === 'swimming_pools' || c === 'pool') {
        filter.category = { $in: ['pools', 'swimming_pools', 'pool'] };
      } else if (c === 'delivery' || c === 'homedelivery' || c === 'home_delivery') {
        filter.category = { $in: ['delivery', 'homeDelivery', 'home_delivery', 'homedelivery'] };
      } else if (c === 'gyms' || c === 'gym' || c === 'fitness' || c === 'wellness') {
        filter.category = { $in: ['gyms', 'gym', 'wellness', 'fitness'] };
      } else {
        filter.category = category;
      }
    }
    if (componentTypeId) filter.componentTypeId = Number(componentTypeId);

    if (isClientAdmin) {
      // Authenticated clientadmin: multi-tenant isolation restricts to caller's owned hotels
      const ownedHotels = await HotelProperty.find({ hotelAdminId: caller.hotelAdminId }).select('hotelPropertyId _id');
      const ownedIds = ownedHotels.flatMap((h) => [String(h.hotelPropertyId), String(h._id)]).filter(Boolean);

      if (hotelPropertyId) {
        const hpStr = String(hotelPropertyId);
        const ownsTarget = ownedHotels.some(
          (h) => String(h.hotelPropertyId) === hpStr || String(h._id) === hpStr
        );
        if (!ownsTarget) {
          return sendError(res, "Forbidden: You are not authorized to view components of this hotel property", 403);
        }
        filter.hotelPropertyId = { $in: [hpStr] };
      } else {
        filter.hotelPropertyId = { $in: ownedIds };
      }

      const items = await DisplayComponent.find(filter).sort({ createdAt: -1 });
      return sendSuccess(res, items);
    }

    if (isSuperAdmin) {
      // Super Admin: platform-wide access, optional hotel filter
      if (hotelPropertyId) {
        filter.hotelPropertyId = String(hotelPropertyId);
      }
      const items = await DisplayComponent.find(filter).sort({ createdAt: -1 });
      return sendSuccess(res, items);
    }

    // Unauthenticated Guest:
    if (hotelPropertyId) {
      const targetHotel = await HotelProperty.findOne({
        $or: [
          { hotelPropertyId: String(hotelPropertyId) },
          ...(mongoose.isValidObjectId(hotelPropertyId) ? [{ _id: hotelPropertyId }] : [])
        ]
      });
      if (!targetHotel || targetHotel.status !== "approved") {
        return sendSuccess(res, []);
      }
      filter.hotelPropertyId = { $in: [String(targetHotel.hotelPropertyId), String(targetHotel._id)] };
      const items = await DisplayComponent.find(filter).sort({ createdAt: -1 });
      return sendSuccess(res, items);
    }

    // Unauthenticated request without hotelPropertyId: only show components of approved hotels
    const approvedHotels = await HotelProperty.find({ status: "approved" }).select('hotelPropertyId _id');
    const approvedIds = approvedHotels.flatMap((h) => [String(h.hotelPropertyId), String(h._id)]).filter(Boolean);
    filter.hotelPropertyId = { $in: approvedIds };

    const items = await DisplayComponent.find(filter).sort({ createdAt: -1 });
    sendSuccess(res, items);
  } catch (err) {
    sendError(res, err.message);
  }
};

// GET /display-components/:id
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    let item = null;
    if (mongoose.isValidObjectId(id)) {
      item = await DisplayComponent.findById(id);
    }
    if (!item) {
      item = await DisplayComponent.findOne({ _id: id });
    }
    if (!item) return sendError(res, "Not found", 404);

    const caller = req.hotelAdmin;
    const isSuperAdmin = caller && String(caller.role || "").toLowerCase() === "superadmin";
    const isClientAdmin = caller && !isSuperAdmin;

    const targetHotel = await HotelProperty.findOne({
      $or: [
        { hotelPropertyId: String(item.hotelPropertyId) },
        ...(mongoose.isValidObjectId(item.hotelPropertyId) ? [{ _id: item.hotelPropertyId }] : [])
      ]
    });

    if (isClientAdmin) {
      if (!targetHotel || targetHotel.hotelAdminId !== caller.hotelAdminId) {
        return sendError(res, "Forbidden: You are not authorized to view this component", 403);
      }
    } else if (!caller) {
      if (!targetHotel || targetHotel.status !== "approved") {
        return sendError(res, "Not found", 404);
      }
    }

    sendSuccess(res, item);
  } catch (err) {
    sendError(res, err.message);
  }
};

// POST /display-components
// Protected: Requires valid authentication and hotel property authorization
const create = async (req, res) => {
  try {
    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";

    const body = { ...req.body };
    if (!body.hotelPropertyId) {
      return sendError(res, "hotelPropertyId is required", 400);
    }

    const targetHotel = await HotelProperty.findOne({
      $or: [
        { hotelPropertyId: String(body.hotelPropertyId) },
        ...(mongoose.isValidObjectId(body.hotelPropertyId) ? [{ _id: body.hotelPropertyId }] : [])
      ]
    });

    if (!targetHotel) {
      return sendError(res, "Hotel property not found", 404);
    }

    // Ownership verification: Client Admin can only add components to their own hotels
    if (!isSuperAdmin) {
      if (!caller.hotelAdminId || targetHotel.hotelAdminId !== caller.hotelAdminId) {
        return sendError(res, "Forbidden: You are not authorized to add components to this hotel property", 403);
      }
    }

    if (!body.componentTypeId) {
      const cat = String(body.category || '').toLowerCase();
      if (cat.includes('dining') || cat.includes('restaurant')) body.componentTypeId = 1;
      else if (cat.includes('gym') || cat.includes('pool') || cat.includes('wellness')) body.componentTypeId = 2;
      else if (cat.includes('takeaway')) body.componentTypeId = 3;
      else if (cat.includes('delivery')) body.componentTypeId = 4;
      else body.componentTypeId = 5;
    }
    if (!body.subTitle && body.subtitle) {
      body.subTitle = body.subtitle;
    }

    const item = await DisplayComponent.create(body);
    sendSuccess(res, item, 201);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

// PUT /display-components/:id
// Protected: Requires valid authentication and component ownership
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";

    let existing = null;
    if (mongoose.isValidObjectId(id)) {
      existing = await DisplayComponent.findById(id);
    }
    if (!existing) {
      existing = await DisplayComponent.findOne({ _id: id });
    }
    if (!existing) return sendError(res, "Not found", 404);

    const targetHotel = await HotelProperty.findOne({
      $or: [
        { hotelPropertyId: String(existing.hotelPropertyId) },
        ...(mongoose.isValidObjectId(existing.hotelPropertyId) ? [{ _id: existing.hotelPropertyId }] : [])
      ]
    });

    if (!isSuperAdmin) {
      if (!targetHotel || targetHotel.hotelAdminId !== caller.hotelAdminId) {
        return sendError(res, "Forbidden: You are not authorized to modify this component", 403);
      }
      if (req.body.hotelPropertyId && String(req.body.hotelPropertyId) !== String(existing.hotelPropertyId)) {
        const newHotel = await HotelProperty.findOne({
          $or: [
            { hotelPropertyId: String(req.body.hotelPropertyId) },
            ...(mongoose.isValidObjectId(req.body.hotelPropertyId) ? [{ _id: req.body.hotelPropertyId }] : [])
          ]
        });
        if (!newHotel || newHotel.hotelAdminId !== caller.hotelAdminId) {
          return sendError(res, "Forbidden: Target hotel property does not belong to you", 403);
        }
      }
    }

    const item = await DisplayComponent.findByIdAndUpdate(existing._id, req.body, {
      new: true,
      runValidators: true,
    });
    sendSuccess(res, item);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

// DELETE /display-components/:id
// Protected: Requires valid authentication and component ownership
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";

    let existing = null;
    if (mongoose.isValidObjectId(id)) {
      existing = await DisplayComponent.findById(id);
    }
    if (!existing) {
      existing = await DisplayComponent.findOne({ _id: id });
    }
    if (!existing) return sendError(res, "Not found", 404);

    const targetHotel = await HotelProperty.findOne({
      $or: [
        { hotelPropertyId: String(existing.hotelPropertyId) },
        ...(mongoose.isValidObjectId(existing.hotelPropertyId) ? [{ _id: existing.hotelPropertyId }] : [])
      ]
    });

    if (!isSuperAdmin) {
      if (!targetHotel || targetHotel.hotelAdminId !== caller.hotelAdminId) {
        return sendError(res, "Forbidden: You are not authorized to delete this component", 403);
      }
    }

    await DisplayComponent.findByIdAndDelete(existing._id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, err.message);
  }
};

module.exports = { getAll, getById, create, update, remove };
