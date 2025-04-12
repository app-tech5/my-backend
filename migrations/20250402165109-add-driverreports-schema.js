// migrations/XXXXXX-generate-mock-driver-reports.js

const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

module.exports = {
  async up(db) {
    try {
      await db.collection("driverreports").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    // Récupérer les entités existantes
    const [users, drivers, orders] = await Promise.all([
      db.collection('users').find({}).project({ _id: 1 }).toArray(),
      db.collection('drivers').find({}).project({ _id: 1 }).toArray(),
      db.collection('orders').find({}).project({ _id: 1 }).toArray()
    ]);

    // if (users.length === 0 || drivers.length === 0) {
    //   throw new Error('Users et Drivers doivent exister dans la base de données');
    // }
    if (users.length === 0 || drivers.length === 0 || orders.length === 0){
      return
    }

    // Types de signalements disponibles
    const reportTypes = [
      'late_delivery',
      'rude_behavior',
      'unprofessional',
      'wrong_order',
      'safety_concern',
      'driving_issues',
      'other'
    ];

    // Niveaux de sévérité
    const severities = ['low', 'medium', 'high', 'critical'];

    // Statuts possibles
    const statuses = ['pending', 'under_review', 'resolved', 'dismissed', 'requires_action'];

    // Résolutions possibles
    const resolutions = ['warning_issued', 'driver_suspended', 'driver_terminated', 'compensation_issued', 'no_action'];

    // Générer des signalements fictifs
    const mockReports = Array.from({ length: 50 }, (_, i) => {
      const reportType = faker.helpers.arrayElement(reportTypes);
      const status = faker.helpers.arrayElement(statuses);
      const isResolved = status === 'resolved';
      const hasOrder = faker.datatype.boolean({ probability: 0.7 });

      return {
        reportType,
        description: faker.lorem.paragraphs(2),
        severity: faker.helpers.arrayElement(severities),
        reporter: faker.helpers.arrayElement(users)._id,
        driver: faker.helpers.arrayElement(drivers)._id,
        order: hasOrder ? faker.helpers.arrayElement(orders)?._id : null,
        images: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => 
          faker.image.urlLoremFlickr({ category: 'street' })
        ),
        videos: Array.from({ length: faker.number.int({ min: 0, max: 1 }) }, () => 
          'https://example.com/video/' + faker.string.uuid()
        ),
        status,
        adminNotes: faker.datatype.boolean({ probability: 0.4 }) ? [{
          note: faker.lorem.sentence(),
          admin: faker.helpers.arrayElement(users)._id,
          createdAt: faker.date.recent()
        }] : [],
        resolution: isResolved ? faker.helpers.arrayElement(resolutions) : null,
        resolutionDetails: isResolved ? faker.lorem.paragraph() : null,
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent(),
        resolvedAt: isResolved ? faker.date.recent() : null
      };
    });

    // Insérer les signalements
    await db.collection('driverreports').insertMany(mockReports);
  },

  async down(db) {
    // Supprimer uniquement les signalements récemment créés
    await db.collection('driverreports').deleteMany({
      createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) }
    });
  }
};