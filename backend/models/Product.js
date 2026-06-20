const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    traderPhone: { type: String, required: true, index: true },
    traderSlug: { type: String, required: true, index: true },
    name: String,
    price: Number,
    imageUrl: String,
    imageUrls: [{ type: String }],
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", ProductSchema);
