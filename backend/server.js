const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const twilio = require("twilio");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;

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

cloudinary.config();

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

app.use("/api/webhook", webhook);

// Get products by phone or slug
app.get("/api/products/:key", async (req, res) => {
  let user = await User.findOne({ phone: req.params.key });
  if (!user) {
    user = await User.findOne({ slug: req.params.key });
  }
  if (!user) {
    console.log(`ℹ️ Product lookup failed for key: ${req.params.key}`);
    return res.json([]);
  }

  // Normalize phone for lookup to ensure compatibility with older product entries
  const phoneDigits = user.phone.replace(/\D/g, "");
  const products = await Product.find({
    $and: [
      {
        $or: [
          { traderPhone: user.phone },
          { traderPhone: `whatsapp:${user.phone}` },
          { traderPhone: { $regex: phoneDigits } },
        ],
      },
      {
        $or: [{ isApproved: { $exists: false } }, { isApproved: true }],
      },
    ],
  });
  res.json(products);
});

// Get all products for the general store
app.get("/api/products", async (req, res) => {
  try {
    // Fetch all products
    const allProds = await Product.find({
      $or: [{ isApproved: { $exists: false } }, { isApproved: true }],
    })
      .sort({ createdAt: -1 })
      .lean();
    // Fetch all traders to get names and addresses for the labels
    const traders = await User.find(
      {},
      "phone isVerified isPro companyName address isBlocked isApproved",
    );

    const augmentedProducts = allProds
      .map((p) => {
        const cleanTraderPhone = (p.traderPhone || "").replace(/\D/g, "");
        const trader = traders.find((t) => {
          const tPhone = (t.phone || "").replace(/\D/g, "");
          return tPhone === cleanTraderPhone;
        });

        return {
          ...p,
          isVerified: !!(trader && trader.isVerified),
          isPro: !!(trader && trader.isPro),
          isApproved: trader ? trader.isApproved !== false : true,
          isBlocked: !!(trader && trader.isBlocked),
          traderName:
            trader && trader.companyName
              ? trader.companyName
              : p.traderPhone || "Unknown Trader",
          traderAddress: trader && trader.address ? trader.address : "",
        };
      })
      .sort((a, b) => {
        // Priority: Pro (2) > Verified (1) > Basic (0)
        const scoreA = a.isPro ? 2 : a.isVerified ? 1 : 0;
        const scoreB = b.isPro ? 2 : b.isVerified ? 1 : 0;
        return scoreB - scoreA;
      });

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

  // 🛡️ Check Trader's Daily Limit
  const today = new Date().toISOString().split("T")[0];
  if (trader.lastUsageDate !== today) {
    trader.dailyUsageCount = 0;
    trader.lastUsageDate = today;
  }

  let dailyLimit = 10;
  if (trader.isPro) dailyLimit = 200;
  else if (trader.isVerified) dailyLimit = 50;

  if (trader.dailyUsageCount >= dailyLimit) {
    console.warn(`⚠️ Trader ${traderPhone} has reached their daily limit.`);
    // We still return success to the frontend so the customer can proceed
    // to the manual WhatsApp link, but we DON'T send the Twilio message.
    return res.json({ success: true, note: "limit_reached" });
  }

  try {
    // Use the pre-initialized client
    await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${traderPhone}`,
      body: `New customer request from ${customerName}:\n${customerRequest}`,
    });

    trader.dailyUsageCount++;
    await trader.save();

    res.json({ success: true });
  } catch (err) {
    if (err.code === 63038) {
      console.error("🛑 Twilio Error 63038: Daily message limit exceeded.");
      return res.status(429).json({
        error: "Twilio daily limit exceeded. Please try again tomorrow.",
      });
    }
    res.status(500).json({ error: "Failed to send WhatsApp message" });
  }
});

// Get Admin Stats
app.get("/api/admin/stats", async (req, res) => {
  try {
    // Fix: Set start dates to the beginning of the day (00:00:00) to ensure full coverage
    const getStartDate = (days) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1));
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const sevenDaysAgo = getStartDate(7);
    const thirtyDaysAgo = getStartDate(30);

    const getDailyTrend = async (Model, days, matchQuery = {}) => {
      const startDate = getStartDate(days);
      const dateList = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dateList.push(d.toISOString().split("T")[0]);
      }

      const data = await Model.aggregate([
        { $match: { ...matchQuery, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return dateList.map((date) => ({
        _id: date,
        count: (data.find((d) => d._id === date) || { count: 0 }).count,
      }));
    };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Tier counts
    const tierStats = {
      basic: await User.countDocuments({
        isVerified: false,
        isPro: { $ne: true },
      }),
      verified: await User.countDocuments({
        isVerified: true,
        isPro: { $ne: true },
      }),
      pro: await User.countDocuments({ isPro: true }),
    };

    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    // Fetch visit counts from the new Visit model
    const landingVisits = await Visit.countDocuments({ page: "landing" });
    const storeVisits = await Visit.countDocuments({ page: "store" });

    // Today's specific traffic
    const todayLanding = await Visit.countDocuments({
      page: "landing",
      createdAt: { $gte: todayStart },
    });
    const todayStore = await Visit.countDocuments({
      page: "store",
      createdAt: { $gte: todayStart },
    });

    // Hourly breakdown for the last 24 hours to see "time" trends
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hourlyData = await Visit.aggregate([
      { $match: { createdAt: { $gte: twentyFourHoursAgo } } },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const feedback = await Feedback.find({}).sort({ createdAt: -1 }).limit(50);
    const traders = await User.find({});
    const products = await Product.find({}).sort({ createdAt: -1 });

    // Generate Trends for 7 days
    const trend7 = {
      traders: await getDailyTrend(User, 7),
      products: await getDailyTrend(Product, 7),
      landing: await getDailyTrend(Visit, 7, { page: "landing" }),
      store: await getDailyTrend(Visit, 7, { page: "store" }),
    };

    // Generate Trends for 30 days
    const trend30 = {
      traders: await getDailyTrend(User, 30),
      products: await getDailyTrend(Product, 30),
      landing: await getDailyTrend(Visit, 30, { page: "landing" }),
      store: await getDailyTrend(Visit, 30, { page: "store" }),
    };

    res.json({
      traders,
      products,
      totalUsers,
      totalProducts,
      feedback,
      landingVisits,
      storeVisits,
      todayLanding,
      todayStore,
      hourlyData,
      daily: trend7, // Default backward compatibility
      tierStats,
      trends: {
        seven: trend7,
        thirty: trend30,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Set Trader Tier
app.patch("/api/admin/set-tier/:id", async (req, res) => {
  try {
    const { tier } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isVerified = tier === "verified" || tier === "pro";
    user.isPro = tier === "pro";
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update tier" });
  }
});

// Paystack Webhook: Automatically verify traders upon payment
app.post("/api/payments/webhook", async (req, res) => {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(req.rawBody)
    .digest("hex");

  // Verify the request came from Paystack
  if (hash !== req.headers["x-paystack-signature"]) {
    console.error(
      "❌ Paystack Webhook Error: Signature mismatch. Check your PAYSTACK_SECRET_KEY.",
    );
    return res.status(400).send("Invalid signature");
  }

  const event = req.body;
  console.log(`📩 Paystack Webhook Received: ${event.event}`);

  if (event.event === "charge.success") {
    let metadata = event.data.metadata;

    // Defensive: Paystack sometimes sends metadata as a string
    if (typeof metadata === "string" && metadata.trim() !== "") {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        console.error(
          "❌ Failed to parse Paystack metadata string:",
          e.message,
        );
      }
    }

    // Try to get phone from metadata, fallback to email prefix if metadata fails
    let phone = metadata && metadata.phone ? metadata.phone : null;
    let tier = metadata && metadata.tier ? metadata.tier : "verified";

    if (!phone && event.data.customer && event.data.customer.email) {
      // If email is +2348071821807@arewaconnect.com.ng, extract the part before @
      const emailPrefix = event.data.customer.email.split("@")[0];
      phone = emailPrefix.replace(/\D/g, ""); // Normalize to digits
      console.log(
        `ℹ️ Phone missing in metadata, extracted from email: ${phone}`,
      );
    }

    if (!phone) {
      console.error(
        "❌ Paystack Webhook Error: No phone number found in metadata or email.",
      );
      console.log(
        "Full Data for Debugging:",
        JSON.stringify(event.data, null, 2),
      );
      return res.sendStatus(200);
    }

    console.log(`🔎 Attempting to verify user with phone: ${phone}`);

    try {
      const user = await User.findOneAndUpdate(
        {
          $or: [
            { phone: phone },
            { phone: `+${phone}` }, // Match if DB has the plus
            { phone: `whatsapp:+${phone}` },
            {
              phone: phone.startsWith("234") ? `0${phone.substring(3)}` : phone,
            }, // Match local 080...
            { phone: phone.startsWith("234") ? phone.substring(3) : phone },
            {
              phone: phone.startsWith("0") ? `234${phone.substring(1)}` : phone,
            },
          ],
        },
        {
          isVerified: true,
          isPro: tier === "pro",
        },
        { new: true },
      );

      if (!user) {
        console.error(
          `❌ User matching "${phone}" not found in DB. Check your User collection phone formats.`,
        );
        return res.sendStatus(200); // Still return 200 to Paystack
      }

      console.log(`✅ User ${phone} verified via Paystack payment.`);

      // Send a confirmation message via WhatsApp to the trader
      const lang = user.language || "en";
      const tierLabel =
        tier === "pro" ? "Pro User (200 daily messages)" : "Verified Trader";

      const successMsg =
        lang === "ha"
          ? `An kammala biyan kuɗi! Yanzu kai ${tierLabel} ne a Arewa Connect ✅.`
          : `Payment successful! You are now a ${tierLabel} on Arewa Connect ✅.`;

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

// Upload image for admin-managed product content
app.post("/api/admin/upload-image", async (req, res) => {
  try {
    const { imageData } = req.body;
    if (!imageData) {
      return res.status(400).json({ error: "Missing image data" });
    }

    const uploadResult = await cloudinary.uploader.upload(imageData, {
      folder: "arewa-connect/products",
      resource_type: "image",
    });

    res.json({ success: true, url: uploadResult.secure_url });
  } catch (err) {
    console.error("Image upload failed:", err);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// Upload multiple images for admin-managed content
app.post("/api/admin/upload-images", async (req, res) => {
  try {
    const { imageDataList } = req.body;
    if (!Array.isArray(imageDataList) || imageDataList.length === 0) {
      return res.status(400).json({ error: "Missing image data list" });
    }

    const uploads = await Promise.all(
      imageDataList.map((imageData) =>
        cloudinary.uploader.upload(imageData, {
          folder: "arewa-connect/products",
          resource_type: "image",
        }),
      ),
    );

    res.json({
      success: true,
      urls: uploads.map((upload) => upload.secure_url),
    });
  } catch (err) {
    console.error("Multiple image upload failed:", err);
    res.status(500).json({ error: "Failed to upload images" });
  }
});

// Create Trader (Admin)
app.post("/api/admin/traders", async (req, res) => {
  try {
    const { phone, companyName, address } = req.body;
    if (!phone || !companyName) {
      return res
        .status(400)
        .json({ error: "Phone and company name are required" });
    }

    const normalizedPhone = phone.replace(/\D/g, "");
    if (!normalizedPhone) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const existing = await User.findOne({
      phone: { $in: [phone, normalizedPhone] },
    });
    if (existing) {
      return res.status(409).json({ error: "Trader already exists" });
    }

    let baseSlug = slugify(companyName);
    let slug = baseSlug || `trader-${normalizedPhone}`;
    let counter = 1;
    while (await User.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    const user = await User.create({
      phone,
      companyName,
      address,
      slug,
      isApproved: true,
      isBlocked: false,
      state: "idle",
    });

    res.json({ success: true, user });
  } catch (err) {
    console.error("Trader creation failed:", err);
    res.status(500).json({ error: "Failed to create trader" });
  }
});

// Update Trader info (Admin)
app.patch("/api/admin/traders/:id", async (req, res) => {
  try {
    const { companyName, address, isApproved, isBlocked } = req.body;
    const updates = {};
    if (companyName !== undefined) updates.companyName = companyName;
    if (address !== undefined) updates.address = address;
    if (isApproved !== undefined) updates.isApproved = Boolean(isApproved);
    if (isBlocked !== undefined) updates.isBlocked = Boolean(isBlocked);

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    if (!user) return res.status(404).json({ error: "Trader not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: "Failed to update trader" });
  }
});

// Update Product (Admin)
app.patch("/api/admin/products/:id", async (req, res) => {
  try {
    const { name, price, imageUrl, imageUrls, isApproved } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = price;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (imageUrls !== undefined) updates.imageUrls = imageUrls;
    if (isApproved !== undefined) updates.isApproved = Boolean(isApproved);

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
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
  console.log(`🚀 Server live in ${process.env.NODE_ENV || "production"} mode`);
  console.log(`📡 Listening on port ${HTTP_PORT}`);
});
