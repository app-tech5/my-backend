/**
 * Retire le driver des commandes `pending` mal seedées (faker :
 * driver assigné alors que la commande n'a pas encore été acceptée).
 */

module.exports = {
  async up(db) {
    const ordersCol = db.collection("orders");

    await ordersCol.updateMany(
      {
        status: "pending",
        driver: { $exists: true, $ne: null },
      },
      {
        $set: {
          driver: null,
          updatedAt: new Date(),
        },
      }
    );
  },

  async down() {
    // Assignations d'origine non récupérables de façon déterministe.
  },
};
