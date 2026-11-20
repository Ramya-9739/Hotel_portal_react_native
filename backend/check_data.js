const mongoose = require("mongoose");
const HotelProperty = require("./models/hotelProperty.model");
const TouristDestination = require("./models/touristDestination.model");

async function run() {
  await mongoose.connect("mongodb://localhost:27017/hotelApiDb");
  const hotel = await HotelProperty.findOne({ hotelPropertyId: "1000000001" });
  console.log("Hotel found:", hotel?.hotelName);
  console.log("nearby touristPlaces count:", hotel?.nearby?.touristPlaces?.length);
  console.log("nearby shopping count:", hotel?.nearby?.shopping?.length);
  console.log("nearby transportation count:", hotel?.nearby?.transportation?.length);
  const destCount = await TouristDestination.countDocuments();
  console.log("TouristDestination count in DB:", destCount);
  await mongoose.disconnect();
}
run().catch(console.error);
