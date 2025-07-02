const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'User email is required'],
        unique: true,
    },
    otp: {
        type: String,
        required: [true, 'OTP is required'],
    },
    expireAt: {
        type: Date,
        default: Date.now,
        expires: 100,
    },
}, {
    timestamps: true,
    strict: false
});

module.exports = mongoose.model('Otp', otpSchema);
