const mongoose = require("mongoose");

const displayComponentSchema = new mongoose.Schema(
  {
    componentTypeId: { type: Number, required: true },
    hotelPropertyId: { type: String, required: true, index: true }, // parentKeyId
    title: { type: String, required: true },
    subTitle: { type: String },
    link: { type: String },
    imageLink: { type: String }, // S3 key/URL, e.g. hotelId/components/<componentId>.jpg
    likes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DisplayComponent", displayComponentSchema);
