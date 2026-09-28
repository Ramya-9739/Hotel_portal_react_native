const mongoose = require("mongoose");

const hotelPictureSchema = new mongoose.Schema(
  {
    hotelPropertyId: { type: String, required: true, index: true }, // parentKeyId
    hotelPicture: { type: String, required: true }, // S3 key/URL, e.g. hotelId/pictures/<pictureId>.jpg
  },
  { timestamps: true }
);

module.exports = mongoose.model("HotelPicture", hotelPictureSchema);
