const mongoose = require('mongoose');

const ServiceCategory = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        unique: true
    },
    categoryType: {
        type: String,
        required: true
    },
    created_date: {
        type: Date,
        default: Date.now
    }  
});

const ServiceCategoryModal = mongoose.model("ServiceCategory", ServiceCategory);
module.exports = ServiceCategoryModal;