const mongoose = require('mongoose');

const IssuesSchema = new mongoose.Schema({
    technicianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Technician',
        required: true
    },
    technicianDetails: {
        firstName: String,
        lastName: String,
        phoneNumber: {
            type: String,
        },
    },
    issueDetails: {
        description: String,
        priority: {
            type: String,
            default: 'Open'
        },
    },
}, { timestamps: true });

const Issue = mongoose.model('Issue', IssuesSchema);

module.exports = Issue;
