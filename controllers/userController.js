const User = require('../models/userModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const sendToken = require('../utils/sendToken');
const ErrorHandler = require('../utils/errorHandler');
// const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const cloudinary = require('cloudinary');
const Product = require('../models/productModel');
const Testimonial = require('../models/testimonialModel');
const Subscription = require('../models/subscriptionModel');
const Department = require('../models/department.Model');
const SubDepartment = require('../models/subDepartmentModel');
const DepartmentUser = require('../models/departmentUserModel');
const contactUs = require('../models/contactUsModel');
const Coupon = require('../models/couponModel');
const sendEmail = require('../utils/sendEmail');
const Otp = require('../models/otpModel');
const departmentUser = require('../models/departmentUserModel');
const testimonialModel = require('../models/testimonialModel');
const Visitor = require('../models/visitorsModel');

// Register User
exports.registerUser = asyncErrorHandler(async (req, res, next) => {

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
        crop: "scale",
    });

    const { name, email, gender, password } = req.body;

    const user = await User.create({
        name,
        email,
        gender,
        password,
        mobile: "",
        avatar: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        },
    });

    sendToken(user, 201, res);
});

// Update User Profile
exports.updateProfile = asyncErrorHandler(async (req, res, next) => {
    const { name, email, mobile, gender, avatar } = req.body;
    const newUserData = {};

    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new ErrorHandler('User not found', 200));
    }

    if (name) newUserData.name = name;
    if (email) {
        const emailExists = await User.findOne({ email: email, _id: { $ne: user._id } });
        if (emailExists) {
            return next(new ErrorHandler('Email is already in use', 200));
        }
        newUserData.email = email;
    }
    if (gender) newUserData.gender = gender;
    if (mobile) newUserData.mobile = mobile;

    if (avatar) {
        const imageId = user.avatar?.public_id;
        if (imageId) {
            await cloudinary.v2.uploader.destroy(imageId);
        }

        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
            crop: "scale",
        });

        newUserData.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        };
    }

    // Update user with new data
    const updatedUser = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    const { cart, savedForLater, wishlist, ...userWithoutSensitiveData } = updatedUser.toObject();

    res.status(200).json({
        success: true,
        message: "User updated successfully",
        user: userWithoutSensitiveData,
    });
});

// Login User
exports.loginUser = asyncErrorHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler("Please Enter Email And Password", 200));
    }

    const user = await User.findOne({ email }).select("+password");

    if (user?.isActive === false) {
        return next(new ErrorHandler("User is not active", 200));
    }

    if (!user) {
        return next(new ErrorHandler("Invalid Email or Password", 200));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid Email or Password", 200));
    }
    sendToken(user, 200, res);
});

// Logout User
exports.logoutUser = asyncErrorHandler(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });

    res.status(200).json({
        success: true,
        message: "Logged Out",
    });
});

// Get User Details
exports.getUserDetails = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success: true,
        user,
    });
});

// get dept details
exports.getDeptDetails = asyncErrorHandler(async (req, res, next) => {
    const deptUserDetails = await departmentUser.find(req.user.id)
    res.status(200).json({
        success: true,
        deptUserDetails
    })
})

// Forgot Password
exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {

    const { email, newPassword } = req.body
    const user = await User.findOne({ email: email });

    if (!user) {
        return next(new ErrorHandler("User Not Found", 200));
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
        success: true,
        message: "Password updated successfully"
    });

});

// send otp to mail
exports.sendOtpToMail = asyncErrorHandler(async (req, res, next) => {
    try {
        const email = req.body.email;
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        // const subject = "Your OTP Code For";
        // const content = `<p>Your OTP is <strong>${otp}</strong>. It is valid for the next 5 minutes.</p>`;

        // await sendEmail.sendMail(email, subject, content);

        const otpRecord = {
            email: email,
            otp: otp
        };
        await Otp.create(otpRecord);
        // await otpRecord.save();

        res.status(200).json({
            success: true,
            message: `Otp sent to ${email} successfully`,
            otp: otp
        });

    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(200).json({
            success: false,
            message: "Failed to send OTP",
        });
    }

});

// Verify OTP
exports.verifyOtp = asyncErrorHandler(async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        // Find the OTP record for the provided email
        const otpRecord = await Otp.findOne({ email: email });

        // Check if OTP is found and hasn't expired
        if (!otpRecord) {
            return res.status(200).json({
                success: false,
                message: "OTP not found or expired",
            });
        }

        if (otpRecord.otp !== otp) {
            return res.status(200).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        // const currentTime = Date.now();
        // if (currentTime > otpRecord.expiresAt) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "OTP has expired",
        //     });
        // }

        // If everything is valid, return success
        res.status(200).json({
            success: true,
            message: "OTP verified successfully",
        });

    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(200).json({
            success: false,
            message: "Failed to verify OTP",
        });
    }
});

// Reset Password
exports.resetPassword = asyncErrorHandler(async (req, res, next) => {

    // create hash token
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        return next(new ErrorHandler("Invalid reset password token", 200));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    sendToken(user, 200, res);
});

// Update Password
exports.updatePassword = asyncErrorHandler(async (req, res, next) => {

    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Old Password is Invalid", 200));
    }

    user.password = req.body.newPassword;
    await user.save();
    sendToken(user, 201, res);
});



// ADMIN DASHBOARD

// Get All Users --ADMIN
exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {

    const users = await User.find();

    res.status(200).json({
        success: true,
        users,
    });
});

exports.changeUserStatus = asyncErrorHandler(async (req, res, next) => {
    try {
        const { id } = req.body;
        const user = await User.findById(id);

        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
            });
        }

        user.isActive = !user.isActive;

        const updatedUser = await user.save();

        return res.status(200).json({
            success: true,
            user: updatedUser?.isActive,
        });
    } catch (error) {
        console.error("Error updating user status:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
})

// Get Single User Details --ADMIN
exports.getSingleUser = asyncErrorHandler(async (req, res, next) => {

    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorHandler(`User doesn't exist with id: ${req.params.id}`, 200));
    }

    res.status(200).json({
        success: true,
        user,
    });
});

// Update User Role --ADMIN
exports.updateUserRole = asyncErrorHandler(async (req, res, next) => {

    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        gender: req.body.gender,
        role: req.body.role,
    }

    await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
    });
});

// Delete Role --ADMIN
exports.deleteUser = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler(`User doesn't exist with id: ${req.params.id}`, 200));
    }
    await user.remove();

    res.status(200).json({
        success: true
    });
});

// add to wishlist --user
exports.addWishList = asyncErrorHandler(async (req, res, next) => {
    const { productId, userId } = req.body;

    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
        return next(new ErrorHandler(`User doesn't exist with id: ${userId}`, 200));
    }

    // Find the product details by productId
    const productDetails = await Product.findById(productId);
    if (!productDetails) {
        return next(new ErrorHandler(`Product doesn't exist with id: ${productId}`, 200));
    }

    // Check if the product is already in the wishlist
    const isProductInWishlist = user.wishlist.some(item => item?.productId?.toString() === productId?.toString());
    if (isProductInWishlist) {
        return next(new ErrorHandler(`Product already exists in wishlist`, 200));
    }

    // Ensure that all required fields are present in the productDetails
    if (!productDetails.name || !productDetails.description || !productDetails.cuttedPrice || !productDetails.price ||
        !productDetails.brand || !productDetails.brand.name || !productDetails.brand.logo ||
        !productDetails.brand.logo.public_id || !productDetails.brand.logo.url ||
        !productDetails.images || productDetails.images.length === 0) {
        return next(new ErrorHandler('Some required product details are missing', 200));
    }

    user.wishlist.push({
        _id: productId,
        name: productDetails.name,
        description: productDetails.description,
        cuttedPrice: productDetails.cuttedPrice,
        price: productDetails.price,
        images: productDetails.images.map(img => ({
            public_id: img.public_id,
            url: img.url
        })),
        brand: {
            name: productDetails.brand.name,
            logo: {
                public_id: productDetails.brand.logo.public_id,
                url: productDetails.brand.logo.url
            }
        },
        ratings: productDetails.ratings,
        reviews: productDetails.reviews,
        quantity: 1,
    });

    await user.save();

    res.status(200).json({
        success: true,
        message: "Product added to wishlist successfully",
    });
});

exports.removeFromWishList = asyncErrorHandler(async (req, res, next) => {
    const { productId, userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
        return next(new ErrorHandler(`User doesn't exist with id: ${userId}`, 200));
    }
    const productDetails = await Product.findById(productId);
    if (!productDetails) {
        return next(new ErrorHandler(`Product doesn't exist with id: ${productId}`, 200));
    }
    const isProductInWishlist = user.wishlist.some(item => item?._id?.toString() === productId?.toString());
    if (!isProductInWishlist) {
        return next(new ErrorHandler(`Product is not in the wishlist`, 200));
    }
    user.wishlist = user.wishlist.filter(item => item?._id.toString() !== productId?.toString());
    await user.save();
    res.status(200).json({
        success: true,
        message: "Product removed from wishlist successfully",
    });
});


// add save for later
exports.addToSaveForLater = asyncErrorHandler(async (req, res, next) => {

    const userId = req.user.id
    const { productId, quantity } = req.body;
    const user = await User.findById(userId);
    if (!user) {
        return next(new ErrorHandler(`User doesn't exist with id: ${userId}`, 200));
    }
    const productDetails = await Product.findById(productId);
    if (!productDetails) {
        return next(new ErrorHandler(`Product doesn't exist with id: ${productId}`, 200));
    }
    const isProductInSavedForLater = user.savedForLater.some(item => item?.productId?.toString() === productId?.toString());
    if (isProductInSavedForLater) {
        return next(new ErrorHandler(`Product already exists in 'Save for Later' list`, 200));
    }

    if (!productDetails.name || !productDetails.description || !productDetails.cuttedPrice || !productDetails.price ||
        !productDetails.brand || !productDetails.brand.name || !productDetails.brand.logo ||
        !productDetails.brand.logo.public_id || !productDetails.brand.logo.url ||
        !productDetails.images || productDetails.images.length === 0) {
        return next(new ErrorHandler('Some required product details are missing', 200));
    }

    user.savedForLater.push({
        _id: productId,
        name: productDetails.name,
        description: productDetails.description,
        cuttedPrice: productDetails.cuttedPrice,
        price: productDetails.price,
        images: productDetails.images.map(img => ({
            public_id: img.public_id,
            url: img.url
        })),
        brand: {
            name: productDetails.brand.name,
            logo: {
                public_id: productDetails.brand.logo.public_id,
                url: productDetails.brand.logo.url
            }
        },
        ratings: productDetails.ratings,
        reviews: productDetails.reviews,
        quantity: quantity,
    });
    await user.save();

    res.status(200).json({
        success: true,
        message: "Product added to 'Save for Later' list successfully",
    });
});

// remove from save for later
exports.removeFromSaveForLater = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user.id
    const { productId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
        return next(new ErrorHandler(`User doesn't exist with id: ${userId}`, 200));
    }
    const isProductInSavedForLater = user.savedForLater.some(item => item?._id?.toString() === productId?.toString());
    if (!isProductInSavedForLater) {
        return next(new ErrorHandler(`Product is not in 'Save for Later' list`, 200));
    }
    user.savedForLater = user.savedForLater.filter(item => item?._id?.toString() !== productId?.toString());
    await user.save();

    res.status(200).json({
        success: true,
        message: "Product removed from 'Save for Later' list successfully",
    });
});

// add to cart
exports.addProductToCart = asyncErrorHandler(async (req, res, next) => {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    const productDetails = await Product.findById(productId);
    if (!productDetails) {
        return next(new ErrorHandler(`Product not found with ID: ${productId}`, 200));
    }
    const user = await User.findById(userId);

    if (!user) {
        return next(new ErrorHandler(`User not found with ID: ${userId}`, 200));
    }
    const existingItem = user.cart.find(item => item?.productId?.toString() === productId?.toString());

    if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.totalPrice = existingItem.price * existingItem.quantity;
    } else {
        user.cart.push({
            _id: productId,
            name: productDetails.name,
            description: productDetails.description,
            cuttedPrice: productDetails.cuttedPrice,
            price: productDetails.price,
            images: productDetails.images.map(img => ({
                public_id: img.public_id,
                url: img.url
            })),
            brand: {
                name: productDetails.brand.name,
                logo: {
                    public_id: productDetails.brand.logo.public_id,
                    url: productDetails.brand.logo.url
                }
            },
            ratings: productDetails.ratings,
            reviews: productDetails.reviews,
            quantity,
            price: productDetails.price,
            totalPrice: productDetails.price * quantity,
        });
    }
    await user.save();

    res.status(200).json({
        success: true,
        message: "Product added to cart",
        cart: user.cart,
    });
});

// remove from cart
exports.removeProductFromCart = asyncErrorHandler(async (req, res, next) => {
    const { productId } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);


    if (!user) {
        return next(new ErrorHandler(`User not found with ID: ${userId}`, 200));
    }

    const itemIndex = user.cart.findIndex(item => item?._id?.toString() === productId?.toString());

    if (itemIndex === -1) {
        return next(new ErrorHandler('Product not found in cart', 200));
    }
    user.cart.splice(itemIndex, 1);

    await user.save();

    res.status(200).json({
        success: true,
        message: "Product removed from cart",
        cart: user.cart,
    });
});

// remove all from cart
exports.removeAllProductFromCart = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
        return next(new ErrorHandler(`User not found with ID: ${userId}`, 200));
    }

    user.cart = [];

    await user.save();

    res.status(200).json({
        success: true,
        message: "All products removed from cart",
        cart: user.cart,
    });
});

// update quantity
exports.updateProductQuantity = asyncErrorHandler(async (req, res, next) => {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
        return next(new ErrorHandler(`User not found with ID: ${userId}`, 200));
    }

    const itemIndex = user.cart.findIndex(item => item._id.toString() === productId.toString());

    if (itemIndex === -1) {
        return next(new ErrorHandler('Product not found in cart', 200));
    }

    user.cart[itemIndex].quantity = quantity;
    user.cart[itemIndex].totalPrice = user.cart[itemIndex].price * quantity;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Product quantity updated",
        cart: user.cart,
    });
});

// get User all saved Products
exports.getUserAllProducts = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user.id;

    const user = await User.findById(userId)

    if (!user) {
        return next(new ErrorHandler(`User not found with ID: ${userId}`, 200));
    }
    res.status(200).json({
        success: true,
        message: "Product quantity updated",
        wishlist: user?.wishlist,
        savedForLater: user?.savedForLater,
        cart: user?.cart,

    });
})

// create testimonials
exports.addTestimonial = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { message, rating } = req.body;

    try {
        const existingTestimonial = await Testimonial.findOne({ userId: userId });
        if (existingTestimonial) {
            return res.status(200).json({
                success: false,
                message: "Feedback already submitted.",
            });
        }

        const newTestimonial = {
            userId,
            message,
            rating,
        };

        const createdTestimonial = await Testimonial.create(newTestimonial);

        res.status(201).json({
            success: true,
            message: 'Testimonial created successfully',
            testimonial: createdTestimonial,
        });
    } catch (error) {
        console.error("Error while saving the testimonial:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while saving the testimonial.",
        });
    }
});

// get all testimonials
exports.getAllTestimonials = asyncErrorHandler(async (req, res, next) => {
    const testimonials = await Testimonial.find().populate('userId', 'userId name email gender avatar')
    res.status(200).json({
        success: true,
        testimonials
    });
});
// delete testimonials
exports.deleteTestimonial = asyncErrorHandler(async (req, res, next) => {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
        return next(new ErrorHandler(`Testimonial not found with ID: ${req.params.id}`, 200));
    }
    await testimonial.remove();
    res.status(200).json({
        success: true,
        message: "Testimonial deleted successfully"
    });
})

// calculated Rating
exports.calculatedRating = asyncErrorHandler(async (req, res, next) => {
    const testimonials = await Testimonial.find()
    const ratings = testimonials.map(testimonial => testimonial.rating);
    const totalRatings = ratings.reduce((sum, rating) => sum + rating, 0);
    const averageRating = totalRatings / ratings.length;
    const roundedRating = averageRating.toFixed(1);

    res.status(200).json({
        success: true,
        roundedRating
    });
})

// add subscription
exports.createSubscription = asyncErrorHandler(async (req, res, next) => {
    const { customerEmail } = req.body;
    const existingSubscription = await Subscription.findOne({ customerEmail });

    if (existingSubscription) {
        return next(new ErrorHandler('Subscription already exists with this email.', 200));
    }
    const newSubscription = await Subscription.create({ customerEmail });

    res.status(201).json({
        success: true,
        message: 'Subscription created successfully',
        subscription: newSubscription,
    });
})
// get all subscriptions
exports.getAllSubscriptions = asyncErrorHandler(async (req, res, next) => {
    const subscriptions = await Subscription.find();
    res.status(200).json({
        success: true,
        subscriptions,
    });
});

// contact us
exports.contactUs = asyncErrorHandler(async (req, res, next) => {
    const { name, email, mobile, message } = req.body;

    const dataToInsert = {
        name: name?.toLowerCase(),
        email,
        mobile,
        message: message ? message : ""
    }

    const result = await contactUs.create(dataToInsert);
    if (result?._id) {
        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
        });
    } else {
        res.status(201).json({
            success: false,
            message: 'Message not sent',
        });
    }
})

// get contact us
exports.getContactUs = asyncErrorHandler(async (req, res, next) => {
    const contactUsData = await contactUs.find();
    res.status(200).json({
        success: true,
        contactUsData,
    });
})

// increase visitors
exports.increaseVisitors = asyncErrorHandler(async (req, res, next) => {

    await Visitor.updateOne(
        {},
        { $inc: { count: 1 } },
        { upsert: true }
    );
    res.status(200).json({
        success: true,
        message: "Visitor count increased successfully",
    });
})

exports.visitorsLists = asyncErrorHandler(async (req, res, next) => {
    const visitorsCount = await Visitor.findOne();
    res.status(200).json({
        success: true,
        visitors: visitorsCount?.count,
    });
})

// department create
exports.createDepartment = asyncErrorHandler(async (req, res, next) => {
    const { name } = req.body;

    // Check if the department already exists
    const existingDepartment = await Department.findOne({ name: name?.toLowerCase() });
    if (existingDepartment) {
        return next(new ErrorHandler('Department already exists with this name.', 200));
    }

    // Generate department ID
    const generateDepartmentId = await Department.find({}).sort({ createdAt: -1 }).limit(1);

    let departmentId;
    if (generateDepartmentId[0]?.departmentId) {
        const lastGeneratedId = (Number(generateDepartmentId[0].departmentId?.substring(2)) + 1);
        departmentId = `DE${lastGeneratedId}`;
    } else {
        departmentId = 'DE1';
    }

    const departmentData = {
        name: name.toLowerCase(),
        departmentId
    };

    const newDepartment = await Department.create(departmentData);
    if (newDepartment?._id) {
        return res.status(201).json({
            success: true,
            message: 'Department created successfully',
            department: newDepartment,
        });
    } else {
        return next(new ErrorHandler('Failed to create department, please try again', 200));
    }
});
// get all departments
exports.getAllDepartments = asyncErrorHandler(async (req, res, next) => {
    const departments = await Department.find();
    res.status(200).json({
        success: true,
        departments,
    });
});
// get single department
exports.getSingleDepartment = asyncErrorHandler(async (req, res, next) => {
    const department = await Department.findOne({ _id: req.params.id });
    if (!department) {
        return next(new ErrorHandler(`Department not found with ID: ${req.params.id}`, 200));
    }
    res.status(200).json({
        success: true,
        department,
    });
});
// update department
exports.updateDepartment = asyncErrorHandler(async (req, res, next) => {
    const { id, name } = req.body;
    const department = await Department.findOne({ _id: id });
    if (!department) {
        return next(new ErrorHandler(`Department not found with ID: ${id}`, 200));
    }
    department.name = name;
    await department.save();
    res.status(200).json({
        success: true,
        message: 'Department updated successfully',
        department,
    });
})
// update status
exports.updateDepartmentStatus = asyncErrorHandler(async (req, res, next) => {
    try {
        const { id } = req.body;
        const department = await Department.findById(id);
        if (!department) {
            return res.status(200).json({
                success: false,
                message: "Department not found",
            });
        }
        department.isActive = !department.isActive;
        const updatedDepartment = await department.save();

        return res.status(200).json({
            success: true,
            department: updatedDepartment,
        });
    } catch (error) {
        console.error("Error updating Department:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
})
// department wise sub-department
exports.departmentWiseSubDepartment = asyncErrorHandler(async (req, res, next) => {
    const departmentId = req.params.id;
    const subDepartments = await SubDepartment.find({ department: departmentId });
    res.status(200).json({
        success: true,
        subDepartments,
    });
})



// sub-department create
exports.createSubDepartment = asyncErrorHandler(async (req, res, next) => {
    const { name, departmentId } = req.body;

    // Check if the sub-department already exists
    const existingSubDepartment = await SubDepartment.findOne({ name: name?.toLowerCase() });
    if (existingSubDepartment) {
        return next(new ErrorHandler('Sub-Department already exists with this name.', 200));
    }

    // Generate sub-department ID
    const generateSubDepartmentId = await SubDepartment.find({}).sort({ createdAt: -1 }).limit(1);

    let subDepartmentId;
    if (generateSubDepartmentId[0]?.subDepartmentId) {
        const lastGeneratedId = (Number(generateSubDepartmentId[0]?.subDepartmentId?.substring(2)) + 1);
        subDepartmentId = `SD${lastGeneratedId}`;
    } else {
        subDepartmentId = 'SD1';
    }

    const subDepartmentData = {
        name: name.toLowerCase(),
        subDepartmentId,
        department: departmentId
    };

    const newSubDepartment = await SubDepartment.create(subDepartmentData);
    if (newSubDepartment?._id) {
        return res.status(201).json({
            success: true,
            message: 'Sub-Department created successfully',
            subDepartment: newSubDepartment,
        });
    } else {
        return next(new ErrorHandler('Failed to create sub-department, please try again', 200));
    }
});
// get all sub-departments
exports.getAllSubDepartments = asyncErrorHandler(async (req, res, next) => {
    const subDepartments = await SubDepartment.find().populate({ path: "department", select: "name" });
    res.status(200).json({
        success: true,
        subDepartments,
    });
});
// get single sub-department
exports.getSingleSubDepartment = asyncErrorHandler(async (req, res, next) => {
    const subDepartment = await SubDepartment.findOne({ _id: req.params.id });
    if (!subDepartment) {
        return next(new ErrorHandler(`Sub-Department not found with ID: ${req.params.id}`, 200));
    }
    res.status(200).json({
        success: true,
        subDepartment,
    });
});
// update sub-department
exports.updateSubDepartment = asyncErrorHandler(async (req, res, next) => {
    const { id, name, departmentId } = req.body;
    const subDepartment = await SubDepartment.findOne({ _id: id });
    if (!subDepartment) {
        return next(new ErrorHandler(`Sub-Department not found with ID: ${id}`, 200));
    }
    subDepartment.name = name;
    subDepartment.department = departmentId;
    await subDepartment.save();
    res.status(200).json({
        success: true,
        message: 'Sub-Department updated successfully',
        subDepartment,
    });
})

exports.updateSubDepartmentStatus = asyncErrorHandler(async (req, res, next) => {
    try {
        const { id } = req.body;
        const department = await SubDepartment.findById(id);
        if (!department) {
            return res.status(200).json({
                success: false,
                message: "Department not found",
            });
        }
        department.isActive = !department.isActive;
        const updatedDepartment = await department.save();

        return res.status(200).json({
            success: true,
            department: updatedDepartment,
        });
    } catch (error) {
        console.error("Error updating Department:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
})





// create department user
exports.createDepartmentUser = asyncErrorHandler(async (req, res, next) => {

    // const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
    //     folder: "avatars",
    //     width: 150,
    //     crop: "scale",
    // });

    const { name, email, mobile, departmentId, subdepartmentId, tabAccess } = req.body;
    let parsedTabAccess = Array.isArray(tabAccess) ? tabAccess : JSON.parse(tabAccess);

    const existingUser = await DepartmentUser.findOne({ mobile });
    if (existingUser) {
        return next(new ErrorHandler('A user with this mobile number already exists.', 200));
    }

    let userId;
    //get all users for userId
    const users = await DepartmentUser.find({}).sort({ createdAt: -1 }).limit(1);
    if (users.length > 0) {
        const lastUserUserId = (Number(users[0]?.userId.substring(4)) + 1);
        userId = `MAHA${lastUserUserId}`
    } else {
        userId = "MAHA1000"
    }
    // Create the Department User (password is the mobile number)
    const departmentUser = await DepartmentUser.create({
        userId,
        name,
        email,
        departmentId,
        subDepartmentId: subdepartmentId,
        password: mobile,
        mobile,
        tabAccess: parsedTabAccess,
        createdBy: req.user._id
    });
    return res.status(201).json({
        success: true,
        message: 'Department user created successfully',
        departmentUser,
    });
});

// department login
exports.departmentUserLogin = asyncErrorHandler(async (req, res, next) => {
    const { userId, password } = req.body;

    if (!userId || !password) {
        return next(new ErrorHandler("Please Enter Email And Password", 200));
    }


    const user = await DepartmentUser.findOne({ userId }).select("+password");

    if (user?.isActive === false) {
        return next(new ErrorHandler("User is not active", 200));
    }
    if (!user) {
        return next(new ErrorHandler("Invalid Email or Password", 200));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid Email or Password", 200));
    }

    sendToken(user, 200, res);
})

exports.getAllDepartmentUsers = asyncErrorHandler(async (req, res, next) => {
    const deptUsers = await DepartmentUser.find();
    res.status(200).json({
        success: true,
        deptUsers,
    });
})

exports.updateDepartmentUsersStatus = asyncErrorHandler(async (req, res, next) => {
    try {
        const { id } = req.body;
        const departmentUser = await DepartmentUser.findById(id);
        if (!departmentUser) {
            return res.status(200).json({
                success: false,
                message: "Department User not found",
            });
        }
        departmentUser.isActive = !departmentUser.isActive;
        const updatedDepartmentUser = await departmentUser.save();
        return res.status(200).json({
            success: true,
            department: updatedDepartmentUser,
        });
    } catch (error) {
        console.error("Error updating Department:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }

})

exports.updateDepartmentUser = asyncErrorHandler(async (req, res, next) => {
    try {

        const { userId, name, email, mobile, departmentId, subdepartmentId, tabAccess } = req.body;

        // Check if the user exists
        const departmentUser = await DepartmentUser.findOne({ _id: userId });

        if (!departmentUser) {
            return next(new ErrorHandler('Department user not found.', 200));
        }

        // Parse the tabAccess array if it's a string
        let parsedTabAccess = Array.isArray(tabAccess) ? tabAccess : JSON.parse(tabAccess);

        // Update user data
        departmentUser.name = name || departmentUser?.name;
        departmentUser.email = email || departmentUser?.email;
        departmentUser.mobile = mobile || departmentUser?.mobile;
        departmentUser.departmentId = departmentId || departmentUser?.departmentId;
        departmentUser.subDepartmentId = subdepartmentId || departmentUser?.subDepartmentId;
        departmentUser.tabAccess = parsedTabAccess || departmentUser?.tabAccess;
        departmentUser.updatedBy = req?.user?._id
        
        // Save the updated user
        await departmentUser.save();

        return res.status(200).json({
            success: true,
            message: 'Department user updated successfully',
            departmentUser,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }

})

exports.getSingleDepartmentUser = asyncErrorHandler(async (req, res, next) => {
    const departmentUser = await DepartmentUser.findOne({ _id: req.params.id })
        .populate([
            { path: "departmentId", select: "name" },
            { path: "subDepartmentId", select: "name" }
        ]);
    if (!departmentUser) {
        return next(new ErrorHandler(`Department user not found with ID: ${req.params.id}`, 200));
    }
    res.status(200).json({
        success: true,
        departmentUser,
    });
})


// coupon
exports.createCoupon = asyncErrorHandler(async (req, res, next) => {
    const { title, code, value, type, price, validity, totalCartAmount, productsAvailableFor, subcategoriesAvailableFor, categoriesAvailableFor } = req.body;

    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
        return next(new ErrorHandler('Coupon with this code already exists.', 200));
    }

    const coupon = await Coupon.create({
        title,
        code,
        value,
        type,
        price,
        validity,
        totalCartAmount,
        productsAvailableFor,
        subcategoriesAvailableFor,
        categoriesAvailableFor,
        createdBy: req.user._id
    });

    return res.status(201).json({
        success: true,
        message: 'Coupon created successfully',
        coupon
    });
});

exports.getAllCoupons = asyncErrorHandler(async (req, res, next) => {
    console.log('here')
    const coupons = await Coupon.find()
    // .populate('productsAvailableFor')
    // .populate('subcategoriesAvailableFor')
    // .populate('categoriesAvailableFor');

    return res.status(200).json({
        success: true,
        coupons
    });
});

exports.getCouponById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const coupon = await Coupon.findById(id)
    // .populate('productsAvailableFor')
    // .populate('subcategoriesAvailableFor')
    // .populate('categoriesAvailableFor');

    if (!coupon) {
        return next(new ErrorHandler('Coupon not found', 200));
    }

    return res.status(200).json({
        success: true,
        coupon
    });
});

// exports.updateCoupon = asyncErrorHandler(async (req, res, next) => {
//     const { id } = req.params;
//     const { title, code, value, type, price, validity, productsAvailableFor, subcategoriesAvailableFor, categoriesAvailableFor } = req.body;

//     const coupon = await Coupon.findById(id);
//     if (!coupon) {
//         return next(new ErrorHandler('Coupon not found', 404));
//     }

//     // Prevent changing the coupon code to a code that already exists
//     if (code && code !== coupon.code) {
//         const existingCoupon = await Coupon.findOne({ code });
//         if (existingCoupon) {
//             return next(new ErrorHandler('Coupon code already exists', 400));
//         }
//     }

//     coupon.title = title || coupon.title;
//     coupon.code = code || coupon.code;
//     coupon.value = value || coupon.value;
//     coupon.type = type || coupon.type;
//     coupon.price = price || coupon.price;
//     coupon.validity = validity || coupon.validity;
//     coupon.productsAvailableFor = productsAvailableFor || coupon.productsAvailableFor;
//     coupon.subcategoriesAvailableFor = subcategoriesAvailableFor || coupon.subcategoriesAvailableFor;
//     coupon.categoriesAvailableFor = categoriesAvailableFor || coupon.categoriesAvailableFor;

//     await coupon.save();

//     return res.status(200).json({
//         success: true,
//         message: 'Coupon updated successfully',
//         coupon
//     });
// });

exports.deleteCoupon = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
        return next(new ErrorHandler('Coupon not found', 200));
    }

    await coupon.remove();

    return res.status(200).json({
        success: true,
        message: 'Coupon deleted successfully'
    });
});

// exports.useCoupon = asyncErrorHandler(async (req, res, next) => {
//     const { couponCode, productIds, subcategoryIds, categoryIds, totalAmount } = req.body;
//     const user = req.user;

//     const coupon = await Coupon.findOne({ code: couponCode })
//         .populate('productsAvailableFor')
//         .populate('subcategoriesAvailableFor')
//         .populate('categoriesAvailableFor');

//     if (!coupon) {
//         return next(new ErrorHandler('Coupon code is invalid', 400));
//     }

//     const currentDate = new Date();
//     if (currentDate < new Date(coupon.validity.from) || currentDate > new Date(coupon.validity.till)) {
//         return next(new ErrorHandler('Coupon has expired or is not yet valid', 400));
//     }

//     const isUsed = coupon.usedCoupons.some((use) => use.user.toString() === user._id.toString());
//     if (isUsed) {
//         return next(new ErrorHandler('You have already used this coupon', 400));
//     }

//     let isValidForProduct = false;
//     let isValidForSubcategory = false;
//     let isValidForCategory = false;

//     if (coupon.productsAvailableFor.length > 0) {
//         isValidForProduct = productIds.some((productId) => coupon.productsAvailableFor.includes(productId));
//     }

//     if (coupon.subcategoriesAvailableFor.length > 0) {
//         isValidForSubcategory = subcategoryIds.some((subcategoryId) => coupon.subcategoriesAvailableFor.includes(subcategoryId));
//     }

//     if (coupon.categoriesAvailableFor.length > 0) {
//         isValidForCategory = categoryIds.some((categoryId) => coupon.categoriesAvailableFor.includes(categoryId));
//     }

//     if (!(isValidForProduct || isValidForSubcategory || isValidForCategory)) {
//         return next(new ErrorHandler('Coupon is not applicable to the selected products, subcategories, or categories', 400));
//     }

//     let discountAmount = 0;

//     if (coupon.type === 'percentage') {
//         discountAmount = (coupon.value / 100) * totalAmount;
//     } else if (coupon.type === 'price') {
//         discountAmount = coupon.price;
//     }

//     discountAmount = Math.min(discountAmount, totalAmount);

//     coupon.usedCoupons.push({ user: user._id });
//     await coupon.save();

//     return res.status(200).json({
//         success: true,
//         message: 'Coupon applied successfully',
//         discountAmount,
//         finalAmount: totalAmount - discountAmount
//     });
// });

exports.useCoupon = asyncErrorHandler(async (req, res, next) => {

    const { couponCode, totalCartAmount } = req.body;
    const user = req.user;
    const coupon = await Coupon.findOne({ code: couponCode });
    if (!coupon) {
        return next(new ErrorHandler('Coupon code is invalid', 200));
    }
    if (totalCartAmount < coupon.totalCartAmount) {
        return next(new ErrorHandler('Minimum cart value not reached', 200));
    }
    const currentDate = new Date();
    if (currentDate < new Date(coupon.validity.from) || currentDate > new Date(coupon.validity.till)) {
        return next(new ErrorHandler('Coupon has expired or is not yet valid', 200));
    }
    const isUsed = coupon.usedCoupons.some((use) => use.user.toString() === user._id.toString());
    if (isUsed) {
        return next(new ErrorHandler('You have already used this coupon', 200));
    }
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
        discountAmount = (coupon.value / 100) * totalCartAmount;
    } else if (coupon.type === 'price') {
        discountAmount = coupon.value;
    }
    discountAmount = Math.min(discountAmount, totalCartAmount);

    // coupon.usedCoupons.push({ user: user._id });
    await coupon.save();
    return res.status(200).json({
        success: true,
        message: 'Coupon applied successfully',
        discountAmount,
        finalAmount: totalCartAmount - discountAmount
    });
})

exports.updateCoupon = asyncErrorHandler(async (req, res, next) => {
    const couponId = req.params.id;
    const { title, code, value, type, totalCartAmount, validity, isActive } = req.body;

    let coupon = await Coupon.findById(couponId);
    if (!coupon) {
        return next(new ErrorHandler('Coupon not found', 200));
    }

    if (coupon.createdBy.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return next(new ErrorHandler('You are not authorized to update this coupon', 200));
    }

    coupon.title = title || coupon.title;
    coupon.code = code || coupon.code;
    coupon.value = value || coupon.value;
    coupon.type = type || coupon.type;
    coupon.totalCartAmount = totalCartAmount || coupon.totalCartAmount;
    coupon.validity = validity || coupon.validity;
    coupon.isActive = isActive !== undefined ? isActive : coupon.isActive;

    await coupon.save();

    return res.status(200).json({
        success: true,
        message: 'Coupon updated successfully',
        coupon
    });
});

exports.updateCouponStatus = asyncErrorHandler(async (req, res, next) => {
    try {
        const { id } = req.body;
        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return res.status(200).json({
                success: false,
                message: "Coupon not found",
            });
        }

        coupon.isActive = !coupon.isActive;

        const updatedCoupon = await coupon.save();

        return res.status(200).json({
            success: true,
            coupon: updatedCoupon,
        });
    } catch (error) {
        console.error("Error updating coupon status:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
})







