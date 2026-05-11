require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const https = require('https'); // Import https module
const fs = require('fs'); // Import file system module

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
    // For HTTPS, ensure these are set in production with paths to your SSL files:
    // "SSL_KEY_PATH",
    // "SSL_CERT_PATH",
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
            // Ensure your frontend URL is always HTTPS in production
            process.env.FRONTEND_URL || "https://arewa-market.vercel.app",
            "http://localhost:3000",
            "https://localhost:3000", // Add for local HTTPS development
        ],
    }),
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose
    .connect(process.env.MONGO_URI, {
        // These options help with connection stability
        serverSelectionTimeoutMS: 10000, // Wait longer for initial selection
        connectTimeoutMS: 20000, // Allow more time for handshake
        socketTimeoutMS: 45000, // Prevent socket hangup
        family: 4, // Force IPv4 (sometimes resolves ETIMEOUT)
    }).catch((err) => console.error("MongoDB connection error:", err)); // Added error handling
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

// Get all products for the general store
app.get("/api/products", async(req, res) => {
    const products = await Product.find({});
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

const HTTP_PORT = process.env.PORT || 5000;
const HTTPS_PORT = process.env.HTTPS_PORT || 8443; // Default HTTPS port

// Check if SSL certificates are available and if we are in production
const useHttps = process.env.NODE_ENV === 'production' && process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH;

if (useHttps) {
    try {
        const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8');
        const certificate = fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8');
        // Optional: If you have a CA bundle, uncomment and add to credentials
        // const ca = fs.readFileSync(process.env.SSL_CA_PATH, 'utf8');
        const credentials = { key: privateKey, cert: certificate /*, ca: ca */ };

        const httpsServer = https.createServer(credentials, app);

        httpsServer.listen(HTTPS_PORT, () => {
            console.log(`HTTPS Server running on port ${HTTPS_PORT}`);
        });

        // Optional: Redirect HTTP to HTTPS
        // This creates a separate HTTP server that simply redirects all traffic to HTTPS.
        // This is good practice to ensure all connections are secure.
        const httpApp = express();
        httpApp.get('*', (req, res) => {
            // Use the correct HTTPS port for redirection
            res.redirect(`https://${req.headers.host.split(':')[0]}:${HTTPS_PORT}${req.url}`);
        });
        httpApp.listen(HTTP_PORT, () => {
            console.log(`HTTP Server redirecting all traffic to HTTPS on port ${HTTP_PORT}`);
        });

    } catch (error) {
        console.error("Failed to start HTTPS server. Check SSL certificate paths and permissions:", error);
        console.warn(`Falling back to HTTP server on port ${HTTP_PORT}. Your site may still show as "dangerous".`);
        app.listen(HTTP_PORT, () => console.log(`Server running on port ${HTTP_PORT}`));
    }
} else {
    console.warn("SSL_KEY_PATH or SSL_CERT_PATH not set, or NODE_ENV is not 'production'. Starting HTTP server. Your site may still show as 'dangerous'.");
    app.listen(HTTP_PORT, () => console.log(`Server running on port ${HTTP_PORT}`));
}