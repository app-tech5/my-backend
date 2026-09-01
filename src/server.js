const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const driverRoutes = require('./routes/driverRoutes');
const cartRoutes = require('./routes/cartRoutes');
const languageRoutes = require('./routes/languageRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const currencyRoutes = require('./routes/currencyRoutes');
const uploadRoutes = require("./routes/uploadRoutes");
const productRoutes = require("./routes/productRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const userSettingsRoutes = require("./routes/userSettingsRoutes");
const http = require('http');
const cleanupRouter = require('./routes/cleanup');
const { Server } = require('socket.io');
const i18n = require('./config/i18n');
const { handleSettingsChange } = require('./controllers/settingsController');
const authMiddleware = require('./middleware/authMiddleware');
const genericRoutes = require("./routes/genericRoutes");
const stripePaymentRoutes = require("./routes/stripePaymentRoutes");
const fs = require('fs');
const path = require('path');
const https = require('https');
dotenv.config();
connectDB();
const app = express();
app.use(i18n.init);

const corsOrigins = process.env.CORS_ORIGINS ?
process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()) :
['http://localhost:3000'];

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    credentials: true
  }
});

global.io = io;

io.on('connection', (socket) => {

  socket.on('joinOrderRoom', (userId) => {

    socket.join(`orders-${userId}`);
  });

  socket.on('joinUserRoom', (userId) => {
    socket.join(`user-${userId}`);
  });

  socket.on('joinRestaurantRoom', (restaurantId) => {
    socket.join(`restaurant-${restaurantId}`);
  });

  socket.on('joinRestaurantsRoom', () => {
    socket.join('restaurants');
  });

  socket.on('joinOrderTrackingRoom', (orderId) => {

    socket.join(`order-${orderId}`);
  });

  socket.on('leaveOrderTrackingRoom', (orderId) => {
    if (!orderId) return;
    socket.leave(`order-${orderId}`);
  });

  socket.on('joinOrderChatRoom', (orderId) => {
    if (!orderId) return;
    socket.join(`order-chat-${orderId}`);
  });

  socket.on('leaveOrderChatRoom', (orderId) => {
    if (!orderId) return;
    socket.leave(`order-chat-${orderId}`);
  });
});

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/public", (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}, express.static(path.join(__dirname, "../public")));

app.use("/api/uploads", (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}, express.static(path.join(__dirname, "../uploads")));

const { publicRouter: channelPublicRoutes, protectedRouter: channelProtectedRoutes } = require("./routes/channelRoutes");
const marketingRoutes = require("./routes/marketingRoutes");
app.use("/api/marketing", marketingRoutes);
app.use("/api/channels", channelPublicRoutes);
app.use("/api", authMiddleware);
app.use('/api/settings', settingsRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/languages', languageRoutes);
app.use("/api/products", productRoutes);
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/user-settings", userSettingsRoutes);
app.use("/api/resource", genericRoutes);
app.use("/api/payments", stripePaymentRoutes);
const stripeConnectRoutes = require("./routes/stripeConnectRoutes");
app.use("/api/connect", stripeConnectRoutes);
app.use("/api/upload", uploadRoutes);
const orderChatRoutes = require("./routes/orderChatRoutes");
app.use("/api/orders/:orderId/chat", orderChatRoutes);
const subscriptionRoutes = require("./routes/subscriptionRoutes");
app.use("/api/subscriptions", subscriptionRoutes);
const intelligenceRoutes = require("./routes/intelligenceRoutes");
app.use("/api/intelligence", intelligenceRoutes);
const logisticsRoutes = require("./routes/logisticsRoutes");
app.use("/api/logistics", logisticsRoutes);
const sponsoredListingRoutes = require("./routes/sponsoredListingRoutes");
app.use("/api/sponsored", sponsoredListingRoutes);
const paymentGatewayRoutes = require("./routes/paymentGatewayRoutes");
app.use("/api/gateways", paymentGatewayRoutes);
app.use("/api/channels", channelProtectedRoutes);
app.use('/api', cleanupRouter);
const startCleanupCron = require('./jobs/cleanupCron');
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.info(`Server running on port ${PORT}`);
  startCleanupCron();
});
