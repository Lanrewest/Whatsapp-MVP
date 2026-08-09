const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema(
  {
    page: {
      type: String,
      required: true,
      enum: ["landing", "store", "product", "admin"], // Define possible pages
    },
    slug: {
      // For store and product pages, to identify the specific entity visited
      type: String,
      required: function () {
        return this.page === "store" || this.page === "product";
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Visit", visitSchema);
