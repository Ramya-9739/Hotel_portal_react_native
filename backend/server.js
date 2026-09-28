require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDb = require("./config/db");
const errorHandler = require("./middleware/errorHandler.middleware");

const displayComponentRoutes = require("./routes/displayComponent.routes");
const displaySubComponentRoutes = require("./routes/displaySubComponent.routes");
const hotelAdminRoutes = require("./routes/hotelAdmin.routes");
const hotelPropertyRoutes = require("./routes/hotelProperty.routes");
const hotelPictureRoutes = require("./routes/hotelPicture.routes");
const subComponentHeaderRoutes = require("./routes/subComponentHeader.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/display-components", displayComponentRoutes);
app.use("/api/display-sub-components", displaySubComponentRoutes);
app.use("/api/hotel-admins", hotelAdminRoutes);
app.use("/api/hotel-properties", hotelPropertyRoutes);
app.use("/api/hotel-pictures", hotelPictureRoutes);
app.use("/api/sub-component-headers", subComponentHeaderRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" })); // for ALB/EC2 health checks

app.use(errorHandler); // must stay last

const PORT = process.env.PORT || 3000;

connectDb().then(() => {
  app.listen(PORT, () => console.log(`hotel-api running on port ${PORT}`));
});
