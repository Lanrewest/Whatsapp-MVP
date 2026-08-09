const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Product = require("../models/Product");
const Feedback = require("../models/Feedback");
const Visit = require("../models/Visit");
const cloudinary = require("cloudinary").v2;

const { slugify } = require("../utils");

const normalizeCategoryList = (value) => {
  const rawList = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return [
    ...new Set(rawList.map((item) => String(item).trim()).filter(Boolean)),
  ];
};

// Get Admin Stats
router.get("/stats", async (req, res) => {
  try {
    const getStartDate = (days) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1));
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const getDailyTrend = async (Model, days, matchQuery = {}) => {
      const startDate = getStartDate(days);
      const dateList = Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split("T")[0];
      }).reverse();

      const data = await Model.aggregate([
        { $match: { ...matchQuery, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
      ]);

      const dataMap = new Map(data.map((item) => [item._id, item.count]));
      return dateList.map((date) => ({
        _id: date,
        count: dataMap.get(date) || 0,
      }));
    };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      tierStats,
      totalUsers,
      totalProducts,
      landingVisits,
      storeVisits,
      todayLanding,
      todayStore,
      hourlyData,
      feedback,
      traders,
      products,
      trend7,
      trend30,
      topStoreVisits,
      topProductVisits,
    ] = await Promise.all([
      User.aggregate([
        { $group: { _id: "$tier", count: { $sum: 1 } } },
        { $project: { _id: 0, tier: "$_id", count: "$count" } },
      ]),
      User.countDocuments(),
      Product.countDocuments(),
      Visit.countDocuments({ page: "landing" }),
      Visit.countDocuments({ page: "store" }),
      Visit.countDocuments({
        page: "landing",
        createdAt: { $gte: todayStart },
      }),
      Visit.countDocuments({ page: "store", createdAt: { $gte: todayStart } }),
      Visit.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        },
        { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Feedback.find({}).sort({ createdAt: -1 }).limit(50),
      User.find({}),
      Product.find({}).sort({ createdAt: -1 }).lean(), // Use .lean() for better performance
      Promise.all([
        getDailyTrend(User, 7),
        getDailyTrend(Product, 7),
        getDailyTrend(Visit, 7, { page: "landing" }),
        getDailyTrend(Visit, 7, { page: "store" }),
      ]),
      Promise.all([
        getDailyTrend(User, 30),
        getDailyTrend(Product, 30),
        getDailyTrend(Visit, 30, { page: "landing" }),
        getDailyTrend(Visit, 30, { page: "store" }),
      ]),
      Visit.aggregate([
        { $match: { page: "store", slug: { $exists: true, $ne: "" } } },
        { $group: { _id: "$slug", visits: { $sum: 1 } } },
        { $sort: { visits: -1, _id: 1 } },
        { $limit: 5 },
      ]),
      Visit.aggregate([
        { $match: { page: "product", slug: { $exists: true, $ne: "" } } },
        { $group: { _id: "$slug", visits: { $sum: 1 } } },
        { $sort: { visits: -1, _id: 1 } },
        { $limit: 5 },
      ]),
    ]);

    const tierMap = tierStats.reduce(
      (acc, { tier, count }) => ({ ...acc, [tier]: count }),
      { basic: 0, verified: 0, pro: 0 },
    );

    const topStores = await User.find({
      slug: { $in: topStoreVisits.map((item) => item._id).filter(Boolean) },
    })
      .select("slug companyName")
      .lean();

    const storeMap = Object.fromEntries(
      topStores.map((store) => [store.slug, store]),
    );

    const topProducts = await Product.find({
      _id: { $in: topProductVisits.map((item) => item._id).filter(Boolean) },
    })
      .select("_id name traderSlug")
      .lean();

    const productMap = Object.fromEntries(
      topProducts.map((product) => [String(product._id), product]),
    );

    // Normalize product image data before sending to frontend
    const normalizedProducts = products.map((p) => {
      // Ensure imageUrls is an array
      if (!Array.isArray(p.imageUrls) || p.imageUrls.length === 0) {
        p.imageUrls = p.imageUrl ? [p.imageUrl] : [];
      }
      // Ensure imageUrl is the first item from imageUrls, if available
      if (!p.imageUrl && p.imageUrls.length > 0) {
        p.imageUrl = p.imageUrls[0];
      }
      return p;
    });

    res.json({
      traders,
      products: normalizedProducts,
      totalUsers,
      totalProducts,
      feedback,
      landingVisits,
      storeVisits,
      todayLanding,
      todayStore,
      hourlyData,
      tierStats: tierMap,
      daily: {
        traders: trend7[0],
        products: trend7[1],
        landing: trend7[2],
        store: trend7[3],
      },
      trends: {
        seven: {
          traders: trend7[0],
          products: trend7[1],
          landing: trend7[2],
          store: trend7[3],
        },
        thirty: {
          traders: trend30[0],
          products: trend30[1],
          landing: trend30[2],
          store: trend30[3],
        },
      },
      topStores: topStoreVisits.map((item) => ({
        _id: item._id,
        visits: item.visits,
        storeName: storeMap[item._id]?.companyName || item._id,
      })),
      topProducts: topProductVisits.map((item) => ({
        _id: item._id,
        visits: item.visits,
        productName: productMap[item._id]?.name || item._id,
        traderSlug: productMap[item._id]?.traderSlug || null,
      })),
    });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Set Trader Tier
router.patch("/set-tier/:id", async (req, res) => {
  try {
    const { tier } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const wasPro = user.isPro;
    const isNowPro = tier === "pro";

    user.isVerified = tier === "verified" || tier === "pro";
    user.isPro = isNowPro;

    if (wasPro && !isNowPro) {
      user.storeBannerUrl = "";
      await Product.updateMany(
        { traderPhone: user.phone },
        { isFeatured: false },
      );
      console.log(
        `💎 Admin downgraded ${user.phone} from Pro. Benefits revoked.`,
      );
    }

    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update tier" });
  }
});

// Upload multiple images for admin-managed content
router.post("/upload-images", async (req, res) => {
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
    res.status(500).json({ error: "Failed to upload images" });
  }
});

// Create Trader (Admin)
router.post("/traders", async (req, res) => {
  try {
    const { phone, companyName, address, storeCategories } = req.body;
    if (!phone || !companyName)
      return res
        .status(400)
        .json({ error: "Phone and company name are required" });
    const normalizedPhone = phone.replace(/\D/g, "");
    if (!normalizedPhone)
      return res.status(400).json({ error: "Invalid phone number" });
    if (await User.findOne({ phone: { $in: [phone, normalizedPhone] } }))
      return res.status(409).json({ error: "Trader already exists" });

    let baseSlug = slugify(companyName);
    let slug = baseSlug || `trader-${normalizedPhone}`;
    let counter = 1;
    while (await User.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const user = await User.create({
      phone,
      companyName,
      address,
      slug,
      storeCategories: normalizeCategoryList(storeCategories),
      isApproved: true,
      isBlocked: false,
      state: "idle",
    });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: "Failed to create trader" });
  }
});

// Create Product (Admin)
router.post("/products", async (req, res) => {
  try {
    const { name, price, traderPhone, imageUrl, imageUrls, category } =
      req.body;
    if (!name || !price || !traderPhone)
      return res
        .status(400)
        .json({ error: "Name, price, and trader phone are required" });

    const normalizedPhone = traderPhone.replace(/\D/g, "");
    const trader = await User.findOne({ phone: { $regex: normalizedPhone } });
    if (!trader)
      return res
        .status(404)
        .json({ error: `Trader with phone "${traderPhone}" not found.` });

    const product = await Product.create({
      name,
      price: Number(price),
      traderPhone: trader.phone,
      traderSlug: trader.slug,
      category: String(category || "General").trim() || "General",
      imageUrl:
        imageUrl || (imageUrls && imageUrls.length > 0 ? imageUrls[0] : ""),
      imageUrls: imageUrls || [],
      isApproved: true,
    });
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update Trader info (Admin)
router.patch("/traders/:id", async (req, res) => {
  try {
    const {
      companyName,
      address,
      isApproved,
      isBlocked,
      storeBannerUrl,
      storeCategories,
    } = req.body;
    const updates = {
      companyName,
      address,
      isApproved,
      isBlocked,
      storeBannerUrl,
    };
    if (storeCategories !== undefined) {
      updates.storeCategories = normalizeCategoryList(storeCategories);
    }
    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key],
    );

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
router.patch("/products/:id", async (req, res) => {
  try {
    const { name, price, imageUrl, imageUrls, isApproved, category } = req.body;
    const updates = { name, price, imageUrl, imageUrls, isApproved, category };
    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key],
    );

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Toggle Product Feature Status (Admin)
router.patch("/products/:id/toggle-feature", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    product.isFeatured = !product.isFeatured;
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete Product (Admin)
router.delete("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Delete Trader and their products
router.delete("/trader/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    await Product.deleteMany({ traderPhone: user.phone });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Trader and products deleted." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete trader" });
  }
});

module.exports = router;
