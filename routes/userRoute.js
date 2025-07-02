const express = require('express');
const { registerUser, loginUser, logoutUser, getUserDetails, forgotPassword, resetPassword, updatePassword, updateProfile, getAllUsers, getSingleUser, updateUserRole, deleteUser, addWishList, removeFromWishList, addToSaveForLater, removeFromSaveForLater, addProductToCart, removeProductFromCart, updateProductQuantity, addTestimonial, getAllTestimonials, deleteTestimonial, createSubscription,getUserAllProducts,removeAllProductFromCart, contactUs, getContactUs, createCoupon, getAllCoupons, getCouponById, updateCoupon, deleteCoupon, useCoupon, sendOtpToMail, verifyOtp, getAllSubscriptions } = require('../controllers/userController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage });

// router.route('/register').post(registerUser);
router.route('/register').post(registerUser);

router.route('/login').post(loginUser);
router.route('/logout').get(logoutUser);

router.route('/me').get(isAuthenticatedUser, getUserDetails);

router.route('/password/forgot').post(forgotPassword);
router.route('/password/send-otp').post(sendOtpToMail);
router.route('/password/verify-otp').post(verifyOtp);

router.route('/password/reset/:token').put(resetPassword);

router.route('/password/update').put(isAuthenticatedUser, updatePassword);

// router.route('/user/update').put(isAuthenticatedUser, updateProfile);


// add product to user wish list
router.route('/user/wishlist').put(addWishList);
router.route('/user/wishlist/remove').delete(removeFromWishList);

// save for later
router.route('/user/save-for-later').put(isAuthenticatedUser, addToSaveForLater);
router.route('/user/save-for-later/remove').post(isAuthenticatedUser, removeFromSaveForLater);

// add to cart 
router.route('/user/cart').put(isAuthenticatedUser, addProductToCart);
router.route('/user/cart/update').put(isAuthenticatedUser, updateProductQuantity);
router.route('/user/cart/remove').post(isAuthenticatedUser, removeProductFromCart);
router.route('/user/cart/remove-all').put(isAuthenticatedUser, removeAllProductFromCart);

// get user products 
router.route('/user/all-products').get(isAuthenticatedUser, getUserAllProducts);


// testimonials
router.route('/user/testimonials').post(addTestimonial);
router.route('/user/all-testimonials').get(getAllTestimonials);
router.route('/user/testimonials/remove').delete(deleteTestimonial);

// subscriptions
router.route('/user/subscription').post(createSubscription);
router.route('/user/all-subscription').get(isAuthenticatedUser, authorizeRoles("admin"), getAllSubscriptions);

// contact us
router.route('/user/contact-us').post(contactUs);
router.route('/user/contact-us').get(getContactUs);


// coupon code
router.route('/admin/coupon').post(isAuthenticatedUser, authorizeRoles("admin"), createCoupon);
router.route('/admin/all-coupon').get(isAuthenticatedUser, authorizeRoles("admin"), getAllCoupons)
router.route('/admin/coupon/:id').get(isAuthenticatedUser, authorizeRoles("admin"), getCouponById)
router.route('/admin/coupon/:id').put(isAuthenticatedUser, authorizeRoles("admin"), updateCoupon)
router.route('/admin/coupon/:id').delete(isAuthenticatedUser, authorizeRoles("admin"), deleteCoupon)
router.route('/user/coupon/apply').post(isAuthenticatedUser, useCoupon)



router.route('/me/update').put(isAuthenticatedUser, updateProfile);

router.route("/admin/users").get(getAllUsers);

router.route("/admin/user/:id")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getSingleUser)
    .put(isAuthenticatedUser, authorizeRoles("admin"), updateUserRole)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);

module.exports = router;