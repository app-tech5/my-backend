// migrations/XXXXXX-generate-mock-customer-supports.js

const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

// Déplacer les fonctions helper en haut du fichier et les rendre dépendantes des paramètres
function generateTicket(user, existingUsers, existingOrders) {
  const status = faker.helpers.arrayElement(['open', 'in_progress', 'resolved', 'closed']);
  const hasOrder = faker.datatype.boolean({ probability: 0.6 });
  
  const ticket = {
    type: 'ticket',
    user: user._id,
    users: { value: user._id.toString(), label: user.name || user.email },
    subject: faker.lorem.sentence(),
    description: faker.lorem.paragraphs(2),
    status,
    priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
    created_at: faker.date.past({ years: 1 }),
    updated_at: faker.date.recent({ days: 30 }),
  };

  if (hasOrder && existingOrders.length > 0) {
    ticket.order = faker.helpers.arrayElement(existingOrders)._id;
  }

  if (status === 'resolved' || status === 'closed') {
    ticket.resolved_at = faker.date.recent({ days: 15 });
  }

  if (faker.datatype.boolean({ probability: 0.7 }) && existingUsers.length > 0) {
    ticket.assigned_to = faker.helpers.arrayElement(existingUsers)._id;
  }

  return ticket;
}

function generateLiveChat(user) {
  // ... (le reste de la fonction reste inchangé)
}

function generateFAQ() {
  // ... (le reste de la fonction reste inchangé)
}

module.exports = {
  async up(db) {
    try {
      await db.collection("customersupports").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    const existingUsers = await db.collection('users')
      .find({})
      .project({ _id: 1, name: 1, email: 1 })
      .toArray();

    if (existingUsers.length === 0) {
      throw new Error('Aucun utilisateur trouvé dans la base de données');
    }

    const existingOrders = await db.collection('orders')
      .find({})
      .project({ _id: 1 })
      .toArray();

    const mockSupports = [];

    for (let i = 0; i < 15; i++) {
      const user = faker.helpers.arrayElement(existingUsers);
      mockSupports.push(generateTicket(user, existingUsers, existingOrders));
    }

    for (let i = 0; i < 9; i++) {
      const user = faker.helpers.arrayElement(existingUsers);
      mockSupports.push(generateLiveChat(user));
    }

    for (let i = 0; i < 6; i++) {
      mockSupports.push(generateFAQ());
    }

    await db.collection('customersupports').insertMany(mockSupports);
  },

  async down(db) {
    await db.collection('customersupports').deleteMany({
      created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};

// const { default: mongoose } = require("mongoose");

// // migrations/YYYYMMDDHHMMSS-create-customer-support.js
// module.exports = {
//   async up(db, client) {
//     // 1. Création de la collection avec des données initiales (comme pour vos restaurants)
//     await db.collection('customersupports').insertMany([
//       {
//         status: 'open',
//         priority: 'medium',
//         type: 'ticket',
//         user: new mongoose.Types.ObjectId(), // Remplacez par un vrai ID utilisateur
//         subject: 'Problème de livraison',
//         description: 'Ma commande est en retard',
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         messages: [
//           {
//             sender: 'user',
//             content: 'Bonjour, ma commande #1234 devrait être arrivée à 19h...',
//             timestamp: new Date(),
//           }
//         ]
//       },
//       {
//         status: 'resolved',
//         type: 'faq',
//         question: 'Comment annuler une commande ?',
//         answer: 'Allez dans "Mes commandes" > "Détails" > "Annuler"',
//         category: 'orders',
//         createdAt: new Date()
//       }
//     ]);

//     // 2. Création des index (optionnel, comme dans votre exemple restaurants)
//     await db.collection('customersupports').createIndex({ status: 1 });
//     await db.collection('customersupports').createIndex({ createdAt: -1 });
//   },

//   async down(db, client) {
//     await db.collection('customersupports').drop();
//   }
// };