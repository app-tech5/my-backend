module.exports = {
  async up(db) {
    // 1. Créer la collection 'notification_setting' (sera automatique avec insertOne)
    // 2. Insérer les configurations de notification par défaut pour différents acteurs
    await db.collection('notificationsettings').insertMany([
      {
        userType: "admin",
        channels: {
          email: {
            enabled: true,
            types: {
              newOrder: true,
              systemAlert: true,
              dailyReport: true
            }
          },
          push: {
            enabled: true,
            types: {
              urgentIssue: true
            }
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userType: "restaurant",
        channels: {
          email: {
            enabled: true,
            types: {
              newOrder: true,
              orderCancellation: true,
              weeklyReport: true
            }
          },
          push: {
            enabled: true,
            types: {
              newOrder: true,
              preparationReminder: true
            }
          },
          sms: {
            enabled: false,
            types: {
              urgentOrder: false
            }
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userType: "driver",
        channels: {
          email: {
            enabled: false,
            types: {
              newAssignment: false
            }
          },
          push: {
            enabled: true,
            types: {
              newOrder: true,
              navigationUpdate: true
            }
          },
          sms: {
            enabled: true,
            types: {
              urgentOrder: true
            }
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userType: "customer",
        channels: {
          email: {
            enabled: true,
            types: {
              orderConfirmation: true,
              deliveryUpdate: true,
              promotions: true
            }
          },
          push: {
            enabled: true,
            types: {
              orderStatus: true,
              nearbyDeals: false
            }
          }
        },
        preferences: {
          quietHours: {
            enabled: true,
            start: "22:00",
            end: "08:00"
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

   
  },

  async down(db) {
    // Rollback : supprimer la collection et ses index
    await db.collection('notificationsettings').drop();
  }
};