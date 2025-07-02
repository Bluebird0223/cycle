const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter product name"],
        trim: true,
        set: value => value.toLowerCase()
    },
    // image: [
    //     {
    //         public_id: {
    //             type: String,
    //             required: true
    //         },
    //         url: {
    //             type: String,
    //             required: true
    //         }
    //     }
    // ],
    isActive: {
        type: Boolean,
        default: true
    },

}, {
    timestamps: true,
    strict: false
}
);

module.exports = mongoose.model('Category', categorySchema);