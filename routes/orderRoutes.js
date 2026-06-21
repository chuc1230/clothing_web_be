const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const fetchUser = require("../middleware/auth");

router.post("/add", fetchUser, orderController.addOrder);
router.get("/myorders", fetchUser, orderController.getMyOrders);
router.get("/allorders", fetchUser, orderController.getAllOrdersAdmin);
router.post("/status", fetchUser, orderController.updateOrderStatus);

module.exports = router;
