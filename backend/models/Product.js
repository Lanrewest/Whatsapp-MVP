const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    traderPhone: { type: String, required: true, index: true },
    traderSlug: { type: String, required: true, index: true },
    name: String,
    price: Number,
    category: { type: String, trim: true, default: "General", index: true },
    imageUrl: String,
    imageUrls: [{ type: String }],
    isApproved: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", ProductSchema);
