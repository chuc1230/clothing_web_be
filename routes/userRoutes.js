const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const fetchUser = require("../middleware/auth");

// Auth
router.post('/signup', userController.signup);
router.post('/login', userController.login);

// Cart
router.post('/addtocart', fetchUser, userController.addToCart);
router.post('/removefromcart', fetchUser, userController.removeFromCart);
router.post('/clearcart', fetchUser, userController.clearCart);
router.post('/getcart', fetchUser, userController.getCart);

// User Management
router.get('/getUsers', userController.getAllUsers);
router.delete('/removeuser', userController.removeUser);

// Orders
router.post('/addOrder', fetchUser, userController.addOrder);
router.get('/orderItems', fetchUser, userController.getOrderItems);
router.get('/admin/allorders', userController.getAllOrdersAdmin);

module.exports = router;