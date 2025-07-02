const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    customerEmail: {
        type: String,
        required: [true, 'Customer email is required'],
        unique: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

subscriptionSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
