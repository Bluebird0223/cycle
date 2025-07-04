const Product = require('../models/productModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
// const SearchFeatures = require('../utils/searchFeatures');
const ErrorHandler = require('../utils/errorHandler');
const cloudinary = require('cloudinary');
const Category = require('../models/categoryModel');
const subCategory = require('../models/subCategoryModel');
const { ObjectId } = require('mongoose').Types;

// Get All Products
exports.getAllProducts = asyncErrorHandler(async (req, res, next) => {
    try {
        const { categoryId, subCategoryId, currentPage = 1, keyword, price, ratings, limit = 12 } = req.body;

        let filter = {};

        if (keyword) {
            filter["$or"] = [
                { 'name': { "$regex": keyword, '$options': "i" } },
            ];
        }

        if (categoryId) {
            filter.category = new ObjectId(categoryId);
        }

        if (subCategoryId) {
            filter.subcategory = new ObjectId(subCategoryId);
        }

        if (price && price.length === 2) {
            filter.price = { $gte: price[0], $lte: price[1] };
        }

        if (ratings) {
            filter.ratings = { $gte: ratings };
        }

        const products = await Product.find(filter)
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * limit)
            .limit(limit);

        const totalRecords = await Product.countDocuments(filter);

        const totalPages = Math.ceil(totalRecords / limit);

        res.status(200).json({
            success: true,
            products,
            totalRecords,
            totalPages,
            resultPerPage: limit
        });

    } catch (error) {
        console.error("Error fetching products:", error);
        return next(new ErrorHandler('Failed to fetch products', 500));
    }
});

// Get All Products ---Product Sliders
exports.getProducts = asyncErrorHandler(async (req, res, next) => {
    const products = await Product.find();

    res.status(200).json({
        success: true,
        products,
    });
});

// Get Product Details
exports.getProductDetails = asyncErrorHandler(async (req, res, next) => {

    const product = await Product.findById(req.params.id).populate([{ path: "category", select: "name" }, { path: "subcategory", select: "name" }])

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    res.status(200).json({
        success: true,
        product,
    });
});

// Get All Products ---ADMIN
exports.getAdminProducts = asyncErrorHandler(async (req, res, next) => {
    const products = await Product.find().populate([{ path: "category", select: "name" }, { path: "subcategory", select: "name" }])

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
        let images = [];
        if (typeof req.body.images === "string") {
            images.push(req.body.images);
        } else if (Array.isArray(req.body.images)) {
            images = req.body.images;
        }

        const imagesLink = [];

        for (let i = 0; i < images?.length; i++) {
            const result = await cloudinary.v2.uploader.upload(images[i], {
                folder: "products",
            });

            imagesLink.push({
                public_id: result?.public_id,
                url: result?.secure_url,
            });
        }



        const result = await cloudinary?.v2?.uploader?.upload(req?.body?.Thumbnail, {
            folder: "thumbnail",
        });

        const brandLogo = {
            public_id: result.public_id,
            url: result.secure_url,
        };

        req.body.brand = {
            name: req.body.brandname,
            logo: brandLogo,
        };
        req.body.images = imagesLink;
        req.body.user = req.user.id;
        // req.body.user = req.body.user

        let specs = [];
        req.body.specifications.forEach((s) => {
            specs.push(JSON.parse(s));
        });
        req.body.specifications = specs;

        const product = await Product.create(req.body);

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

        const existingCategory = await Category.findOne({ name: req.body.name.toLowerCase() });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Category with this name already exists",
            });
        }
        let imageLink = [];
        if (req.body.image) {
            const result = await cloudinary.v2.uploader.upload(req.body.image, {
                folder: "category",
            });

            imageLink.push({
                public_id: result.public_id,
                url: result.secure_url
            });
        }
        const categoryData = {
            ...req.body,
            image: imageLink.length > 0 ? imageLink : undefined,
        };
        // Create the category
        const category = await Category.create(categoryData);

        // Send response with created category
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
        const { id, name, image } = req.body;

        const isCategoryExist = await Category.findOne({
            name: name,
            _id: { $ne: id }
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
                folder: 'category',
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
})
// get category by id
exports.getCategoryDetails = asyncErrorHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
        return next(new ErrorHandler("Category Not Found", 200));
    }
    res.status(200).json({
        success: true,
        category,
    });
});

exports.getCategoryWiseSubcategory = asyncErrorHandler(async (req, res, next) => {
    try {
        const categories = await Category.find();

        if (!categories || categories.length === 0) {
            return next(new ErrorHandler("Categories Not Found", 404));
        }
        const categoryWithSubcategories = await Promise.all(
            categories.map(async (category) => {
                const subcategories = await subCategory.find({ category: category._id });
                return {
                    category: category,
                    subcategories: subcategories
                };
            })
        );

        res.status(200).json({
            success: true,
            data: categoryWithSubcategories,
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal Server Error", 500));
    }
});

exports.getCategoryAndSubcategoryWiseProducts = asyncErrorHandler(async (req, res, next) => {
    try {
        const { category, subCategory } = req.body
        const isCategoryExist = await Category.find({ _id: category });

        if (!isCategoryExist) {
            return next(new ErrorHandler("Categories Not Found", 404));
        }
        const productWithCategories = await Product.find({ category: category, subcategory: subCategory });

        if (productWithCategories.length === 0) {
            return res.status(200).json({
                success: false,
                message: "No products found for this category."
            });
        }
        return res.status(200).json({
            success: true,
            products: productWithCategories
        });
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal Server Error", 500));
    }
})
exports.getCategoryWiseProducts = asyncErrorHandler(async (req, res, next) => {
    try {
        const { category } = req.body
        const isCategoryExist = await Category.find({ _id: category });

        if (!isCategoryExist) {
            return next(new ErrorHandler("Categories Not Found", 404));
        }
        const productWithCategories = await Product.find({ category: category });

        if (productWithCategories.length === 0) {
            return res.status(200).json({
                success: false,
                message: "No products found for this category."
            });
        }
        return res.status(200).json({
            success: true,
            products: productWithCategories
        });
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Internal Server Error", 500));
    }
})



exports.deleteCategory = asyncErrorHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
        return next(new ErrorHandler("Category Not Found", 404));
    }
    if (category.image && category.image.length > 0) {
        for (let i = 0; i < category.image.length; i++) {
            await cloudinary.v2.uploader.destroy(category.image[i].public_id);
        }
    }
    await category.remove();
    return res.status(200).json({
        success: true,
        message: "Category deleted successfully",
    });
})


// create Sub Category ---ADMIN
exports.createSubCategory = asyncErrorHandler(async (req, res, next) => {
    try {
        const { name, category } = req.body;
        const categoryExist = await Category.findById(category);
        if (!categoryExist) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const checkNameExistCategory = await subCategory.findOne({ name, category });
        if (checkNameExistCategory) {
            return res.status(400).json({
                success: false,
                message: "Subcategory already exists with this category",
            });
        }

        const subcategoryData = {
            ...req.body,
        };

        const result = await subCategory.create(subcategoryData);
        return res.status(201).json({
            success: true,
            message: "Subcategory created successfully",
            result,
        });
    } catch (error) {
        console.error("Error creating subcategory:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
});
// Get category
exports.getSubCategory = asyncErrorHandler(async (req, res, next) => {
    const subcategory = await subCategory.find().populate({ path: "category", select: "name" })
    res.status(200).json({
        success: true,
        subcategory,
    });
});
// update subcategory
exports.updateSubCategory = asyncErrorHandler(async (req, res, next) => {
    try {
        const { id, name } = req.body;
        let result = await subCategory.findById(id);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: "SubCategory not found",
            });
        }
        const checkNameExistCategory = await subCategory.findOne({
            name,
            categoryId: result.category,
        });

        if (checkNameExistCategory && checkNameExistCategory._id.toString() !== id) {
            return res.status(400).json({
                success: false,
                message: "Subcategory with this name already exists in the same category",
            });
        }
        result.name = name || result.name;
        await result.save();
        return res.status(200).json({
            success: true,
            result,
        });
    } catch (error) {
        console.error("Error updating subcategory:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
});
// update subcategory
exports.toggleSubCategory = asyncErrorHandler(async (req, res, next) => {
    try {
        const { id } = req.body;
        const category = await subCategory.findById(id);

        if (!category) {
            return res.status(200).json({
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
})
exports.getSubcategoryDetails = asyncErrorHandler(async (req, res, next) => {
    const category = await subCategory.findById(req.params.id).populate({ path: "category", select: "name" });
    if (!category) {
        return next(new ErrorHandler("Product Not Found", 404));
    }
    res.status(200).json({
        success: true,
        category,
    });
})



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

        let product = await Product.findById(req.body.id);

        if (!product) {
            return next(new ErrorHandler("Product Not Found", 200));
        }

        // Handle image uploads
        // const imagesLink = [];
        if (req.body.images !== undefined) {
            let images = [];
            if (typeof req.body.images === "string") {
                images.push(req.body.images);
            } else {
                images = req.body.images;
            }
            for (let i = 0; i < product?.images?.length; i++) {
                await cloudinary.v2.uploader.destroy(product?.images[i]?.public_id);
            }

            const imagesLink = [];

            for (let i = 0; i < images?.length; i++) {
                const result = await cloudinary.v2.uploader.upload(images[i], {
                    folder: "products",
                });
                

                imagesLink.push({
                    public_id: result.public_id,
                    url: result.secure_url,
                });
            }
            req.body.images = imagesLink;
        }

        if (req.body.thumbnail > 0) {
            await cloudinary?.v2?.uploader?.destroy(product?.brand?.thumbnail?.public_id);
            const result = await cloudinary?.v2?.uploader?.upload(req.body.thumbnail, {
                folder: "thumbnail",
            });

            const brandLogo = {
                public_id: result.public_id,
                url: result.secure_url,
            };

            req.body.brand = {
                name: req.body.brandname,
                logo: brandLogo
            }
        }


        // req.body.images = imagesLink;
        // req.body.user = req.user.id;
        // req.body.user = req.body.user
        // console.log(req.body.brandname)

        let specs = [];
        req.body.specifications.forEach((s) => {
            specs.push(JSON.parse(s));
        });
        req.body.specifications = specs;
        req.body.user = req.body.id

        // console.log(req.body.id)
        // return
        product = await Product.findByIdAndUpdate(req.body.id, req.body, {
            new: true,
            runValidators: true,
            useFindAndModify: false,
        });

        res.status(201).json({
            success: true,
            message: "Product updated successfully",
            product
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
        success: true
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
    }

    const product = await Product.findById(productId);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    const isReviewed = product.reviews.find(review => review.user.toString() === req.user._id.toString());

    if (isReviewed) {

        product.reviews.forEach((rev) => {
            if (rev.user.toString() === req.user._id.toString())
                (rev.rating = rating, rev.comment = comment);
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
        success: true
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
        reviews: product.reviews
    });
});


exports.getAllReviews = asyncErrorHandler(async (req, res, next) => {
    const products = await Product.find();
    let reviews = [];

    // products.forEach((product) => {
    //     reviews = [...reviews, ...product.reviews];
    // });

    products.forEach((product) => {
        product.reviews.forEach((review) => {
            reviews.push({
                ...review._doc,
                productId: product._id
            });
        });
    });

    res.status(200).json({
        success: true,
        reviews
    });
});

// Delete Reveiws
exports.deleteReview = asyncErrorHandler(async (req, res, next) => {

    const product = await Product.findById(req.query.productId);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    const reviews = product.reviews.filter((rev) => rev._id.toString() !== req.query.id.toString());

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

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings: Number(ratings),
        numOfReviews,
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
    });
});