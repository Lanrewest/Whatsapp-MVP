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

const normalizePhoneForLookup = (phone) => {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.substring(1)}`;
  return `234${digits}`;
};

const formatTwilioRecipient = (phone) => {
  const normalized = normalizePhoneForLookup(phone);
  if (!normalized) return null;
  return `whatsapp:+${normalized}`;
};

const buildRenewalLink = () => {
  const base = (
    process.env.FRONTEND_URL || "https://arewaconnect.com.ng"
  ).replace(/\/$/, "");
  return `${base}/upgrade?plan=pro&renew=1`;
};

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

    const normalizedPhone = normalizePhoneForLookup(phone);

    try {
      const user = await User.findOne({
        $or: [
          { phone: normalizedPhone },
          { phone: `+${normalizedPhone}` },
          { phone: `0${normalizedPhone.substring(3)}` },
          { phone: `whatsapp:+${normalizedPhone}` },
        ],
      });

      if (!user) {
        console.error(
          `❌ User matching "${phone}" not found in DB. Check your User collection phone formats.`,
        );
        return res.sendStatus(200);
      }

      user.isVerified = true;
      user.isPro = tier === "pro";
      user.subscriptionPlan = tier === "pro" ? "pro" : "verified";
      user.subscriptionStatus = "active";
      user.lastPaidAt = new Date();
      user.pendingTier = null;
      user.proExpiresAt =
        tier === "pro" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;
      await user.save();

      console.log(
        `✅ User ${normalizedPhone} verified as ${tier} via Paystack payment.`,
      );

      const lang = user.language || "en";
      const tierLabel = tier === "pro" ? "Pro User" : "Verified Trader";
      const renewalLink = buildRenewalLink();
      const successMsg =
        lang === "ha"
          ? `An kammala biyan kuɗi! Yanzu kai ${tierLabel} ne a Arewa Connect ✅.\n\nDon sabunta biyan kuɗi a kowane lokaci, ziyarci: ${renewalLink}`
          : `Payment successful! You are now a ${tierLabel} on Arewa Connect ✅.\n\nRenew anytime here: ${renewalLink}`;

      const recipient = formatTwilioRecipient(user.phone);
      if (recipient) {
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: recipient,
          body: successMsg,
        });
      }
    } catch (err) {
      console.error("Webhook User Update Error:", err);
    }
  }

  res.sendStatus(200);
});

module.exports = router;
