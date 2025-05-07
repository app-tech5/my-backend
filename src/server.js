const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const languageRoutes = require('./routes/languageRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const currencyRoutes = require('./routes/currencyRoutes');
const uploadRoutes = require("./routes/uploadRoutes");
const http = require('http');
const cleanupRouter = require('./routes/cleanup');

const { Server } = require('socket.io');

const i18n = require('./config/i18n');
const { handleSettingsChange } = require('./controllers/settingsController');
const authMiddleware = require('./middleware/authMiddleware');
const genericRoutes = require("./routes/genericRoutes");

// SSL
const fs = require('fs');
const https = require('https');




dotenv.config();
connectDB();

const app = express();
app.use(i18n.init);

// app.use((req, res, next) => {
//     console.log("Langue active :", req.getLocale());
//     next();
// });

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// handleSettingsChange(io);

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes); 

// Appliquer `authMiddleware` à toutes les routes API
app.use("/api", authMiddleware);

app.use('/api/users', userRoutes);
// app.use('/api/languages', languageRoutes);
// app.use('/api/settings', settingsRoutes);
// app.use('/api/currencies', currencyRoutes);
app.use("/api/resource", genericRoutes);
app.use("/api/upload", uploadRoutes);

// 📌 Servir les images stockées
app.use("/api/uploads", express.static("uploads"));

app.use('/api', cleanupRouter);


// const options = {
//     key: fs.readFileSync('/etc/letsencrypt/live/good-foods.digitaldienste.fr/privkey.pem'),
//     cert: fs.readFileSync('/etc/letsencrypt/live/good-foods.digitaldienste.fr/fullchain.pem')
//   };
  
// const PORT = process.env.PORT || 443;
// https.createServer(options, app).listen(PORT, () => {
// console.log(`Serveur démarré sur le port ${PORT}`);
// });


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
