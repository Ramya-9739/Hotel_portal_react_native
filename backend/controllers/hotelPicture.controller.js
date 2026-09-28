const HotelPicture = require("../models/hotelPicture.model");
const { uploadToS3 } = require("../utils/s3Helper"); // import deleteFromS3 too once remove() uses it
const { sendSuccess, sendError } = require("../utils/responseHelper");

// GET /hotel-pictures?hotelPropertyId=xxx  (parentKeyId filter)
const getAll = async (req, res) => {
  try {
    const { hotelPropertyId } = req.query;
    const filter = hotelPropertyId ? { hotelPropertyId } : {};
    const items = await HotelPicture.find(filter);
    sendSuccess(res, items);
  } catch (err) {
    sendError(res, err.message);
  }
};

const getById = async (req, res) => {
  try {
    const item = await HotelPicture.findById(req.params.id);
    if (!item) return sendError(res, "Not found", 404);
    sendSuccess(res, item);
  } catch (err) {
    sendError(res, err.message);
  }
};

// POST /hotel-pictures  (multipart/form-data, field name: "picture")
const create = async (req, res) => {
  try {
    const { hotelPropertyId } = req.body;
    if (!req.file) return sendError(res, "No file uploaded", 400);

    const hotelPicture = await uploadToS3(
      hotelPropertyId,
      "pictures",
      `${Date.now()}-${req.file.originalname}`,
      req.file.buffer,
      req.file.mimetype
    );

    const item = await HotelPicture.create({ hotelPropertyId, hotelPicture });
    sendSuccess(res, item, 201);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

const remove = async (req, res) => {
  try {
    const item = await HotelPicture.findByIdAndDelete(req.params.id);
    if (!item) return sendError(res, "Not found", 404);
    // ---- DUMMY: derive S3 key from item.hotelPicture URL and call deleteFromS3(key) ----
    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, err.message);
  }
};

module.exports = { getAll, getById, create, remove };
