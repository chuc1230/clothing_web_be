const Product = require("../models/Product");
const cloudinary = require("cloudinary").v2;
const logger = require('../utils/logger');
// Add single product
exports.addProduct = async (req, res) => {
    try {
        let last_product_arr = await Product.find({}).sort({ id: -1 }).limit(1);
        let id = last_product_arr.length > 0 ? (last_product_arr[0].id || 0) + 1 : 1;

        let imageUrl = "";
        if (req.files && req.files['product'] && req.files['product'][0]) {
            const result = await cloudinary.uploader.upload(req.files['product'][0].path);
            imageUrl = result.secure_url;
        }

        let imagesUrls = [];
        if (req.files && req.files['images']) {
            for (const file of req.files['images']) {
                const result = await cloudinary.uploader.upload(file.path);
                imagesUrls.push(result.secure_url);
            }
        }

        const product = new Product({
            id: id,
            name: req.body.name || "Unknown Product",
            description: req.body.description || "",
            image: imageUrl || "",
            images: imagesUrls,
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

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        let products = await Product.find({});
        console.log("All products fetched");
        res.send(products);
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed", error: error.message });
    }
};

// Get new collection
exports.getNewCollection = async (req, res) => {
    try {
        let products = await Product.find({});
        let newcollection = products.slice(1).slice(-8);
        console.log("NewCollection Fetched");
        res.send(newcollection);
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch new collection" });
    }
};

// Get popular in women
exports.getPopularInWomen = async (req, res) => {
    try {
        let products = await Product.find({ category: "women" });
        let popular_in_women = products.slice(0, 4);
        console.log("Popular in women fetched");
        res.send(popular_in_women);
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch popular in women" });
    }
};

// Add product review
exports.addProductReview = async (req, res) => {
    try {
        const { name, rating, comment } = req.body;
        if (!name || !rating || !comment) {
            return res.status(400).json({ success: false, message: "Missing review information" });
        }
        
        const product = await Product.findOne({ id: Number(req.params.id) });
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        
        product.reviews.push({ name, rating: Number(rating), comment });
        await product.save();
        
        console.log(`Review added for product ${product.id}`);
        res.json({ success: true, reviews: product.reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to add review", error: error.message });
    }
};