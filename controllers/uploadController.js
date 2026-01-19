const cloudinary = require("cloudinary").v2;

exports.uploadImages = async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: 0, message: "No files uploaded" });
    }
    try {
        const imageUrls = await Promise.all(req.files.map(file => {
            return new Promise((resolve, reject) => {
                cloudinary.uploader.upload(file.path, (error, result) => {
                    if (error) reject(error);
                    else resolve(result.secure_url);
                });
            });
        }));
        res.json({ success: 1, image_urls: imageUrls });
    } catch (error) {
        res.status(500).json({ success: 0, message: "Failed to upload", error: error.message });
    }
};