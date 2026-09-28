const SubComponentHeader = require("../models/subComponentHeader.model");
const { sendSuccess, sendError } = require("../utils/responseHelper");

// GET /sub-component-headers?componentTypeId=xxx  (parentKeyId filter)
const getAll = async (req, res) => {
  try {
    const { componentTypeId } = req.query;
    const filter = componentTypeId ? { componentTypeId } : {};
    const items = await SubComponentHeader.find(filter);
    sendSuccess(res, items);
  } catch (err) {
    sendError(res, err.message);
  }
};

// GET /sub-component-headers/:id
const getById = async (req, res) => {
  try {
    const item = await SubComponentHeader.findById(req.params.id);
    if (!item) return sendError(res, "Not found", 404);
    sendSuccess(res, item);
  } catch (err) {
    sendError(res, err.message);
  }
};

// POST /sub-component-headers
const create = async (req, res) => {
  try {
    const item = await SubComponentHeader.create(req.body);
    sendSuccess(res, item, 201);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

// PUT /sub-component-headers/:id
const update = async (req, res) => {
  try {
    const item = await SubComponentHeader.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return sendError(res, "Not found", 404);
    sendSuccess(res, item);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

// DELETE /sub-component-headers/:id
const remove = async (req, res) => {
  try {
    const item = await SubComponentHeader.findByIdAndDelete(req.params.id);
    if (!item) return sendError(res, "Not found", 404);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, err.message);
  }
};

module.exports = { getAll, getById, create, update, remove };
