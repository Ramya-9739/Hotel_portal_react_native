const DisplaySubComponent = require("../models/displaySubComponent.model");
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

const create = async (req, res) => {
  try {
    // ---- DUMMY: S3 upload hookup, same pattern as displayComponent.controller.js ----
    const item = await DisplaySubComponent.create(req.body);
    sendSuccess(res, item, 201);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

const update = async (req, res) => {
  try {
    const item = await DisplaySubComponent.findByIdAndUpdate(req.params.id, req.body, {
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
    const item = await DisplaySubComponent.findByIdAndDelete(req.params.id);
    if (!item) return sendError(res, "Not found", 404);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, err.message);
  }
};

module.exports = { getAll, getById, create, update, remove };
