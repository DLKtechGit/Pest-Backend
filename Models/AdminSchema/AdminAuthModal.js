const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    role: String,
    randomString:{type:String}
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;