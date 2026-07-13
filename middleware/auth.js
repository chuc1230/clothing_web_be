const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || 'secret_ecom';

const fetchUser = async (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
        return res.status(401).send({ errors: "Please authenticate using valid token" });
    }
    try {
        const data = jwt.verify(token, JWT_SECRET); 
        req.user = data.user;
        next();
    } catch (error) {
        res.status(401).send({ errors: "Please authenticate using a valid token" });
    }
};

fetchUser.isAdmin = async (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
        next();
    } else {
        res.status(403).json({ success: false, message: "Access denied. Admin role required." });
    }
};

fetchUser.isSuperAdmin = async (req, res, next) => {
    if (req.user && req.user.role === 'super_admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: "Access denied. Super Admin role required." });
    }
};

module.exports = fetchUser;