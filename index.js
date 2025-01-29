const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const {transactions} = require('./data')

const app = express();
const port = 3002;

// Initialisation de Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json'); // Assurez-vous que ce fichier existe
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());

// Données exemple pour la collection "transactions"

// Fonction pour peupler la collection "transactions"
async function populateTransactions() {
  try {
    const db = admin.firestore();
    for (const transaction of transactions) {
      await db.collection('transactions').doc(transaction.id).set(transaction);
      console.log(`Transaction ${transaction.id} added successfully.`);
    }
    console.log('All transactions added successfully.');
  } catch (error) {
    console.error('Error adding transactions: ', error);
  }
}

// Endpoint pour peupler la collection "transactions"
app.post('/populate-transactions', async (req, res) => {
  try {
    await populateTransactions();
    res.status(200).send('Transactions added successfully.');
  } catch (error) {
    res.status(500).send('Error adding transactions: ' + error.message);
  }
});

// Endpoint pour récupérer les données depuis Firebase
app.get('/data', async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('restaurants').get();
    const elements = snapshot.docs.map((doc) => doc.data());
    res.json(elements);
  } catch (error) {
    res.status(500).send(error);
  }
});


const db = admin.firestore();
const usersCol = db.collection("users");

// Endpoint pour mettre à jour les documents
app.get("/update-missing-createdAt", async (req, res) => {
  try {
    // Récupérer tous les documents dans la collection
    const snapshot = await usersCol.get();

    const batch = db.batch(); // Utilisation d'un batch pour les mises à jour

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.createdAt) {
        // Si le champ `createdAt` est manquant, on l'ajoute avec la date actuelle
        batch.update(doc.ref, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
      }
    });

    // Exécuter les mises à jour en lot
    await batch.commit();
    res.send("Mise à jour des documents terminée avec succès !");
  } catch (error) {
    console.error("Erreur lors de la mise à jour :", error);
    res.status(500).send("Erreur lors de la mise à jour des documents.");
  }
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});