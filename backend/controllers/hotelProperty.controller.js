const mongoose = require("mongoose");
const HotelProperty = require("../models/hotelProperty.model");
const { sendSuccess, sendError } = require("../utils/responseHelper");

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

// GET /api/hotel-properties?hotelAdminId=xxx&status=xxx
const getAll = async (req, res) => {
  try {
    const { hotelAdminId, status } = req.query;
    const filter = {};
    if (hotelAdminId) filter.hotelAdminId = hotelAdminId;
    if (status) filter.status = status;

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

module.exports = {
  getPublic,
  getPending,
  getAll,
  getById,
  create,
  update,
  remove,
  approve,
  reject,
};
