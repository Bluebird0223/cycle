const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true
    }
}, {
    timestamps: true,
    strict: false
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
