require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const webhook = require("./routes/webhook");
const Product = require("./models/Product");
const User = require("./models/User");
const twilio = require("twilio");

// Security Check: Ensure all required environment variables are loaded
const requiredEnvs = [
    "MONGO_URI",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_WHATSAPP_NUMBER",
    "CLOUDINARY_URL",
    "FRONTEND_URL",
];
requiredEnvs.forEach((env) => {
    if (!process.env[env]) {
        console.error(`ERROR: Missing required environment variable: ${env}`);
        process.exit(1);
    }
});

const app = express();
app.use(
    cors({
        origin: [
            process.env.FRONTEND_URL || "https://arewa-market.vercel.app",
            "http://localhost:3000",
        ],
    }),
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose
    .connect(process.env.MONGO_URI, {
        // These options help with connection stability
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
    })
    .then(() => console.log("MongoDB connected"));

// Root route to confirm server status
app.get("/", (req, res) => {
    res.send("ArewaMarket Backend Server is running!");
});

app.use("/api/webhook", webhook);

// Get products by phone or slug
app.get("/api/products/:key", async(req, res) => {
    let user = await User.findOne({ phone: req.params.key });
    if (!user) {
        user = await User.findOne({ slug: req.params.key });
    }
    if (!user) return res.json([]);
    const products = await Product.find({ traderPhone: user.phone });
    res.json(products);
});

// Get trader info by phone or slug
app.get("/api/trader/:key", async(req, res) => {
    let user = await User.findOne({ phone: req.params.key });
    if (!user) {
        user = await User.findOne({ slug: req.params.key });
    }
    if (!user) return res.status(404).json({ error: "Trader not found" });
    res.json(user);
});

// Customer request endpoint
app.post("/api/request", async(req, res) => {
    const { traderPhone, customerName, customerRequest } = req.body;
    if (!traderPhone || !customerName || !customerRequest) {
        return res.status(400).json({ error: "Missing fields" });
    }

    // Find trader
    const trader = await User.findOne({ phone: traderPhone });
    if (!trader) {
        return res.status(404).json({ error: "Trader not found" });
    }

    // Send WhatsApp message to trader
    const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
    );
    try {
        await client.messages.create({
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: `whatsapp:${traderPhone}`,
            body: `New customer request from ${customerName}:\n${customerRequest}`,
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to send WhatsApp message" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));