const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please Enter Your Name"],
    },
    email: {
        type: String,
        required: [true, "Please Enter Your Email"],
        unique: true,
    },
    gender: {
        type: String,
        required: [true, "Please Enter Gender"]
    },
    password: {
        type: String,
        required: [true, "Please Enter Your Password"],
        minLength: [8, "Password should have atleast 8 chars"],
        select: false,
    },
    mobile: {
        type: String,
        required: false,
        default: ""
    },
    avatar: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        }
    },
    wishlist: [
        {
            name: {
                type: String,
                required: false,
            },
            description: {
                type: String,
                required: false,
            },
            cuttedPrice: {
                type: Number,
                required: false,
            },
            images: [
                {
                    public_id: {
                        type: String,
                        required: false,
                    },
                    url: {
                        type: String,
                        required: false,
                    }
                }
            ],
            brand: {
                name: {
                    type: String,
                    required: false,
                },
                logo: {
                    public_id: {
                        type: String,
                        required: false,
                    },
                    url: {
                        type: String,
                        required: false,
                    }
                }
            },
            ratings: {
                type: Number,
                default: 0,
            },
            reviews: [
                {
                    userId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User',
                    },
                    name: {
                        type: String,
                        required: false,
                    },
                    rating: {
                        type: Number,
                        required: false,
                    },
                    comment: {
                        type: String,
                        required: false,
                    }
                }
            ],
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
                min: 1,
            },
            price: {
                type: Number,
                required: false,
            },
            _id: 0
        },
    ],
    savedForLater: [
        {
            name: {
                type: String,
                required: false,
            },
            description: {
                type: String,
                required: false,
            },
            cuttedPrice: {
                type: Number,
                required: false,
            },
            images: [
                {
                    public_id: {
                        type: String,
                        required: false,
                    },
                    url: {
                        type: String,
                        required: false,
                    }
                }
            ],
            brand: {
                name: {
                    type: String,
                    required: false,
                },
                logo: {
                    public_id: {
                        type: String,
                        required: false,
                    },
                    url: {
                        type: String,
                        required: false,
                    }
                }
            },
            ratings: {
                type: Number,
                default: 0,
            },
            reviews: [
                {
                    userId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User',
                    },
                    name: {
                        type: String,
                        required: false,
                    },
                    rating: {
                        type: Number,
                        required: false,
                    },
                    comment: {
                        type: String,
                        required: false,
                    }
                }
            ],
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
                min: 1,
            },
            price: {
                type: Number,
                required: false,
            },
            _id: 0
        },
    ],
    cart: [
        {
            name: {
                type: String,
                required: false,
            },
            description: {
                type: String,
                required: false,
            },
            cuttedPrice: {
                type: Number,
                required: false,
            },
            images: [
                {
                    public_id: {
                        type: String,
                        required: false,
                    },
                    url: {
                        type: String,
                        required: false,
                    }
                }
            ],
            brand: {
                name: {
                    type: String,
                    required: false,
                },
                logo: {
                    public_id: {
                        type: String,
                        required: false,
                    },
                    url: {
                        type: String,
                        required: false,
                    }
                }
            },
            ratings: {
                type: Number,
                default: 0,
            },
            reviews: [
                {
                    userId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User',
                    },
                    name: {
                        type: String,
                        required: false,
                    },
                    rating: {
                        type: Number,
                        required: false,
                    },
                    comment: {
                        type: String,
                        required: false,
                    },
                }
            ],
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
                min: 1,
            },
            price: {
                type: Number,
                required: false,
            },
            _id: 0
        },
    ],
    role: {
        type: String,
        default: "user",
    },
    isActive: {
        type: Boolean,
        default: true

    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
});

userSchema.pre("save", async function (next) {

    if (!this.isModified("password")) {
        next();
    }

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
}

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

userSchema.methods.getResetPasswordToken = async function () {

    // generate token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // generate hash token and add to db
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    return resetToken;
}

module.exports = mongoose.model('User', userSchema);