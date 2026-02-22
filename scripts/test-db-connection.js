const mongoose = require('mongoose');
const i18n = require('../src/config/i18n');
require('dotenv').config();

function buildMongoURL() {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }
  const host = process.env.MONGODB_HOST || '127.0.0.1';
  const port = process.env.MONGODB_PORT || '27017';
  const database = process.env.MONGODB_DATABASE || 'good-foods';
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;
  let url = 'mongodb://';
  if (username && password) {
    url += `${username}:${password}@`;
  }
  url += `${host}:${port}/${database}`;
  return url;
}

async function testConnection() {
  const mongoURL = buildMongoURL();
  try {
    await mongoose.connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    await mongoose.connection.db.admin().ping();
    console.info(i18n.__('mongodb_connection_successful'));
  } catch (error) {
    console.error(i18n.__('mongodb_connection_error'), error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

testConnection().catch(console.error);
