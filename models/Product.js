const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String }, // Thêm mô tả sản phẩm
    image: { type: String, required: true }, // Ảnh đại diện chính (frontend dùng thuộc tính này)
    images: [{ type: String }], // Mảng chứa nhiều ảnh (ảnh chính, ảnh chi tiết)
    category: { type: String, required: true, index: true }, 
    sizes: [{ type: String }], // Ví dụ: ["S", "M", "L", "XL"]
    colors: [{ type: String }], // Ví dụ: ["Red", "Black"]
    new_price: { type: Number, required: true, min: 0 },
    old_price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0 }, // Quản lý số lượng tồn kho
    available: { type: Boolean, default: true },
    featured: { type: Boolean, default: false }, // Sản phẩm nổi bật
    date: { type: Date, default: Date.now },
    reviews: [
        {
            name: { type: String, required: true },
            rating: { type: Number, required: true, min: 1, max: 5 },
            comment: { type: String, required: true },
            date: { type: Date, default: Date.now }
        }
    ]
});

module.exports = mongoose.model("Product", ProductSchema);