const mongoose = require('mongoose');

const DeletedCustomer = new mongoose.Schema({
    name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  created_date: {
    type: Date,
    default: Date.now
  }
});

const DeletedCustomerModels = mongoose.model("DeletedCustomer,",DeletedCustomer)
module.exports = DeletedCustomerModels