const User = require("../models/userModel");
const asyncErrorHandler = require("../middlewares/asyncErrorHandler");
const sendToken = require("../utils/sendToken");
const ErrorHandler = require("../utils/errorHandler");
// const sendEmail = require('../utils/sendEmail');
const crypto = require("crypto");
const cloudinary = require("cloudinary");
const Product = require("../models/productModel");
const Testimonial = require("../models/testimonialModel");
const Subscription = require("../models/subscriptionModel");
const contactUs = require("../models/contactUsModel");
const Coupon = require("../models/couponModel");
const sendEmail = require("../utils/sendEmail");
const Otp = require("../models/otpModel");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Register User
// exports.registerUser = asyncErrorHandler(async (req, res, next) => {
//   const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
//     folder: "avatars",
//     width: 150,
//     crop: "scale",
//   });

//   const { name, email, gender, password } = req.body;

//   const user = await User.create({
//     name,
//     email,
//     gender,
//     password,
//     mobile: "",
//     avatar: {
//       public_id: myCloud.public_id,
//       url: myCloud.secure_url,
//     },
//   });

//   sendToken(user, 201, res);
// });

// exports.registerUser = asyncErrorHandler(async (req, res, next) => {
//   console.log("1️⃣ Request Body:", req.body);

//   if (!req.body.avatar) {
//     return next(new ErrorHandler("Avatar image is required", 400));
//   }

//   console.log("2️⃣ Uploading to Cloudinary...");
//   const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
//     folder: "avatars",
//     width: 150,
//     crop: "scale",
//   });
//   console.log("✅ Cloudinary Upload Success:", myCloud);

//   const { name, email, gender, password } = req.body;

//   if (!name || !email || !gender || !password) {
//     return next(new ErrorHandler("All fields are required", 400));
//   }

//   console.log("3️⃣ Creating User...");
//   const user = await User.create({
//     name,
//     email,
//     gender,
//     password,
//     mobile: "",
//     avatar: {
//       public_id: myCloud.public_id,
//       url: myCloud.secure_url,
//     },
//   });
//   console.log("✅ User Created:", user);

//   console.log("4️⃣ Sending Token...");
//   sendToken(user, 201, res);
// });

exports.registerUser = asyncErrorHandler(async (req, res, next) => {
  // Upload document
  await runMiddleware(req, res, upload.single("attachment"));
  // const fileResponse = await runMiddleware(request, response, uploadPdf.single("attachment"));
  // if (fileResponse) {
  //   return response.status(400).json({
  //     status: "FAILED",
  //     message: fileResponse.code
  //   });
  // }

  if (req.fileError) {
    return next(new ErrorHandler(req.fileError.message, 400));
  }

  //extract data from request body
  const data = JSON.parse(request.body.data);
  const { name, email, gender, password } = data;

  // Basic validation of required fields from parsed data
  if (!name || !email || !gender || !password) {
    // Delete the uploaded file if validation fails
    if (req.file) {
      await deleteFile(req.file.path); // Function to delete local file
    }
    return next(new ErrorHandler("Please enter all required fields (name, email, gender, password).", 400));
  }

  let avatar = {
    public_id: "",
    url: "",
  };

  if (req.file) {
    try {
      // Upload to Cloudinary
      const myCloud = await cloudinary.uploader.upload(req.file.path, {
        folder: "avatars", // Your desired folder in Cloudinary
        width: 150,
        crop: "scale",
      });

      avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };

      // After successful upload to Cloudinary, delete the local file
      await deleteFile(req.file.path);
    } catch (uploadError) {
      // Handle Cloudinary upload error
      await deleteFile(req.file.path); // Ensure local file is deleted on upload failure
      return next(new ErrorHandler("Failed to upload avatar.", 500));
    }
  } else {
    // If attachment is required, and no file was uploaded
    return next(new ErrorHandler("Attachment (avatar) is required.", 400));
  }

  const dataToInsert = {
    name,
    email,
    gender,
    password,
    mobile: mobile,
    avatar,
  };

  // Check if user with email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (avatar.public_id) {
      await cloudinary.uploader.destroy(avatar.public_id);
    }
    return next(new ErrorHandler("User with this email already exists.", 409));
  }

  const user = await User.create(dataToInsert);
  console.log("✅ User Created:");
  sendToken(user, 201, res);

});



// Update User Profile
exports.updateProfile = asyncErrorHandler(async (req, res, next) => {
  const { name, email, mobile, gender, avatar } = req.body;
  const newUserData = {};

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorHandler("User not found", 200));
  }

  if (name) newUserData.name = name;
  if (email) {
    const emailExists = await User.findOne({
      email: email,
      _id: { $ne: user._id },
    });
    if (emailExists) {
      return next(new ErrorHandler("Email is already in use", 200));
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

  const { cart, savedForLater, wishlist, ...userWithoutSensitiveData } =
    updatedUser.toObject();

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    user: userWithoutSensitiveData,
  });
});

// Login User
exports.loginUser = asyncErrorHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorHandler("Please Enter Email And Password", 200));
    }

    let user = await User.findOne({ email }).select({ password: +1 });

    if (!user) {
      return next(new ErrorHandler("Invalid Email or Password", 200));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      return next(new ErrorHandler("Invalid Email or Password", 200));
    }

    user = await User.findOne({ email });

    sendToken(user, 200, res);
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Internal error",
      error,
    });
  }
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

// Forgot Password
exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
  const { email, newPassword } = req.body;
  const user = await User.findOne({ email: email });

  if (!user) {
    return next(new ErrorHandler("User Not Found", 200));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
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
      otp: otp,
    };
    await Otp.create(otpRecord);
    // await otpRecord.save();

    res.status(200).json({
      success: true,
      message: `Otp sent to ${email} successfully`,
      otp: otp,
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
    // console.log(otpRecord)

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
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
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

// Get Single User Details --ADMIN
exports.getSingleUser = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User doesn't exist with id: ${req.params.id}`, 200)
    );
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
  };

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
    return next(
      new ErrorHandler(`User doesn't exist with id: ${req.params.id}`, 200)
    );
  }
  await user.remove();

  res.status(200).json({
    success: true,
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
    return next(
      new ErrorHandler(`Product doesn't exist with id: ${productId}`, 200)
    );
  }

  // Check if the product is already in the wishlist
  const isProductInWishlist = user.wishlist.some(
    (item) => item?.productId?.toString() === productId?.toString()
  );
  if (isProductInWishlist) {
    return next(new ErrorHandler(`Product already exists in wishlist`, 200));
  }

  // Ensure that all required fields are present in the productDetails
  if (
    !productDetails.name ||
    !productDetails.description ||
    !productDetails.cuttedPrice ||
    !productDetails.price ||
    !productDetails.brand ||
    !productDetails.brand.name ||
    !productDetails.brand.logo ||
    !productDetails.brand.logo.public_id ||
    !productDetails.brand.logo.url ||
    !productDetails.images ||
    productDetails.images.length === 0
  ) {
    return next(
      new ErrorHandler("Some required product details are missing", 200)
    );
  }

  user.wishlist.push({
    _id: productId,
    name: productDetails.name,
    description: productDetails.description,
    cuttedPrice: productDetails.cuttedPrice,
    price: productDetails.price,
    images: productDetails.images.map((img) => ({
      public_id: img.public_id,
      url: img.url,
    })),
    brand: {
      name: productDetails.brand.name,
      logo: {
        public_id: productDetails.brand.logo.public_id,
        url: productDetails.brand.logo.url,
      },
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
    return next(
      new ErrorHandler(`Product doesn't exist with id: ${productId}`, 200)
    );
  }
  const isProductInWishlist = user.wishlist.some(
    (item) => item?._id?.toString() === productId?.toString()
  );
  if (!isProductInWishlist) {
    return next(new ErrorHandler(`Product is not in the wishlist`, 200));
  }
  user.wishlist = user.wishlist.filter(
    (item) => item?._id.toString() !== productId?.toString()
  );
  await user.save();
  res.status(200).json({
    success: true,
    message: "Product removed from wishlist successfully",
  });
});

// add save for later
exports.addToSaveForLater = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body;
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler(`User doesn't exist with id: ${userId}`, 200));
  }
  const productDetails = await Product.findById(productId);
  if (!productDetails) {
    return next(
      new ErrorHandler(`Product doesn't exist with id: ${productId}`, 200)
    );
  }
  const isProductInSavedForLater = user.savedForLater.some(
    (item) => item?.productId?.toString() === productId?.toString()
  );
  if (isProductInSavedForLater) {
    return next(
      new ErrorHandler(`Product already exists in 'Save for Later' list`, 200)
    );
  }

  if (
    !productDetails.name ||
    !productDetails.description ||
    !productDetails.cuttedPrice ||
    !productDetails.price ||
    !productDetails.brand ||
    !productDetails.brand.name ||
    !productDetails.brand.logo ||
    !productDetails.brand.logo.public_id ||
    !productDetails.brand.logo.url ||
    !productDetails.images ||
    productDetails.images.length === 0
  ) {
    return next(
      new ErrorHandler("Some required product details are missing", 200)
    );
  }

  user.savedForLater.push({
    _id: productId,
    name: productDetails.name,
    description: productDetails.description,
    cuttedPrice: productDetails.cuttedPrice,
    price: productDetails.price,
    images: productDetails.images.map((img) => ({
      public_id: img.public_id,
      url: img.url,
    })),
    brand: {
      name: productDetails.brand.name,
      logo: {
        public_id: productDetails.brand.logo.public_id,
        url: productDetails.brand.logo.url,
      },
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
  const userId = req.user.id;
  const { productId } = req.body;
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler(`User doesn't exist with id: ${userId}`, 200));
  }
  const isProductInSavedForLater = user.savedForLater.some(
    (item) => item?._id?.toString() === productId?.toString()
  );
  if (!isProductInSavedForLater) {
    return next(
      new ErrorHandler(`Product is not in 'Save for Later' list`, 200)
    );
  }
  user.savedForLater = user.savedForLater.filter(
    (item) => item?._id?.toString() !== productId?.toString()
  );
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
    return next(
      new ErrorHandler(`Product not found with ID: ${productId}`, 200)
    );
  }
  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorHandler(`User not found with ID: ${userId}`, 200));
  }
  const existingItem = user.cart.find(
    (item) => item?.productId?.toString() === productId?.toString()
  );

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
      images: productDetails.images.map((img) => ({
        public_id: img.public_id,
        url: img.url,
      })),
      brand: {
        name: productDetails.brand.name,
        logo: {
          public_id: productDetails.brand.logo.public_id,
          url: productDetails.brand.logo.url,
        },
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

  const itemIndex = user.cart.findIndex(
    (item) => item?._id?.toString() === productId?.toString()
  );

  if (itemIndex === -1) {
    return next(new ErrorHandler("Product not found in cart", 200));
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

  const itemIndex = user.cart.findIndex(
    (item) => item._id.toString() === productId.toString()
  );

  if (itemIndex === -1) {
    return next(new ErrorHandler("Product not found in cart", 200));
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

  const user = await User.findById(userId);

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
});

// create testimonials
exports.addTestimonial = asyncErrorHandler(async (req, res, next) => {
  const { customerName, customerEmail, message, rating } = req.body;

  const newTestimonial = new Testimonial({
    customerName,
    customerEmail,
    message,
    rating,
    // productId,
  });

  await newTestimonial.save();

  res.status(201).json({
    success: true,
    message: "Testimonial created successfully",
    testimonial: newTestimonial,
  });
});
// get all testimonials
exports.getAllTestimonials = asyncErrorHandler(async (req, res, next) => {
  const testimonials = await Testimonial.find();
  res.status(200).json({
    success: true,
    testimonials,
  });
});
// delete testimonials
exports.deleteTestimonial = asyncErrorHandler(async (req, res, next) => {
  const testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial) {
    return next(
      new ErrorHandler(`Testimonial not found with ID: ${req.params.id}`, 200)
    );
  }
  await testimonial.remove();
  res.status(200).json({
    success: true,
    message: "Testimonial deleted successfully",
  });
});

// add subscription
exports.createSubscription = asyncErrorHandler(async (req, res, next) => {
  const { customerEmail } = req.body;
  const existingSubscription = await Subscription.findOne({ customerEmail });

  if (existingSubscription) {
    return next(
      new ErrorHandler("Subscription already exists with this email.", 200)
    );
  }
  const newSubscription = await Subscription.create({ customerEmail });

  res.status(201).json({
    success: true,
    message: "Subscription created successfully",
    subscription: newSubscription,
  });
});
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
    message: message ? message : "",
  };

  const result = await contactUs.create(dataToInsert);
  if (result?._id) {
    res.status(201).json({
      success: true,
      message: "Message sent successfully",
    });
  } else {
    res.status(201).json({
      success: false,
      message: "Message not sent",
    });
  }
});

// get contact us
exports.getContactUs = asyncErrorHandler(async (req, res, next) => {
  const contactUsData = await contactUs.find();
  res.status(200).json({
    success: true,
    contactUsData,
  });
});

// coupon
exports.createCoupon = asyncErrorHandler(async (req, res, next) => {
  const {
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
  } = req.body;

  const existingCoupon = await Coupon.findOne({ code });
  if (existingCoupon) {
    return next(new ErrorHandler("Coupon with this code already exists.", 400));
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
    createdBy: req.user._id,
  });

  return res.status(201).json({
    success: true,
    message: "Coupon created successfully",
    coupon,
  });
});

exports.getAllCoupons = asyncErrorHandler(async (req, res, next) => {
  const coupons = await Coupon.find();
  // .populate('productsAvailableFor')
  // .populate('subcategoriesAvailableFor')
  // .populate('categoriesAvailableFor');

  return res.status(200).json({
    success: true,
    coupons,
  });
});

exports.getCouponById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const coupon = await Coupon.findById(id);
  // .populate('productsAvailableFor')
  // .populate('subcategoriesAvailableFor')
  // .populate('categoriesAvailableFor');

  if (!coupon) {
    return next(new ErrorHandler("Coupon not found", 404));
  }

  return res.status(200).json({
    success: true,
    coupon,
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
    return next(new ErrorHandler("Coupon not found", 404));
  }

  await coupon.remove();

  return res.status(200).json({
    success: true,
    message: "Coupon deleted successfully",
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
    return next(new ErrorHandler("Coupon code is invalid", 400));
  }
  if (totalCartAmount < coupon.totalCartAmount) {
    return next(new ErrorHandler("Minimum cart value not reached", 400));
  }
  const currentDate = new Date();
  if (
    currentDate < new Date(coupon.validity.from) ||
    currentDate > new Date(coupon.validity.till)
  ) {
    return next(
      new ErrorHandler("Coupon has expired or is not yet valid", 400)
    );
  }
  const isUsed = coupon.usedCoupons.some(
    (use) => use.user.toString() === user._id.toString()
  );
  if (isUsed) {
    return next(new ErrorHandler("You have already used this coupon", 400));
  }
  let discountAmount = 0;
  if (coupon.type === "percentage") {
    discountAmount = (coupon.value / 100) * totalCartAmount;
  } else if (coupon.type === "price") {
    discountAmount = coupon.value;
  }
  discountAmount = Math.min(discountAmount, totalCartAmount);
  coupon.usedCoupons.push({ user: user._id });
  await coupon.save();
  return res.status(200).json({
    success: true,
    message: "Coupon applied successfully",
    discountAmount,
    finalAmount: totalCartAmount - discountAmount,
  });
});

exports.updateCoupon = asyncErrorHandler(async (req, res, next) => {
  const couponId = req.params.id;
  const { title, code, value, type, totalCartAmount, validity, isActive } =
    req.body;

  let coupon = await Coupon.findById(couponId);
  if (!coupon) {
    return next(new ErrorHandler("Coupon not found", 404));
  }

  if (
    coupon.createdBy.toString() !== req.user._id.toString() &&
    !req.user.isAdmin
  ) {
    return next(
      new ErrorHandler("You are not authorized to update this coupon", 403)
    );
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
    message: "Coupon updated successfully",
    coupon,
  });
});
