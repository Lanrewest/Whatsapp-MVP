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
    sendImageOrSkip:
      "Send up to 3 images for your product. Or reply with 'SKIP' to add no images.",
    productAdded: "✅ Product added!\n1. Add another\n2. View store",
    viewStore: (slug) =>
      `You can view your store at:\n${process.env.FRONTEND_URL || "https://arewaconnect.com.ng"}/store/${slug}`,
    replyHi: "Reply Hi to start",
    welcomeBack: (name, tierLabel = "Free") =>
      `Welcome back, ${name}! Current tier: ${tierLabel}. What would you like to do?`,
    // Re-ordered for better flow
    mainMenu:
      "1. Add Product\n2. Modify Product\n3. Delete Product\n4. View My Store\n5. Update Address\n6. Give Feedback\n7. Upgrade Account",
    upgradeLimitExceeded: `You have reached your daily message limit. Please try again tomorrow, or reply with "7" to upgrade your account for a higher limit.`,
    productNotFound: "Product not found.",
    noProducts: "You have not added any products yet.",
    askDeleteProduct:
      "Reply with the number of the product you want to delete:",
    askModifyProduct:
      "Reply with the number of the product you want to modify:",
    askModifyAction: "What do you want to modify?\n1. Name\n2. Price",
    askNewName: "Please enter the new product name:",
    askNewPrice: "Please enter the new product price:",
    askNewAddress: "Please enter your new company address:",
    addressUpdated: "✅ Address updated successfully!",
    productDeleted: "🗑️ Product deleted successfully.",
    askFeedback:
      "We value your input! Please type your feedback/suggestions for Arewa Connect below:",
    feedbackReceived:
      "🙏 Thank you! Your feedback has been recorded. Our team will look into it.",
    verifying: "Generating your secure payment link...",
    verifyError: "Payment system busy. Please try again or contact support.",
    askVerifyChoice:
      "Select Upgrade Type:\n1. Verified Badge (₦2,000 Monthly - 50 msgs/day)\n2. Pro Subscription (₦3,000 Monthly - 200 msgs/day + Pro Features)",
    askPaymentMethod:
      "How would you like to pay for your badge?\n1. Pay Online (Instant ✅)\n2. Bank Transfer (Manual 🏦)",
    bankDetails: `Please transfer the required amount to:\n\n*Bank:* ${process.env.BANK_NAME || "OPAY"}\n*Account:* ${process.env.BANK_ACCOUNT_NUMBER || "6558777325"}\n*Name:* ${process.env.BANK_ACCOUNT_NAME || "AREWACONNECT ENTERPRISE"}\n\nAfter payment, please send a *screenshot of the receipt* here.`,
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
    sendImageOrSkip:
      "Aika hotuna har guda 3 na kayanka. Ko ka rubuta 'SKIP' idan ba kwa bukata.",
    productAdded: "✅ An ƙara kaya!\n1. Ƙara wani\n2. Duba shago",
    viewStore: (slug) =>
      `Zaku iya duba shagonku a:\n${process.env.FRONTEND_URL || "https://arewaconnect.com.ng"}/store/${slug}`,
    replyHi: "Amsa da Hi don farawa",
    welcomeBack: (name, tierLabel = "Free") =>
      `Barka da dawowa, ${name}! Matsayin ku: ${tierLabel}. Me kake son yi?`,
    // Re-ordered for better flow
    mainMenu:
      "1. Ƙara Kaya\n2. Gyara Kaya\n3. Goge Kaya\n4. Duba Shagona\n5. Gyara Adireshi\n6. Ba da Rahoto/Shawara\n7. Haɓaka Asusu",
    upgradeLimitExceeded: `Kuyi hakuri, kun kai iyakacin saƙonni na yau. Da fatan za a sake gwadawa gobe, ko ku amsa da "7" don haɓaka asusun ku.`,
    productNotFound: "Ba a sami kaya ba.",
    noProducts: "Baku ƙara kowane kaya ba tukuna.",
    askDeleteProduct: "Amsa da lambar kayan da kake son gogewa:",
    askModifyProduct: "Amsa da lambar kayan da kake son gyarawa:",
    askModifyAction: "Me kake son gyarawa?\n1. Suna\n2. Farashi",
    askNewName: "Da fatan za a shigar da sabon sunan kayan:",
    askNewPrice: "Da fatan za a shigar da sabon farashin kayan:",
    askNewAddress: "Da fatan za a shigar da sabon adireshin kamfani:",
    addressUpdated: "✅ An gyara adireshin kamfani cikin nasara!",
    productDeleted: "🗑️ An goge kayan cikin nasara.",
    askFeedback:
      "Muna daraja ra'ayin ku! Da fatan za a rubuta shawara ko korafi game da Arewa Connect a kasa:",
    feedbackReceived: "🙏 Mun gode! An karbi ra'ayin ku. Za mu duba shi.",
    verifying: "Ana shirya hanyar biyan kuɗi...",
    verifyError: "An sami matsala. Da fatan za a sake gwadawa.",
    askVerifyChoice:
      "Zaɓi nau'in haɓakawa:\n1. Verified Badge (₦2,000 Duk wata - Sakonni 50)\n2. Pro Subscription (₦3,000 Duk wata - Sakonni 200 + Ayyukan Pro)",
    askPaymentMethod:
      "Yaya kake son biya?\n1. Biya ta Online (Nan take ✅)\n2. Canja wurin kudi ta Banki (Manual 🏦)",
    bankDetails: `Da fatan za a tura kudin da ake bukata zuwa:\n\n*Bank:* ${process.env.BANK_NAME || "OPAY"}\n*Account:* ${process.env.BANK_ACCOUNT_NUMBER || "6558777325"}\n*Sunan:* ${process.env.BANK_ACCOUNT_NAME || "Arewaconect Enterprise"}\n\nBayan kayi biya, turo hoton shaidar biyan ka (receipt) a nan.`,
    receiptReceived:
      "🙏 Mun gode! Mun karbi hoton shaidar biyan ku. Za mu duba sannan mu inganta asusun ku nan ba da jimawa ba.",
    sendReceiptOnly: "Da fatan za a turo hoton shaidar biyan ku.",
  },
};

module.exports = prompts;
