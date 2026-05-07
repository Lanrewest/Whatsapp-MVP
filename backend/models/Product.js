const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    traderPhone: { type: String, required: true, index: true },
    traderSlug: { type: String, required: true, index: true }, // New field for linking to store
    name: String,
    price: Number,
    imageUrl: String,
}, { timestamps: true }, );

module.exports = mongoose.model("Product", ProductSchema);