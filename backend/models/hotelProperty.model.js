const mongoose = require("mongoose");

const hotelPropertySchema = new mongoose.Schema(
  {
    hotelPropertyId: { type: String, required: true, unique: true, index: true },
    hotelAdminId: { type: String, required: true, index: true }, // parentKeyId
    hotelName: { type: String, required: true },
    hotelAddress: { type: String },
    hotelLatLong: { type: String },
    hotelContactNumber: { type: String },
    city: { type: String },
    rating: { type: Number, default: 4.9 },
    pricePerNight: { type: String },
    imageLink: { type: String },
    images: [{ type: String }],
    paymentMethods: [{ type: String }],
    availability: { type: String, default: "Available" },
    paidTill: { type: Number }, // epoch millis/seconds, your convention
  },
  { timestamps: true }
);

module.exports = mongoose.model("HotelProperty", hotelPropertySchema);
