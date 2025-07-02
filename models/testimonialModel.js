const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
    },
    customerEmail: {
        type: String,
        required: [true, 'Customer email is required'],
        unique: true,
    },
    message: {
        type: String,
        required: [true, 'Testimonial message is required'],
        minlength: [10, 'Testimonial must be at least 10 characters long'],
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be between 1 and 5'],
        max: [5, 'Rating must be between 1 and 5'],
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', 
        required: false, 
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

testimonialSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
