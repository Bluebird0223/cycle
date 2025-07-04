const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const ErrorHandler = require('../utils/errorHandler');
const asyncErrorHandler = require('./asyncErrorHandler');
const DepartmentUser = require('../models/departmentUserModel');

exports.isAuthenticatedUser = asyncErrorHandler(async (req, res, next) => {

    // if(authHeader){
    // }
    // const { token } = req.cookies;
    // console.log(token)
    const authHeader = req.header('authorization')
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return next(new ErrorHandler("Please Login to Access", 200))
    }
    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        // console.log(decodedData)

        const user = await User.findById(decodedData.id);
        const deptUser = await DepartmentUser.findById(decodedData.id);

        if (user) {
            req.user = user;
        }

        if (deptUser) {
            req.deptUser = deptUser;
        }

        next();
    } catch (error) {
        return next(new ErrorHandler("Invalid Token or Token Expired", 401));
    }
});

exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        const deptUserRole = req.deptUser?.role;
        // console.log(userRole,deptUserRole)

        // if (!roles.includes(req.user.role)) {
        //     return next(new ErrorHandler(`Role: ${req.user.role} is not allowed`, 200));
        // }
        // if (!roles.includes(req.deptUser.role)) {
        //     return next(new ErrorHandler(`Role: ${req.deptUser.role} is not allowed`, 200));
        // }
        
        if (userRole && !roles.includes(userRole)) {
            return next(new ErrorHandler(`Role: ${userRole} is not allowed`, 403)); // Forbidden if role doesn't match
        }
        if (deptUserRole && !roles.includes(deptUserRole)) {
            return next(new ErrorHandler(`Role: ${deptUserRole} is not allowed`, 403)); // Forbidden if role doesn't match
        }
        next();
    }
}