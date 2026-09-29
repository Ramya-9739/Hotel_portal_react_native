const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/hotelApiDb", {
      serverSelectionTimeoutMS: 3000,
    });
    console.log("MongoDB connected:", mongoose.connection.name);
  } catch (err) {
    console.warn("MongoDB offline / connection failed:", err.message);
    console.log("hotel-api continuing with offline-first resilient mode.");
  }
};

module.exports = connectDb;
