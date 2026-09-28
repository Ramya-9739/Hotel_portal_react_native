const HotelProperty = require("../models/hotelProperty.model");
const { sendSuccess, sendError } = require("../utils/responseHelper");

// GET /hotel-properties?hotelAdminId=xxx  (parentKeyId filter)
const getAll = async (req, res) => {
  try {
    const { hotelAdminId } = req.query;
    const filter = hotelAdminId ? { hotelAdminId } : {};
    const items = await HotelProperty.find(filter);
    sendSuccess(res, items);
  } catch (err) {
    sendError(res, err.message);
  }
};

const getById = async (req, res) => {
  try {
    const item = await HotelProperty.findById(req.params.id);
    if (!item) return sendError(res, "Not found", 404);
    sendSuccess(res, item);
  } catch (err) {
    sendError(res, err.message);
  }
};

const create = async (req, res) => {
  try {
    const item = await HotelProperty.create(req.body);
    sendSuccess(res, item, 201);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

const update = async (req, res) => {
  try {
    const item = await HotelProperty.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return sendError(res, "Not found", 404);
    sendSuccess(res, item);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

const remove = async (req, res) => {
  try {
    const item = await HotelProperty.findByIdAndDelete(req.params.id);
    if (!item) return sendError(res, "Not found", 404);
    // ---- DUMMY: cascade-delete HotelPictures/DisplayComponents for this property if desired ----
    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, err.message);
  }
};

module.exports = { getAll, getById, create, update, remove };
