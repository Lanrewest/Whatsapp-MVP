const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    phone: { type: String, unique: true },
    state: { type: String, default: "idle" },
    language: { type: String, enum: ["en", "ha"], default: "en" },
    companyName: { type: String },
    slug: { type: String, unique: true, sparse: true },
    address: { type: String },
    email: { type: String, unique: true, sparse: true }, // Added to fix the duplicate null error
    currentProduct: {
        name: String,
        price: Number
    }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);