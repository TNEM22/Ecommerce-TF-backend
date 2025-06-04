const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required!'],
    unique: true,
  },
  otp: {
    type: String,
    required: [true, 'OTP is required!'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300,
  },
});

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
