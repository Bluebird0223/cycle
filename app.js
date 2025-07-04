const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const dotenv = require("dotenv");
const errorMiddleware = require('./middlewares/error');
const morgan=require('morgan')
const cors = require("cors");
const app = express();

// config
dotenv.config();
// if (process.env.NODE_ENV !== 'production') {
//     require('dotenv').config({ path: 'backend/config/config.env' });
// }

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "*" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(morgan("dev"))

const user = require('./routes/userRoute');
const product = require('./routes/productRoute');
const order = require('./routes/orderRoute');
const payment = require('./routes/paymentRoute');

app.use('/api/v1', user);
app.use('/api/v1', product);
app.use('/api/v1', order);
app.use('/api/v1', payment);

// error middleware
app.use(errorMiddleware);

module.exports = app;