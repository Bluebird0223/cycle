const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please enter coupon title'],
    },
    code: {
        type: String,
        required: [true, 'Please enter coupon code'],
        unique: true
    },
    value: {
        type: Number,
        required: [true, 'Please enter coupon value'],
    },
    type: {
        type: String,
        enum: ['percentage', 'price'],
        required: [true, 'Please specify coupon type'],
    },
    totalCartAmount: {
        type: String,
        required: false
    },
    validity: {
        from: {
            type: Date,
            required: [true, 'Please enter the start date of validity']
        },
        till: {
            type: Date,
            required: [true, 'Please enter the end date of validity']
        }
    },
    usedCoupons: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: true
            },
            usedAt: {
                type: Date,
                default: Date.now
            },
            _id: 0
        }
    ],
    // productsAvailableFor: [
    //     {
    //         type: mongoose.Schema.ObjectId,
    //         ref: 'Product'
    //     }
    // ],
    // subcategoriesAvailableFor: [
    //     {
    //         type: mongoose.Schema.ObjectId,
    //         ref: 'SubCategory'
    //     }
    // ],
    // categoriesAvailableFor: [
    //     {
    //         type: mongoose.Schema.ObjectId,
    //         ref: 'Category'
    //     }
    // ],
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    strict: false
});

module.exports = mongoose.model('Coupon', couponSchema);
