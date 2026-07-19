const twilio = require("twilio");
const User = require("../models/User");

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

const getReminderBody = (user, daysRemaining) => {
  const lang = user.language || "en";
  const renewalLink = buildRenewalLink();

  if (daysRemaining <= 0) {
    return lang === "ha"
      ? `Asusun Pro ɗin ku ya ƙare. Da fatan za a sabunta yanzu: ${renewalLink}`
      : `Your Pro subscription has expired. Please renew now: ${renewalLink}`;
  }

  if (daysRemaining === 1) {
    return lang === "ha"
      ? `Asusun Pro ɗin ku zai kare gobe. Don sabuntawa, danna: ${renewalLink}`
      : `Your Pro subscription expires tomorrow. Renew now: ${renewalLink}`;
  }

  return lang === "ha"
    ? `Asusun Pro ɗin ku zai kare a cikin kwanaki ${daysRemaining}. Don sabunta shi, danna: ${renewalLink}`
    : `Your Pro subscription will expire in ${daysRemaining} days. Renew now: ${renewalLink}`;
};

async function sendRenewalNotification(user) {
  const recipient = formatTwilioRecipient(user.phone);
  if (!recipient) return;

  const expiry = new Date(user.proExpiresAt);
  const daysRemaining = Math.ceil(
    (expiry - Date.now()) / (1000 * 60 * 60 * 24),
  );

  if (daysRemaining > 7 || daysRemaining < 0) return;

  const reminderBody = getReminderBody(user, daysRemaining);
  await twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: recipient,
    body: reminderBody,
  });

  user.renewalReminderSentAt = new Date();
  await user.save();
}

async function runSubscriptionReminderCycle() {
  try {
    const users = await User.find({
      isPro: true,
      proExpiresAt: { $ne: null },
    });

    for (const user of users) {
      const expiry = new Date(user.proExpiresAt);
      const daysRemaining = Math.ceil(
        (expiry - Date.now()) / (1000 * 60 * 60 * 24),
      );
      const shouldSendReminder = daysRemaining <= 7 && daysRemaining >= 0;
      const alreadySentRecently =
        user.renewalReminderSentAt &&
        new Date(user.renewalReminderSentAt) >
          new Date(Date.now() - 24 * 60 * 60 * 1000);

      if (shouldSendReminder && !alreadySentRecently) {
        await sendRenewalNotification(user);
      }
    }
  } catch (error) {
    console.error("❌ Subscription reminder job error:", error.message);
  }
}

module.exports = {
  runSubscriptionReminderCycle,
};
