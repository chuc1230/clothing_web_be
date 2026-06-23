require('dotenv').config();
const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const cloudinary = require("cloudinary").v2;
const morgan = require("morgan"); // Thêm thư viện morgan
const logger = require("./utils/logger"); // Import cấu hình logger bạn đã tạo
// Configs
const port = 4000;
connectDB();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware
app.use(express.json());
app.use(cors());

// Custom debug_log middleware
app.use((req, res, next) => {
    const time = new Date().toLocaleString("vi-VN");
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    res.on('finish', () => {
        const status = res.statusCode;
        console.log(`[${time}] - [${method}: ${url}] - [Status: ${status}] - [IP: ${ip}]`);
    });
    next();
});

app.use('/images', express.static(path.join(__dirname, 'upload/images')));

// Routes
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const orderRoutes = require("./routes/orderRoutes");

app.use(productRoutes); 
app.use(userRoutes);
app.use(uploadRoutes);
app.use("/api/order", orderRoutes);


// Health Check
app.get("/", (req, res) => {
    res.send("Express App is Running (MVC Architecture)");
});

// Start Server
app.listen(port, (error) => {
    if (!error) {
        console.log("Server running on port: " + port);
    } else {
        console.log("Error:", error);
    }
});

// Prevent server crashes on unhandled errors
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception at process level:", error);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Promise Rejection at:", promise, "reason:", reason);
});