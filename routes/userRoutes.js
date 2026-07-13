const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const fetchUser = require("../middleware/auth");

// Auth
router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.post('/admin/login', userController.adminLogin);

// Profile
router.get('/api/users/profile', fetchUser, userController.getUserProfile);
router.put('/api/users/profile', fetchUser, userController.updateUserProfile);

// Cart
router.post('/addtocart', fetchUser, userController.addToCart);
router.post('/removefromcart', fetchUser, userController.removeFromCart);
router.post('/deletefromcart', fetchUser, userController.deleteFromCart);
router.post('/clearcart', fetchUser, userController.clearCart);
router.post('/getcart', fetchUser, userController.getCart);

// User Management
router.get('/getUsers', userController.getAllUsers);
router.delete('/removeuser', userController.removeUser);
router.put('/api/users/:id/role', fetchUser, fetchUser.isSuperAdmin, userController.updateUserRole);

// Orders
router.post('/addOrder', fetchUser, userController.addOrder);
router.post('/cancelOrder', fetchUser, userController.cancelOrder);
router.get('/orderItems', fetchUser, userController.getOrderItems);
router.get('/admin/allorders', userController.getAllOrdersAdmin);
router.post('/admin/updateOrderStatus', userController.updateUserOrderStatus);
router.get('/admin/stats', userController.getAdminStats);

module.exports = router;