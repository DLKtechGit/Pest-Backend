const mongoose = require('mongoose');

const ResetPasswordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  token: { type: String, required: true },
  expires: { type: Date, required: true }
});

const ResetToken = mongoose.model('ResetToken', ResetPasswordSchema);

module.exports = ResetToken;