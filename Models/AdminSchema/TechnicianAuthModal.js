const mongoose = require('mongoose');

const TechnicianAuth = new mongoose.Schema({
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
    role:{
        type:String,
        required: true
    },
    confirmpassword:{
        type: String,        
        // required: true 
    },  
    created_date: Date,
});

const TechnicianRegisterModels = mongoose.model("RegisterTechnician", TechnicianAuth);   
module.exports = TechnicianRegisterModels; 