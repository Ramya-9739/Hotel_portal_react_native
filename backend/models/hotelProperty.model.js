const mongoose = require("mongoose");

// Explicit sub-schema for individual nearby points of interest
const nearbyPlaceSchema = new mongoose.Schema(
  {
    id: { type: String },
    name: { type: String },
    title: { type: String },
    subtitle: { type: String },
    desc: { type: String },
    rating: { type: Number, default: 4.8 },
    userRatingCount: { type: Number },
    distance: { type: String },
    hotelDistance: { type: String },
    address: { type: String },
    location: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    timings: { type: String },
    image: { type: String },
    imageLink: { type: String },
    photoUrl: { type: String },
    photos: [{ type: String }],
    googleMapsUrl: { type: String },
    directionsUrl: { type: String },
    websiteUrl: { type: String },
    phone: { type: String },
    category: { type: String },
    componentType: { type: mongoose.Schema.Types.Mixed },
    componentTypeId: { type: Number },
    price: { type: String },
    priceLevel: { type: String },
    openingHours: { type: String },
    data1: { type: String },
    data2: { type: String },
    data3: { type: String },
    data4: { type: String },
    data5: { type: String },
  },
  { _id: false }
);

// Explicit sub-schema for nearby categories in the 5-Quadrant Guest Portal & All Curations
const nearbyCategoriesSchema = new mongoose.Schema(
  {
    transportation: { type: [nearbyPlaceSchema], default: [] },
    shopping: { type: [nearbyPlaceSchema], default: [] },
    touristPlaces: { type: [nearbyPlaceSchema], default: [] },
    cafes: { type: [nearbyPlaceSchema], default: [] },
    gyms: { type: [nearbyPlaceSchema], default: [] },
    takeaway: { type: [nearbyPlaceSchema], default: [] },
    delivery: { type: [nearbyPlaceSchema], default: [] },
    hospitals: { type: [nearbyPlaceSchema], default: [] },
    pharmacies: { type: [nearbyPlaceSchema], default: [] },
    spa: { type: [nearbyPlaceSchema], default: [] },
    atms: { type: [nearbyPlaceSchema], default: [] },
  },
  { _id: false }
);

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
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String, default: "" },
    nearby: {
      type: nearbyCategoriesSchema,
      default: () => ({ transportation: [], shopping: [], touristPlaces: [] }),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HotelProperty", hotelPropertySchema);
