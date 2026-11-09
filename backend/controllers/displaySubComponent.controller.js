const DisplaySubComponent = require("../models/displaySubComponent.model");
const HotelProperty = require("../models/hotelProperty.model");
const mongoose = require("mongoose");
const { sendSuccess, sendError } = require("../utils/responseHelper");

// GET /display-sub-components?componentTypeId=xxx&hotelPropertyId=xxx
const getAll = async (req, res) => {
  try {
    const caller = req.hotelAdmin;
    const isSuperAdmin = caller && String(caller.role || "").toLowerCase() === "superadmin";
    const isClientAdmin = caller && !isSuperAdmin;

    const { componentTypeId, hotelPropertyId } = req.query;
    const filter = {};
    if (componentTypeId) filter.componentTypeId = componentTypeId;

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
          return sendError(res, "Forbidden: You are not authorized to view sub-components of this hotel property", 403);
        }
        filter.hotelPropertyId = { $in: [hpStr] };
      } else {
        filter.hotelPropertyId = { $in: ownedIds };
      }

      const items = await DisplaySubComponent.find(filter);
      return sendSuccess(res, items);
    }

    if (isSuperAdmin) {
      if (hotelPropertyId) filter.hotelPropertyId = String(hotelPropertyId);
      const items = await DisplaySubComponent.find(filter);
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
      const items = await DisplaySubComponent.find(filter);
      return sendSuccess(res, items);
    }

    const approvedHotels = await HotelProperty.find({ status: "approved" }).select('hotelPropertyId _id');
    const approvedIds = approvedHotels.flatMap((h) => [String(h.hotelPropertyId), String(h._id)]).filter(Boolean);
    filter.hotelPropertyId = { $in: approvedIds };

    const items = await DisplaySubComponent.find(filter);
    sendSuccess(res, items);
  } catch (err) {
    sendError(res, err.message);
  }
};

const getById = async (req, res) => {
  try {
    const item = await DisplaySubComponent.findById(req.params.id);
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
        return sendError(res, "Forbidden: You are not authorized to view this sub-component", 403);
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

// POST /display-sub-components (Protected)
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

    if (!isSuperAdmin) {
      if (!caller.hotelAdminId || targetHotel.hotelAdminId !== caller.hotelAdminId) {
        return sendError(res, "Forbidden: You are not authorized to add sub-components to this hotel property", 403);
      }
    }

    const item = await DisplaySubComponent.create(body);
    sendSuccess(res, item, 201);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

// PUT /display-sub-components/:id (Protected)
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";

    const existing = await DisplaySubComponent.findById(id);
    if (!existing) return sendError(res, "Not found", 404);

    const targetHotel = await HotelProperty.findOne({
      $or: [
        { hotelPropertyId: String(existing.hotelPropertyId) },
        ...(mongoose.isValidObjectId(existing.hotelPropertyId) ? [{ _id: existing.hotelPropertyId }] : [])
      ]
    });

    if (!isSuperAdmin) {
      if (!targetHotel || targetHotel.hotelAdminId !== caller.hotelAdminId) {
        return sendError(res, "Forbidden: You are not authorized to modify this sub-component", 403);
      }
    }

    const item = await DisplaySubComponent.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    sendSuccess(res, item);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

// DELETE /display-sub-components/:id (Protected)
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";

    const existing = await DisplaySubComponent.findById(id);
    if (!existing) return sendError(res, "Not found", 404);

    const targetHotel = await HotelProperty.findOne({
      $or: [
        { hotelPropertyId: String(existing.hotelPropertyId) },
        ...(mongoose.isValidObjectId(existing.hotelPropertyId) ? [{ _id: existing.hotelPropertyId }] : [])
      ]
    });

    if (!isSuperAdmin) {
      if (!targetHotel || targetHotel.hotelAdminId !== caller.hotelAdminId) {
        return sendError(res, "Forbidden: You are not authorized to delete this sub-component", 403);
      }
    }

    await DisplaySubComponent.findByIdAndDelete(id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, err.message);
  }
};

module.exports = { getAll, getById, create, update, remove };
