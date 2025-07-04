var nodemailer = require("nodemailer");

exports.sendMail = async (email, subject, content) => {
    try {
        const transporter = nodemailer.createTransport(
            {
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: "aigcredential@gmail.com",
                    pass: "bqei pxmk unrl hfmw"
                }
            }
        );

        const mailOptions = {
            from: "aigcredential@gmail.com",
            to: email,
            subject: subject,
            html: content
        };
        return new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions)
                .then(() => {
                    resolve(true);
                }).catch((error) => {
                    reject(error);
                })
        });
    } catch (error) {
        console.log("error", error);
        throw error
    }
};