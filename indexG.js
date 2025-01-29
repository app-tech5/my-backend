const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const port = 3002;

// Initialisation de Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(cors());

// Endpoint pour récupérer les données depuis Firebase
app.get('/data', async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('restaurants').get();
    const elements = snapshot.docs.map(doc => doc.data());
    res.json(elements);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});