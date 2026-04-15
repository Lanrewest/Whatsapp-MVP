const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  traderPhone: String,
  name: String,
  price: Number,
  imageUrl: String
}, { timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);
