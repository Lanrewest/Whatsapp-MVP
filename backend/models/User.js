const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    phone: { type: String, unique: true },
    state: { type: String, default: "idle" },
    language: { type: String, enum: ["en", "ha"], default: "en" },
    companyName: { type: String },
    slug: { type: String, unique: true, sparse: true },
    address: { type: String },
    email: { type: String },
    currentProduct: {
      name: String,
      price: Number,
      imageUrls: [{ type: String }],
    },
    currentProductId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    isVerified: { type: Boolean, default: false },
    isPro: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    proExpiresAt: { type: Date },
    dailyUsageCount: { type: Number, default: 0 },
    lastUsageDate: { type: String },
    pendingTier: { type: String },
    subscriptionStatus: { type: String, default: "inactive" },
    subscriptionPlan: { type: String, default: "free" },
    lastPaidAt: { type: Date },
    renewalReminderSentAt: { type: Date },
    verificationReceiptUrl: { type: String },
    storeBannerUrl: { type: String, default: "" },
    storeCategories: [{ type: String, trim: true }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema);
