const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
            name: String, // Lưu tên tại thời điểm mua (đề phòng sau này product đổi tên)
            price: Number,
            quantity: Number,
            size: String
        }
    ],
    totalPrice: { type: Number, required: true },
    shippingAddress: { type: Object, required: true },
    paymentMethod: { type: String, default: "COD" }, // COD, Stripe, PayPal...
    status: { 
        type: String, 
        enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"], 
        default: "Pending" 
    },
    orderDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", OrderSchema);