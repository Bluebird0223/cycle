const express = require('express');
const { newOrder, getSingleOrderDetails, myOrders, getAllOrders, updateOrder, deleteOrder, verifyPayment, createOrder } = require('../controllers/orderController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.route('/order/new').post(isAuthenticatedUser, newOrder);
router.route('/order/:id').get(isAuthenticatedUser, getSingleOrderDetails);
router.route('/orders/me').get(isAuthenticatedUser, myOrders);

router.route('/admin/orders').get(isAuthenticatedUser, authorizeRoles("admin"), getAllOrders);
router.route('/admin/order/status').put(isAuthenticatedUser, authorizeRoles("admin"), updateOrder)

router.route('/admin/order/:id')
    // .put(isAuthenticatedUser, authorizeRoles("admin"), updateOrder)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteOrder);

// razor pay verify payment 
router.route('/order/verify-payment').post(isAuthenticatedUser, verifyPayment)
// create razor pay order
router.route('/order/create-order').post(isAuthenticatedUser, createOrder)

module.exports = router;