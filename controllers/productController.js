const Product = require('../models/productModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
// const SearchFeatures = require('../utils/searchFeatures');
const ErrorHandler = require('../utils/errorHandler');
const cloudinary = require('cloudinary');
const Category = require('../models/categoryModel');
const { ObjectId } = require('mongoose').Types;


// Get All Products
exports.getAllProducts = asyncErrorHandler(async (req, res, next) => {
    try {
        const { categoryId, currentPage = 1, keyword, price, ratings, limit = 12 } = req.query;

        let filter = {};

        if (keyword) {
            filter["$or"] = [
                { 'name': { "$regex": keyword, '$options': "i" } },
            ];
        }

        if (categoryId) {
            filter.category = new ObjectId(categoryId);
        }

        if (typeof price === 'object') {
            const priceFilter = {};
            if (price.gte) priceFilter.$gte = Number(price.gte);
            if (price.lte) priceFilter.$lte = Number(price.lte);
            if (Object.keys(priceFilter).length > 0) {
                filter.price = priceFilter;
            }
        }

        if (typeof ratings === 'object' && ratings.gte) {
            filter.ratings = { $gte: Number(ratings.gte) };
        } else if (!isNaN(ratings)) {
            filter.ratings = { $gte: Number(ratings) };
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

    const product = await Product.findById(req.params.id).populate([{ path: "category", select: "name" }])

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
    const products = await Product.find().populate([{ path: "category", select: "name" }])

    res.status(200).json({
        success: true,
        products,
    });
});

exports.createProduct = asyncErrorHandler(async (req, res, next) => {
    try {
        // console.log('body', req.body, req.files)

        // Handle image uploads
        let images = [];
        if (req.files && req.files.images) {
            if (Array.isArray(req.files.images)) {
                images = req.files.images;
            } else {
                // Single image case
                images.push(req.files.images);
            }
        }

        const imagesLink = [];

        for (let i = 0; i < images?.length; i++) {
            const file = images[i];
            const mimeType = file.mimetype;
            const base64Image = `data:${mimeType};base64,${file.data.toString('base64')}`;

            const result = await cloudinary.v2.uploader.upload(base64Image, {
                folder: "products",
            });

            imagesLink.push({
                public_id: result?.public_id,
                url: result?.secure_url,
            });
        }

        // Handle thumbnail upload
        let brandLogo = null;
        if (req.files && req.files.thumbnail) {
            const thumbnailFile = req.files.thumbnail;
            const mimeType = thumbnailFile.mimetype;
            const base64Thumbnail = `data:${mimeType};base64,${thumbnailFile.data.toString('base64')}`;

            const result = await cloudinary.v2.uploader.upload(base64Thumbnail, {
                folder: "thumbnail",
            });

            brandLogo = {
                public_id: result.public_id,
                url: result.secure_url,
            };
        }

        // Set brand information
        if (brandLogo) {
            req.body.brand = {
                name: req.body.brandname,
                logo: brandLogo,
            };
        }

        // Set images and user
        req.body.images = imagesLink;
        req.body.user = req.user.id;

        // Parse specifications
        let specs = [];
        if (req.body.specifications) {
            if (typeof req.body.specifications === 'string') {
                try {
                    const parsedSpecs = JSON.parse(req.body.specifications);
                    if (Array.isArray(parsedSpecs)) {
                        specs = parsedSpecs;
                    } else {
                        specs.push(parsedSpecs);
                    }
                } catch (e) {
                    console.error('Error parsing specifications:', e);
                }
            } else if (Array.isArray(req.body.specifications)) {
                req.body.specifications.forEach((s) => {
                    if (typeof s === 'string') {
                        specs.push(JSON.parse(s));
                    } else {
                        specs.push(s);
                    }
                });
            }
        }
        req.body.specifications = specs;

        // Parse highlights
        if (typeof req.body.highlights === 'string') {
            try {
                req.body.highlights = JSON.parse(req.body.highlights);
            } catch (e) {
                console.error('Error parsing highlights:', e);
                req.body.highlights = [];
            }
        }

        // Convert string numbers to actual numbers
        if (req.body.price) {
            req.body.price = Number(req.body.price);
        }
        if (req.body.cuttedPrice) {
            req.body.cuttedPrice = Number(req.body.cuttedPrice);
        }
        if (req.body.stock) {
            req.body.stock = Number(req.body.stock);
        }

        // Save sku as warranty
        if (req.body.sku) {
            req.body.warranty = Number(req.body.sku);
            delete req.body.sku; // Remove sku from the request body
        }

        const product = await Product.create(req.body);

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product,
        });
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler(error.message, 500));
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
        if (req.files.image) {
            const file = req.files.image;
            const mimeType = file.mimetype;
            const base64Image = `data:${mimeType};base64,${file.data.toString('base64')}`;
            const result = await cloudinary.v2.uploader.upload(base64Image, {
                folder: "category",
            })
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
// update category
exports.updateCategory = asyncErrorHandler(async (req, res, next) => {
    try {

        const { id, name } = req.body;

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

        if (req.files.image) {
            const file = req.files.image;
            const mimeType = file.mimetype;
            const base64Image = `data:${mimeType};base64,${file.data.toString('base64')}`;
            const uploadedImage = await cloudinary.uploader.upload(base64Image, {
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
// Get category
exports.getCategory = asyncErrorHandler(async (req, res, next) => {
    const category = await Category.find();
    res.status(200).json({
        success: true,
        category,
    });
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
    try {
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
    } catch (error) {
        console.error("Error deleting category:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
})


exports.updateProduct = asyncErrorHandler(async (req, res, next) => {
    try {
        console.log("body", req.body)

        let product = await Product.findById(req.params.id);

        if (!product) {
            return next(new ErrorHandler("Product Not Found", 404));
        }

        // Handle image uploads
        if (req.files && req.files.images) {
            let images = [];
            if (typeof req.files.images === "string") {
                images.push(req.files.images);
            } else {
                images = req.files.images;
            }

            // Delete existing images from cloudinary
            for (let i = 0; i < product?.images?.length; i++) {
                await cloudinary.v2.uploader.destroy(product?.images[i]?.public_id);
            }

            const imagesLink = [];

            for (let i = 0; i < images?.length; i++) {
                const file = images[i];
                const mimeType = file.mimetype;
                const base64Image = `data:${mimeType};base64,${file.data.toString('base64')}`;
                const result = await cloudinary.v2.uploader.upload(base64Image, {
                    folder: "products",
                });

                imagesLink.push({
                    public_id: result.public_id,
                    url: result.secure_url,
                });
            }
            req.body.images = imagesLink;
        }

        // Handle thumbnail upload - Fixed condition
        if (req.files && req.files.thumbnail) {
            // Delete existing thumbnail if it exists
            if (product?.brand?.logo?.public_id) {
                await cloudinary?.v2?.uploader?.destroy(product?.brand?.logo?.public_id);
            }

            const file = req.files.thumbnail;
            const mimeType = file.mimetype;
            const base64Image = `data:${mimeType};base64,${file.data.toString('base64')}`;
            const result = await cloudinary.v2.uploader.upload(base64Image, {
                folder: "thumbnail",
            });

            const brandLogo = {
                public_id: result.public_id,
                url: result.secure_url,
            };

            req.body.brand = {
                name: req.body.brandname || (product.brand && product.brand.name), // Fixed: use req.body.brandname
                logo: brandLogo
            }
        }

        // Handle specifications parsing
        if (typeof req.body.specifications === 'string') {
            try {
                req.body.specifications = JSON.parse(req.body.specifications);
            } catch (e) {
                req.body.specifications = [];
            }
        }

        if (typeof req.body.highlights === 'string') {
            try {
                req.body.highlights = JSON.parse(req.body.highlights);
            } catch (e) {
                req.body.highlights = [];
            }
        }

        let specs = [];
        if (Array.isArray(req.body.specifications)) {
            req.body.specifications.forEach((s) => {
                specs.push(typeof s === 'string' ? JSON.parse(s) : s);
            });
        } else if (typeof req.body.specifications === 'string') {
            specs.push(JSON.parse(req.body.specifications));
        } else if (typeof req.body.specifications === 'object' && req.body.specifications !== null) {
            specs.push(req.body.specifications);
        }
        req.body.specifications = specs;

        // Handle images from request body (when updating without file upload)
        if (req.body.images && typeof req.body.images === 'string') {
            try {
                let parsedImages = JSON.parse(req.body.images);

                // Extract public_id from cloudinary URLs if not provided
                req.body.images = parsedImages.map(imageUrl => {
                    if (typeof imageUrl === 'string') {
                        // Extract public_id from cloudinary URL
                        const urlParts = imageUrl.split('/');
                        const fileName = urlParts[urlParts.length - 1];
                        const publicId = fileName.split('.')[0];

                        return {
                            public_id: `products/${publicId}`, // Assuming images are in 'products' folder
                            url: imageUrl
                        };
                    } else if (imageUrl && typeof imageUrl === 'object') {
                        return {
                            public_id: imageUrl.public_id || "",
                            url: imageUrl.url || ""
                        };
                    }
                    return { public_id: "", url: "" };
                });
            } catch (e) {
                console.error('Error parsing images:', e);
                // Keep existing images if parsing fails
                delete req.body.images;
            }
        }

        // Set user ID
        req.body.user = req.user.id; // Fixed: should be req.user.id, not req.params.id

        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
            useFindAndModify: false,
        });

        res.status(200).json({
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

    console.log(req.params.id)

    const product = await Product.findById(req.params.id);
    console.log(product)

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