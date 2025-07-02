const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter product name"],
    trim: true,
  },
  shortName: {
    type: String,
    required: [true, "Please enter Short name"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Please enter product description"],
  },
  highlights: [
    {
      type: String,
      required: true,
    },
  ],
  specifications: [
    {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
    },
  ],
  price: {
    type: Number,
    required: [true, "Please enter product price"],
  },
  cuttedPrice: {
    type: Number,
    required: [true, "Please enter cutted price"],
  },
  images: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  brand: {
    name: {
      type: String,
      required: false,
    },
    logo: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: "Category",
    required: true,
  },
  stock: {
    type: Number,
    required: [true, "Please enter product stock"],
    maxlength: [4, "Stock cannot exceed limit"],
    default: 1,
  },
  warranty: {
    type: String,
    default: 1,
  },
  sku: {
    type: String,
    required: true,
  },
  ratings: {
    type: Number,
    default: 0,
  },
  numOfReviews: {
    type: Number,
    default: 0,
  },
  group: {
    type: mongoose.Schema.ObjectId,
    ref: "Group",
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],

  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Product", productSchema);
