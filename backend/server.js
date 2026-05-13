const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const twilio = require("twilio");

// Security Check: Ensure all required environment variables are loaded
// These must be checked BEFORE importing the routes that use them (like Cloudinary)
const requiredEnvs = [
  "MONGO_URI",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_WHATSAPP_NUMBER",
  "CLOUDINARY_URL",
  "FRONTEND_URL",
];
requiredEnvs.forEach((env) => {
  const val = process.env[env];
  if (!val) {
    console.error(`ERROR: Missing required environment variable: ${env}`);
    process.exit(1);
  }
  if (val.startsWith("your_") || val.includes("_here")) {
    console.error(
      `ERROR: Environment variable ${env} still contains a placeholder value. Please update your .env file with real credentials.`,
    );
    process.exit(1);
  }
});

if (!process.env.CLOUDINARY_URL.startsWith("cloudinary://")) {
  console.error(
    "ERROR: CLOUDINARY_URL must start with 'cloudinary://'. Check your .env file.",
  );
  process.exit(1);
}

const webhook = require("./routes/webhook");
const Product = require("./models/Product");
const Visit = require("./models/Visit");
const User = require("./models/User");

// Initialize Twilio client once
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

const app = express();
app.use(
  cors({
    origin: [
      // Ensure your frontend URL is always HTTPS in production
      process.env.FRONTEND_URL || "https://arewa-market.vercel.app",
      "http://localhost:3000",
      "https://localhost:3000", // Add for local HTTPS development
    ],
  }),
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose
  .connect(process.env.MONGO_URI, {
    // These options help with connection stability
    serverSelectionTimeoutMS: 10000, // Wait longer for initial selection
    connectTimeoutMS: 20000, // Allow more time for handshake
    socketTimeoutMS: 45000, // Prevent socket hangup
    family: 4, // Force IPv4 (sometimes resolves ETIMEOUT)
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Root route to confirm server status
app.get("/", (req, res) => {
  res.send("ArewaMarket Backend Server is running!");
});

app.use("/api/webhook", webhook);

// Get products by phone or slug
app.get("/api/products/:key", async (req, res) => {
  let user = await User.findOne({ phone: req.params.key });
  if (!user) {
    user = await User.findOne({ slug: req.params.key });
  }
  if (!user) return res.json([]);
  const products = await Product.find({ traderPhone: user.phone });
  res.json(products);
});

// Get all products for the general store
app.get("/api/products", async (req, res) => {
  const products = await Product.find({});
  res.json(products);
});

// Get trader info by phone or slug
app.get("/api/trader/:key", async (req, res) => {
  let user = await User.findOne({ phone: req.params.key });
  if (!user) {
    user = await User.findOne({ slug: req.params.key });
  }
  if (!user) return res.status(404).json({ error: "Trader not found" });
  res.json(user);
});

// Customer request endpoint
app.post("/api/request", async (req, res) => {
  const { traderPhone, customerName, customerRequest } = req.body;
  if (!traderPhone || !customerName || !customerRequest) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // Find trader
  const trader = await User.findOne({ phone: traderPhone });
  if (!trader) {
    return res.status(404).json({ error: "Trader not found" });
  }

  try {
    // Use the pre-initialized client
    await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${traderPhone}`,
      body: `New customer request from ${customerName}:\n${customerRequest}`,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send WhatsApp message" });
  }
});

// Get Admin Stats
app.get("/api/admin/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    // Fetch visit counts from the new Visit model
    const landingVisits = await Visit.countDocuments({ page: "landing" });
    const storeVisits = await Visit.countDocuments({ page: "store" });

    const traders = await User.find({});
    res.json({
      traders,
      totalUsers,
      totalProducts,
      landingVisits,
      storeVisits,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Toggle Trader Verification
app.patch("/api/admin/verify/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.isVerified = !user.isVerified;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update verification" });
  }
});

// Delete Trader and their products
app.delete("/api/admin/trader/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // 1. Delete all products belonging to this trader to keep DB clean
    await Product.deleteMany({ traderPhone: user.phone });

    // 2. Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Trader and products deleted." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete trader" });
  }
});

// Analytics Tracker (Placeholder)
app.post("/api/analytics/track", async (req, res) => {
  try {
    const { page, slug } = req.query; // Assuming page and slug are passed as query parameters
    if (!page) {
      return res.status(400).json({ error: "Missing 'page' parameter" });
    }

    const visitData = { page };
    if (page === "store" && slug) {
      visitData.slug = slug;
    }
    await Visit.create(visitData);
    res.json({ success: true });
  } catch (error) {
    console.error("Error tracking analytics:", error);
    res.status(500).json({ error: "Failed to track visit" });
  }
});

const HTTP_PORT = process.env.PORT || 5000;

app.listen(HTTP_PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${HTTP_PORT}`,
  );
});
