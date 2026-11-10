// =============================================================================
// backend/models/touristDestination.model.js
// Centralized Platform-Wide Global Tourist Destination Schema (Super Admin Controlled)
// =============================================================================

const mongoose = require("mongoose");

const touristDestinationSchema = new mongoose.Schema(
  {
    destinationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Destination name is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "Indian state is required"],
      trim: true,
      index: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "Heritage & Palaces",
      index: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    latitude: {
      type: Number,
      validate: {
        validator: function (v) {
          if (v === null || v === undefined) return true;
          return v >= -90 && v <= 90;
        },
        message: "Latitude must be between -90 and 90 degrees",
      },
      default: null,
    },
    longitude: {
      type: Number,
      validate: {
        validator: function (v) {
          if (v === null || v === undefined) return true;
          return v >= -180 && v <= 180;
        },
        message: "Longitude must be between -180 and 180 degrees",
      },
      default: null,
    },
    timings: {
      type: String,
      trim: true,
      default: "Open Daily",
    },
    entryFee: {
      type: String,
      trim: true,
      default: "Verified on entry",
    },
    imageLink: {
      type: String,
      trim: true,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: String,
      default: "superadmin",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate destinations in the same city/state
touristDestinationSchema.index({ name: 1, city: 1, state: 1 }, { unique: true });

module.exports = mongoose.model("TouristDestination", touristDestinationSchema);

