const express = require('express');
const { registerUser, loginUser, logoutUser, getUserDetails, forgotPassword, resetPassword, updatePassword, updateProfile, getAllUsers, getSingleUser, updateUserRole, deleteUser, addWishList, removeFromWishList, addToSaveForLater, removeFromSaveForLater, addProductToCart, removeProductFromCart, updateProductQuantity, addTestimonial, getAllTestimonials, deleteTestimonial, createSubscription, createDepartment, updateDepartment, getAllDepartments, getSingleDepartment, createSubDepartment, updateSubDepartment, getSingleSubDepartment, getAllSubDepartments, getUserAllProducts, createDepartmentUser, departmentUserLogin, updateDepartmentStatus, updateSubDepartmentStatus, getAllDepartmentUsers, updateDepartmentUsersStatus, removeAllProductFromCart, departmentWiseSubDepartment, updateDepartmentUser, contactUs, getContactUs, createCoupon, getAllCoupons, getCouponById, updateCoupon, deleteCoupon, useCoupon, sendOtpToMail, verifyOtp, getAllSubscriptions, getSingleDepartmentUser, updateCouponStatus, getDeptDetails, increaseVisitors, visitorsLists, calculatedRating, changeUserStatus } = require('../controllers/userController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').get(logoutUser);

router.route('/me').get(isAuthenticatedUser, getUserDetails);
router.route('/dept/me').get(isAuthenticatedUser, getDeptDetails);

router.route('/password/forgot').post(forgotPassword);
router.route('/password/send-otp').post(sendOtpToMail);
router.route('/password/verify-otp').post(verifyOtp);

router.route('/password/reset/:token').put(resetPassword);

router.route('/password/update').put(isAuthenticatedUser, updatePassword);

// router.route('/user/update').post(isAuthenticatedUser, authorizeRoles("admin", "DeptUser"), updateProfile);


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
router.route('/user/testimonials').post(isAuthenticatedUser, addTestimonial);
router.route('/user/all-testimonials').get(getAllTestimonials);
router.route('/user/testimonials/remove').delete(deleteTestimonial);
router.route('/user/testimonials/rating').get(calculatedRating)

// subscriptions
router.route('/user/subscription').post(createSubscription);
router.route('/user/all-subscription').get(isAuthenticatedUser, authorizeRoles("admin", "DeptUser"), getAllSubscriptions);

// contact us
router.route('/user/contact-us').post(contactUs);
router.route('/user/contact-us').get(getContactUs);

// visitors
router.route('/user/visitors').post(increaseVisitors)
router.route('/user/visitors').get(visitorsLists)


// department
// router.route('/admin/department').post(createDepartment);
// router.route('/admin/department/update').put(updateDepartment);
// router.route('/admin/department/status').post(updateDepartmentStatus)
// router.route('/admin/department/all-department').get(isAuthenticatedUser, getAllDepartments);
// router.route('/admin/department/get-department/:id').get(getSingleDepartment);
// router.route('/admin/department/get-sub-department/:id').get(departmentWiseSubDepartment);

// sub-department
// router.route('/admin/sub-department').post(createSubDepartment)
// router.route('/admin/sub-department').get(getAllSubDepartments)
// router.route('/admin/sub-department/status').post(updateSubDepartmentStatus)
// router.route('/admin/sub-department/update').put(updateSubDepartment)
// router.route('/admin/sub-department/:id').get(getSingleSubDepartment)


// department user
// router.route('/admin/dept/login').post(departmentUserLogin);
// router.route('/admin/dept/create').post(isAuthenticatedUser, authorizeRoles("admin"), createDepartmentUser);
// router.route('/admin/dept/all-users').get(isAuthenticatedUser, authorizeRoles("admin"), getAllDepartmentUsers);
// router.route('/admin/dept/status').post(isAuthenticatedUser, authorizeRoles("admin"), updateDepartmentUsersStatus);
// router.route('/admin/dept/update').post(isAuthenticatedUser, authorizeRoles("admin"), updateDepartmentUser);
// router.route('/admin/dept/:id').get(isAuthenticatedUser, authorizeRoles("admin"), getSingleDepartmentUser);



// coupon code
router.route('/user/all-coupon-user').get(getAllCoupons)
router.route('/user/coupon/apply').post(isAuthenticatedUser, useCoupon)
router.route('/admin/coupon').post(isAuthenticatedUser, authorizeRoles("admin", "DeptUser"), createCoupon);
router.route('/admin/all-coupon').get(isAuthenticatedUser, authorizeRoles("admin", "DeptUser"), getAllCoupons)
router.route('/admin/coupon/status').post(isAuthenticatedUser, authorizeRoles("admin", "DeptUser"), updateCouponStatus)
router.route('/admin/coupon/:id').get(isAuthenticatedUser, authorizeRoles("admin", "DeptUser"), getCouponById)
router.route('/admin/coupon/:id').put(isAuthenticatedUser, authorizeRoles("admin", "DeptUser"), updateCoupon)
router.route('/admin/coupon/:id').delete(isAuthenticatedUser, authorizeRoles("admin", "DeptUser"), deleteCoupon)



router.route('/me/update').put(isAuthenticatedUser, updateProfile);

router.route("/admin/users").get(getAllUsers);
router.route('/admin/user/status').post(isAuthenticatedUser, authorizeRoles("admin"),changeUserStatus)

router.route("/admin/user/:id")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getSingleUser)
    .put(isAuthenticatedUser, authorizeRoles("admin"), updateUserRole)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);

module.exports = router;