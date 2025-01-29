const express = require('express');
const mongoose = require('./config/db');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');

const app = express();
app.use(express.json());
app.use(cors());  // Pour autoriser les requêtes du frontend

app.use('/api/users', userRoutes); // API des utilisateurs

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur en écoute sur le port ${PORT}`));
