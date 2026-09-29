const mongoose = require("mongoose");

const displayComponentSchema = new mongoose.Schema(
  {
    componentTypeId: { type: Number, required: true },
    hotelPropertyId: { type: String, required: true, index: true }, // parentKeyId
    title: { type: String, required: true },
    subTitle: { type: String },
    description: { type: String },
    category: { type: String, index: true },
    location: { type: String },
    rating: { type: Number, default: 4.8 },
    timings: { type: String },
    price: { type: String },
    link: { type: String },
    imageLink: { type: String }, // S3 key/URL, e.g. hotelId/components/<componentId>.jpg
    likes: { type: Number, default: 0 },
    availability: { type: String, default: "Available" },
    data1: { type: String },
    data2: { type: String },
    data3: { type: String },
    data4: { type: String },
    data5: { type: String },
  },
  { timestamps: true, strict: false }
);

module.exports = mongoose.model("DisplayComponent", displayComponentSchema);
