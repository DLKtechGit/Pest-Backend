const jwt = require('jsonwebtoken');
const { SECRET_TOKEN } = require("../env/env");

const generateAuthToken = (id, email, username) => {
    const token = jwt.sign({
        _id: id,
        email: email,
        username: username,
    },
        SECRET_TOKEN
        // { expiresIn: "5h" }
    );
    return token;
};

module.exports = generateAuthToken;
