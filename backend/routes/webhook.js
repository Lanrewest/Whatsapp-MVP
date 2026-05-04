const express = require("express");
const router = express.Router();
const twilio = require("twilio");
const MessagingResponse = twilio.twiml.MessagingResponse;

const User = require("../models/User");
const Product = require("../models/Product");

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

// Bilingual prompts
const prompts = {
    en: {
        welcome: "Welcome to ArewaMarket! Please select your language:\n1. English\n2. Hausa",
        askCompany: "Please enter your company name:",
        askAddress: "Please enter your company address:",
        registrationComplete: "Registration complete! You can now add products.",
        addProduct: "1. Add Product\n2. View My Store",
        enterProductName: "Enter product name:",
        enterPrice: "Enter price:",
        companyNameTaken: "This company name is already taken. Please choose another one.",
        enterValidPrice: "Enter valid price:",
        sendImageOrSkip: "Send image or type SKIP",
        productAdded: "✅ Product added!\n1. Add another\n2. View store",
        viewStore: (slug) =>
            `${process.env.FRONTEND_URL || "https://arewa-market.vercel.app"}/store/${slug}`,
        replyHi: "Reply Hi to start",
        welcomeBack: (name) => `Welcome back, ${name}! What would you like to do?`,
        mainMenu: "1. Add Product\n2. View My Store\n3. Update Address\n4. Delete Product",
        productNotFound: "Product not found.",
        askNewAddress: "Please enter your new company address:",
        addressUpdated: "✅ Address updated successfully!",
        askDeleteProduct: "Enter the exact name of the product you want to delete:",
        productDeleted: "🗑️ Product deleted successfully.",
    },
    ha: {
        welcome: "Barka da zuwa ArewaMarket! Da fatan za a zaɓi yaren ku:\n1. Turanci\n2. Hausa",
        askCompany: "Da fatan za a shigar da sunan kamfanin ku:",
        askAddress: "Da fatan za a shigar da adireshin kamfanin ku:",
        registrationComplete: "Rajista ta kammala! Yanzu zaku iya ƙara kayayyaki.",
        addProduct: "1. Ƙara Kaya\n2. Duba Shagona",
        enterProductName: "Shigar da sunan kaya:",
        enterPrice: "Shigar da farashi:",
        companyNameTaken: "An riga an yi amfani da wannan sunan kamfani. Da fatan za a zaɓi wani.",
        enterValidPrice: "Shigar da sahihin farashi:",
        sendImageOrSkip: "Aika hoto ko rubuta SKIP",
        productAdded: "✅ An ƙara kaya!\n1. Ƙara wani\n2. Duba shago",
        viewStore: (slug) =>
            `${process.env.FRONTEND_URL || "https://arewa-market.vercel.app"}/store/${slug}`,
        replyHi: "Amsa da Hi don farawa",
        welcomeBack: (name) => `Barka da dawowa, ${name}! Me kake son yi?`,
        mainMenu: "1. Ƙara Kaya\n2. Duba Shagona\n3. Gyara Adireshin Kamfani\n4. Goge Kaya",
        productNotFound: "Ba a sami kaya ba.",
        askNewAddress: "Da fatan za a shigar da sabon adireshin kamfani:",
        addressUpdated: "✅ An gyara adireshin kamfani cikin nasara!",
        askDeleteProduct: "Shigar da ainihin sunan kayan da kake son gogewa:",
        productDeleted: "🗑️ An goge kayan cikin nasara.",
    },
};

router.post("/", async(req, res) => {
    const twiml = new MessagingResponse();
    try {
        const msg = (req.body.Body || "").trim();
        const from = (req.body.From || "").replace("whatsapp:", "");
        const numMedia = parseInt(req.body.NumMedia || "0", 10);
        const mediaUrl = numMedia > 0 ? req.body.MediaUrl0 : null;

        console.log(`Received message from ${from}: ${msg}`);

        let user = await User.findOne({ phone: from });
        if (!user) {
            console.log(`New user detected: ${from}`);
            user = await User.create({
                phone: from,
                state: "awaiting_language",
                language: "en",
                currentProduct: { name: "", price: 0 },
            });
        }

        // Safety: Ensure currentProduct is initialized (for older user docs)
        if (!user.currentProduct) {
            user.currentProduct = { name: "", price: 0 };
        }
        // Ensure user has language and product state initialized
        user.language = user.language || "en";
        user.currentProduct = user.currentProduct || { name: "", price: 0 };
        user.state = user.state || "awaiting_language";

        // Use user's language or default to English
        const lang = user.language || "en";
        const t = prompts[lang];

        // 1. Handle Greetings and "Join" triggers
        const isGreeting = /hi|start|market/i.test(msg); // Corrected: Removed '^' from 'hi' to match "Join themselves-game"
        const isJoinMessage = /join/i.test(msg);

        if (isGreeting || isJoinMessage) {
            // If already registered and just saying "Hi", show menu
            if (user.companyName && !isJoinMessage) {
                user.state = "main_menu";
                await user.save();
                twiml.message(`${t.welcomeBack(user.companyName)}\n${t.mainMenu}`);
                return res.type("text/xml").send(twiml.toString());
            }

            // Otherwise, start/restart language selection
            user.state = "awaiting_language";
            await user.save();
            twiml.message(prompts.en.welcome);
            return res.type("text/xml").send(twiml.toString());
        }

        // 2. State Machine for Registration and Menu
        if (user.state === "awaiting_language") {
            if (msg === "1") {
                user.language = "en";
                user.state = user.companyName ? "main_menu" : "register_company";
                await user.save();
                twiml.message(user.companyName ? t.mainMenu : prompts.en.askCompany);
            } else if (msg === "2") {
                user.language = "ha";
                user.state = user.companyName ? "main_menu" : "register_company";
                await user.save();
                twiml.message(user.companyName ? t.mainMenu : prompts.ha.askCompany);
            } else {
                twiml.message(prompts.en.welcome);
            }
            return res.type("text/xml").send(twiml.toString());
        }

        if (user.state === "register_company") {
            // Check if another trader is using this company name
            const existing = await User.findOne({ companyName: { $regex: new RegExp(`^${msg}$`, "i") } });
            if (existing && existing.phone !== from) {
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
            twiml.message(prompts[user.language].askAddress);
            return res.type("text/xml").send(twiml.toString());
        }

        if (user.state === "register_address") {
            user.address = msg;
            user.state = "main_menu";
            await user.save();
            twiml.message(prompts[user.language].registrationComplete + "\n" + t.mainMenu);
            return res.type("text/xml").send(twiml.toString());
        }

        switch (user.state) {
            case "idle":
            case "main_menu":
                if (msg === "1") {
                    user.state = "adding_name";
                    await user.save();
                    twiml.message(t.enterProductName);
                    return res.type("text/xml").send(twiml.toString());
                } else if (msg === "2") {
                    const storeLink = user.slug ?
                        t.viewStore(user.slug) :
                        t.viewStore(from);
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
                }
                break;

            case "adding_name":
                user.currentProduct = {...user.currentProduct, name: msg };
                user.state = "adding_price";
                await user.save();
                twiml.message(t.enterPrice);
                return res.type("text/xml").send(twiml.toString());

            case "adding_price":
                const price = Number(msg);
                if (isNaN(price)) {
                    twiml.message(t.enterValidPrice);
                    return res.type("text/xml").send(twiml.toString());
                } else {
                    user.currentProduct = {...user.currentProduct, price: price };
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
                    imageUrl = mediaUrl;
                } else {
                    twiml.message(t.sendImageOrSkip);
                    return res.type("text/xml").send(twiml.toString());
                }
                await Product.create({
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