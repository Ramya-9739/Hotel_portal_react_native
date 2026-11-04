const DisplaySubComponent = require("../models/displaySubComponent.model");
const HotelProperty = require("../models/hotelProperty.model");
const mongoose = require("mongoose");
const { sendSuccess, sendError } = require("../utils/responseHelper");

// GET /display-sub-components?componentTypeId=xxx&hotelPropertyId=xxx
const getAll = async (req, res) => {
  try {
    const { componentTypeId, hotelPropertyId } = req.query;
    const filter = {};
    if (componentTypeId) filter.componentTypeId = componentTypeId;
    if (hotelPropertyId) filter.hotelPropertyId = hotelPropertyId;
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

    if (!isSuperAdmin && caller.hotelAdminId && body.hotelPropertyId) {
      const targetHotel = await HotelProperty.findOne({
        $or: [
          { hotelPropertyId: String(body.hotelPropertyId) },
          ...(mongoose.isValidObjectId(body.hotelPropertyId) ? [{ _id: body.hotelPropertyId }] : [])
        ]
      });
      if (targetHotel && targetHotel.hotelAdminId && targetHotel.hotelAdminId !== caller.hotelAdminId) {
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

    if (!isSuperAdmin && caller.hotelAdminId) {
      const targetHotel = await HotelProperty.findOne({
        $or: [
          { hotelPropertyId: String(existing.hotelPropertyId) },
          ...(mongoose.isValidObjectId(existing.hotelPropertyId) ? [{ _id: existing.hotelPropertyId }] : [])
        ]
      });
      if (targetHotel && targetHotel.hotelAdminId && targetHotel.hotelAdminId !== caller.hotelAdminId) {
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

    if (!isSuperAdmin && caller.hotelAdminId) {
      const targetHotel = await HotelProperty.findOne({
        $or: [
          { hotelPropertyId: String(existing.hotelPropertyId) },
          ...(mongoose.isValidObjectId(existing.hotelPropertyId) ? [{ _id: existing.hotelPropertyId }] : [])
        ]
      });
      if (targetHotel && targetHotel.hotelAdminId && targetHotel.hotelAdminId !== caller.hotelAdminId) {
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
