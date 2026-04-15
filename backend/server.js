require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const webhook = require("./routes/webhook");
const Product = require("./models/Product");
const User = require("./models/User");
const twilio = require("twilio");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"));


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

// Get trader info by slug
app.get("/api/trader/:slug", async(req, res) => {
    const user = await User.findOne({ slug: req.params.slug });
    if (!user) return res.status(404).json({ error: "Trader not found" });
    res.json({
        companyName: user.companyName,
        address: user.address
    });
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
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    try {
        await client.messages.create({
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: `whatsapp:${traderPhone}`,
            body: `New customer request from ${customerName}:\n${customerRequest}`
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to send WhatsApp message" });
    }
});

app.listen(process.env.PORT, () => console.log("Server running"));