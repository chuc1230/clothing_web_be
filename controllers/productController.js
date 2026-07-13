const Product = require("../models/Product");
const Order = require("../models/Order");
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

        let colors = [];
        if (req.body.colors) {
            try {
                colors = typeof req.body.colors === 'string' ? JSON.parse(req.body.colors) : req.body.colors;
            } catch (err) {
                console.error("Error parsing colors:", err);
            }
        }

        const new_price = req.body.new_price !== undefined ? Number(req.body.new_price) : (sizes.length > 0 ? Number(sizes[0].new_price) : 0);
        const old_price = req.body.old_price !== undefined ? Number(req.body.old_price) : (sizes.length > 0 ? Number(sizes[0].old_price) : 0);
        const stock = req.body.stock !== undefined ? Number(req.body.stock) : 0;

        if (new_price < 0 || old_price < 0) {
            return res.status(400).json({ success: false, message: "Giá sản phẩm không hợp lệ (không được nhỏ hơn 0)" });
        }

        for (const s of sizes) {
            if (Number(s.new_price) < 0 || Number(s.old_price) < 0) {
                return res.status(400).json({ success: false, message: "Giá kích thước sản phẩm không hợp lệ" });
            }
        }

        if (stock < 0) {
            return res.status(400).json({ success: false, message: "Số lượng tồn kho không được âm" });
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
            new_price: new_price,
            old_price: old_price,
            sizes: sizes,
            colors: colors,
            season: req.body.season || 'Quanh năm',
            stock: stock,
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
        let newcollection = await Product.find({}).sort({ date: -1 }).limit(8);
        console.log("NewCollection Fetched");
        res.send(newcollection);
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch new collection" });
    }
};

// Get popular in women
exports.getPopularInWomen = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Find orders in the last 30 days that are not cancelled/denied
        const orders = await Order.find({
            orderDate: { $gte: thirtyDaysAgo },
            status: { $nin: ["Cancelled", "Đã hủy"] }
        });

        // Map and sum sold quantities per product ID
        const productSales = {};
        orders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    if (item.productId) {
                        const prodIdStr = item.productId.toString();
                        productSales[prodIdStr] = (productSales[prodIdStr] || 0) + (item.quantity || 1);
                    }
                });
            }
        });

        // Get all women products
        const womenProducts = await Product.find({ category: "women" });

        // Map women products with their sale count
        const womenProductsWithSales = womenProducts.map(product => {
            const saleCount = productSales[product._id.toString()] || 0;
            return {
                product,
                saleCount
            };
        });

        // Sort by saleCount descending
        womenProductsWithSales.sort((a, b) => {
            if (b.saleCount !== a.saleCount) {
                return b.saleCount - a.saleCount;
            }
            // Fallback: sort by date created (newest first)
            return new Date(b.product.date) - new Date(a.product.date);
        });

        // Take top 5 products
        const popular_in_women = womenProductsWithSales.slice(0, 5).map(item => item.product);

        console.log("Popular in women (top 5 in last 30 days) fetched");
        res.send(popular_in_women);
    } catch (error) {
        console.error("Error in getPopularInWomen:", error);
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
        const { id, name, description, category, subcategory, detail_category, new_price, old_price, sizes, stock, season, colors, existingImages } = req.body;
        
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

        // Process accompanying images (merge existing ones with new uploads)
        let imagesUrls = [];
        if (existingImages !== undefined) {
            try {
                imagesUrls = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
            } catch (err) {
                console.error("Error parsing existingImages:", err);
                imagesUrls = product.images || [];
            }
        } else {
            imagesUrls = product.images || [];
        }

        if (req.files && req.files['images'] && req.files['images'].length > 0) {
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

        let parsedColors = [];
        if (colors !== undefined) {
            try {
                parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
            } catch (err) {
                console.error("Error parsing colors:", err);
            }
        }

        if (new_price !== undefined && Number(new_price) < 0) {
            return res.status(400).json({ success: false, message: "Giá sản phẩm không hợp lệ (không được nhỏ hơn 0)" });
        }
        if (old_price !== undefined && Number(old_price) < 0) {
            return res.status(400).json({ success: false, message: "Giá sản phẩm không hợp lệ (không được nhỏ hơn 0)" });
        }

        if (parsedSizes && parsedSizes.length > 0) {
            for (const s of parsedSizes) {
                if (Number(s.new_price) < 0 || Number(s.old_price) < 0) {
                    return res.status(400).json({ success: false, message: "Giá kích thước sản phẩm không hợp lệ" });
                }
            }
        }

        if (stock !== undefined) {
            const stockNum = Number(stock);
            if (stockNum < 0) {
                return res.status(400).json({ success: false, message: "Số lượng tồn kho không được âm" });
            }
            product.stock = stockNum;
        }

        product.name = name || product.name;
        product.description = description !== undefined ? description : product.description;
        product.category = category || product.category;
        product.subcategory = subcategory !== undefined ? subcategory : product.subcategory;
        product.detail_category = detail_category !== undefined ? detail_category : product.detail_category;
        product.image = imageUrl;
        product.images = imagesUrls;
        if (sizes !== undefined) {
            product.sizes = parsedSizes;
        }
        if (colors !== undefined) {
            product.colors = parsedColors;
        }
        if (season !== undefined) {
            product.season = season;
        }
        
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