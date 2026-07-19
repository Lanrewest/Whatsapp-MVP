const express = require("express");
const router = express.Router();
const twilio = require("twilio");
const MessagingResponse = twilio.twiml.MessagingResponse;
const cloudinary = require("cloudinary").v2; // Import Cloudinary SDK
const axios = require("axios"); // Install this: npm install axios

const User = require("../models/User");
const Product = require("../models/Product");
const Feedback = require("../models/Feedback");
const prompts = require("../prompts");

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

function getTierLabel(user, lang = "en") {
  if (user.isPro) {
    return lang === "ha" ? "Pro" : "Pro";
  }
  if (user.isVerified) {
    return lang === "ha" ? "Verified" : "Verified";
  }
  return lang === "ha" ? "Free" : "Free";
}

// Configure Cloudinary using the URL from environment variables
cloudinary.config(); // Automatically picks up CLOUDINARY_URL from process.env

router.get("/", (req, res) => {
  res.status(200).json({
    ok: true,
    message: "Webhook endpoint is ready for POST requests from Twilio.",
  });
});

// Helper function to securely download from Twilio and upload to Cloudinary
async function uploadTwilioMediaToCloudinary(mediaUrl, cloudinaryFolder) {
  try {
    // 1. Download the image from Twilio using Basic Auth
    const response = await axios.get(mediaUrl, {
      responseType: "arraybuffer", // Important to get binary data
      auth: {
        username: process.env.TWILIO_ACCOUNT_SID,
        password: process.env.TWILIO_AUTH_TOKEN,
      },
    });

    // 2. Convert binary data to a Base64 string for Cloudinary
    const base64Image = Buffer.from(response.data, "binary").toString("base64");
    const dataUri = `data:${response.headers["content-type"]};base64,${base64Image}`;

    // 3. Upload the data URI to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: cloudinaryFolder,
      resource_type: "image",
    });
    return uploadResult;
  } catch (error) {
    console.error("Error in media upload process:", error.message);
    throw error; // Re-throw the error to be caught by the calling function
  }
}

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
        await Product.updateMany(
          { traderPhone: user.phone },
          { isFeatured: false },
        );
        console.log(
          `💎 Pro subscription expired for ${user.phone}. Benefits revoked.`,
        );

        const expiredMsg =
          user.language === "ha"
            ? "Biyan kuɗin ku na 'Pro' ya ƙare. An mayar da ku asusun 'Verified'. 💎"
            : "Your Pro subscription has expired. You have been rolled back to a Verified account. 💎";
        twiml.message(expiredMsg);
        // } else if (daysRemaining <= 3 && !user.expiryNotified) {
        //   // This feature is ready, but requires adding `expiryNotified: Boolean` to the User model.
        //   // Notify 3 days before expiration (one-time flag)
        //   const warningMsg =
        //     user.language === "ha"
        //       ? `Sauran kwanaki ${daysRemaining} biyan kuɗin ku na Pro ya ƙare. Ku sabunta don ci gaba da amfani da damar 200 messages.`
        //       : `Your Pro subscription expires in ${daysRemaining} days. Renew now to keep your 200 messages/day limit!`;
        //   twiml.message(warningMsg);
        //   user.expiryNotified = true;
        //   await user.save();
      }
    }

    const lang = user.language;
    const t = prompts[lang];

    // Add Pro prompts to the language object
    t.pro = prompts.pro[lang];

    // 1. Unified Greeting & Reset Logic
    const isGreeting = /^(hi|start|market|join|get started)/i.test(msg);

    if (isGreeting) {
      console.log(
        `👋 Greeting from ${user.phone}. Setting state to awaiting_language.`,
      );
      user.dailyUsageCount++; // Count the interaction
      if (user.companyName) {
        // If user is already registered
        user.state = "main_menu";
        await user.save();
        let mainMenu = t.mainMenu;
        if (user.isPro) mainMenu += "\n8. Pro Features 💎";
        const tierLabel = getTierLabel(user, lang);
        twiml.message(
          `${t.welcomeBack(user.companyName, tierLabel)}\n${mainMenu}`,
        );
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

    const frontendBaseUrl = (
      process.env.FRONTEND_URL || "https://arewaconnect.com.ng"
    ).replace(/\/$/, "");
    const upgradeLink = `${frontendBaseUrl}/upgrade`;
    const isPartOfUpgradeFlow =
      msg === "7" || // Corrected from 6 to 7
      user.state === "verification_choice" ||
      user.state === "payment_method_choice";

    if (
      !isPartOfUpgradeFlow &&
      user.dailyUsageCount >= dailyLimit &&
      user.state !== "awaiting_transfer_receipt" // Also allow receipt uploads
    ) {
      // This block now correctly handles all messages once the limit is reached.
      // It sends a consistent message and then stops, preventing silent "OK" responses.
      const limitMsg =
        user.language === "ha"
          ? prompts.ha.upgradeLimitExceeded
          : prompts.en.upgradeLimitExceeded;
      twiml.message(limitMsg);
      return res.type("text/xml").send(twiml.toString());
    }

    // If the user is within their limit, increment the usage count for this interaction.
    // We do it here so greetings are counted, but limit-exceeded messages are not double-counted.
    if (!isPartOfUpgradeFlow) {
      user.dailyUsageCount++;
    }

    // 1.5. Global Upgrade Command Handler
    // This must come AFTER the daily limit check but BEFORE the main state switch.
    if (msg === "7") {
      // Changed from 6 to 7 due to menu re-order
      user.state = "verification_choice";
      await user.save();
      twiml.message(t.askVerifyChoice);
      return res.type("text/xml").send(twiml.toString());
    }

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
            ? `${prompts[user.language].welcomeBack(user.companyName, getTierLabel(user, user.language))}\n${
                prompts[user.language].mainMenu
              }${user.isPro ? "\n8. Pro Features 💎" : ""}`
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
          if (user.isPro) mainMenu += "\n8. Pro Features 💎";
          const tierLabel = getTierLabel(user, user.language || "en");

          twiml.message(
            t.welcomeBack(user.companyName, tierLabel) + "\n" + mainMenu,
          );
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
          if (user.isPro) mainMenu += "\n8. Pro Features 💎";

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
        if (user.isPro) mainMenu += "\n8. Pro Features 💎";

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
          // Modify Product
          const products = await Product.find({ traderSlug: user.slug }).lean();
          if (products.length === 0) {
            twiml.message(t.noProducts);
          } else {
            const productList = products
              .map((p, i) => `${i + 1}. ${p.name} - ₦${p.price}`)
              .join("\n");
            user.state = "modifying_product_selection";
            await user.save();
            twiml.message(`${productList}\n\n${t.askModifyProduct}`);
          }
          return res.type("text/xml").send(twiml.toString());
        } else if (msg === "3") {
          // Delete Product
          const products = await Product.find({ traderSlug: user.slug }).lean();
          if (products.length === 0) {
            twiml.message(t.noProducts);
          } else {
            const productList = products
              .map((p, i) => `${i + 1}. ${p.name}`)
              .join("\n");
            user.state = "deleting_product_selection";
            await user.save();
            twiml.message(`${productList}\n\n${t.askDeleteProduct}`);
          }
          return res.type("text/xml").send(twiml.toString());
        } else if (msg === "4") {
          // View Store
          const storeLink = user.slug
            ? t.viewStore(user.slug)
            : t.viewStore(from);
          twiml.message(storeLink);
          return res.type("text/xml").send(twiml.toString());
        } else if (msg === "5") {
          // Update Address
          user.state = "updating_address";
          await user.save();
          twiml.message(t.askNewAddress);
          return res.type("text/xml").send(twiml.toString());
        } else if (msg === "6") {
          // Give Feedback
          user.state = "awaiting_feedback";
          await user.save();
          twiml.message(t.askFeedback);
          return res.type("text/xml").send(twiml.toString());
        } else if (msg === "8") {
          // Pro Features (now option 8)
          if (user.isPro) {
            user.state = "pro_menu_action";
            await user.save();
            // We need to check if the pro menu exists before sending
            if (t.pro && t.pro.proMenu) {
              twiml.message(t.pro.proMenu);
            } else {
              // Fallback if pro prompts aren't loaded for some reason
              user.state = "main_menu";
              await user.save();
              twiml.message("Pro features are available.");
            }
          } else {
            twiml.message(t.pro.notPro);
          }
          return res.type("text/xml").send(twiml.toString());
        }
        // Fallback for main_menu: if no option is matched, show the menu again.
        let defaultMainMenu = t.mainMenu;
        if (user.isPro) defaultMainMenu += "\n8. Pro Features 💎";
        twiml.message(defaultMainMenu);
        return res.type("text/xml").send(twiml.toString());

      case "pro_menu_action":
        if (!user.isPro) {
          user.state = "main_menu";
          await user.save();
          twiml.message(t.pro.notPro);
          return res.type("text/xml").send(twiml.toString());
        }
        if (msg === "1") {
          // Set Banner
          user.state = "pro_setting_banner";
          await user.save();
          twiml.message(t.pro.askBannerImage);
        } else if (msg === "2") {
          // Feature Product
          const products = await Product.find({
            // Use slug for reliable lookup
            traderSlug: user.slug,
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
            traderSlug: user.slug, // Use slug for reliable lookup
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
            const uploadResult = await uploadTwilioMediaToCloudinary(
              mediaUrl,
              "arewaconnect_banners",
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

            const amount = user.pendingTier === "pro" ? 3000 : 2000;
            const upgradeName =
              user.pendingTier === "pro"
                ? "Pro Subscription"
                : "Verified Badge";

            const response = await axios.post(
              "https://api.paystack.co/transaction/initialize",
              {
                email: `${phoneDigits}@arewaconnect.com.ng`,
                amount: amount * 100, // Amount in kobo
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
            const uploadResult = await uploadTwilioMediaToCloudinary(
              mediaUrl,
              "arewaconnect_receipts",
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
        // Initialize imageUrls array if it doesn't exist
        if (!user.currentProduct.imageUrls) {
          user.currentProduct.imageUrls = [];
        }

        if (mediaUrl) {
          // User sent an image
          // Enforce a limit of 3 images per product
          if (user.currentProduct.imageUrls.length >= 3) {
            twiml.message(
              "You have reached the maximum of 3 images. Please reply with 'DONE' to finish adding your product.",
            );
            return res.type("text/xml").send(twiml.toString());
          }

          try {
            const uploadResult = await uploadTwilioMediaToCloudinary(
              mediaUrl,
              "arewaconnect_products",
            );
            user.currentProduct.imageUrls.push(uploadResult.secure_url);
            await user.save();
            const remaining = 3 - user.currentProduct.imageUrls.length;
            twiml.message(
              `Image added (${user.currentProduct.imageUrls.length}/3). Send another, or reply with 'DONE' to finish.`,
            );
          } catch (uploadError) {
            console.error("Cloudinary upload failed:", uploadError.message);
            twiml.message(
              "Image upload failed. Please try again, or reply with 'DONE' to finish.",
            );
          }
          return res.type("text/xml").send(twiml.toString());
        }

        // Only finish product creation on explicit commands "DONE" or "SKIP"
        const upperMsg = msg.toUpperCase();
        if (upperMsg === "DONE" || upperMsg === "SKIP") {
          const savedImageUrls = Array.isArray(user.currentProduct.imageUrls)
            ? user.currentProduct.imageUrls
            : [];

          // Finish product creation
          await Product.create({
            traderSlug: user.slug, // This is the key fix
            traderPhone: phoneDigits,
            name: user.currentProduct.name,
            price: user.currentProduct.price,
            imageUrl: savedImageUrls[0] || "",
            imageUrls: savedImageUrls,
          });
          user.state = "main_menu";
          user.currentProduct = { name: "", price: 0, imageUrls: [] }; // Reset for next time
          await user.save();
          let postAddMainMenu = t.mainMenu;
          if (user.isPro) postAddMainMenu += "\n8. Pro Features 💎";

          twiml.message("✅ Product added!\n\n" + postAddMainMenu);
        } else {
          // If no images have been added and they didn't send an image or SKIP/DONE
          twiml.message(t.sendImageOrSkip);
        }
        return res.type("text/xml").send(twiml.toString());

      case "updating_address":
        user.address = msg;
        user.state = "main_menu";
        await user.save();
        twiml.message(t.addressUpdated + "\n" + t.mainMenu);
        return res.type("text/xml").send(twiml.toString());

      case "deleting_product_selection":
        const deleteIndex = parseInt(msg, 10) - 1;
        const productsToDelete = await Product.find({
          traderSlug: user.slug,
        }).lean();
        let deletedProduct = null;

        if (deleteIndex >= 0 && deleteIndex < productsToDelete.length) {
          const product = productsToDelete[deleteIndex];
          deletedProduct = await Product.findByIdAndDelete(product._id);
        }

        user.state = "main_menu";
        await user.save();
        const feedback = deletedProduct ? t.productDeleted : t.productNotFound;
        let deleteMainMenu = t.mainMenu;
        if (user.isPro) deleteMainMenu += "\n8. Pro Features 💎";

        twiml.message(feedback + "\n" + deleteMainMenu);
        return res.type("text/xml").send(twiml.toString());

      case "modifying_product_selection":
        const modifyIndex = parseInt(msg, 10) - 1;
        const productsToModify = await Product.find({
          traderSlug: user.slug,
        }).lean();

        if (modifyIndex >= 0 && modifyIndex < productsToModify.length) {
          const product = productsToModify[modifyIndex];
          user.currentProductId = product._id; // Store the ID of the product to modify
          user.state = "modifying_product_choice";
          await user.save();
          twiml.message(t.askModifyAction);
        } else {
          user.state = "main_menu";
          await user.save();
          twiml.message(t.productNotFound + "\n" + t.mainMenu);
        }
        return res.type("text/xml").send(twiml.toString());

      case "modifying_product_choice":
        if (msg === "1") {
          // Modify Name
          user.state = "modifying_product_name";
          await user.save();
          twiml.message(t.askNewName);
        } else if (msg === "2") {
          // Modify Price
          user.state = "modifying_product_price";
          await user.save();
          twiml.message(t.askNewPrice);
        } else {
          // If invalid option, ask again
          twiml.message(t.askModifyAction);
        }
        return res.type("text/xml").send(twiml.toString());

      case "modifying_product_name":
        const newName = msg;
        const updatedNameProduct = await Product.findByIdAndUpdate(
          user.currentProductId,
          { name: newName },
          { new: true },
        );
        user.state = "main_menu";
        user.currentProductId = null; // Clear the stored ID
        await user.save();

        let nameMainMenu = t.mainMenu;
        if (user.isPro) nameMainMenu += "\n8. Pro Features 💎";
        const nameFeedback = updatedNameProduct
          ? `✅ Name updated to: *${newName}*`
          : t.productNotFound;
        twiml.message(nameFeedback + "\n" + nameMainMenu);
        return res.type("text/xml").send(twiml.toString());

      case "modifying_product_price":
        const newPrice = Number(msg);
        if (isNaN(newPrice) || newPrice < 0) {
          twiml.message(t.enterValidPrice);
          return res.type("text/xml").send(twiml.toString());
        }

        const updatedPriceProduct = await Product.findByIdAndUpdate(
          user.currentProductId,
          { price: newPrice },
          { new: true },
        );
        user.state = "main_menu";
        user.currentProductId = null; // Clear the stored ID
        await user.save();

        let priceMainMenu = t.mainMenu;
        if (user.isPro) priceMainMenu += "\n8. Pro Features 💎";
        const priceFeedback = updatedPriceProduct
          ? `✅ Price updated to: *₦${newPrice}*`
          : t.productNotFound;
        twiml.message(priceFeedback + "\n" + priceMainMenu);
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
        if (user.isPro) feedbackMainMenu += "\n8. Pro Features 💎";

        twiml.message(t.feedbackReceived + "\n" + feedbackMainMenu);
        return res.type("text/xml").send(twiml.toString());

      case "pro_featuring_product":
        const featuredCount = await Product.countDocuments({
          traderSlug: user.slug, // Use slug for reliable lookup
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
          traderSlug: user.slug,
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
        if (user.isPro) mainMenuFeature += "\n8. Pro Features 💎";
        twiml.message(featureFeedback + "\n" + mainMenuFeature);
        return res.type("text/xml").send(twiml.toString());

      case "pro_unfeaturing_product":
        const unfeatureIndex = parseInt(msg, 10) - 1;
        const featuredProducts = await Product.find({
          traderSlug: user.slug, // Use slug for reliable lookup
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
        if (user.isPro) mainMenuUnfeature += "\n8. Pro Features 💎";
        twiml.message(unfeatureFeedback + "\n" + mainMenuUnfeature);
        return res.type("text/xml").send(twiml.toString());
    }

    // Default fallback
    // Make sure main menu is correct in fallback too
    if (user.state === "main_menu") {
      let fallbackMainMenu = t.mainMenu;
      if (user.isPro) fallbackMainMenu += "\n8. Pro Features 💎";
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
