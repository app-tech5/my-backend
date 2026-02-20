const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/good-foods', {

        });
    } catch (error) {
        console.error('Erreur de connexion MongoDB:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
