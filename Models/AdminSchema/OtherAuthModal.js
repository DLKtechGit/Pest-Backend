const mongoose = require('mongoose');

const OtherAuth = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password:{
        type: String,        
        // required: true
    },
    confirmpassword:{
        type: String,        
        // required: true
    },  
    role:{
        type:String,
        required:true
    },
    created_date: Date,
});

const CustomerRegisterModels = mongoose.model("RegisterCompany", OtherAuth);
module.exports = CustomerRegisterModels;