const Product = require("../models/Product");
const cloudinary = require("cloudinary").v2;

// Add single product
exports.addProduct = async (req, res) => {
    try {
        let products = await Product.find({});
        let id = products.length > 0 ? products[products.length - 1].id + 1 : 1;

        let imageUrl = "";
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);
            imageUrl = result.secure_url;
        }

        const product = new Product({
            id: id,
            name: req.body.name || "Unknown Product",
            image: imageUrl,
            category: req.body.category || "others",
            new_price: req.body.new_price || 0,
            old_price: req.body.old_price || 0,
        });

        await product.save();
        console.log("Product saved:", product);
        res.json({ success: true, name: req.body.name });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to add product", error: error.message });
    }
};

// Add multiple products
exports.addAllProduct = async (req, res) => {
    const products = req.body;
    if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ success: false, message: "Product list is empty" });
    }
    try {
        const savedProducts = await Product.insertMany(products);
        res.json({ success: true, addedProducts: savedProducts.length, message: "All products added" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to add products", error: error.message });
    }
};

// Remove product
exports.removeProduct = async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id });
    console.log("Removed");
    res.json({ success: true, name: req.body.name });
};

// Get all products (Filtered > 10000)
exports.getAllProducts = async (req, res) => {
    try {
        let products = await Product.find({ new_price: { $gt: 10000 } });
        console.log("Filtered products fetched");
        res.send(products);
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed", error: error.message });
    }
};

// Get new collection
exports.getNewCollection = async (req, res) => {
    let products = await Product.find({ new_price: { $gt: 10000 } });
    let newcollection = products.slice(1).slice(-8);
    console.log("NewCollection Fetched");
    res.send(newcollection);
};

// Get popular in women
exports.getPopularInWomen = async (req, res) => {
    let products = await Product.find({ category: "women", new_price: { $gt: 10000 } });
    let popular_in_women = products.slice(0, 4);
    console.log("Popular in women fetched");
    res.send(popular_in_women);
};