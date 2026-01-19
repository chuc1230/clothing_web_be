const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");
const upload = require("../middleware/upload");

router.post("/upload", upload.array('product'), uploadController.uploadImages);

module.exports = router;