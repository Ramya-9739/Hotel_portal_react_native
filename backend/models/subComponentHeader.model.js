const mongoose = require("mongoose");

const subComponentHeaderSchema = new mongoose.Schema(
  {
    componentTypeId: { type: Number, required: true, index: true }, // parentKeyId -> DisplayComponent
    titleHeader: { type: String, required: true },
    data1Header: { type: String },
    data2Header: { type: String },
    data3Header: { type: String },
    data4Header: { type: String },
    data5Header: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubComponentHeader", subComponentHeaderSchema);
