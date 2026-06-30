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

        const user = new Users({
            name: req.body.username,
            email: req.body.email,
            password: req.body.password,
            cartData: cart,
            listOrders: [],
        });
        await user.save();
        const token = jwt.sign({ user: { id: user.id, role: user.role || 'user' } }, 'secret_ecom');
        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, message: "Signup failed", error: error.message });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        if (process.env.SUPER_ADMIN_EMAIL && process.env.SUPER_ADMIN_PASSWORD &&
            req.body.email === process.env.SUPER_ADMIN_EMAIL && req.body.password === process.env.SUPER_ADMIN_PASSWORD) {
            const token = jwt.sign({ user: { id: "super_admin_id", role: "super_admin" } }, 'secret_ecom');
            return res.json({ success: true, token });
        }

        let user = await Users.findOne({ email: req.body.email });
        if (user) {
            const passCompare = req.body.password === user.password;
            if (passCompare) {
                const token = jwt.sign({ user: { id: user.id, role: user.role || 'user' } }, 'secret_ecom');
                res.json({ success: true, token });
            } else {
                res.json({ success: false, errors: "Wrong Password" });
            }
        } else {
            res.json({ success: false, errors: "Wrong Email Id" });
        }
    } catch (error) {
        res.status(500).json({ success: false, errors: "Login failed due to server error", error: error.message });
    }
};

// Cart Operations
exports.addToCart = async (req, res) => {
    try {
        if (req.user.id === "super_admin_id") {
            return res.status(400).json({ success: false, message: "Super admin cannot have a cart" });
        }
        let userData = await Users.findOne({ _id: req.user.id });
        if (!userData.cartData) {
            userData.cartData = {};
        }
        userData.cartData[req.body.itemId] = (userData.cartData[req.body.itemId] || 0) + 1;
        await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
        res.json({
            success: true,
            message: "Added"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to add to cart", error: error.message });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        if (req.user.id === "super_admin_id") {
            return res.json({ success: true, message: "Super admin has no cart" });
        }
        let userData = await Users.findOne({ _id: req.user.id });
        if (userData.cartData && userData.cartData[req.body.itemId] > 0) {
            userData.cartData[req.body.itemId] -= 1;
            if (userData.cartData[req.body.itemId] === 0) {
                delete userData.cartData[req.body.itemId];
            }
        }
        await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
        res.send("Remove");
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to remove from cart", error: error.message });
    }
};

exports.deleteFromCart = async (req, res) => {
    try {
        if (req.user.id === "super_admin_id") {
            return res.json({ success: true, message: "Super admin has no cart" });
        }
        let userData = await Users.findOne({ _id: req.user.id });
        if (userData.cartData && userData.cartData[req.body.itemId] !== undefined) {
            delete userData.cartData[req.body.itemId];
            await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
        }
        res.json({ success: true, message: "Deleted from cart" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete from cart", error: error.message });
    }
};

exports.getCart = async (req, res) => {
    try {
        if (req.user.id === "super_admin_id") {
            return res.json({});
        }
        let userData = await Users.findOne({ _id: req.user.id });
        res.json(userData ? userData.cartData : {});
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to get cart", error: error.message });
    }
};

exports.clearCart = async (req, res) => {
    try {
        if (req.user.id === "super_admin_id") {
            return res.json({ message: "Cart cleared successfully" });
        }
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
        if (req.user.id === "super_admin_id") {
            return res.status(400).json({ success: false, message: "Super admin cannot place orders" });
        }
        const { cart, totalPrice, phoneNumber, address, paymentMethod } = req.body;

        // Bắt buộc nhập số điện thoại và địa chỉ giao hàng cho đơn hàng mới
        if (!phoneNumber || typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
            return res.status(400).json({ success: false, message: "Số điện thoại nhận hàng là bắt buộc" });
        }
        if (!address || typeof address !== 'object' || 
            !address.street || typeof address.street !== 'string' || !address.street.trim() || 
            !address.city || typeof address.city !== 'string' || !address.city.trim() || 
            !address.state || typeof address.state !== 'string' || !address.state.trim()) {
            return res.status(400).json({ success: false, message: "Địa chỉ giao hàng đầy đủ (số nhà/đường, quận/huyện, tỉnh/thành phố) là bắt buộc" });
        }

        const user = await Users.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.listOrders.push({ 
            cart, 
            totalPrice, 
            orderDate: new Date(),
            status: "Chờ shop đóng hàng",
            phoneNumber: phoneNumber || user.phoneNumber || "",
            address: address || user.address || {},
            paymentMethod: paymentMethod || "Tiền mặt"
        });
        
        // Do not clear cartData on purchase as per new request
        user.markModified('listOrders');
        await user.save();
        res.json({ success: true, message: "Order added", listOrders: user.listOrders });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed", error: error.message });
    }
};

exports.getOrderItems = async (req, res) => {
    try {
        if (req.user.id === "super_admin_id") {
            return res.json({ success: true, orderItems: [] });
        }
        const user = await Users.findById(req.user.id);
        res.json({ success: true, orderItems: (user && user.listOrders) ? user.listOrders : [] });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error" });
    }
};

exports.getAllOrdersAdmin = async (req, res) => {
    try {
        const users = await Users.find({});
        const allOrders = [];
        users.forEach(user => {
            (user.listOrders || []).forEach(order => {
                if (new Date(order.orderDate) > new Date("2025-01-01")) {
                    allOrders.push({
                        userId: user._id,
                        name: user.name,
                        email: user.email,
                        orderDate: order.orderDate,
                        totalPrice: order.totalPrice,
                        cart: order.cart,
                        phoneNumber: order.phoneNumber || user.phoneNumber || "",
                        address: order.address || user.address || {},
                        status: order.status || "Chờ shop đóng hàng",
                        paymentMethod: order.paymentMethod || "Tiền mặt"
                    });
                }
            });
        });
        res.json({ success: true, orders: allOrders });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error" });
    }
};

exports.updateUserOrderStatus = async (req, res) => {
    try {
        const { userId, orderDate, status } = req.body;
        const user = await Users.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const order = user.listOrders.find(
            (o) => new Date(o.orderDate).getTime() === new Date(orderDate).getTime()
        );
        if (order) {
            order.status = status;
            user.markModified('listOrders');
            await user.save();
            res.json({ success: true, message: "Trạng thái đơn hàng đã được cập nhật!", order });
        } else {
            res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi cập nhật trạng thái đơn hàng", error: error.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin', 'super_admin'].includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role value" });
        }
        const updatedUser = await Users.findByIdAndUpdate(req.params.id, { role }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, message: "User role updated successfully", user: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update role", error: error.message });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        if (req.user.id === "super_admin_id") {
            return res.json({
                success: true,
                user: {
                    name: "Super Admin",
                    email: process.env.SUPER_ADMIN_EMAIL || "abc123@example.com",
                    role: "super_admin",
                    phoneNumber: "",
                    address: { street: "", city: "", state: "" }
                }
            });
        }
        const user = await Users.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching profile", error: error.message });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const { name, phoneNumber, address } = req.body;
        const updateData = {};
        if (name) updateData.name = name;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (address) {
            updateData.address = {
                street: address.street || "",
                city: address.city || "",
                state: address.state || ""
            };
        }

        const updatedUser = await Users.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update profile", error: error.message });
    }
};

exports.cancelOrder = async (req, res) => {
    try {
        const { orderDate } = req.body;
        if (!orderDate) {
            return res.status(400).json({ success: false, message: "Missing order date" });
        }
        const user = await Users.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const order = user.listOrders.find(
            (o) => new Date(o.orderDate).getTime() === new Date(orderDate).getTime()
        );
        if (!order) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
        }

        if (order.status !== "Chờ shop đóng hàng") {
            return res.status(400).json({ success: false, message: "Chỉ có thể hủy đơn hàng ở trạng thái 'Chờ shop đóng hàng'" });
        }

        order.status = "Đã hủy";
        user.markModified('listOrders');
        await user.save();
        res.json({ success: true, message: "Đơn hàng đã được hủy thành công!", order });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hủy đơn hàng", error: error.message });
    }
};