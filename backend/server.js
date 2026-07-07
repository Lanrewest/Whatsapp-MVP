const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const twilio = require("twilio");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;
const User = require("./models/User");

// Security Check: Ensure all required environment variables are loaded
// These must be checked BEFORE importing the routes that use them (like Cloudinary)
const requiredEnvs = [
  "MONGO_URI",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_WHATSAPP_NUMBER",
  "CLOUDINARY_URL",
  "PAYSTACK_SECRET_KEY",
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

cloudinary.config();

const webhook = require("./routes/webhook");
const apiRoutes = require("./routes/api");
const adminRoutes = require("./routes/admin");
const paymentsRoutes = require("./routes/payments"); // Import the new payments router

const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or matching our whitelist
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        "http://localhost:3000",
        "https://arewaconnect.com.ng",
      ].filter(Boolean);
      if (!origin || allowedOrigins.some((o) => origin.startsWith(o)))
        return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
  }),
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  bodyParser.json({
    limit: "50mb", // Increase the limit to allow for image data
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);

const slugify = (text) =>
  (text || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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
  res.send("Arewa Connect Backend Server is running!");
});

// Public/Browser-facing routes that need CORS
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "https://arewaconnect.com.ng",
    ].filter(Boolean);
    if (!origin || allowedOrigins.some((o) => origin.startsWith(o)))
      return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
};
app.use("/api", cors(corsOptions), apiRoutes);
app.use("/api/admin", cors(corsOptions), adminRoutes); // Admin routes also need CORS

// Internal/Webhook routes that do NOT need CORS
app.use("/api/webhook", webhook);
app.use("/api/payments", paymentsRoutes);

const HTTP_PORT = process.env.PORT || 5000;

app.listen(HTTP_PORT, () => {
  console.log(`🚀 Server live in ${process.env.NODE_ENV || "production"} mode`);
  console.log(`📡 Listening on port ${HTTP_PORT}`);
});
