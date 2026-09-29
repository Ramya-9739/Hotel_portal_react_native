const mongoose = require("mongoose");

const hotelPropertySchema = new mongoose.Schema(
  {
    hotelPropertyId: { type: String, required: true, unique: true, index: true },
    hotelAdminId: { type: String, required: true, index: true }, // parentKeyId
    hotelName: { type: String, required: true },
    hotelAddress: { type: String },
    hotelLatLong: { type: String },
    hotelContactNumber: { type: String },
    paidTill: { type: Number }, // epoch millis/seconds, your convention
  },
  { timestamps: true }
);

module.exports = mongoose.model("HotelProperty", hotelPropertySchema);
