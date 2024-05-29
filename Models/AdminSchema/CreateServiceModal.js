const mongoose = require('mongoose');

const CreateService = new mongoose.Schema({
    serviceName: {
        type: [String],
        required: true
    },
    serviceImage: {
        type: String,
        // contentType: String,
        // imageUrl: String,
    },
    mainCategory: {
        type: String,
        required: true,
    },
    created_date: Date,
});

const CreateServiceModal = mongoose.model("CreateService", CreateService);
module.exports = CreateServiceModal;