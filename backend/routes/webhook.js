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
      `${process.env.FRONTEND_URL || "https://arewaconnect.com.ng"}/store/${slug}`,
    replyHi: "Reply Hi to start",
    welcomeBack: (name) => `Welcome back, ${name}! What would you like to do?`,
    mainMenu:
      "1. Add Product\n2. View My Store\n3. Update Address\n4. Delete Product\n5. Give Feedback\n6. Get Verified Badge (₦2,000)",
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
      "How would you like to pay for your badge?\n1. Pay Online (Instant ✅)\n2. Bank Transfer (Manual 🏦)",
    bankDetails:
      "Please transfer ₦2,000 to:\n\n*Bank:* Zenith Bank\n*Account:* 1234567890\n*Name:* Arewa Connect\n\nAfter payment, please send a *screenshot of the receipt* here.",
    receiptReceived:
      "🙏 Thank you! Your receipt has been received. Our team will verify it and update your badge shortly.",
    sendReceiptOnly: "Please send a photo/screenshot of your payment receipt.",
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
      `${process.env.FRONTEND_URL || "https://arewaconnect.com.ng"}/store/${slug}`,
    replyHi: "Amsa da Hi don farawa",
    welcomeBack: (name) => `Barka da dawowa, ${name}! Me kake son yi?`,
    mainMenu:
      "1. Ƙara Kaya\n2. Duba Shagona\n3. Gyara Adireshin Kamfani\n4. Goge Kaya\n5. Ba da Rahoto/Shawara\n6. Samu Shaidar ✅ (₦2,000)",
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

    console.log(`📩 Incoming: From=${from}, Msg="${msg}"`);
    const phoneDigits = from.replace(/\D/g, "");

    // 🔎 Robust User Lookup
    let user = await User.findOne({
      $or: [
        { phone: from },
        { phone: phoneDigits },
        { phone: `+${phoneDigits}` },
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
        { phone: `whatsapp:+${phoneDigits}` },
      ],
    });

    if (!user) {
      console.log(`New user detected: ${from}`);
      user = await User.create({
        phone: phoneDigits, // Store clean digits for consistency
        state: "awaiting_language",
        language: "en",
      });
    }

    // Initialize defaults
    user.language = user.language || "en";
    user.currentProduct = user.currentProduct || { name: "", price: 0 };
    user.state = user.state || "awaiting_language";

    const lang = user.language || "en";
    const t = prompts[lang];

    // 1. Unified Greeting & Reset Logic
    const isGreeting = /^(hi|start|market)/i.test(msg);
    const isJoinMessage = /^join/i.test(msg);

    if (isGreeting || isJoinMessage) {
      console.log(
        `👋 Greeting detected. Resetting state for user: ${user.phone}`,
      );
      if (user.companyName && !isJoinMessage) {
        user.state = "main_menu";
        await user.save();
        twiml.message(`${t.welcomeBack(user.companyName)}\n${t.mainMenu}`);
        return res.type("text/xml").send(twiml.toString());
      }
      user.state = "awaiting_language";
      await user.save();
      twiml.message(prompts[user.language || "en"].welcome);
      return res.type("text/xml").send(twiml.toString());
    }

    // 2. State Machine
    switch (user.state) {
      case "awaiting_language":
        console.log("State: awaiting_language");
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
            ? prompts[user.language].mainMenu
            : prompts[user.language].askCompany,
        );
        return res.type("text/xml").send(twiml.toString());

      case "register_company":
        if (user.companyName) {
          // Immutability Guard
          user.state = "main_menu";
          await user.save();
          twiml.message(t.welcomeBack(user.companyName) + "\n" + t.mainMenu);
          return res.type("text/xml").send(twiml.toString());
        }
        const safeName = msg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const existing = await User.findOne({
          companyName: { $regex: new RegExp(`^${safeName}$`, "i") },
        });
        if (existing) {
          // Uniqueness Guard
          twiml.message(t.companyNameTaken);
          return res.type("text/xml").send(twiml.toString());
        }
        user.companyName = msg;
        let baseSlug = slugify(msg);
        let slug = baseSlug;
        let i = 1;
        while (await User.findOne({ slug })) {
          slug = `${baseSlug}-${i++}`;
        }
        user.slug = slug;
        user.state = "register_address";
        await user.save();
        twiml.message(t.askAddress);
        return res.type("text/xml").send(twiml.toString());

      case "register_address":
        user.address = msg;
        user.state = "main_menu";
        await user.save();
        twiml.message(t.registrationComplete + "\n" + t.mainMenu);
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
          if (user.isVerified) {
            twiml.message("You are already verified! ✅");
            return res.type("text/xml").send(twiml.toString());
          }
          user.state = "verification_choice";
          await user.save();
          twiml.message(t.askVerifyChoice);
          return res.type("text/xml").send(twiml.toString());
        }
        break;

      case "verification_choice":
        if (msg === "1") {
          // Paystack logic
          if (!process.env.PAYSTACK_SECRET_KEY) {
            twiml.message(
              "Automated online payment is currently being set up. Please select Option 2 for Bank Transfer to verify your account manually.",
            );
            return res.type("text/xml").send(twiml.toString());
          }
          try {
            const response = await axios.post(
              "https://api.paystack.co/transaction/initialize",
              {
                email: `${from.replace(/\D/g, "")}@arewaconnect.com.ng`, // "23480..."
                amount: 2000 * 100,
                callback_url: `${process.env.FRONTEND_URL}/store/${user.slug}`,
                metadata: { phone: from.replace(/\D/g, "") }, // Send digits only
              },
              {
                headers: {
                  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                },
              },
            );
            user.state = "main_menu";
            await user.save();
            twiml.message(
              `${t.verifying}\n\nPay here to get your badge: ${response.data.data.authorization_url}`,
            );
          } catch (err) {
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
          traderPhone: from,
          name: user.currentProduct.name,
          price: user.currentProduct.price,
          imageUrl,
        });
        user.state = "main_menu";
        user.currentProduct = { name: "", price: 0 };
        await user.save();
        twiml.message(t.productAdded + "\n" + t.mainMenu);
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
        twiml.message(feedback + "\n" + t.mainMenu);
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
        twiml.message(t.feedbackReceived + "\n" + t.mainMenu);
        return res.type("text/xml").send(twiml.toString());
    }

    // Default fallback
    twiml.message(t.replyHi);
    return res.type("text/xml").send(twiml.toString());
  } catch (error) {
    console.error("Webhook Error:", error);
    twiml.message("Sorry, an error occurred. Please try again later.");
    return res.type("text/xml").send(twiml.toString());
  }
});

module.exports = router;
