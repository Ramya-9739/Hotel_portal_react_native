const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const hotelAdminSchema = new mongoose.Schema(
  {
    hotelAdminId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // stored hashed
    adminContactNumber: { type: String },
    adminAddress: { type: String },
    adminEmail: { type: String },
  },
  { timestamps: true }
);

hotelAdminSchema.pre("save", async function preSave(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

hotelAdminSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("HotelAdmin", hotelAdminSchema);
