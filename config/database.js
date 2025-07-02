const mongoose = require('mongoose');
const dotenv = require("dotenv")
dotenv.config()

const MONGO_URI = process.env.MONGO_URI

const connectToDatabase = async () => {
    try {
        // Check if DB_URL is defined
        await mongoose.connect(MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('Connected to the database 🎁🎁');
    } catch (error) {
        console.error('Error connecting to the database 😭:', error.message);
        process.exit(1); // Exit the application if unable to connect to the database
    }
};

module.exports = connectToDatabase;