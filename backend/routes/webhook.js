const express = require("express");
const router = express.Router();
const twilio = require("twilio");
const MessagingResponse = twilio.twiml.MessagingResponse;
const cloudinary = require("cloudinary").v2; // Import Cloudinary SDK
const axios = require("axios"); // Install this: npm install axios

const User = require("../models/User");
const Product = require("../models/Product");
const Feedback = require("../models/Feedback");

// Helper to create a URL-friendly slug from company name
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^a-z0-9\-]/g, "") // Remove all non-alphanumeric except -
    .replace(/-+/g, "-") // Replace multiple - with single -
    .replace(/^-+|-+$/g, ""); // Trim - from start/end
}

// Configure Cloudinary using the URL from environment variables
cloudinary.config(); // Automatically picks up CLOUDINARY_URL from process.env

// Bilingual prompts
const prompts = {
  en: {
    welcome:
      "Welcome to Arewa Connect! Please select your language:\n1. English\n2. Hausa",
    askCompany:
      "Please enter your *Company Name* and *Address* separated by a comma.\n\nExample: Alhaji & Sons, No 5 Kano Road",
    askAddress: "Please enter your company address:", // Fallback
    registrationComplete: "Registration complete! You can now add products.",
    addProduct: "1. Add Product\n2. View My Store",
    enterProductName:
      "Enter *Product Name* and *Price* separated by a comma.\n\nExample: Men's Shoes, 5000",
    enterPrice: "Enter price:", // Fallback
    companyNameTaken:
      "This company name is already taken. Please choose another one.",
    enterValidPrice: "Enter valid price:",
    sendImageOrSkip: "Send image or type SKIP",
    productAdded: "✅ Product added!\n1. Add another\n2. View store",
    viewStore: (slug) =>
      `You can view your store at:\n${process.env.FRONTEND_URL || "https://arewaconnect.com.ng"}/store/${slug}`,
    replyHi: "Reply Hi to start",
    welcomeBack: (name) => `Welcome back, ${name}! What would you like to do?`,
    mainMenu:
      "1. Add Product\n2. View My Store\n3. Update Address\n4. Delete Product\n5. Give Feedback\n6. Upgrade Account / Get Badge",
    productNotFound: "Product not found.",
    askNewAddress: "Please enter your new company address:",
    addressUpdated: "✅ Address updated successfully!",
    askDeleteProduct: "Enter the exact name of the product you want to delete:",
    productDeleted: "🗑️ Product deleted successfully.",
    askFeedback:
      "We value your input! Please type your feedback/suggestions for Arewa Connect below:",
    feedbackReceived:
      "🙏 Thank you! Your feedback has been recorded. Our team will look into it.",
    verifying: "Generating your secure payment link...",
    verifyError: "Payment system busy. Please try again or contact support.",
    askVerifyChoice:
      "Select Upgrade Type:\n1. Verified Badge (₦2,000 One-time)\n2. Pro Subscription (₦2,000 Monthly - 200 msgs/day + includes Badge)",
    askPaymentMethod:
      "How would you like to pay for your badge?\n1. Pay Online (Instant ✅)\n2. Bank Transfer (Manual 🏦)",
    bankDetails:
      "Please transfer ₦2,000 to:\n\n*Bank:* Zenith Bank\n*Account:* 1234567890\n*Name:* Arewa Connect\n\nAfter payment, please send a *screenshot of the receipt* here.",
    receiptReceived:
      "🙏 Thank you! Your receipt has been received. Our team will verify it and update your badge shortly.",
    sendReceiptOnly: "Please send a photo/screenshot of your payment receipt.",
  },
  pro: {
    en: {
      askBannerImage:
        "Please send the image you want to use as your store banner.",
      bannerUpdated: "✅ Your store banner has been updated!",
      askFeatureProduct:
        "Reply with the number of the product you want to feature (e.g., '1').",
      productFeatured: "⭐ Product featured successfully!",
      askUnfeatureProduct:
        "Reply with the number of the product you want to un-feature (e.g., '1').",
      productUnfeatured: "Product is no longer featured.",
      notPro: "This is a Pro feature. Please upgrade your account to use it.",
      maxFeaturedReached:
        "You have reached the maximum of 3 featured products. Please un-feature another product first.",
      proMenu:
        "Pro Menu 💎:\n1. Set Store Banner\n2. Feature a Product\n3. Un-feature a Product",
    },
    ha: {
      askBannerImage:
        "Da fatan za a aiko da hoton da kake son amfani da shi a saman shaganka.",
      bannerUpdated: "✅ An sabunta hoton shaganka!",
      askFeatureProduct:
        "Amsa da lambar kayan da kake son fitarwa (misali, '1').",
      productFeatured: "⭐ An fitar da kayan cikin nasara!",
      askUnfeatureProduct:
        "Amsa da lambar kayan da kake son cirewa daga fitattun (misali, '1').",
      productUnfeatured: "An cire kayan daga jerin fitattu.",
      notPro:
        "Wannan na masu asusun Pro ne kawai. Da fatan za a haɓaka asusunka.",
      maxFeaturedReached:
        "Kun kai iyakacin kayayyaki da za'a iya fitarwa (guda 3). Da fatan za a cire wani.",
      proMenu:
        "Ayyukan Pro 💎:\n1. Sanya Hoton Shago (Banner)\n2. Fitar da Kaya (Feature)\n3. Cire Fitar da Kaya",
    },
  },
  ha: {
    welcome:
      "Barka da zuwa Arewa Connect! Da fatan za a zaɓi yaren ku:\n1. Turanci\n2. Hausa",
    askCompany:
      "Shigar da *Sunan Kamfani* da *Adireshin ku* (raba su da 'comma').\n\nMisali: Alhaji & Sons, No 5 Kano Road",
    askAddress: "Da fatan za a shigar da adireshin kamfanin ku:", // Fallback
    registrationComplete: "Rajista ta kammala! Yanzu zaku iya ƙara kayayyaki.",
    addProduct: "1. Ƙara Kaya\n2. Duba Shagona",
    enterProductName:
      "Shigar da *Sunan Kaya* da *Farashi* (raba su da 'comma').\n\nMisali: Takalmi, 5000",
    enterPrice: "Shigar da farashi:", // Fallback
    companyNameTaken:
      "An riga an yi amfani da wannan sunan kamfani. Da fatan za a zaɓi wani.",
    enterValidPrice: "Shigar da sahihin farashi:",
    sendImageOrSkip: "Aika hoto ko rubuta SKIP",
    productAdded: "✅ An ƙara kaya!\n1. Ƙara wani\n2. Duba shago",
    viewStore: (slug) =>
      `Zaku iya duba shagonku a:\n${process.env.FRONTEND_URL || "https://arewaconnect.com.ng"}/store/${slug}`,
    replyHi: "Amsa da Hi don farawa",
    welcomeBack: (name) => `Barka da dawowa, ${name}! Me kake son yi?`,
    mainMenu:
      "1. Ƙara Kaya\n2. Duba Shagona\n3. Gyara Adireshin Kamfani\n4. Goge Kaya\n5. Ba da Rahoto/Shawara\n6. Haɓaka Asusun ku",
    productNotFound: "Ba a sami kaya ba.",
    askNewAddress: "Da fatan za a shigar da sabon adireshin kamfani:",
    addressUpdated: "✅ An gyara adireshin kamfani cikin nasara!",
    askDeleteProduct: "Shigar da ainihin sunan kayan da kake son gogewa:",
    productDeleted: "🗑️ An goge kayan cikin nasara.",
    askFeedback:
      "Muna daraja ra'ayin ku! Da fatan za a rubuta shawara ko korafi game da Arewa Connect a kasa:",
    feedbackReceived: "🙏 Mun gode! An karbi ra'ayin ku. Za mu duba shi.",
    verifying: "Ana shirya hanyar biyan kuɗi...",
    verifyError: "An sami matsala. Da fatan za a sake gwadawa.",
    askVerifyChoice:
      "Zaɓi nau'in haɓakawa:\n1. Shaidar Tabbatarwa (₦2,000 Sau ɗaya)\n2. Pro Subscription (₦2,000 Duk wata - Sakonni 200 + Shaidar ✅)",
    askPaymentMethod:
      "Yaya kake son biya?\n1. Biya ta Online (Nan take ✅)\n2. Canja wurin kudi ta Banki (Manual 🏦)",
    bankDetails:
      "Da fatan za a tura ₦2,000 zuwa:\n\n*Bank:* Zenith Bank\n*Account:* 1234567890\n*Sunan:* Arewa Connect\n\nBayan kayi biya, turo hoton shaidar biyan ka (receipt) a nan.",
    receiptReceived:
      "🙏 Mun gode! Mun karbi hoton shaidar biyan ku. Za mu duba sannan mu inganta asusun ku nan ba da jimawa ba.",
    sendReceiptOnly: "Da fatan za a turo hoton shaidar biyan ku.",
  },
};

router.post("/", async (req, res) => {
  const twiml = new MessagingResponse();
  try {
    const msg = (req.body.Body || "").trim();
    const from = (req.body.From || "").replace("whatsapp:", "");
    const numMedia = parseInt(req.body.NumMedia || "0", 10);
    const mediaUrl = numMedia > 0 ? req.body.MediaUrl0 : null;

    if (!from || from === "") {
      console.error(
        "❌ Webhook Error: No 'From' number provided in request body.",
      );
      return res.status(400).send("Missing sender info");
    }

    console.log(`📩 Incoming: From=${from}, Msg="${msg}"`);
    const phoneDigits = from.replace(/\D/g, "");

    // 🔎 Robust User Lookup
    let user = await User.findOne({
      $or: [
        { phone: from },
        { phone: phoneDigits },
        { phone: `+${phoneDigits}` },
        { phone: `whatsapp:+${phoneDigits}` },
        {
          phone: phoneDigits.startsWith("234")
            ? `0${phoneDigits.substring(3)}`
            : phoneDigits,
        },
        {
          phone: phoneDigits.startsWith("234")
            ? phoneDigits.substring(3)
            : phoneDigits,
        },
        {
          phone: phoneDigits.startsWith("0")
            ? `234${phoneDigits.substring(1)}`
            : phoneDigits,
        },
      ],
    });

    if (!user) {
      console.log(`New user detected: ${from}`);
      user = await User.create({
        phone: phoneDigits, // Store clean digits for consistency
        companyName: "",
        state: "awaiting_language",
        language: "en",
      });
    }

    if (!user) {
      console.error("❌ Failed to find or create user for:", phoneDigits);
      return res.status(500).send("Database error");
    }

    // Initialize defaults
    user.language =
      user.language === "en" || user.language === "ha" ? user.language : "en";
    user.currentProduct = user.currentProduct || { name: "", price: 0 };
    user.state = user.state || "awaiting_language";

    // 🕒 Subscription Management Logic
    if (user.isPro && user.proExpiresAt) {
      const now = new Date();
      const expiry = new Date(user.proExpiresAt);
      const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

      if (daysRemaining <= 0) {
        // Rollback to Verified
        user.isPro = false;
        user.storeBannerUrl = ""; // Remove banner
        user.proExpiresAt = null;
        await user.save();

        // Remove all "featured" status from their products
        await Product.updateMany({ traderPhone: user.phone }, { isFeatured: false });
        console.log(`💎 Pro subscription expired for ${user.phone}. Benefits revoked.`);

        const expiredMsg =
          user.language === "ha"
            ? "Biyan kuɗin ku na 'Pro' ya ƙare. An mayar da ku asusun 'Verified'. 💎"
            : "Your Pro subscription has expired. You have been rolled back to a Verified account. 💎";
        twiml.message(expiredMsg);
      } else if (daysRemaining <= 3 && !user.expiryNotified) {
        // Notify 3 days before expiration (one-time flag)
        const warningMsg =
          user.language === "ha"
            ? `Sauran kwanaki ${daysRemaining} biyan kuɗin ku na Pro ya ƙare. Ku sabunta don ci gaba da amfani da damar 200 messages.`
            : `Your Pro subscription expires in ${daysRemaining} days. Renew now to keep your 200 messages/day limit!`;
        twiml.message(warningMsg);
        user.expiryNotified = true; // You'd need to add this field to the model too
        await user.save();
      }
    }

    const lang = user.language;
    const t = prompts[lang];

    // Add Pro prompts to the language object
    t.pro = prompts.pro[lang];

    // 1. Unified Greeting & Reset Logic
    const isGreeting = /^(hi|start|market)/i.test(msg);
    const isJoinMessage = /^join/i.test(msg);

    if (isGreeting || isJoinMessage) {
      console.log(
        `👋 Greeting from ${user.phone}. Setting state to awaiting_language.`,
      );
      user.dailyUsageCount++; // Count the interaction
      if (user.companyName && !isJoinMessage) {
        user.state = "main_menu";
        await user.save();
        let mainMenu = t.mainMenu;
        if (user.isPro) mainMenu += "\n7. Pro Features 💎";
        twiml.message(`${t.welcomeBack(user.companyName)}\n${mainMenu}`);
        console.log(`✅ Response sent: Welcome back to ${user.phone}`);
        return res.type("text/xml").send(twiml.toString());
      }
      user.state = "awaiting_language";
      await user.save();
      twiml.message(prompts[lang].welcome);
      console.log(`✅ Response sent: Language selection to ${user.phone}`);
      return res.type("text/xml").send(twiml.toString());
    }

    // 🛡️ Daily Usage Cap Logic - Moved here to allow greetings to pass through
    const today = new Date().toISOString().split("T")[0];
    if (user.lastUsageDate !== today) {
      user.dailyUsageCount = 0;
      user.lastUsageDate = today;
      // Save immediately to reset the count in the database
      await user.save();
    }

    // Define limits based on verification status
    let dailyLimit = 10;
    if (user.isPro) dailyLimit = 200;
    else if (user.isVerified) dailyLimit = 50;

    if (user.dailyUsageCount >= dailyLimit) {
      // This block now correctly handles all messages once the limit is reached.
      // It sends a consistent message and then stops, preventing silent "OK" responses.
      const limitMsg =
        user.language === "ha"
          ? "Kuyi hakuri, kun kai iyakacin saƙonni na yau. Da fatan za a sake gwadawa bayan awa 24, ko ku amsa da '6' don haɓaka asusun ku."
          : "You have reached your daily message limit. Please try again after 24 hours, or reply with '6' to upgrade your account for a higher limit.";
      twiml.message(limitMsg);
      return res.type("text/xml").send(twiml.toString());
    }

    // If the user is within their limit, increment the usage count for this interaction.
    // We do it here so greetings are counted, but limit-exceeded messages are not double-counted.
    user.dailyUsageCount++;

    // 2. State Machine
    switch (user.state) {
      case "awaiting_language":
        console.log(`🔄 User ${user.phone} selecting language: ${msg}`);
        if (msg === "1") {
          user.language = "en";
        } else if (msg === "2") {
          user.language = "ha";
        } else {
          twiml.message(prompts.en.welcome);
          return res.type("text/xml").send(twiml.toString());
        }
        user.state = user.companyName ? "main_menu" : "register_company";
        await user.save();
        twiml.message(
          user.companyName
            ? `${prompts[user.language].welcomeBack(user.companyName)}\n${
                prompts[user.language].mainMenu
              }${user.isPro ? "\n7. Pro Features 💎" : ""}`
            : prompts[user.language].askCompany,
        );
        console.log(`✅ Response generated for ${user.phone}: ${user.state}`);
        return res.type("text/xml").send(twiml.toString());

      case "register_company":
        if (user.companyName) {
          // Immutability Guard
          user.state = "main_menu";
          await user.save();
          let mainMenu = t.mainMenu;
          if (user.isPro) mainMenu += "\n7. Pro Features 💎";

          twiml.message(t.welcomeBack(user.companyName) + "\n" + mainMenu);
          return res.type("text/xml").send(twiml.toString());
        }

        // Split input by comma to handle Name and Address at once
        const regParts = msg.split(",").map((p) => p.trim());
        const compName = regParts[0];
        const compAddr =
          regParts.length > 1 ? regParts.slice(1).join(", ") : null;

        const safeName = compName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const existing = await User.findOne({
          companyName: { $regex: new RegExp(`^${safeName}$`, "i") },
        });

        if (existing) {
          // Uniqueness Guard
          twiml.message(t.companyNameTaken);
          return res.type("text/xml").send(twiml.toString());
        }

        user.companyName = compName;
        let baseSlug = slugify(compName);
        let slug = baseSlug;
        let i = 1;
        while (await User.findOne({ slug })) {
          slug = `${baseSlug}-${i++}`;
        }
        user.slug = slug;

        if (compAddr) {
          // If address was provided with the comma, finish registration immediately
          user.address = compAddr;
          user.state = "main_menu";
          await user.save();
          let mainMenu = t.mainMenu;
          if (user.isPro) mainMenu += "\n7. Pro Features 💎";

          twiml.message(t.registrationComplete + "\n" + mainMenu);
        } else {
          // Fallback if they only sent the name
          user.state = "register_address";
          await user.save();
          twiml.message(t.askAddress);
        }
        return res.type("text/xml").send(twiml.toString());

      case "register_address":
        user.address = msg;
        user.state = "main_menu";
        await user.save();
        let mainMenu = t.mainMenu;
        if (user.isPro) mainMenu += "\n7. Pro Features 💎";

        twiml.message(t.registrationComplete + "\n" + mainMenu);
        return res.type("text/xml").send(twiml.toString());

      case "idle":
      case "main_menu":
        if (msg === "1") {
          user.state = "adding_name";
          await user.save();
          twiml.message(t.enterProductName);
          return res.type("text/xml").send(twiml.toString());
        } else if (msg === "2") {
          const storeLink = user.slug
            ? t.viewStore(user.slug)
            : t.viewStore(from);
          twiml.message(storeLink);
          return res.type("text/xml").send(twiml.toString());
        } else if (msg === "3") {
          user.state = "updating_address";
          await user.save();
          twiml.message(t.askNewAddress);
          return res.type("text/xml").send(twiml.toString());
        } else if (msg === "4") {
          user.state = "deleting_product";
          await user.save();
          twiml.message(t.askDeleteProduct);
          return res.type("text/xml").send(twiml.toString());
        } else if (msg === "5") {
          user.state = "awaiting_feedback";
          await user.save();
          twiml.message(t.askFeedback);
          return res.type("text/xml").send(twiml.toString());
        } else if (msg === "6") {
          user.state = "verification_choice";
          await user.save();
          twiml.message(t.askVerifyChoice);
          return res.type("text/xml").send(twiml.toString());
        } else if (msg === "7") {
          if (user.isPro) {
            user.state = "pro_menu_action";
            await user.save();
            twiml.message(t.pro.proMenu);
          } else {
            twiml.message(t.pro.notPro);
          }
          return res.type("text/xml").send(twiml.toString());
        }
        break;

      case "pro_menu_action":
        if (!user.isPro) {
          user.state = "main_menu";
          await user.save();
          twiml.message(t.pro.notPro);
          return res.type("text/xml").send(twiml.toString());
        }
        if (msg === "1") {
          // Set Banner - This was the bug. It should go to pro_setting_banner directly.
          user.state = "pro_setting_banner";
          await user.save();
          twiml.message(t.pro.askBannerImage);
        } else if (msg === "2") {
          // Feature Product
          const products = await Product.find({
            traderPhone: from,
            isFeatured: { $ne: true },
          }).lean();
          if (products.length === 0) {
            twiml.message(
              lang === "ha"
                ? "Babu wasu kayayyaki da za a iya fitarwa."
                : "You have no products available to feature.",
            );
          } else {
            const productList = products
              .map((p, i) => `${i + 1}. ${p.name}`)
              .join("\n");
            user.state = "pro_featuring_product";
            await user.save();
            twiml.message(`${productList}\n\n${t.pro.askFeatureProduct}`);
          }
        } else if (msg === "3") {
          // Un-feature Product
          const featuredProducts = await Product.find({
            traderPhone: from,
            isFeatured: true,
          }).lean();
          if (featuredProducts.length === 0) {
            twiml.message(
              lang === "ha"
                ? "Babu kayayyakin da aka fitar."
                : "You have no featured products.",
            );
          } else {
            const productList = featuredProducts
              .map((p, i) => `${i + 1}. ${p.name}`)
              .join("\n");
            user.state = "pro_unfeaturing_product";
            await user.save();
            twiml.message(`${productList}\n\n${t.pro.askUnfeatureProduct}`);
          }
        } else {
          twiml.message(t.pro.proMenu); // Re-ask if invalid option
        }
        return res.type("text/xml").send(twiml.toString());

      case "pro_setting_banner":
        if (mediaUrl) {
          try {
            const authenticatedMediaUrl = mediaUrl.replace(
              "https://api.twilio.com",
              `https://${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}@api.twilio.com`,
            );
            const uploadResult = await cloudinary.uploader.upload(
              authenticatedMediaUrl,
              { folder: "arewaconnect_banners" },
            );
            user.storeBannerUrl = uploadResult.secure_url;
            user.state = "main_menu";
            await user.save();
            twiml.message(t.pro.bannerUpdated);
          } catch (e) {
            twiml.message(t.sendReceiptOnly + " (Upload failed, try again)");
          }
        } else {
          twiml.message(t.pro.askBannerImage);
        }
        return res.type("text/xml").send(twiml.toString());

      case "verification_choice":
        if (msg === "1" || msg === "2") {
          // Store the choice (Verified or Pro) in a temporary field or state
          user.pendingTier = msg === "1" ? "verified" : "pro";
          user.state = "payment_method_choice";
          await user.save();
          twiml.message(t.askPaymentMethod);
          return res.type("text/xml").send(twiml.toString());
        } else {
          twiml.message(t.askVerifyChoice);
          return res.type("text/xml").send(twiml.toString());
        }

      case "payment_method_choice":
        if (msg === "1") {
          // Paystack logic
          if (!process.env.PAYSTACK_SECRET_KEY) {
            twiml.message(
              "Automated online payment is currently being set up. Please select Option 2 for Bank Transfer to verify your account manually.",
            );
            return res.type("text/xml").send(twiml.toString());
          }
          try {
            const rawKey = process.env.PAYSTACK_SECRET_KEY || "";
            const cleanKey = rawKey.trim();

            console.log(
              `🔑 Paystack Auth Debug: Prefix=${cleanKey.substring(0, 7)}..., Length=${cleanKey.length}, Type=${cleanKey.startsWith("sk_") ? "Secret (Correct)" : "INVALID_TYPE"}`,
            );

            const frontendUrl = (
              process.env.FRONTEND_URL || "https://arewaconnect.com.ng"
            ).replace(/\/$/, "");

            const response = await axios.post(
              "https://api.paystack.co/transaction/initialize",
              {
                email: `${phoneDigits}@arewaconnect.com.ng`,
                amount: 2000 * 100,
                callback_url: `${frontendUrl}/store/${user.slug}`,
                metadata: {
                  phone: phoneDigits,
                  tier: user.pendingTier || "verified",
                },
              },
              {
                headers: {
                  Authorization: `Bearer ${cleanKey}`,
                },
              },
            );
            user.state = "main_menu";
            await user.save();
            const upgradeName =
              user.pendingTier === "pro"
                ? "Pro Subscription"
                : "Verified Badge";
            twiml.message(
              `${t.verifying}\n\nPay here for your ${upgradeName}: ${response.data.data.authorization_url}`,
            );
          } catch (err) {
            console.error(
              "❌ Paystack Initialization Error:",
              err.response ? err.response.data : err.message,
            );
            twiml.message(t.verifyError);
          }
          return res.type("text/xml").send(twiml.toString());
        } else if (msg === "2") {
          user.state = "awaiting_transfer_receipt";
          await user.save();
          twiml.message(t.bankDetails);
          return res.type("text/xml").send(twiml.toString());
        } else {
          twiml.message(t.askVerifyChoice);
          return res.type("text/xml").send(twiml.toString());
        }

      case "awaiting_transfer_receipt":
        if (mediaUrl) {
          try {
            const authenticatedMediaUrl = mediaUrl.replace(
              "https://api.twilio.com",
              `https://${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}@api.twilio.com`,
            );
            const uploadResult = await cloudinary.uploader.upload(
              authenticatedMediaUrl,
              { folder: "arewaconnect_receipts" },
            );
            user.verificationReceiptUrl = uploadResult.secure_url;
            user.state = "main_menu";
            await user.save();
            twiml.message(t.receiptReceived + "\n" + t.mainMenu);
          } catch (e) {
            twiml.message(t.sendReceiptOnly + " (Upload failed, try again)");
          }
          return res.type("text/xml").send(twiml.toString());
        } else {
          twiml.message(t.sendReceiptOnly);
          return res.type("text/xml").send(twiml.toString());
        }

      case "adding_name":
        const prodParts = msg.split(",").map((p) => p.trim());
        const prodName = prodParts[0];
        const prodPrice = Number(prodParts[1]);

        user.currentProduct = { ...user.currentProduct, name: prodName };

        if (prodParts.length >= 2 && !isNaN(prodPrice)) {
          user.currentProduct.price = prodPrice;
          user.state = "adding_image";
          await user.save();
          twiml.message(t.sendImageOrSkip);
        } else {
          user.state = "adding_price";
          await user.save();
          twiml.message(t.enterPrice);
        }
        return res.type("text/xml").send(twiml.toString());

      case "adding_price":
        const price = Number(msg);
        if (isNaN(price)) {
          twiml.message(t.enterValidPrice);
          return res.type("text/xml").send(twiml.toString());
        } else {
          user.currentProduct = { ...user.currentProduct, price: price };
          user.state = "adding_image";
          await user.save();
          twiml.message(t.sendImageOrSkip);
          return res.type("text/xml").send(twiml.toString());
        }

      case "adding_image":
        let imageUrl = "";
        if (msg.toUpperCase() === "SKIP") {
          imageUrl = "";
        } else if (mediaUrl) {
          // Upload the image from Twilio's temporary URL to Cloudinary
          try {
            // Twilio media URLs are protected. We inject credentials via Basic Auth
            // so Cloudinary has permission to download the file.
            const authenticatedMediaUrl = mediaUrl.replace(
              "https://api.twilio.com",
              `https://${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}@api.twilio.com`,
            );

            console.log(
              `Attempting Cloudinary upload using SID: ${process.env.TWILIO_ACCOUNT_SID ? process.env.TWILIO_ACCOUNT_SID.substring(0, 5) : "MISSING"}...`,
            );

            const uploadResult = await cloudinary.uploader.upload(
              authenticatedMediaUrl,
              {
                folder: "arewaconnect_products", // Optional: organize uploads in a specific folder
                // You can add other Cloudinary options here, like public_id, transformations, etc.
              },
            );
            imageUrl = uploadResult.secure_url; // Get the permanent secure URL
            console.log("Image uploaded to Cloudinary successfully:", imageUrl);
          } catch (uploadError) {
            console.error(
              "Cloudinary upload failed:",
              uploadError.message || uploadError,
            ); // Log only the message
            // Inform the user if image upload fails, and keep them in the same state to retry or skip
            twiml.message(
              t.sendImageOrSkip +
                " (Image upload failed. Please try again or type SKIP)",
            );
            return res.type("text/xml").send(twiml.toString());
          }
        } else {
          twiml.message(t.sendImageOrSkip);
          return res.type("text/xml").send(twiml.toString());
        }

        await Product.create({
          traderSlug: user.slug, // Save the trader's slug with the product
          traderPhone: phoneDigits, // Use normalized digits
          name: user.currentProduct.name,
          price: user.currentProduct.price,
          imageUrl,
        });
        user.state = "main_menu";
        user.currentProduct = { name: "", price: 0 };
        await user.save();
        let postAddMainMenu = t.mainMenu;
        if (user.isPro) postAddMainMenu += "\n7. Pro Features 💎";

        twiml.message("✅ Product added!\n\n" + postAddMainMenu);
        return res.type("text/xml").send(twiml.toString());

      case "updating_address":
        user.address = msg;
        user.state = "main_menu";
        await user.save();
        twiml.message(t.addressUpdated + "\n" + t.mainMenu);
        return res.type("text/xml").send(twiml.toString());

      case "deleting_product":
        // Escape special characters to prevent Regex crashes
        const safeMsg = msg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const result = await Product.findOneAndDelete({
          traderPhone: from,
          name: { $regex: new RegExp(`^${safeMsg}$`, "i") },
        });
        user.state = "main_menu"; // Reset state to main menu
        await user.save();
        const feedback = result ? t.productDeleted : t.productNotFound;
        let deleteMainMenu = t.mainMenu;
        if (user.isPro) deleteMainMenu += "\n7. Pro Features 💎";

        twiml.message(feedback + "\n" + deleteMainMenu);
        return res.type("text/xml").send(twiml.toString());

      case "awaiting_feedback":
        await Feedback.create({
          traderPhone: from,
          traderSlug: user.slug,
          rating: 5, // Default for text-only feedback
          comment: msg,
          type: "trader",
        });
        user.state = "main_menu";
        await user.save();
        let feedbackMainMenu = t.mainMenu;
        if (user.isPro) feedbackMainMenu += "\n7. Pro Features 💎";

        twiml.message(t.feedbackReceived + "\n" + feedbackMainMenu);
        return res.type("text/xml").send(twiml.toString());

      case "pro_featuring_product":
        const featuredCount = await Product.countDocuments({
          traderPhone: from,
          isFeatured: true,
        });
        if (featuredCount >= 3) {
          user.state = "main_menu";
          await user.save();
          twiml.message(t.pro.maxFeaturedReached);
          return res.type("text/xml").send(twiml.toString());
        }

        const productIndex = parseInt(msg, 10) - 1;
        const productsToFeature = await Product.find({
          traderPhone: from,
          isFeatured: { $ne: true },
        }).lean();
        let productToFeature = null;

        if (productIndex >= 0 && productIndex < productsToFeature.length) {
          const product = productsToFeature[productIndex];
          productToFeature = await Product.findByIdAndUpdate(
            product._id,
            { isFeatured: true },
            { new: true },
          );
        }

        user.state = "main_menu";
        await user.save();
        const featureFeedback = productToFeature
          ? t.pro.productFeatured
          : t.productNotFound;
        let mainMenuFeature = t.mainMenu;
        if (user.isPro) mainMenuFeature += "\n7. Pro Features 💎";
        twiml.message(featureFeedback + "\n" + mainMenuFeature);
        return res.type("text/xml").send(twiml.toString());

      case "pro_unfeaturing_product":
        const unfeatureIndex = parseInt(msg, 10) - 1;
        const featuredProducts = await Product.find({
          traderPhone: from,
          isFeatured: true,
        }).lean();
        let productToUnfeature = null;

        if (unfeatureIndex >= 0 && unfeatureIndex < featuredProducts.length) {
          const product = featuredProducts[unfeatureIndex];
          productToUnfeature = await Product.findByIdAndUpdate(
            product._id,
            { isFeatured: false },
            { new: true },
          );
        }

        user.state = "main_menu";
        await user.save();
        const unfeatureFeedback = productToUnfeature
          ? t.pro.productUnfeatured
          : t.productNotFound;
        let mainMenuUnfeature = t.mainMenu;
        if (user.isPro) mainMenuUnfeature += "\n7. Pro Features 💎";
        twiml.message(unfeatureFeedback + "\n" + mainMenuUnfeature);
        return res.type("text/xml").send(twiml.toString());
    }

    // Default fallback
    // Make sure main menu is correct in fallback too
    if (user.state === "main_menu") {
      let fallbackMainMenu = t.mainMenu;
      if (user.isPro) fallbackMainMenu += "\n7. Pro Features 💎";
      twiml.message(fallbackMainMenu);
      return res.type("text/xml").send(twiml.toString());
    }

    twiml.message(t.replyHi);
    return res.type("text/xml").send(twiml.toString());
  } catch (error) {
    if (error.code === 63038) {
      console.error(
        "🛑 TWILIO LIMIT REACHED: Your daily message quota has been exceeded. Responses will not be delivered.",
      );
    } else {
      console.error("❌ Webhook Execution Error:", error);
    }

    const errorTwiml = new MessagingResponse();
    errorTwiml.message("Sorry, an error occurred. Please try again later.");
    return res.type("text/xml").send(errorTwiml.toString());
  }
});

module.exports = router;
