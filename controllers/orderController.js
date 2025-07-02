const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const razPayment = require('../models/raz-pay-model');
const ErrorHandler = require('../utils/errorHandler');
// const razorpayInstance = require('../utils/razor-pay-instance');
const sendEmail = require('../utils/sendEmail');
const Razorpay = require('razorpay');
const crypto = require("crypto");
const dotenv = require("dotenv")
const mongoose = require("mongoose")
dotenv.config()


//!Don't remove this
async function getPaymentDetails() {
    const key_Id = process.env.RAZOR_PAY_KEY_ID
    const secret_Key = process.env.RAZOR_PAY_SECRET_KEY

    const instance = new Razorpay({ key_id: key_Id, key_secret: secret_Key })

    return instance
};

// Create New Order
exports.newOrder = asyncErrorHandler(async (req, res, next) => {

    //Extract data from request body
    const { shippingInfo, orderItems, paymentInfo, totalPrice } = req.body;

    //check if order already placed
    const orderExist = await Order.findOne({ "paymentInfo.id": paymentInfo.id });
    if (orderExist) {
        return next(new ErrorHandler("Order Already Placed", 400));
    }

    //check if selected product exist
    for (let i = 0; i < orderItems.length; i++) {
        const { product, quantity } = orderItems[i];

        const productInDb = await Product.findById(product);
        if (!productInDb) {
            return next(new ErrorHandler(`Product with id ${product} not found`, 200));
        }
        if (productInDb.stock < quantity) {
            return next(new ErrorHandler(`Not enough stock for product ${productInDb.name}`, 200));
        }
        productInDb.stock -= quantity;
        await productInDb.save();
    }

    // create new order
    const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        totalPrice,
        paidAt: Date.now(),
        user: req.user._id,
    });

    // send response to client with order confirmation email
    if (order) {
        //Send Order Confirmation Email
        sendEmail.sendMail(order);

        res.status(201).json({
            success: true,
            order,
        });
    } else {
        res.status(400).json({
            success: false,
            message: "Order not created",
        });
    }
});



// exports.newOrder = asyncErrorHandler(async (req, res, next) => {
//     const session = await mongoose.startSession(); // Start a session
//     session.startTransaction(); // Start transaction

//     try {
//         const { shippingInfo, orderItems, totalPrice } = req.body;

//         const razPayOrder = {
//             amount: totalPrice * 100, // convert to paisa (required)
//             currency: "INR"
//         };

//         for (let i = 0; i < orderItems.length; i++) {
//             const { product, quantity } = orderItems[i];

//             const productInDb = await Product.findById(product).session(session);
//             if (!productInDb) {
//                 await session.abortTransaction(); // abort if product not found
//                 session.endSession();
//                 return next(new ErrorHandler(`Product with id ${product} not found`, 400));
//             }
//             if (productInDb.stock < quantity) {
//                 await session.abortTransaction(); // abort if product not found
//                 session.endSession();
//                 return next(new ErrorHandler(`Not enough stock for product ${productInDb.name}`, 400));
//             }

//             productInDb.stock -= quantity;
//             await productInDb.save({ session });
//         }

//         const instance = await getPaymentDetails();
//         const razorpayOrder = await instance.orders.create(razPayOrder);

//         const order = await Order.create([{
//             shippingInfo,
//             orderItems,
//             paymentInfo: {
//                 id: razorpayOrder.id,
//                 status: "pending",
//             },
//             totalPrice,
//             paidAt: Date.now(),
//             user: req.user._id,
//         }], { session });

//         // Commit transaction if everything is working
//         await session.commitTransaction();
//         session.endSession();

//         res.status(201).json({
//             success: true,
//             order: order[0], // create returns an array
//             razorpayOrder,
//         });

//     } catch (error) {
//         await session.abortTransaction();
//         session.endSession();
//         console.log(error);
//         return next(new ErrorHandler("Razorpay order creation failed", 500));
//     }
// });

// generate razor payment id with amount and currency
exports.createOrder = asyncErrorHandler(async (req, res, next) => {
    try {
        //Extract data from request body
        const { amount, currency } = req.body;

        const razPayOrder = {
            amount: amount, //amount must be greater than 1 rupees
            currency: currency
        };

        // Create razorpay order 
        const instance = await getPaymentDetails();
        const razorpayOrder = await instance.orders.create(razPayOrder);

        res.status(201).json({
            success: true,
            razorpayOrder
        });

    } catch (error) {
        return next(new ErrorHandler("Razorpay order creation failed", 500));
    }
});


//verify payment
exports.verifyPayment = asyncErrorHandler(async (req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // check if payment order exist or not
    const order = await Order.findOne({ "paymentInfo.id": razorpay_order_id });
    if (!order) return next(new ErrorHandler("Order not found", 404));

    const generatedSignature = crypto.createHmac("sha256", process.env.RAZOR_PAY_SECRET_KEY)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    const isAuthentic = generatedSignature === razorpay_signature;
    if (isAuthentic) {
        // Update payment info in the Order collection
        order.paymentInfo.paymentId = razorpay_payment_id;
        order.paymentInfo.status = "paid";
        order.paidAt = Date.now();
        await order.save();

        // Create entry `RazPayment` collection
        await razPayment.create({
            razPayOrderId: razorpay_order_id,
            razPaymentId: razorpay_payment_id,
            orderId: order?._id,
            paymentStatus: "paid"
        });

        res.status(200).json({
            success: true
        });
    } else {
        res.status(400).json({
            success: false
        });
    }
});


// Get Single Order Details
exports.getSingleOrderDetails = asyncErrorHandler(async (req, res, next) => {

    const order = await Order.findById(req.params.id).populate("user", "name email");

    if (!order) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    res.status(200).json({
        success: true,
        order,
    });
});


// Get Logged In User Orders
exports.myOrders = asyncErrorHandler(async (req, res, next) => {

    const orders = await Order.find({ user: req.user._id });

    if (!orders) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    res.status(200).json({
        success: true,
        orders,
    });
});


// Get All Orders ---ADMIN
exports.getAllOrders = asyncErrorHandler(async (req, res, next) => {
    const orders = await Order.find();

    if (!orders) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    let totalAmount = 0;
    orders.forEach((order) => {
        totalAmount += order.totalPrice;
    });

    res.status(200).json({
        success: true,
        orders,
        totalAmount,
    });
});

// Update Order Status ---ADMIN
exports.updateOrder = asyncErrorHandler(async (req, res, next) => {
    const order = await Order.findById(req?.body?.id);

    if (!order) {
        return next(new ErrorHandler("Order Not Found", 200));
    }

    if (order.orderStatus === "Delivered") {
        return next(new ErrorHandler("Already Delivered", 200));
    }

    if (req?.body?.status === "Shipped") {
        order.shippedAt = Date.now();
        order.orderItems.forEach(async (i) => {
            await updateStock(i.product, i.quantity)
        });
    }

    order.orderStatus = req?.body?.status;
    if (req.body.status === "Delivered") {
        order.deliveredAt = Date.now();
    }

    await order.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true
    });
});

async function updateStock(id, quantity) {
    const product = await Product.findById(id);
    product.stock -= quantity;
    await product.save({ validateBeforeSave: false });
}

// Delete Order ---ADMIN
exports.deleteOrder = asyncErrorHandler(async (req, res, next) => {

    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    await order.remove();

    res.status(200).json({
        success: true,
    });
});