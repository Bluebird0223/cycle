const mongoose = require('mongoose');

const SubCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter a subcategory name'],
        unique: true,
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
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
    strict: false
});

module.exports = mongoose.model('SubCategory', SubCategorySchema);
