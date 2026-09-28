const DisplayComponent = require("../models/displayComponent.model");
const { sendSuccess, sendError } = require("../utils/responseHelper");

// GET /display-components?hotelPropertyId=xxx  (parentKeyId filter)
const getAll = async (req, res) => {
  try {
    const { hotelPropertyId } = req.query;
    const filter = hotelPropertyId ? { hotelPropertyId } : {};
    const items = await DisplayComponent.find(filter);
    sendSuccess(res, items);
  } catch (err) {
    sendError(res, err.message);
  }
};

// GET /display-components/:id
const getById = async (req, res) => {
  try {
    const item = await DisplayComponent.findById(req.params.id);
    if (!item) return sendError(res, "Not found", 404);
    sendSuccess(res, item);
  } catch (err) {
    sendError(res, err.message);
  }
};

// POST /display-components
const create = async (req, res) => {
  try {
    // ---- DUMMY: if req.file present, upload to S3 first and set imageLink ----
    // const imageLink = req.file
    //   ? await uploadToS3(req.body.hotelPropertyId, "components", req.file.originalname, req.file.buffer, req.file.mimetype)
    //   : req.body.imageLink;
    const item = await DisplayComponent.create(req.body);
    sendSuccess(res, item, 201);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

// PUT /display-components/:id
const update = async (req, res) => {
  try {
    const item = await DisplayComponent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return sendError(res, "Not found", 404);
    sendSuccess(res, item);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

// DELETE /display-components/:id
const remove = async (req, res) => {
  try {
    const item = await DisplayComponent.findByIdAndDelete(req.params.id);
    if (!item) return sendError(res, "Not found", 404);
    // ---- DUMMY: also delete image from S3 via deleteFromS3(key) if imageLink set ----
    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, err.message);
  }
};

module.exports = { getAll, getById, create, update, remove };
