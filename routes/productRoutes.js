const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const upload = require("../middleware/upload");

router.post('/addproduct', upload.single('product'), productController.addProduct);
router.post('/addAllProduct', productController.addAllProduct);
router.post('/removeproduct', productController.removeProduct);
router.get('/allproducts', productController.getAllProducts);
router.get('/newcollection', productController.getNewCollection);
router.get('/popularinwomen', productController.getPopularInWomen);

module.exports = router;