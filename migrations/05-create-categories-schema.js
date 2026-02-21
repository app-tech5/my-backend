module.exports = {
  async up(db) {
    try {
      await db.collection("categories").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }

    // Basic food categories
    const categories = [
      {
        name: 'Pizza',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop'
      },
      {
        name: 'Burger',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop'
      },
      {
        name: 'Pasta',
        image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&h=400&fit=crop'
      },
      {
        name: 'Salad',
        image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=400&fit=crop'
      },
      {
        name: 'Dessert',
        image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop'
      }
    ];

    await db.collection('categories').insertMany(
      categories.map(cat => ({
        ...cat,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    );
  },
  async down(db) {
    await db.collection('categories').deleteMany({
      name: { $in: [
        'Pizza', 'Burger', 'Pasta', 'Salad', 'Dessert'
      ]}
    });
  }
};
