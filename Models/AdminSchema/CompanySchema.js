const mongoose = require('mongoose');

const Customer = new mongoose.Schema({
    firstName: { 
        type: String, 
        // required: true
    },
    lastName: {
        type: String,
        // required: true
    },
    name: {
        type: String, 
        // required: true
    },
    email: {
        type: String,
        unique: true,
        // required: true
    },
    address: {
        type: String,
        // required: true
    },
    country: {
        type: String,
        // required: true
    },
    state: {
        type: String,
        // required: true
    },
    city: {
        type: String,
        // required: true
    },
    phoneNumber: {
        type: String,
        unique: true,
        // required: true,
    },
    deleted: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        // required: true
    },
    confirmpassword: {
        type: String,
        // required: true
    },
    registered: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
    },   
    created_date: Date,
});

const CompanyModels = mongoose.model("Customer", Customer);
module.exports = CompanyModels;