const mongoose = require('mongoose');

const contactUsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
    },
    mobile:{
        type:String,
        required:[true,'Mobile is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
    },
    message: {
        type: String,
        required: false
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

contactUsSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('ContactUs', contactUsSchema);
