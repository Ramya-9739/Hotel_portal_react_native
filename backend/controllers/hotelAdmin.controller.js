const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const HotelAdmin = require("../models/hotelAdmin.model");
const { sendSuccess, sendError } = require("../utils/responseHelper");

// POST /hotel-admins/register
const register = async (req, res) => {
  try {
    const admin = await HotelAdmin.create(req.body); // password hashed via pre-save hook
    const { password, ...safeAdmin } = admin.toObject();
    sendSuccess(res, safeAdmin, 201);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

// POST /hotel-admins/login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await HotelAdmin.findOne({ username });
    if (!admin || !(await admin.comparePassword(password))) {
      return sendError(res, "Invalid credentials", 401);
    }
    const token = jwt.sign(
      { hotelAdminId: admin.hotelAdminId, username: admin.username, role: admin.role, _id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );
    const { password: _, ...safeAdmin } = admin.toObject();
    sendSuccess(res, { token, user: safeAdmin });
  } catch (err) {
    sendError(res, err.message);
  }
};

// GET /hotel-admins (Super Admin only)
const getAll = async (req, res) => {
  try {
    const admins = await HotelAdmin.find().select("-password").sort({ createdAt: -1 });
    sendSuccess(res, admins);
  } catch (err) {
    sendError(res, err.message);
  }
};

// GET /hotel-admins/:id
const getById = async (req, res) => {
  try {
    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";

    let admin = null;
    if (mongoose.isValidObjectId(req.params.id)) {
      admin = await HotelAdmin.findById(req.params.id).select("-password");
    }
    if (!admin) {
      admin = await HotelAdmin.findOne({ hotelAdminId: req.params.id }).select("-password");
    }
    if (!admin) return sendError(res, "Not found", 404);

    // Enforce authorization: Non-superadmin can only access their own profile
    if (!isSuperAdmin && caller.hotelAdminId !== admin.hotelAdminId && String(caller._id) !== String(admin._id)) {
      return sendError(res, "Forbidden: Access to another administrator profile is restricted", 403);
    }

    sendSuccess(res, admin);
  } catch (err) {
    sendError(res, err.message);
  }
};

// PUT /hotel-admins/:id
const update = async (req, res) => {
  try {
    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";

    let admin = null;
    if (mongoose.isValidObjectId(req.params.id)) {
      admin = await HotelAdmin.findById(req.params.id);
    }
    if (!admin) {
      admin = await HotelAdmin.findOne({ hotelAdminId: req.params.id });
    }
    if (!admin) return sendError(res, "Not found", 404);

    // Enforce authorization
    if (!isSuperAdmin && caller.hotelAdminId !== admin.hotelAdminId && String(caller._id) !== String(admin._id)) {
      return sendError(res, "Forbidden: You are not authorized to modify another administrator profile", 403);
    }

    delete req.body.password;
    if (!isSuperAdmin) {
      delete req.body.role; // Prevent unauthorized privilege escalation
    }

    const updated = await HotelAdmin.findByIdAndUpdate(admin._id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");

    sendSuccess(res, updated);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

// DELETE /hotel-admins/:id (Super Admin only)
const remove = async (req, res) => {
  try {
    let admin = null;
    if (mongoose.isValidObjectId(req.params.id)) {
      admin = await HotelAdmin.findById(req.params.id);
    }
    if (!admin) {
      admin = await HotelAdmin.findOne({ hotelAdminId: req.params.id });
    }
    if (!admin) return sendError(res, "Not found", 404);

    await HotelAdmin.findByIdAndDelete(admin._id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, err.message);
  }
};

module.exports = { register, login, getAll, getById, update, remove };
