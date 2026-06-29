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

        let sizes = [];
        if (req.body.sizes) {
            try {
                sizes = typeof req.body.sizes === 'string' ? JSON.parse(req.body.sizes) : req.body.sizes;
            } catch (err) {
                console.error("Error parsing sizes:", err);
            }
        }

        const product = new Product({
            id: id,
            name: req.body.name || "Unknown Product",
            description: req.body.description || "",
            image: imageUrl || "",
            images: imagesUrls,
            category: req.body.category || "others",
            subcategory: req.body.subcategory || "",
            detail_category: req.body.detail_category || "",
            new_price: req.body.new_price || (sizes.length > 0 ? sizes[0].new_price : 0),
            old_price: req.body.old_price || (sizes.length > 0 ? sizes[0].old_price : 0),
            sizes: sizes,
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
        if (!name || !rating) {
            return res.status(400).json({ success: false, message: "Missing review name or rating" });
        }
        
        const product = await Product.findOne({ id: Number(req.params.id) });
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        
        product.reviews.push({ name, rating: Number(rating), comment: comment || "" });
        await product.save();
        
        console.log(`Review added for product ${product.id}`);
        res.json({ success: true, reviews: product.reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to add review", error: error.message });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const { id, name, description, category, subcategory, detail_category, new_price, old_price, sizes } = req.body;
        
        const product = await Product.findOne({ id: Number(id) });
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Upload main image if new one provided
        let imageUrl = product.image;
        if (req.files && req.files['product'] && req.files['product'][0]) {
            const result = await cloudinary.uploader.upload(req.files['product'][0].path);
            imageUrl = result.secure_url;
        }

        // Upload accompanying images if new ones provided
        let imagesUrls = product.images;
        if (req.files && req.files['images'] && req.files['images'].length > 0) {
            imagesUrls = [];
            for (const file of req.files['images']) {
                const result = await cloudinary.uploader.upload(file.path);
                imagesUrls.push(result.secure_url);
            }
        }

        let parsedSizes = [];
        if (sizes) {
            try {
                parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
            } catch (err) {
                console.error("Error parsing sizes:", err);
            }
        }

        product.name = name || product.name;
        product.description = description !== undefined ? description : product.description;
        product.category = category || product.category;
        product.subcategory = subcategory !== undefined ? subcategory : product.subcategory;
        product.detail_category = detail_category !== undefined ? detail_category : product.detail_category;
        product.image = imageUrl;
        product.images = imagesUrls;
        product.sizes = parsedSizes;
        
        // If size prices exist, set global price dynamically as first size's price
        product.new_price = new_price !== undefined ? Number(new_price) : (parsedSizes.length > 0 ? parsedSizes[0].new_price : product.new_price);
        product.old_price = old_price !== undefined ? Number(old_price) : (parsedSizes.length > 0 ? parsedSizes[0].old_price : product.old_price);

        await product.save();
        console.log("Product updated:", product);
        res.json({ success: true, name: product.name });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update product", error: error.message });
    }
};