const { default: mongoose } = require("mongoose");

// migrations/YYYYMMDDHHMMSS-create-customer-support.js
module.exports = {
  async up(db, client) {
    // 1. Création de la collection avec des données initiales (comme pour vos restaurants)
    await db.collection('customersupports').insertMany([
      {
        status: 'open',
        priority: 'medium',
        type: 'ticket',
        user: new mongoose.Types.ObjectId(), // Remplacez par un vrai ID utilisateur
        subject: 'Problème de livraison',
        description: 'Ma commande est en retard',
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [
          {
            sender: 'user',
            content: 'Bonjour, ma commande #1234 devrait être arrivée à 19h...',
            timestamp: new Date(),
          }
        ]
      },
      {
        status: 'resolved',
        type: 'faq',
        question: 'Comment annuler une commande ?',
        answer: 'Allez dans "Mes commandes" > "Détails" > "Annuler"',
        category: 'orders',
        createdAt: new Date()
      }
    ]);

    // 2. Création des index (optionnel, comme dans votre exemple restaurants)
    await db.collection('customersupports').createIndex({ status: 1 });
    await db.collection('customersupports').createIndex({ createdAt: -1 });
  },

  async down(db, client) {
    await db.collection('customersupports').drop();
  }
};