const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const Coupon = require('../models/couponModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler');
const sendEmail = require('../utils/sendEmail');

// Create New Order
exports.newOrder = asyncErrorHandler(async (req, res, next) => {

    const {
        shippingInfo,
        orderItems,
        paymentInfo,
        totalPrice,
        couponCode
    } = req.body;

    const orderExist = await Order.findOne({ paymentInfo });

    if (orderExist) {
        return next(new ErrorHandler("Order Already Placed", 400));
    }

    const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        totalPrice,
        paidAt: Date.now(),
        user: req?.user?._id,
    });

    // await sendEmail({
    //     email: req.user.email,
    //     templateId: process.env.SENDGRID_ORDER_TEMPLATEID,
    //     data: {
    //         name: req.user.name,
    //         shippingInfo,
    //         orderItems,
    //         totalPrice,
    //         oid: order._id,
    //     }
    // });
    if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
        
        if (!coupon) {
            return next(new ErrorHandler("Invalid or expired coupon code", 200));
        }

        const currentDate = new Date();
        if (coupon?.validity?.from > currentDate || coupon?.validity?.till < currentDate) {
            return next(new ErrorHandler("Coupon is not valid at this time", 200));
        }
        const usedCoupon = coupon?.usedCoupons.find(u => u?.user?.toString() === req?.user?._id.toString());
        if (usedCoupon) {
            return next(new ErrorHandler("Coupon has already been used", 200));
        }

        coupon.usedCoupons.push({ user: req?.user?._id });
        await coupon.save();
    }

    for (let i = 0; i < orderItems?.length; i++) {
        const { product, quantity } = orderItems[i];

        const productInDb = await Product.findById(product);
        if (!productInDb) {
            return next(new ErrorHandler(`Product with id ${product} not found`, 200));
        }
        if (productInDb?.stock < quantity) {
            return next(new ErrorHandler(`Not enough stock for product ${productInDb?.name}`, 200));
        }
        productInDb.stock -= quantity;
        await productInDb.save();
    }

    res.status(201).json({
        success: true,
        order,
    });
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