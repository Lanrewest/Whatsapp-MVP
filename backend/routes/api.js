const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Visit = require("../models/Visit");
const User = require("../models/User");
const Feedback = require("../models/Feedback");
const cloudinary = require("cloudinary").v2;
const twilio = require("twilio");

const { slugify } = require("../utils");

// Initialize Twilio client once
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

// Get products by phone or slug
router.get("/products/:key", async (req, res) => {
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
  })
    .sort({ isFeatured: -1, createdAt: -1 }) // Sort by featured status first, then by creation date
    .lean();

  // Normalize image data to ensure consistency for the frontend
  const normalizedProducts = products.map((p) => {
    // Ensure imageUrls is an array and contains imageUrl if it's missing
    if (!Array.isArray(p.imageUrls) || p.imageUrls.length === 0) {
      p.imageUrls = p.imageUrl ? [p.imageUrl] : [];
    }
    // Ensure imageUrl is set to the first image in the array if it's missing
    if (!p.imageUrl && p.imageUrls.length > 0) {
      p.imageUrl = p.imageUrls[0];
    }
    return p;
  });

  res.json(normalizedProducts);
});

// Get all products for the general store
router.get("/products", async (req, res) => {
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
          isFeatured: !!p.isFeatured,
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
        // Add featured status to the sorting logic
        const scoreA =
          (a.isPro ? 2 : a.isVerified ? 1 : 0) + (a.isFeatured ? 0.5 : 0);
        const scoreB =
          (b.isPro ? 2 : b.isVerified ? 1 : 0) + (b.isFeatured ? 0.5 : 0);
        if (scoreB !== scoreA) return scoreB - scoreA;
        // If scores are equal, sort by date
        return scoreB - scoreA;
      });

    res.json(augmentedProducts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get trader info by phone or slug
router.get("/trader/:key", async (req, res) => {
  let user = await User.findOne({ phone: req.params.key })
    .select("+storeBannerUrl")
    .lean();
  if (!user) {
    user = await User.findOne({ slug: req.params.key })
      .select("+storeBannerUrl")
      .lean();
  }
  if (!user) return res.status(404).json({ error: "Trader not found" });
  res.json(user);
});

// Customer request endpoint
router.post("/request", async (req, res) => {
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

// Add Feedback endpoint
router.post("/feedback", async (req, res) => {
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
router.post("/analytics/track", async (req, res) => {
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

module.exports = router;
