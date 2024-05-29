const jwt = require('jsonwebtoken');
const { SECRET_TOKEN } = require("../env/env");

const AuthToken = (req, res, next) => {
    const token = req.header('authorization');
    console.log("Token", token)
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }
    try {
        const verified = jwt.verify(token, SECRET_TOKEN);
        req.user = verified;
//        console.log("user",req.user)
        next();
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: 'Invalid token.'
        });
    }
}

module.exports = AuthToken;