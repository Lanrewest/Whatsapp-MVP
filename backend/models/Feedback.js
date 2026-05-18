const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema(
  {
    traderPhone: { type: String, required: true },
    customerName: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    traderSlug: { type: String },
    type: { type: String, enum: ["customer", "trader"], default: "customer" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Feedback", FeedbackSchema);
