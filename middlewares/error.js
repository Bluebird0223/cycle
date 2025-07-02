const ErrorHandler = require("../utils/errorHandler");

module.exports = (err, req, res, next) => {
    // Default fallback
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // MongoDB ObjectId error
    if (err.name === "CastError") {
        message = `Resource Not Found. Invalid: ${err.path}`;
        statusCode = 400;
    }

    // Duplicate key error
    if (err.code === 11000) {
        message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        statusCode = 400;
    }

    // Invalid JWT
    if (err.name === "JsonWebTokenError") {
        message = 'JWT is invalid';
        statusCode = 400;
    }

    // JWT Expired
    if (err.name === "TokenExpiredError") {
        message = 'JWT has expired';
        statusCode = 401;
    }

    res.status(statusCode).json({
        success: false,
        message: message,
    });
};
