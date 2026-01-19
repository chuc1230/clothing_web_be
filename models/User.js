const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    listOrders: [
        {
            cart: { type: Object, required: true },
            totalPrice: { type: Number, required: true },
            orderDate: { type: Date, default: Date.now },
        }
    ],
    cartData: { type: Object },
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Users", UserSchema);