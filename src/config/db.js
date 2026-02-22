const mongoose = require('mongoose');
const i18n = require('./i18n');
require('dotenv').config();

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error(i18n.__('mongo_uri_required'));
        }
        await mongoose.connect(process.env.MONGO_URI);
    } catch (error) {
        console.error(i18n.__('mongodb_connection_error'), error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
