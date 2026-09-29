const mongoose = require("mongoose");

const displaySubComponentSchema = new mongoose.Schema(
  {
    componentTypeId: { type: Number, required: true, index: true }, // parentKeyId -> DisplayComponent
    hotelPropertyId: { type: String, required: true, index: true },
    subComponentTypeId: { type: Number, required: true },
    title: { type: String, required: true },
    subTitle: { type: String },
    imageLink: { type: String }, // S3 key/URL, e.g. hotelId/subComponents/<subComponentId>.jpg
    data1: { type: String },
    data2: { type: String },
    data3: { type: String },
    data4: { type: String },
    data5: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DisplaySubComponent", displaySubComponentSchema);
