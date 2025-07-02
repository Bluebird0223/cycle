const Product = require("../models/productModel");
const asyncErrorHandler = require("../middlewares/asyncErrorHandler");
const SearchFeatures = require("../utils/searchFeatures");
const ErrorHandler = require("../utils/errorHandler");
const cloudinary = require("cloudinary");
const Category = require("../models/categoryModel");
const productModel = require("../models/productModel");

// Get All Products
exports.getAllProducts = asyncErrorHandler(async (req, res, next) => {
  const resultPerPage = 12;
  const productsCount = await Product.countDocuments();

  const searchFeature = new SearchFeatures(Product.find(), req.query)
    .search()
    .filter();

  let products = await searchFeature.query;
  let filteredProductsCount = products.length;

  searchFeature.pagination(resultPerPage);

  products = await searchFeature.query.clone();

  res.status(200).json({
    success: true,
    products,
    productsCount,
    resultPerPage,
    filteredProductsCount,
  });
});

// Get All Products ---Product Sliders
exports.getProducts = asyncErrorHandler(async (req, res, next) => {
  const products = await Product.find().populate([
    { path: "category", select: "name" },
  ]);
  res.status(200).json({
    success: true,
    products,
  });
});

// Get Product Details
exports.getProductDetails = asyncErrorHandler(async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate([
      { path: "category", select: "name" },
      // { path: "subcategory", select: "name" },
    ]);

    if (!product) {
      return next(new ErrorHandler("Product Not Found", 404));
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

// Get All Products ---ADMIN
exports.getAdminProducts = asyncErrorHandler(async (req, res, next) => {
  const products = await Product.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    products,
  });
});

// Create Product ---ADMIN
// exports.createProduct = asyncErrorHandler(async (req, res, next) => {

//     let images = [];
//     if (typeof req.body.images === "string") {
//         images.push(req.body.images);
//     } else {
//         images = req.body.images;
//     }

//     const imagesLink = [];

//     for (let i = 0; i < images.length; i++) {
//         const result = await cloudinary.v2.uploader.upload(images[i], {
//             folder: "products",
//         });

//         imagesLink.push({
//             public_id: result.public_id,
//             url: result.secure_url,
//         });
//     }

//     const result = await cloudinary.v2.uploader.upload(req.body.logo, {
//         folder: "brands",
//     });
//     const brandLogo = {
//         public_id: result.public_id,
//         url: result.secure_url,
//     };

//     req.body.brand = {
//         name: req.body.brandname,
//         logo: brandLogo
//     }
//     req.body.images = imagesLink;
//     req.body.user = req.user.id;

//     let specs = [];
//     req.body.specifications.forEach((s) => {
//         specs.push(JSON.parse(s))
//     });
//     req.body.specifications = specs;

//     const product = await Product.create(req.body);

//     res.status(201).json({
//         success: true,
//         product
//     });
// });

exports.createProduct = asyncErrorHandler(async (req, res, next) => {
  try {
    req.setTimeout(180000); // 3 minutes
    req.on("timeout", () => {
      const error = {
        message: "Request Timeout",
        http_code: 499,
        name: "TimeoutError",
      };
      next(error); // Pass the error to the error-handling middleware
    });
    //     console.log(req.fields)
    let images = [];

    // return res.status(200).send({
    //   success:false,
    //   message:"wait"
    // })

    if (typeof req?.files?.images?.path === "string") {
      images.push(req.files.images);
    } else if (Array.isArray(req.files.images)) {
      images = req.files.images;
    }

    if (!req.files.thumbnail || !req.files.images) {
      return res.status(400).send({
        success: false,
        message: "Please attach image",
      });
    }

    const imagesLink = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i].path, {
        folder: "products",
      });

      imagesLink.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    const result = await cloudinary.v2.uploader.upload(
      req.files.thumbnail.path,
      {
        folder: "thumbnail",
      }
    );

    const brandLogo = {
      public_id: result.public_id,
      url: result.secure_url,
    };

    req.fields.brand = {
      name: req.body.brandname,
      logo: brandLogo,
    };
    req.fields.images = imagesLink;
    // req.body.user = req.user.id;
    req.fields.user = req.body.user;

    // let specs = [];
    // req.fields.specifications.forEach((s) => {
    //   specs.push(JSON.parse(s));
    // });
    // req.fields.specifications = specs;

    // let high = [];
    // req.fields.highlights.forEach((s)=>{
    //   high.push(JSON.parse())
    // })
    let spec = [];
    JSON.parse(req.fields.specifications).forEach((ar) => {
      spec.push(ar);
    });
    req.fields.specifications = spec;

    let high = [];
    JSON.parse(req.fields.highlights).forEach((ar) => {
      high.push(ar);
    });
    req.fields.highlights = high;

    const product = await Product.create(req.fields);

    // Ensure a valid status code is set here
    return res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// create Category ---ADMIN
exports.createCategory = asyncErrorHandler(async (req, res, next) => {
  try {
    const { name } = req.fields;
    // const imagePath = req.files.image.path;

    // console.log(name, imagePath);
    // if (!imagePath) {
    //   return res.status(200).send({
    //     success: false,
    //     message: "No image attached",
    //   });
    // }

    const existingCategory = await Category.findOne({
      name: name.toLowerCase(),
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    let imageLink = [];

    // ===== ❌ Skip Cloudinary upload START =====
    // if (imagePath) {
    //   try {
    //     const result = await cloudinary.v2.uploader.upload(imagePath, {
    //       folder: "category",
    //     });

    //     console.log(result);
    //     imageLink.push({
    //       public_id: result.public_id,
    //       url: result.secure_url,
    //     });
    //   } catch (error) {
    //     console.log(error);
    //     throw error;
    //   }
    // }
    // ===== ❌ Skip Cloudinary upload END =====

    const categoryData = {
      name: name.toLowerCase(),
      // Optional: remove `image` completely if not needed
      image: imageLink.length > 0 ? imageLink : undefined,
    };

    const category = await Category.create(categoryData);

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// Get category
exports.getCategory = asyncErrorHandler(async (req, res, next) => {
  const category = await Category.find();
  res.status(200).json({
    success: true,
    category,
  });
});
// update category
exports.updateCategory = asyncErrorHandler(async (req, res, next) => {
  try {
    // const { id, name, image } = req.body;
    const { id, name } = req.fields;
    let image;
    if (req?.files?.image) {
      image = req.files.image.path;
    } else if (req.fields?.image) {
      image = req.fields.image;
    }
    // return res.status(200).send({
    //   success: false,
    //   message: "Please wait",
    // });

    const isCategoryExist = await Category.findOne({
      name: name,
      _id: { $ne: id },
    });

    if (isCategoryExist) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    let updatedCategoryData = { name };

    if (image) {
      const uploadedImage = await cloudinary.uploader.upload(image, {
        folder: "category",
      });
      const category = await Category.findById(id);
      if (category.image && category.image.length > 0) {
        await cloudinary.uploader.destroy(category.image[0].public_id);
      }
      updatedCategoryData.image = [
        {
          public_id: uploadedImage.public_id,
          url: uploadedImage.secure_url,
        },
      ];
    }
    const category = await Category.findByIdAndUpdate(id, updatedCategoryData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});
// update category
exports.toggleCategory = asyncErrorHandler(async (req, res, next) => {
  try {
    const { id } = req.body;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    category.isActive = !category.isActive;
    const updatedCategory = await category.save();

    return res.status(200).json({
      success: true,
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});
// get category by id
exports.getCategoryDetails = asyncErrorHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new ErrorHandler("Product Not Found", 404));
  }
  res.status(200).json({
    success: true,
    category,
  });
});
exports.deleteCategory = asyncErrorHandler(async (req, res, next) => {
  try {
    console.log("Received ID:", req.params.id);  // ✅ Add this

    // OPTIONAL: Validate ObjectId
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new ErrorHandler("Invalid Category ID", 400));
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(new ErrorHandler("Category Not Found", 404));
    }

    console.log("Category found:", category);  // ✅ Add this

    // if (category.image && category.image.length > 0) {
    //   for (let i = 0; i < category.image.length; i++) {
    //     await cloudinary.v2.uploader.destroy(category.image[i].public_id);
    //   }
    // }

    await category.remove();

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete Category Error:", error);  // ✅ View exact error
    return res.status(500).json({
      success: false,
      message: "Server Error: " + error.message,
    });
  }
});

// Update Product ---ADMIN
// exports.updateProduct = asyncErrorHandler(async (req, res, next) => {
//     try {
//         // return
//         let product = await Product.findById(req.params.id);

//         if (!product) {
//             return next(new ErrorHandler("Product Not Found", 404));
//         }

//         if (req.body.images !== undefined) {
//             let images = [];
//             if (typeof req.body.images === "string") {
//                 images.push(req.body.images);
//             } else {
//                 images = req.body.images;
//             }
//             for (let i = 0; i < product.images.length; i++) {
//                 await cloudinary.v2.uploader.destroy(product.images[i].public_id);
//             }
//             const imagesLink = [];

//             for (let i = 0; i < images.length; i++) {
//                 const result = await cloudinary.v2.uploader.upload(images[i], {
//                     folder: "products",
//                 });

//                 imagesLink.push({
//                     public_id: result.public_id,
//                     url: result.secure_url,
//                 });
//             }
//             req.body.images = imagesLink;
//         }

//         if (req.body.thumbnail.length > 0) {
//             await cloudinary.v2.uploader.destroy(product.brand.logo.public_id);
//             const result = await cloudinary.v2.uploader.upload(req.body.logo, {
//                 folder: "thumbnail",
//             });
//             const brandLogo = {
//                 public_id: result.public_id,
//                 url: result.secure_url,
//             };

//             req.body.brand = {
//                 name: req.body.brandname,
//                 logo: brandLogo
//             }
//         }

//         let specs = [];
//         req.body.specifications.forEach((s) => {
//             specs.push(JSON.parse(s))
//         });
//         req.body.specifications = specs;
//         req.body.user = req.user.id;

//         product = await Product.findByIdAndUpdate(req.params.id, req.body, {
//             new: true,
//             runValidators: true,
//             useFindAndModify: false,
//         });

//         res.status(201).json({
//             success: true,
//             product
//         });
//     } catch (error) {
//         console.log(error)
//     }
// });

exports.updateProduct = asyncErrorHandler(async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    req.setTimeout(180000); // 3 minutes
    req.on("timeout", () => {
      const error = {
        message: "Request Timeout",
        http_code: 499,
        name: "TimeoutError",
      };
      next(error); // Pass the error to the error-handling middleware
    });
    // console.log(req);
    // console.log(req.files);
    // return res.status(400).send({
    //   success:false,
    //   message:"wait buddy"
    // })

    if (!product) {
      return next(new ErrorHandler("Product Not Found", 404));
    }

    // Handle image uploads
    const imagesLink = [];
    if (req.fields.images || req.files.images) {
      let images = [];
      if (req.fields.images) {
        let temp = JSON.parse(req.fields.images);
        for (let i = 0; i < temp.length; i++) {
          images.push(temp[i]);
        }
      } else if (req.files.images) {
        let temp = req.files.images;
        for (let i = 0; i < temp.length; i++) {
          images.push(temp[i].path);
        }
      }

      // if (typeof req.files.images === "string") {
      //   images.push(req.body.images);
      // } else {
      //   images = req.body.images;
      // }

      for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
          folder: "products",
        });

        imagesLink.push({
          public_id: result.public_id,
          url: result.secure_url,
        });

        // Deleting old images from Cloudinary
        // for (let i = 0; i < product.images.length; i++) {
        //   await cloudinary.uploader.destroy(product.images[i].public_id);
        // }
      }
    }

    if (req.fields.thumbnail || req.files.thumbnail) {
      let image = "";
      if (req.fields.thumbnail) {
        image = req.fields.thumbnail;
      } else if (req.files.thumbnail) {
        image = req.files.thumbnail.path;
      }

      const result = await cloudinary.v2.uploader.upload(image, {
        folder: "thumbnail",
      });

      const brandLogo = {
        public_id: result.public_id,
        url: result.secure_url,
      };

      req.fields.brand = {
        name: req.fields.brandname,
        logo: brandLogo,
      };
      // if (product.brand.logo.public_id) {
      //   await cloudinary.v2.uploader.destroy(product.brand.logo.public_id);
      // }
    }


    req.fields.images = imagesLink;
    // req.body.user = req.user.id;
    req.fields.user = req.body.user;
    // console.log(req.body.brandname)
    req.fields.highlights = JSON.parse(req.fields.highlights);

    req.fields.specifications = JSON.parse(req.fields.specifications);
    // req.body.user = req.body.user

    product = await Product.findByIdAndUpdate(req.params.id, req.fields, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });


    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(error);
    next(new ErrorHandler(error.message, 500));
  }
});
// Delete Product ---ADMIN
exports.deleteProduct = asyncErrorHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  for (let i = 0; i < product.images.length; i++) {
    await cloudinary.v2.uploader.destroy(product.images[i].public_id);
  }

  await product.remove();

  res.status(201).json({
    success: true,
  });
});

// Create OR Update Reviews
exports.createProductReview = asyncErrorHandler(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  const isReviewed = product.reviews.find(
    (review) => review.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString())
        (rev.rating = rating), (rev.comment = comment);
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  let avg = 0;

  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

// Get All Reviews of Product
exports.getProductReviews = asyncErrorHandler(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

exports.getAllReviews = asyncErrorHandler(async (req, res, next) => {
  const products = await Product.find();
  let reviews = [];

  products.forEach((product) => {
    reviews = [...reviews, ...product.reviews];
  });

  res.status(200).json({
    success: true,
    reviews,
  });
});

// Delete Reveiws
exports.deleteReview = asyncErrorHandler(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
  );

  let avg = 0;

  reviews.forEach((rev) => {
    avg += rev.rating;
  });

  let ratings = 0;

  if (reviews.length === 0) {
    ratings = 0;
  } else {
    ratings = avg / reviews.length;
  }

  const numOfReviews = reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings: Number(ratings),
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});

exports.getFirst12 = async (req, res) => {
  try {
    const products = await productModel
      .find()
      .sort({ createdAt: +1 })
      .limit(12);
    // .limit(12).select({name:+1,price:+1,images:+1, cuttedPrice:+1});
    res.status(200).send({
      success: true,
      message: "Getting products...",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Internal error",
      error,
    });
  }
};

