const express = require("express");
const {
  getAllProducts,
  getProductDetails,
  updateProduct,
  deleteProduct,
  getProductReviews,
  deleteReview,
  createProductReview,
  createProduct,
  getAdminProducts,
  getProducts,
  createCategory,
  getCategory,
  updateCategory,
  toggleCategory,
  getCategoryDetails,
  deleteCategory,
  getAllReviews,
  getFirst12,
} = require("../controllers/productController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const {
  createGroup,
  getGroupById,
  getAllGroup,
  updateGroup,
  deleteGroup,
  getGroupByName,
} = require("../controllers/groupController");
const formidable = require("express-formidable");

const router = express.Router();

router.route("/products").get(getAllProducts);
router.route("/products/all").get(getProducts);
router.route("/products/first12").get(getFirst12);

router.route("/group/get-all").get(getAllGroup);
router.route("/group/:id").get(getGroupById);

router.route("/product/category/new").post(formidable(), createCategory);
router.route("/product/category").get(getCategory);
router.route("/product/category/update").put(formidable(), updateCategory);
router.route("/product/category/delete/:id").delete(deleteCategory);
router.route("/product/category/toggle-active").put(toggleCategory);
router.route("/product/category/:id").get(getCategoryDetails);

// router.route('/admin/products').get(isAuthenticatedUser, authorizeRoles("admin"), getAdminProducts);
router.route("/admin/products").get(getAdminProducts);
router
  .route("/admin/product/new")
  .post(formidable({ multiples: true, keepExtensions: true }), createProduct);

router.route("/admin/group/create").post(createGroup);
router.route("/admin/group/update/:id").post(updateGroup);
router.route("/admin/group/delete/:id").delete(deleteGroup)
router.route("/group/get-by-name").post(getGroupByName);

router
  .route("/admin/product/:id")
  // .put(isAuthenticatedUser, authorizeRoles("admin"), updateProduct)
  .put(formidable({ multiples: true, keepExtensions: true }), updateProduct)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteProduct);

router.route("/product/:id").get(getProductDetails);

router.route("/review").put(isAuthenticatedUser, createProductReview);
router
  .route("/all-review")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAllReviews);

router
  .route("/admin/reviews")
  .get(getProductReviews)
  .delete(isAuthenticatedUser, deleteReview);

module.exports = router;
