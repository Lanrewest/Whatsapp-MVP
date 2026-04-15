const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    phone: { type: String, unique: true },
    state: { type: String, default: "idle" },
    language: { type: String, enum: ["en", "ha"], default: "en" },
    companyName: { type: String },
    address: { type: String },
    currentProduct: {
        name: String,
        price: Number
    }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);