
module.exports = {
  async up(db) {
    try {
      await db.collection("categories").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
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
        name: 'Sushi', 
        image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=400&fit=crop' 
      },
      { 
        name: 'Pasta', 
        image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&h=400&fit=crop' 
      },
      { 
        name: 'Salade', 
        image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=400&fit=crop' 
      },
      { 
        name: 'Dessert', 
        image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop' 
      },
      { 
        name: 'Boissons', 
        image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop' 
      },
      { 
        name: 'Asiatique', 
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop' 
      },
      { 
        name: 'Mexicain', 
        image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&h=400&fit=crop' 
      },
      { 
        name: 'Végétarien', 
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop' 
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
        'Pizza', 'Burger', 'Sushi', 'Pasta', 'Salade', 
        'Dessert', 'Boissons', 'Asiatique', 'Mexicain', 'Végétarien'
      ]}
    });
  }
};

