
module.exports = {
  async up(db) {
    const ordersCol = db.collection("orders");

    await ordersCol.updateMany(
      {
        status: "pending",
        driver: { $exists: true, $ne: null }
      },
      {
        $set: {
          driver: null,
          updatedAt: new Date()
        }
      }
    );
  },

  async down() {

  }
};
