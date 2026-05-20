const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema({
    page: {
        type: String,
        required: true,
        enum: ["landing", "store", "admin"], // Define possible pages
    },
    slug: {
        // For store pages, to identify which store was visited
        type: String,
        required: function() {
            return this.page === "store";
        }, // Required only if page is 'store'
    },
}, { timestamps: true });

module.exports = mongoose.model("Visit", visitSchema);