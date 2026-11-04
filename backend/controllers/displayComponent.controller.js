const mongoose = require("mongoose");
const DisplayComponent = require("../models/displayComponent.model");
const { sendSuccess, sendError } = require("../utils/responseHelper");

const HotelProperty = require("../models/hotelProperty.model");

// GET /display-components?hotelPropertyId=xxx&category=xxx&componentTypeId=xxx
const getAll = async (req, res) => {
  try {
    const { hotelPropertyId, category, componentTypeId } = req.query;
    const filter = {};
    if (category) {
      const c = String(category).toLowerCase();
      if (c === 'dining' || c === 'restaurants' || c === 'restaurant') {
        filter.category = { $in: ['dining', 'restaurants', 'restaurant'] };
      } else if (c === 'takeaway' || c === 'takeaways') {
        filter.category = { $in: ['takeaway', 'takeaways'] };
      } else if (c === 'pools' || c === 'swimming_pools' || c === 'pool') {
        filter.category = { $in: ['pools', 'swimming_pools', 'pool'] };
      } else if (c === 'delivery' || c === 'homedelivery' || c === 'home_delivery') {
        filter.category = { $in: ['delivery', 'homeDelivery', 'home_delivery', 'homedelivery'] };
      } else if (c === 'gyms' || c === 'gym' || c === 'fitness' || c === 'wellness') {
        filter.category = { $in: ['gyms', 'gym', 'wellness', 'fitness'] };
      } else {
        filter.category = category;
      }
    }
    if (componentTypeId) filter.componentTypeId = Number(componentTypeId);

    if (hotelPropertyId) {
      const targetIds = [String(hotelPropertyId)];
      try {
        const hp = mongoose.isValidObjectId(hotelPropertyId)
          ? await HotelProperty.findById(hotelPropertyId)
          : await HotelProperty.findOne({ hotelPropertyId: String(hotelPropertyId) });
        if (hp) {
          if (hp.hotelPropertyId && !targetIds.includes(String(hp.hotelPropertyId))) {
            targetIds.push(String(hp.hotelPropertyId));
          }
          if (hp._id && !targetIds.includes(String(hp._id))) {
            targetIds.push(String(hp._id));
          }
        }
      } catch (err) {
        // Continue with original hotelPropertyId
      }

      const specificFilter = { ...filter, hotelPropertyId: { $in: targetIds } };
      const items = await DisplayComponent.find(specificFilter).sort({ createdAt: -1 });
      // Multi-tenant data isolation: return only this hotel's components (or empty array if none registered)
      return sendSuccess(res, items);
    }

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
    if (!item) {
      item = await DisplayComponent.findOne({ _id: id });
    }
    if (!item) return sendError(res, "Not found", 404);
    sendSuccess(res, item);
  } catch (err) {
    sendError(res, err.message);
  }
};

// POST /display-components
// Protected: Requires valid authentication and hotel property authorization
const create = async (req, res) => {
  try {
    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";

    const body = { ...req.body };
    if (!body.componentTypeId) {
      const cat = String(body.category || '').toLowerCase();
      if (cat.includes('dining') || cat.includes('restaurant')) body.componentTypeId = 1;
      else if (cat.includes('gym') || cat.includes('pool') || cat.includes('wellness')) body.componentTypeId = 2;
      else if (cat.includes('takeaway')) body.componentTypeId = 3;
      else if (cat.includes('delivery')) body.componentTypeId = 4;
      else body.componentTypeId = 5;
    }
    if (!body.hotelPropertyId) {
      body.hotelPropertyId = '1000000001';
    }
    if (!body.subTitle && body.subtitle) {
      body.subTitle = body.subtitle;
    }

    // Authorization check: Verify caller owns target hotel (unless superadmin)
    if (!isSuperAdmin && caller.hotelAdminId) {
      const targetHotel = await HotelProperty.findOne({
        $or: [
          { hotelPropertyId: String(body.hotelPropertyId) },
          ...(mongoose.isValidObjectId(body.hotelPropertyId) ? [{ _id: body.hotelPropertyId }] : [])
        ]
      });
      if (targetHotel && targetHotel.hotelAdminId && targetHotel.hotelAdminId !== caller.hotelAdminId) {
        return sendError(res, "Forbidden: You are not authorized to add components to this hotel property", 403);
      }
    }

    const item = await DisplayComponent.create(body);
    sendSuccess(res, item, 201);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

// PUT /display-components/:id
// Protected: Requires valid authentication and component ownership
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";

    let existing = null;
    if (mongoose.isValidObjectId(id)) {
      existing = await DisplayComponent.findById(id);
    }
    if (!existing) {
      existing = await DisplayComponent.findOne({ _id: id });
    }
    if (!existing) return sendError(res, "Not found", 404);

    // Authorization check: Verify caller owns the parent hotel
    if (!isSuperAdmin && caller.hotelAdminId) {
      const targetHotel = await HotelProperty.findOne({
        $or: [
          { hotelPropertyId: String(existing.hotelPropertyId) },
          ...(mongoose.isValidObjectId(existing.hotelPropertyId) ? [{ _id: existing.hotelPropertyId }] : [])
        ]
      });
      if (targetHotel && targetHotel.hotelAdminId && targetHotel.hotelAdminId !== caller.hotelAdminId) {
        return sendError(res, "Forbidden: You are not authorized to modify this component", 403);
      }
    }

    const item = await DisplayComponent.findByIdAndUpdate(existing._id, req.body, {
      new: true,
      runValidators: true,
    });
    sendSuccess(res, item);
  } catch (err) {
    sendError(res, err.message, 400);
  }
};

// DELETE /display-components/:id
// Protected: Requires valid authentication and component ownership
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const caller = req.hotelAdmin || {};
    const isSuperAdmin = String(caller.role || "").toLowerCase() === "superadmin";

    let existing = null;
    if (mongoose.isValidObjectId(id)) {
      existing = await DisplayComponent.findById(id);
    }
    if (!existing) {
      existing = await DisplayComponent.findOne({ _id: id });
    }
    if (!existing) return sendError(res, "Not found", 404);

    // Authorization check: Verify caller owns the parent hotel
    if (!isSuperAdmin && caller.hotelAdminId) {
      const targetHotel = await HotelProperty.findOne({
        $or: [
          { hotelPropertyId: String(existing.hotelPropertyId) },
          ...(mongoose.isValidObjectId(existing.hotelPropertyId) ? [{ _id: existing.hotelPropertyId }] : [])
        ]
      });
      if (targetHotel && targetHotel.hotelAdminId && targetHotel.hotelAdminId !== caller.hotelAdminId) {
        return sendError(res, "Forbidden: You are not authorized to delete this component", 403);
      }
    }

    await DisplayComponent.findByIdAndDelete(existing._id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    sendError(res, err.message);
  }
};

module.exports = { getAll, getById, create, update, remove };
