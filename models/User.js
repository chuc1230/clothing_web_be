const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin", "super_admin"], default: "user" }, // Phân quyền
    phoneNumber: { type: String },
    address: {
        street: String,
        city: String,
        state: String
    },
    // Giỏ hàng hiện tại (Lưu ID sản phẩm và số lượng)
    cartData: { type: Object, default: {} },
    listOrders: [
        {
            cart: { type: Object },
            totalPrice: { type: Number },
            orderDate: { type: Date, default: Date.now }
        }
    ],
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);