const mongoose = require('mongoose');

const CreateChemicals = new mongoose.Schema({
    chemicalsName: {
        type: String,
        required: true
    },   
    created_date: Date,     
});

const CreateChemicalsModal = mongoose.model("CreateChemicals", CreateChemicals);
module.exports = CreateChemicalsModal;