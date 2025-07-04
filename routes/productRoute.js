const express = require('express');
const { getAllProducts, getProductDetails, updateProduct, deleteProduct, getProductReviews, deleteReview, createProductReview, createProduct, getAdminProducts, getProducts, createCategory, getCategory, updateCategory, toggleCategory, createSubCategory, updateSubCategory, getSubCategory, toggleSubCategory, getCategoryDetails, deleteCategory, getSubcategoryDetails, getAllReviews, getCategoryWiseSubcategory, getCategoryWiseProducts, getCategoryAndSubcategoryWiseProducts } = require('../controllers/productController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.route('/products').post(getAllProducts);
router.route('/products/all').get(getProducts);


router.route('/product/category/new').post(createCategory)
router.route('/product/category').get(getCategory)
router.route('/product/category/update').put(updateCategory)
router.route('/product/category/delete').delete(deleteCategory)
router.route('/product/category/toggle-active').put(toggleCategory)
router.route('/product/category/sub-categories').get(getCategoryWiseSubcategory);
router.route('/product/category/sarees').post(getCategoryAndSubcategoryWiseProducts);
router.route('/product/category/products').post(getCategoryWiseProducts);
router.route('/product/category/:id').get(getCategoryDetails);


router.route('/product/sub-category/new').post(createSubCategory)
router.route('/product/sub-category').get(getSubCategory)
router.route('/product/sub-category/update').put(updateSubCategory)
router.route('/product/sub-category/delete').put(updateSubCategory)
router.route('/product/sub-category/toggle-active').put(toggleSubCategory)
router.route('/product/sub-category/:id').get(getSubcategoryDetails);


// router.route('/admin/products').get(isAuthenticatedUser, authorizeRoles("admin"), getAdminProducts);
router.route('/admin/products').get(getAdminProducts);
router.route('/admin/product/new').post(isAuthenticatedUser, authorizeRoles("admin"), createProduct);

router.route('/admin/product/update').post(isAuthenticatedUser, authorizeRoles("admin"), updateProduct)
// .put(updateProduct)
// .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteProduct);

router.route('/product/:id').get(getProductDetails);

router.route('/review').put(isAuthenticatedUser, createProductReview);
router.route('/all-review').get(isAuthenticatedUser, authorizeRoles("admin", "DeptUser"), getAllReviews);

router.route('/admin/reviews')
    .get(getProductReviews)
    .delete(isAuthenticatedUser, deleteReview);

module.exports = router;