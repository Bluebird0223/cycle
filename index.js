const express = require('express');
const cookieParser = require('cookie-parser');
const dotenv = require("dotenv");
const errorMiddleware = require('./middlewares/error');
const morgan = require('morgan')
const cors = require("cors");
const path = require('path');
const cloudinary = require('cloudinary');

// config
dotenv.config();

const PORT = process.env.PORT || 3040;
const app = express();

app.use(cors({ origin: "*" }));
app.use(morgan("dev"))
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

const user = require('./routes/userRoute');
const product = require('./routes/productRoute');
const order = require('./routes/orderRoute');
const payment = require('./routes/paymentRoute');
const connectToDatabase = require('./config/database');

app.use('/api/v1', user);
app.use('/api/v1', product);
app.use('/api/v1', order);
app.use('/api/v1', payment);



connectToDatabase();
app.get('/', (req, res) => {
    res.send('Server is Running! 🚀');
});

// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// deployment
// __dirname = path.resolve();
// if (process.env.NODE_ENV === 'production') {
//     app.use(express.static(path.join(__dirname, '/frontend/build')))

//     app.get('*', (req, res) => {
//         res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'))
//     });
// } else {
//     app.get('/', (req, res) => {
//         res.send('Server is Running! 🚀');
//     });
// }

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
});

