const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const twilio = require("twilio");
const User = require("../models/User");

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

// Paystack Webhook: Automatically verify traders upon payment
router.post("/webhook", async (req, res) => {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(req.rawBody)
    .digest("hex");

  // Verify the request came from Paystack
  if (hash !== req.headers["x-paystack-signature"]) {
    console.error(
      "❌ Paystack Webhook Error: Signature mismatch. Check your PAYSTACK_SECRET_KEY.",
    );
    return res.status(400).send("Invalid signature");
  }

  const event = req.body;
  console.log(`📩 Paystack Webhook Received: ${event.event}`);

  if (event.event === "charge.success") {
    let metadata = event.data.metadata;

    // Defensive: Paystack sometimes sends metadata as a string
    if (typeof metadata === "string" && metadata.trim() !== "") {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        console.error(
          "❌ Failed to parse Paystack metadata string:",
          e.message,
        );
      }
    }

    let phone = metadata && metadata.phone ? metadata.phone : null;
    let tier = metadata && metadata.tier ? metadata.tier : "verified";

    if (!phone && event.data.customer && event.data.customer.email) {
      const emailPrefix = event.data.customer.email.split("@")[0];
      phone = emailPrefix.replace(/\D/g, "");
      console.log(
        `ℹ️ Phone missing in metadata, extracted from email: ${phone}`,
      );
    }

    if (!phone) {
      console.error(
        "❌ Paystack Webhook Error: No phone number found in metadata or email.",
      );
      return res.sendStatus(200);
    }

    try {
      const user = await User.findOneAndUpdate(
        { phone: { $regex: phone.replace(/^0/, "(0)?") } }, // More flexible regex
        {
          isVerified: true,
          isPro: tier === "pro",
          tier: tier, // Explicitly set the tier field
          proExpiresAt: tier === "pro" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
        },
        { new: true },
      );

      if (!user) {
        console.error(
          `❌ User matching "${phone}" not found in DB. Check your User collection phone formats.`,
        );
        return res.sendStatus(200);
      }

      console.log(`✅ User ${phone} verified as ${tier} via Paystack payment.`);

      const lang = user.language || "en";
      const tierLabel = tier === "pro" ? "Pro User" : "Verified Trader";
      const successMsg =
        lang === "ha"
          ? `An kammala biyan kuɗi! Yanzu kai ${tierLabel} ne a Arewa Connect ✅.`
          : `Payment successful! You are now a ${tierLabel} on Arewa Connect ✅.`;

      await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${user.phone}`, // Use the canonical phone from the DB
        body: successMsg,
      });
    } catch (err) {
      console.error("Webhook User Update Error:", err);
    }
  }

  res.sendStatus(200);
});

module.exports = router;