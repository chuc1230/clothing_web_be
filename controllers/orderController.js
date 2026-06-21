const Order = require("../models/Order");
const User = require("../models/User");

// 1. User đặt hàng (Tạo đơn hàng mới)
exports.addOrder = async (req, res) => {
    try {
        const { items, totalPrice, shippingAddress, paymentMethod } = req.body;
        const userId = req.user.id;

        // Tạo đơn hàng mới dựa trên Order Model
        const newOrder = new Order({
            userId,
            items, // Mảng các sản phẩm [{productId, name, price, quantity, size}]
            totalPrice,
            shippingAddress,
            paymentMethod
        });

        await newOrder.save();

        // Reset giỏ hàng của User về rỗng sau khi đặt hàng thành công
        await User.findByIdAndUpdate(userId, { cartData: [] });

        res.json({ success: true, message: "Đặt hàng thành công!", order: newOrder });
    } catch (error) {
        res.status(500).json({ success: false, message: "Đặt hàng thất bại", error: error.message });
    }
};

// 2. User xem lịch sử đơn hàng của chính mình
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id }).sort({ orderDate: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: "Không thể lấy danh sách đơn hàng" });
    }
};

// 3. Admin xem TẤT CẢ đơn hàng của hệ thống
exports.getAllOrdersAdmin = async (req, res) => {
    try {
        // Lấy tất cả đơn hàng và tự động "populate" thông tin name, email của User từ userId
        const orders = await Order.find({}).populate("userId", "name email").sort({ orderDate: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy đơn hàng" });
    }
};

// 4. Admin cập nhật trạng thái đơn hàng (Ví dụ: Đang xử lý -> Đang giao -> Đã giao)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body; // status: "Processing", "Shipped", "Delivered", "Cancelled"
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
        res.json({ success: true, message: "Cập nhật trạng thái thành công", order: updatedOrder });
    } catch (error) {
        res.status(500).json({ success: false, message: "Không thể cập nhật trạng thái đơn hàng" });
    }
};