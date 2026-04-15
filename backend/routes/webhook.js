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
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^a-z0-9\-]/g, '') // Remove all non-alphanumeric except -
        .replace(/-+/g, '-') // Replace multiple - with single -
        .replace(/^-+|-+$/g, ''); // Trim - from start/end
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
        enterValidPrice: "Enter valid price:",
        sendImageOrSkip: "Send image or type SKIP",
        productAdded: "✅ Product added!\n1. Add another\n2. View store",
        viewStore: (slug) => `https://yourapp.com/store/${slug}`,
        replyHi: "Reply Hi to start"
    },
    ha: {
        welcome: "Barka da zuwa ArewaMarket! Da fatan za a zaɓi yaren ku:\n1. Turanci\n2. Hausa",
        askCompany: "Da fatan za a shigar da sunan kamfanin ku:",
        askAddress: "Da fatan za a shigar da adireshin kamfanin ku:",
        registrationComplete: "Rajista ta kammala! Yanzu zaku iya ƙara kayayyaki.",
        addProduct: "1. Ƙara Kaya\n2. Duba Shagona",
        enterProductName: "Shigar da sunan kaya:",
        enterPrice: "Shigar da farashi:",
        enterValidPrice: "Shigar da sahihin farashi:",
        sendImageOrSkip: "Aika hoto ko rubuta SKIP",
        productAdded: "✅ An ƙara kaya!\n1. Ƙara wani\n2. Duba shago",
        viewStore: (slug) => `https://yourapp.com/store/${slug}`,
        replyHi: "Amsa da Hi don farawa"
    }
};

router.post("/", async(req, res) => {
    const msg = (req.body.Body || "").trim();
    const from = (req.body.From || "").replace("whatsapp:", "");
    const numMedia = parseInt(req.body.NumMedia || "0", 10);
    const mediaUrl = numMedia > 0 ? req.body.MediaUrl0 : null;

    let user = await User.findOne({ phone: from });
    if (!user) {
        user = await User.create({ phone: from, state: "select_language", currentProduct: {} });
    }

    // Use user's language or default to English
    const lang = user.language || "en";
    const t = prompts[lang];
    const twiml = new MessagingResponse();

    // Language selection
    if (user.state === "select_language" || /^hi$/i.test(msg)) {
        if (/^hi$/i.test(msg)) {
            user.state = "select_language";
            await user.save();
        }
        twiml.message(prompts.en.welcome); // Always show both languages for selection
        user.state = "awaiting_language";
        await user.save();
        return res.type("text/xml").send(twiml.toString());
    }

    // Awaiting language selection
    if (user.state === "awaiting_language") {
        if (msg === "1") {
            user.language = "en";
            user.state = "register_company";
            await user.save();
            twiml.message(prompts.en.askCompany);
            return res.type("text/xml").send(twiml.toString());
        } else if (msg === "2") {
            user.language = "ha";
            user.state = "register_company";
            await user.save();
            twiml.message(prompts.ha.askCompany);
            return res.type("text/xml").send(twiml.toString());
        } else {
            twiml.message(prompts.en.welcome);
            return res.type("text/xml").send(twiml.toString());
        }
    }

    // Registration: company name
    if (user.state === "register_company") {
        user.companyName = msg;
        // Generate slug and ensure uniqueness
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

    // Registration: address
    if (user.state === "register_address") {
        user.address = msg;
        user.state = "idle";
        await user.save();
        twiml.message(prompts[user.language].registrationComplete + "\n" + prompts[user.language].addProduct);
        return res.type("text/xml").send(twiml.toString());
    }

    // Add Product flow (bilingual)
    if (msg === "1") {
        user.state = "adding_name";
        await user.save();
        twiml.message(t.enterProductName);
        return res.type("text/xml").send(twiml.toString());
    }

    if (user.state === "adding_name") {
        user.currentProduct.name = msg;
        user.state = "adding_price";
        await user.save();
        twiml.message(t.enterPrice);
        return res.type("text/xml").send(twiml.toString());
    }

    if (user.state === "adding_price") {
        const price = Number(msg);
        if (isNaN(price)) {
            twiml.message(t.enterValidPrice);
            return res.type("text/xml").send(twiml.toString());
        } else {
            user.currentProduct.price = price;
            user.state = "adding_image";
            await user.save();
            twiml.message(t.sendImageOrSkip);
            return res.type("text/xml").send(twiml.toString());
        }
    }

    if (user.state === "adding_image") {
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
            imageUrl
        });

        user.state = "idle";
        user.currentProduct = {};
        await user.save();

        twiml.message(t.productAdded);
        return res.type("text/xml").send(twiml.toString());
    }

    if (msg === "2") {
        // Use slug for store link if available, else fallback to phone
        const storeLink = user.slug ? t.viewStore(user.slug) : t.viewStore(from);
        twiml.message(storeLink);
        return res.type("text/xml").send(twiml.toString());
    }

    // Default fallback
    twiml.message(t.replyHi);
    return res.type("text/xml").send(twiml.toString());
});

module.exports = router;