// var nodemailer = require("nodemailer");

// exports.sendMail = async (email, subject, content) => {
//     try {
//         const transporter = nodemailer.createTransport(
//             {
//                 host: 'smtp.gmail.com',
//                 port: 465,
//                 secure: true,
//                 auth: {
//                     user: "aigcredential@gmail.com",
//                     pass: "bqei pxmk unrl hfmw"
//                 }
//             }
//         );

//         const mailOptions = {
//             from: "aigcredential@gmail.com",
//             to: email,
//             subject: subject,
//             html: content
//         };
//         return new Promise((resolve, reject) => {
//             transporter.sendMail(mailOptions)
//                 .then(() => {
//                     resolve(true);
//                 }).catch((error) => {
//                     reject(error);
//                 })
//         });
//     } catch (error) {
//         console.log("error", error);
//         throw error
//     }
// };


var nodemailer = require("nodemailer");
const userModel = require("../models/userModel");

exports.sendMail = async (order) => {
    try {
        const userDetails = await userModel.findById(order?.user);
        if (!userDetails) {
            throw new Error("User not found");
        }

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: "aigcredential@gmail.com",
                pass: "bqei pxmk unrl hfmw"
            }
        });

        const mailOptions = {
            from: "aigcredential@gmail.com",
            to: userDetails.email,
            subject: "Order Confirmation",
            text: `Dear Customer,
        
            Your order with Payment ID ${order?.paymentInfo?.id} has been confirmed!
            
            Shipping Information:
            Address: ${order?.shippingInfo?.address}, ${order?.shippingInfo?.city}, ${order?.shippingInfo?.state}, ${order?.shippingInfo?.pincode}
            Contact Number: ${order?.shippingInfo?.phoneNo}
            
            Thank you for shopping with us!`
        };

        return transporter.sendMail(mailOptions);
    } catch (error) {
        console.log("error", error);
        throw error;
    }
};
