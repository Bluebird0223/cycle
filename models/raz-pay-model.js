const mongoose = require("mongoose");

const razPaymentSchema = new mongoose.Schema({
    razPaymentId: {
        type: String,
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    paymentStatus: {
        type: String,
        required: true
    }
},
    {
        timestamps: true,
        strict: false
    }
);

const razPayment = mongoose.model('RazPayment', razPaymentSchema);
module.exports = razPayment;
