const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const upload = require("../middleware/upload");

router.post('/addproduct', upload.fields([
    { name: 'product', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]), productController.addProduct);

router.post('/updateproduct', upload.fields([
    { name: 'product', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]), productController.updateProduct);

router.post('/addAllProduct', productController.addAllProduct);
router.post('/removeproduct', productController.removeProduct);
router.get('/allproducts', productController.getAllProducts);
router.get('/newcollection', productController.getNewCollection);
router.get('/popularinwomen', productController.getPopularInWomen);
router.post('/product/:id/review', productController.addProductReview);

module.exports = router;