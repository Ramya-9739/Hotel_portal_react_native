const HotelPicture = require("../models/hotelPicture.model");
const { uploadToS3, generatePresignedUrl, deleteFromS3 } = require("../utils/s3Helper");
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

    const targetHotelId = hotelPropertyId || "general";
    const hotelPicture = await uploadToS3(
      targetHotelId,
      "pictures",
      `${Date.now()}-${req.file.originalname}`,
      req.file.buffer,
      req.file.mimetype
    );

    const item = await HotelPicture.create({
      hotelPropertyId: targetHotelId,
      hotelPicture,
    });
    sendSuccess(res, item, 201);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

const remove = async (req, res) => {
  try {
    const idOrUrl = decodeURIComponent(req.params.id);
    let item = null;

    if (idOrUrl.match(/^[0-9a-fA-F]{24}$/)) {
      item = await HotelPicture.findByIdAndDelete(idOrUrl);
    } else {
      item = await HotelPicture.findOneAndDelete({
        hotelPicture: { $regex: idOrUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') },
      });
    }

    if (item && item.hotelPicture) {
      await deleteFromS3(item.hotelPicture);
    } else if (idOrUrl.includes("/uploads/")) {
      await deleteFromS3(idOrUrl);
    }

    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, err.message);
  }
};

const getPresignedUrl = async (req, res) => {
  try {
    const { hotelPropertyId, fileName, mimeType } = req.body;
    if (!hotelPropertyId || !fileName || !mimeType) {
      return sendError(res, "hotelPropertyId, fileName, and mimeType are required", 400);
    }
    const data = await generatePresignedUrl(
      hotelPropertyId,
      "pictures",
      `${Date.now()}-${fileName}`,
      mimeType
    );
    sendSuccess(res, data);
  } catch (err) {
    sendError(res, err.message);
  }
};

module.exports = { getAll, getById, create, remove, getPresignedUrl };
