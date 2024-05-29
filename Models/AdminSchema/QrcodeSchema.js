const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
    qrTitle: {
        type: String,
        // required: true
    },
    qrScanned: {
        type: String,
        Boolean:false
        // required: true
    },
    titles: [{
        title: { type: String },
        skip:Boolean
        // Other properties if needed
    }],
    serviceName: {
        type: String,
        // required: true
    },
    customerName: {
        type: String,
        // required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer', 
        // required: true
    },
    startDate: {
        type: Date,
        // required: true
    },
    format: {
        type: String,
        // required: true
    },
    width: {
        type: Number,
        // required: true
    },
    height: {
        type: Number,
        // required: true
    },
    qrImage: {
        type: String
    },
    numQRCodes: {
        type: Number,
    },
    available: {
        type: String,
        default: 'NO' 
    },
    created_date: {
        type: Date,
        default: Date.now
    }
});

const QRCode = mongoose.model('QRCode', qrCodeSchema);
module.exports = QRCode;
