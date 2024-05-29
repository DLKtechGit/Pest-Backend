const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        // required: true
    },
    customerDetails: {
        name: {
            type: String,
            // required: true
        },
        email: {
            type: String,
            // unique: true,
            // required: true
        },
        phoneNumber: {
            type: String,
            // unique: true,
            // required: true,
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
    },
    technicians: [{
        technicianId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Technician',
            // required: true
        },

        tasks: [{
            technicianDetails: {
                firstName: {
                    type: String,
                    // required: true
                },
                lastName: {
                    type: String,
                    // required: true
                },
                email: {
                    type: String,
                }
            },
            otherTechnicianName: {
                type: String,
            },
            serviceName: [{
                type: String,
            }],
            noqrcodeService: [{
                category: {
                    type: String
                },
                subCategory: [{
                    type: String
                }],
                subCategoryStatus: [{
                    subCategory: String,
                    status: Boolean,
                    skip: Boolean
                    
                }] 
            }], 
            QrCodeCategory: [{
                category: {
                    type: String
                },
                subCategory: [{
                    type: String
                }],
                subCategoryStatus: [{
                    subCategory: String,
                    status: Boolean,
                    skip: Boolean,
                    pauseDetails: [{
                        pauseReason: String,
                        pauseTiming: String
                    }]
                }]
            }],
            mainCategory: [{
                type: String,
                // required: true 
            }],
            companyName: {
                type: String,
                // required: true
            },
            technicianStartDate: {
                type: String,
            },
            technicianStartTime: {
                type: String,
            },
            pauseReason: {
                type: String,
            },
            startDate: {
                type: String,
                // required: true
            },
            starttime: {
                type: String,
                // required: true
            },
            description: {
                type: String,
                // required: true
            },
            pdf: {
                type: String,
                // required: true
            },
            status: {
                type: String,
                default: 'Yet to Start'
            },
            Rodentstatus: {
                type: Boolean,
                default: false
            },
            QrCountStatus: {
                type: String,
                default: "0"
            },
            qrDetails: [{
                serviceName: {
                    type: String
                },
                qrTitle: {
                    type: String
                },
                titles: [{
                    title: {
                        type: String,
                    },
                    skip: Boolean,
                    qrScanned: {
                        type: Boolean,
                        default: false
                    },
                    taskItemStatus: {
                        type: String,
                        default: "Start"
                    }
                }],
            }],
            qrTitle: {
                type: String,
            },
            titles: [{
                title: { type: String },
                qrScanned: { type: Boolean, default: false }
            }],
            numQRCodes: {
                type: Number,
            },
            available: {
                type: String,
                default: 'NO'
            },
            // qrScanned: {
            //     type: String,
            //     default:"false",
            //     Boolean:false
            // },
            completedDetails: {
                chemicalsName: [{
                    type: String,
                    default: "No Chemaical name"
                }],
                recommendation: {
                    type: String,
                },
                firstName: {
                    type: String,
                },
                lastName: {
                    type: String,
                },
                techSign: {
                    type: String,
                    // default:"Not Signed"
                },
                name: {
                    type: String,
                },
                customerAvailble: {
                    type: String,
                    default: "false"
                },
                customerSign: {
                    type: String,
                    // default:"Not Signed"
                },
                endTime: {
                    type: String,
                },
            },
        }]
    }]
});

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;
