const jwt = require("jsonwebtoken");
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
    // ---- DUMMY: adjust payload/claims as needed ----
    const token = jwt.sign(
      { hotelAdminId: admin.hotelAdminId, username: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );
    const { password: _, ...safeAdmin } = admin.toObject();
    sendSuccess(res, { token, user: safeAdmin });
  } catch (err) {
    sendError(res, err.message);
  }
};

// GET /hotel-admins/:id
const getById = async (req, res) => {
  try {
    const admin = await HotelAdmin.findById(req.params.id).select("-password");
    if (!admin) return sendError(res, "Not found", 404);
    sendSuccess(res, admin);
  } catch (err) {
    sendError(res, err.message);
  }
};

// PUT /hotel-admins/:id
const update = async (req, res) => {
  try {
    delete req.body.password; // ---- DUMMY: route password changes through a separate endpoint ----
    const admin = await HotelAdmin.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!admin) return sendError(res, "Not found", 404);
    sendSuccess(res, admin);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

// DELETE /hotel-admins/:id
const remove = async (req, res) => {
  try {
    const admin = await HotelAdmin.findByIdAndDelete(req.params.id);
    if (!admin) return sendError(res, "Not found", 404);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, err.message);
  }
};

module.exports = { register, login, getById, update, remove };
