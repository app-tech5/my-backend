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
const https = require('https');
dotenv.config();
connectDB();
const app = express();
app.use(i18n.init);

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

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

  socket.on('joinOrderTrackingRoom', (orderId) => {
     
    socket.join(`order-${orderId}`);
  });
  
  socket.on('leaveOrderTrackingRoom', (orderId) => {
    if (!orderId) return;
    socket.leave(`order-${orderId}`);
  });
});

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
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
app.use("/api/upload", uploadRoutes);
app.use("/api/uploads", express.static("uploads"));
app.use('/api', cleanupRouter);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.info(`Server running on port ${PORT}`);
});
