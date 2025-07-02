const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter or select bunch name"],
      trim: true,
      unique: true,
    },
    products: {
      type: [
        {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
          required: false,
        },
      ],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Group", groupSchema);
