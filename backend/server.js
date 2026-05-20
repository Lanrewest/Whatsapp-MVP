const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const twilio = require("twilio");
const crypto = require("crypto");

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

if (!process.env.PAYSTACK_SECRET_KEY) {
  console.warn(
    "⚠️ WARNING: PAYSTACK_SECRET_KEY is missing. Automated payment features will be disabled.",
  );
}

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
const Feedback = require("./models/Feedback"); // Ensure Feedback.js is moved to c:\Users\USER\Documents\Whatsapp MVP\backend\models\

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
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(async () => {
    console.log("✅ MongoDB connected successfully");
    try {
      // Synchronize indexes to remove ghost unique constraints like email_1
      await User.syncIndexes();
      console.log("📊 Database indexes synchronized");
    } catch (err) {
      console.error("⚠️ Index sync error:", err.message);
    }
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.error(
      "Please ensure your IP is whitelisted in MongoDB Atlas: https://www.mongodb.com/docs/atlas/security-whitelist/",
    );
    // In many production scenarios, if the DB is down, the server should not start.
    // process.exit(1);
  });

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
  try {
    const products = await Product.find({}).lean();
    const traders = await User.find({ isVerified: true }, "phone isVerified");

    // Map through products and attach verification status if the trader is verified
    const verifiedPhones = new Set(traders.map((t) => t.phone));
    const augmentedProducts = products.map((p) => ({
      ...p,
      isVerified: verifiedPhones.has(p.traderPhone),
    }));

    res.json(augmentedProducts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
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
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Create an array of the last 7 dates in YYYY-MM-DD format
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split("T")[0]);
    }

    // Helper for daily aggregation
    const getDailyTrend = async (Model, matchQuery = {}) => {
      const data = await Model.aggregate([
        { $match: { ...matchQuery, createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Fill in gaps with 0
      return last7Days.map((date) => ({
        _id: date,
        count: (data.find((d) => d._id === date) || { count: 0 }).count,
      }));
    };

    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    // Fetch visit counts from the new Visit model
    const landingVisits = await Visit.countDocuments({ page: "landing" });
    const storeVisits = await Visit.countDocuments({ page: "store" });

    const feedback = await Feedback.find({}).sort({ createdAt: -1 }).limit(50);
    const traders = await User.find({});
    const products = await Product.find({}).sort({ createdAt: -1 });

    // Generate Daily Trends
    const dailyTraders = await getDailyTrend(User);
    const dailyProducts = await getDailyTrend(Product);
    const dailyLanding = await getDailyTrend(Visit, { page: "landing" });
    const dailyStore = await getDailyTrend(Visit, { page: "store" });

    res.json({
      traders,
      products,
      totalUsers,
      totalProducts,
      feedback,
      landingVisits,
      storeVisits,
      daily: {
        traders: dailyTraders,
        products: dailyProducts,
        landing: dailyLanding,
        store: dailyStore,
      },
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

// Paystack Webhook: Automatically verify traders upon payment
app.post("/api/payments/webhook", async (req, res) => {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");

  // Verify the request came from Paystack
  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(400).send("Invalid signature");
  }

  const event = req.body;
  if (event.event === "charge.success") {
    const { phone } = event.data.metadata;

    try {
      const user = await User.findOneAndUpdate(
        { phone: phone },
        { isVerified: true },
        { new: true },
      );
      console.log(`✅ User ${phone} verified via Paystack payment.`);

      // Send a confirmation message via WhatsApp to the trader
      const lang = user.language || "en";
      const successMsg =
        lang === "ha"
          ? "An kammala biyan kuɗi! Yanzu kai ingantaccen ɗan kasuwa ne ✅. Shagon ka zai nuna alamar tabbatarwa ga kowa."
          : "Payment successful! You are now a Verified Trader ✅. Your store will now display the verification badge to all customers.";

      await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${phone}`,
        body: successMsg,
      });
    } catch (err) {
      console.error("Webhook User Update Error:", err);
    }
  }

  res.sendStatus(200);
});

// Update Product (Admin)
app.patch("/api/admin/products/:id", async (req, res) => {
  try {
    const { name, price } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price },
      { new: true },
    );
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete Product (Admin)
app.delete("/api/admin/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
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

// Add Feedback endpoint
app.post("/api/feedback", async (req, res) => {
  try {
    const { traderPhone, customerName, rating, comment, traderSlug } = req.body;
    if (!traderPhone || !rating) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const feedback = await Feedback.create({
      traderPhone,
      customerName,
      rating,
      comment,
      traderSlug,
    });
    res.json({ success: true, feedback });
  } catch (error) {
    console.error("Error saving feedback:", error);
    res.status(500).json({ error: "Failed to save feedback" });
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
