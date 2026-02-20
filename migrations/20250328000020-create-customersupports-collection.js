
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

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
  return {
    type: 'live_chat',
    user: user._id,
    users: { value: user._id.toString(), label: user.name || user.email },
    subject: `Chat en direct - ${faker.lorem.words(3)}`,
    description: faker.lorem.paragraphs(1),
    status: faker.helpers.arrayElement(['open', 'resolved', 'closed']),
    priority: faker.helpers.arrayElement(['low', 'medium']),
    created_at: faker.date.recent({ days: 7 }),
    updated_at: faker.date.recent({ days: 1 }),
  };
}

function generateFAQ() {
  const faqCategories = ['orders', 'payments', 'delivery', 'account', 'technical'];
  const questions = {
    orders: ['Comment annuler une commande ?', 'Puis-je modifier ma commande ?', 'Où voir l\'état de ma commande ?'],
    payments: ['Quels moyens de paiement acceptez-vous ?', 'Ma carte a été débitée mais pas la commande', 'Comment obtenir un remboursement ?'],
    delivery: ['Quand sera livrée ma commande ?', 'Puis-je changer l\'adresse de livraison ?', 'Que faire si ma commande est endommagée ?'],
    account: ['Comment changer mon mot de passe ?', 'Comment modifier mes informations ?', 'Comment supprimer mon compte ?'],
    technical: ['L\'application ne fonctionne pas', 'Comment contacter le support ?', 'Problème de connexion']
  };

  const category = faker.helpers.arrayElement(faqCategories);
  const question = faker.helpers.arrayElement(questions[category]);

  const answers = {
    'Comment annuler une commande ?': 'Allez dans "Mes commandes" > sélectionnez la commande > "Annuler". L\'annulation est possible jusqu\'à 30 minutes après validation.',
    'Puis-je modifier ma commande ?': 'Les modifications sont possibles uniquement par téléphone au service client dans les 15 minutes suivant la commande.',
    'Où voir l\'état de ma commande ?': 'Dans l\'onglet "Mes commandes" de l\'application, vous verrez l\'état en temps réel.',
    'Quels moyens de paiement acceptez-vous ?': 'Nous acceptons les cartes bancaires (Visa, Mastercard), PayPal et le paiement à la livraison.',
    'Ma carte a été débitée mais pas la commande': 'Le débit est temporaire. Contactez notre service client pour vérifier le statut de votre commande.',
    'Comment obtenir un remboursement ?': 'Les remboursements sont traités sous 48h ouvrées. Vous serez notifié par email.',
    'Quand sera livrée ma commande ?': 'Le délai de livraison est indiqué lors de la commande. Vous recevrez des notifications en temps réel.',
    'Puis-je changer l\'adresse de livraison ?': 'L\'adresse peut être modifiée jusqu\'à 30 minutes avant l\'heure de livraison prévue.',
    'Que faire si ma commande est endommagée ?': 'Prenez des photos et contactez immédiatement notre service client pour un remboursement.',
    'Comment changer mon mot de passe ?': 'Allez dans "Mon compte" > "Sécurité" > "Changer mot de passe".',
    'Comment modifier mes informations ?': 'Dans "Mon compte" > "Informations personnelles", vous pouvez modifier vos données.',
    'Comment supprimer mon compte ?': 'Contactez notre service client pour la suppression définitive de votre compte.',
    'L\'application ne fonctionne pas': 'Essayez de redémarrer l\'application ou de mettre à jour vers la dernière version.',
    'Comment contacter le support ?': 'Utilisez le chat en direct dans l\'app ou appelez le 01-XX-XX-XX-XX.',
    'Problème de connexion': 'Vérifiez votre connexion internet et essayez de vous reconnecter.'
  };

  return {
    type: 'faq',
    question: question,
    answer: answers[question],
    category: category,
    status: 'published',
    created_at: faker.date.past({ years: 1 }),
    updated_at: faker.date.recent({ days: 30 }),
  };
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

