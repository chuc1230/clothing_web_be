const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const { type } = require("os");
const { error, log } = require("console");

app.use(express.json());
app.use(cors());

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to the database");
}).catch((error) => {
    console.error("Database connection error:", error);
});
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("Đã kết nối Database thành công!"))
//   .catch((err) => console.log("Lỗi kết nối:", err));
// APT Creation
app.get("/", (req, res) => {
    res.send("Express App is Running ");
});

// Image Storage Engine
const storage = multer.diskStorage({
    destination: './upload/images', // Đảm bảo thư mục 'upload/images' đã được tạo
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// Cấu hình để server có thể truy cập thư mục chứa ảnh đã upload
app.use('/images', express.static(path.join(__dirname, 'upload/images')));

app.post("/upload", upload.array('product'), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: 0, message: "No files uploaded" });
    }

    try {
        const imageUrls = await Promise.all(req.files.map(file => {
            return new Promise((resolve, reject) => {
                cloudinary.uploader.upload(file.path, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result.secure_url); // Lấy URL ảnh từ Cloudinary
                    }
                });
            });
        }));

        res.json({
            success: 1,
            image_urls: imageUrls,
        });
    } catch (error) {
        res.status(500).json({ success: 0, message: "Failed to upload image", error: error.message });
    }
});

const Product = mongoose.model("Product", {
    id:{
        type: Number,
        required: true,

    },
    name:{
        type:String,
        required:true,
    }, 
    image:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    new_price:{
        type:Number,
        required:true,
    },
    old_price: {
        type:Number,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    avilable:{
        type:Boolean,
        default:true,
    },

})



app.post('/addproduct', upload.single('product'), async (req, res) => {
    try {
        let products = await Product.find({});
        let id;

        if (products.length > 0) {
            let last_product = products[products.length - 1];
            id = last_product.id + 1; // Tự động tăng `id`
        } else {
            id = 1; // Nếu là sản phẩm đầu tiên
        }

        // Kiểm tra xem file ảnh có được upload không
        let imageUrl = "";

        if (req.file) {
            // Upload ảnh lên Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path);
            imageUrl = result.secure_url; // Lấy URL của ảnh từ Cloudinary
        }

        // Tạo product mới
        const product = new Product({
            id: id,
            name: req.body.name || "Unknown Product",
            image: imageUrl,
            category: req.body.category || "others",
            new_price: req.body.new_price || 0,
            old_price: req.body.old_price || 0,
        });

        // Lưu product vào database
        await product.save();
        console.log("Product saved:", product);

        res.json({
            success: true,
            name: req.body.name,
        });
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add product",
            error: error.message,
        });
    }
});


app.post('/addAllProduct', async (req, res) => {
    const products = req.body; // Mảng các sản phẩm từ yêu cầu POST

    if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ success: false, message: "Product list is empty or invalid" });
    }

    try {
        // Sử dụng insertMany để thêm tất cả sản phẩm cùng một lúc
        const savedProducts = await Product.insertMany(products);
        console.log("All products added successfully");
        
        res.json({
            success: true,
            addedProducts: savedProducts.length,
            message: "All products have been added successfully",
        });
    } catch (error) {
        console.error("Error adding products:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add products",
            error: error.message,
        });
    }
});


app.post('/removeproduct', async (req, res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success:true,
        name: req.body.name
    })
})

// app.get('/allproducts', async (req, res) => {
//     let products = await Product.find({});
//     console.log("All products fetched");
//     res.send(products);
// })
app.get('/allproducts', async (req, res) => {
    try {
        // Lấy sản phẩm có new_price lớn hơn 10,000
        let products = await Product.find({ new_price: { $gt: 10000 } });
        console.log("Filtered products fetched with price > 10,000");
        res.send(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ success: false, message: "Failed to fetch products", error: error.message });
    }
});


// Shema creating for User model 
const Users = mongoose.model('Users', {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    listOrders: [
        {
            cart: { type: Object, required: true }, // Danh sách sản phẩm trong giỏ hàng
            totalPrice: { type: Number, required: true }, // Tổng giá trị đơn hàng
            orderDate: { type: Date, default: Date.now }, // Ngày đặt hàng
        }
    ],
    cartData: { type: Object },
    date: { type: Date, default: Date.now },
});


// Creating endpoint for registering the user
app.post('/signup', async (req, res) => {
    try {
        let check = await Users.findOne({ email: req.body.email });
        if (check) {
            return res.status(400).json({ success: false, errors: "Người dùng đã tồn tại với email này" });
        }

        // Khởi tạo giỏ hàng
        let cart = {};
        for (let i = 0; i < 300; i++) {
            cart[i] = 0;
        }

        // Tạo tài khoản người dùng
        const user = new Users({
            name: req.body.username,
            email: req.body.email,
            password: req.body.password,
            cartData: cart,
            listOrders: [], // Khởi tạo danh sách đơn hàng rỗng
        });

        await user.save();

        const data = {
            user: { id: user.id },
        };

        const token = jwt.sign(data, 'secret_ecom');
        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, message: "Đăng ký thất bại", error: error.message });
    }
})


// creating endpoint for user login 
app.post('/login', async (req, res) => {
    let user = await Users.findOne({email:req.body.email});
    if(user){
        const passCompare = req.body.password === user.password;
        if(passCompare) {
            const data = {
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign(data, 'secret_ecom');
            res.json({success:true, token});
        }
        else{
            res.json({success:false, errors:"Wrong Password"});
        }
    }
    else {
        res.json({success:false, errors:"Wrong Email Id"});
    }
})

// Creating endpoint for newcollection data
app.get('/newcollection', async (req, res) => {
    let products = await Product.find({ new_price: { $gt: 10000 } });
    let newcollection = products.slice(1).slice(-8);
    console.log("NewCollection Feiched");
    res.send(newcollection);
});


app.get('/popularinwomen', async (req, res) => {
    let products = await Product.find({ category: "women", new_price: { $gt: 10000 } });
    let popular_in_women = products.slice(0, 4);
    console.log("Filtered popular in women fetched with price > 1000");
    res.send(popular_in_women);
});

// creating midelware to fetch user

const fetchUser = async (req, res, next)=>{
    const token = req.header('auth-token');
    if (!token) {
        res.status(401).send({errors:"Please authenticate using valid token"})
    }
    else {
        try {
            const data = jwt.verify(token, 'secret_ecom');
            req.user = data.user;
            next();
        } catch (error) {
            res.status(401).send({errors:"please authenticate using a valid token"})
        }
    }
}


// creating endpoint to remove product from cartdata
app.post('/removefromcart', fetchUser, async (req, res) =>{
    let userData = await Users.findOne({_id:req.user.id});
    if(userData.cartData[req.body.itemId]>0)
    userData.cartData[req.body.itemId] -= 1;
    await Users.findOneAndUpdate({_id:req.user.id}, {cartData:userData.cartData});
    res.send("Remove")
})

// creating endpoint for adding products in cartdata
app.post('/addtocart',fetchUser, async(req, res)=> {
    let userData = await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId] += 1;
    await Users.findOneAndUpdate({_id:req.user.id}, {cartData:userData.cartData});
    res.send("Added")
})

// creating endpoint for clearing the cart
app.post('/clearcart', fetchUser, async (req, res) => {
    try {
      // Find the user by their ID
      let userData = await Users.findOne({ _id: req.user.id });
  
      // Reset the cart to an empty object (or default cart structure)
      userData.cartData = {}; // Clear the cartData
  
      // Update the user document in the database with the empty cart
      await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  
      // Send a success response
      res.json({ message: "Cart cleared successfully" });
    } catch (error) {
      // Handle any errors
      console.error("Error clearing cart:", error);
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });
  
app.post('/getcart', fetchUser, async (req, res) => {
    console.log("GetCart");
    let userData = await Users.findOne({_id:req.user.id});
    res.json(userData.cartData);
})

app.get('/getUsers', async (req, res) => {
    try {
      const users = await Users.find({});
      res.json(users);
    } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching users", error: error.message });
    }
  });
  
// API để xóa người dùng
app.delete('/removeuser', async (req, res) => {
    const { id } = req.body; // Lấy id người dùng cần xóa
    console.log("Id remove: ", id);
    try {
        // Kiểm tra người dùng có tồn tại trong cơ sở dữ liệu không
        const userToDelete = await Users.findById(id);
        if (!userToDelete) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Xóa người dùng
        await Users.findByIdAndDelete(id);
        res.json({ success: true, message: 'User removed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error removing user', error: error.message });
    }
});

app.post('/addOrder', fetchUser, async (req, res) => {
    try {
        const { cart, totalPrice } = req.body;

        // Tìm người dùng
        const user = await Users.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
        }

        // Kiểm tra nếu thông tin giỏ hàng hoặc tổng giá trị đơn hàng không hợp lệ
        if (!cart || Object.keys(cart).length === 0 || totalPrice <= 0) {
            return res.status(400).json({ success: false, message: "Thông tin giỏ hàng hoặc giá trị đơn hàng không hợp lệ" });
        }

        // Thêm đơn hàng mới vào `listOrders`
        user.listOrders = user.listOrders || []; // Khởi tạo `listOrders` nếu chưa tồn tại
        user.listOrders.push({
            cart: cart,
            totalPrice: totalPrice,
            date: new Date(),
        });

        // Xóa giỏ hàng sau khi đặt hàng
        user.cartData = {};
        for (let i = 0; i < 300; i++) {
            user.cartData[i] = 0;
        }

        // Lưu lại thay đổi
        await user.save();
        res.json({ success: true, message: "Đơn hàng đã được thêm thành công", listOrders: user.listOrders });
    } catch (error) {
        res.status(500).json({ success: false, message: "Thêm đơn hàng thất bại", error: error.message });
    }
});

// Endpoint to get the user's order history
app.get('/orderItems', fetchUser, async (req, res) => {
    try {
        const user = await Users.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, orderItems: user.listOrders });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching order history", error: error.message });
    }
});

app.get('/admin/allorders', async (req, res) => {
    try {
        const users = await Users.find({}); // Lấy tất cả user
        const allOrders = [];

        // Duyệt qua từng user và lọc các đơn hàng có ngày sau 1/1/2025
        users.forEach(user => {
            user.listOrders.forEach(order => {
                if (new Date(order.orderDate) > new Date("2025-01-01")) { // Điều kiện ngày
                    allOrders.push({
                        userId: user._id,
                        name: user.name,
                        email: user.email,
                        orderDate: order.orderDate,
                        totalPrice: order.totalPrice,
                        cart: order.cart,
                    });
                }
            });
        });

        res.json({ success: true, orders: allOrders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ success: false, message: "Error fetching orders" });
    }
});



// Lắng nghe kết nối từ cổng đã chỉ định
app.listen(port, (error) => {
    if (!error) {
        console.log("Server running on port: " + port);
    } else {
        console.log("Error:", error);
    }
});
