const mongoose = require("mongoose");
const DisplayComponent = require("../models/displayComponent.model");
const { sendSuccess, sendError } = require("../utils/responseHelper");

// GET /display-components?hotelPropertyId=xxx&category=xxx&componentTypeId=xxx
const getAll = async (req, res) => {
  try {
    const { hotelPropertyId, category, componentTypeId } = req.query;
    const filter = {};
    if (hotelPropertyId) filter.hotelPropertyId = hotelPropertyId;
    if (category) filter.category = category;
    if (componentTypeId) filter.componentTypeId = Number(componentTypeId);
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
    if (!item) return sendError(res, "Not found", 404);
    sendSuccess(res, item);
  } catch (err) {
    sendError(res, err.message);
  }
};

// POST /display-components
const create = async (req, res) => {
  try {
    const item = await DisplayComponent.create(req.body);
    sendSuccess(res, item, 201);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

// PUT /display-components/:id
const update = async (req, res) => {
  try {
    const { id } = req.params;
    let item = null;
    if (mongoose.isValidObjectId(id)) {
      item = await DisplayComponent.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });
    }
    if (!item) return sendError(res, "Not found", 404);
    sendSuccess(res, item);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

// DELETE /display-components/:id
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    let item = null;
    if (mongoose.isValidObjectId(id)) {
      item = await DisplayComponent.findByIdAndDelete(id);
    }
    if (!item) return sendError(res, "Not found", 404);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, err.message);
  }
};

module.exports = { getAll, getById, create, update, remove };
