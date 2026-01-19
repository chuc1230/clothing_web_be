const Users = require("../models/User");
const jwt = require("jsonwebtoken");

// Signup
exports.signup = async (req, res) => {
    try {
        let check = await Users.findOne({ email: req.body.email });
        if (check) {
            return res.status(400).json({ success: false, errors: "Email already exists" });
        }
        let cart = {};
        for (let i = 0; i < 300; i++) cart[i] = 0;

        const user = new Users({
            name: req.body.username,
            email: req.body.email,
            password: req.body.password,
            cartData: cart,
            listOrders: [],
        });
        await user.save();
        const token = jwt.sign({ user: { id: user.id } }, 'secret_ecom');
        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, message: "Signup failed", error: error.message });
    }
};

// Login
exports.login = async (req, res) => {
    let user = await Users.findOne({ email: req.body.email });
    if (user) {
        const passCompare = req.body.password === user.password;
        if (passCompare) {
            const token = jwt.sign({ user: { id: user.id } }, 'secret_ecom');
            res.json({ success: true, token });
        } else {
            res.json({ success: false, errors: "Wrong Password" });
        }
    } else {
        res.json({ success: false, errors: "Wrong Email Id" });
    }
};

// Cart Operations
exports.addToCart = async (req, res) => {
    let userData = await Users.findOne({ _id: req.user.id });
    userData.cartData[req.body.itemId] += 1;
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.send("Added");
};

exports.removeFromCart = async (req, res) => {
    let userData = await Users.findOne({ _id: req.user.id });
    if (userData.cartData[req.body.itemId] > 0)
        userData.cartData[req.body.itemId] -= 1;
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.send("Remove");
};

exports.getCart = async (req, res) => {
    let userData = await Users.findOne({ _id: req.user.id });
    res.json(userData.cartData);
};

exports.clearCart = async (req, res) => {
    try {
        await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: {} }); // Lưu ý: Logic gốc set {} nhưng signup set loop 300. Cần đồng bộ logic này sau.
        res.json({ message: "Cart cleared successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to clear cart" });
    }
};

// User Management (Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await Users.find({});
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users" });
    }
};

exports.removeUser = async (req, res) => {
    try {
        const { id } = req.body;
        await Users.findByIdAndDelete(id);
        res.json({ success: true, message: 'User removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error removing user' });
    }
};

// Order Management
exports.addOrder = async (req, res) => {
    try {
        const { cart, totalPrice } = req.body;
        const user = await Users.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.listOrders.push({ cart, totalPrice, date: new Date() });
        
        // Reset cart logic (Original code logic)
        user.cartData = {};
        for (let i = 0; i < 300; i++) user.cartData[i] = 0;

        await user.save();
        res.json({ success: true, message: "Order added", listOrders: user.listOrders });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed", error: error.message });
    }
};

exports.getOrderItems = async (req, res) => {
    try {
        const user = await Users.findById(req.user.id);
        res.json({ success: true, orderItems: user.listOrders });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error" });
    }
};

exports.getAllOrdersAdmin = async (req, res) => {
    try {
        const users = await Users.find({});
        const allOrders = [];
        users.forEach(user => {
            user.listOrders.forEach(order => {
                if (new Date(order.orderDate) > new Date("2025-01-01")) {
                    allOrders.push({
                        userId: user._id,
                        name: user.name,
                        email: user.email,
                        orderDate: order.orderDate,
                        totalPrice: order.totalPrice,
                        cart: order.cart,
                    });
                }
            });
        });
        res.json({ success: true, orders: allOrders });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error" });
    }
};