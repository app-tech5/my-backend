module.exports = {
  async up(db, client) {
    await db.collection('categories').insertMany([
      {
        image: 'https://cdn.pixabay.com/photo/2018/07/18/06/36/egg-net-3545650_960_720.jpg',
        name: 'Fast Food',
      },
      {
        image: 'https://cdn.pixabay.com/photo/2019/11/19/20/40/wine-4638457_960_720.jpg',
        name: 'Italian',
      },
      {
        image: 'https://cdn.pixabay.com/photo/2018/07/18/06/36/egg-net-3545650_960_720.jpg',
        name: 'Desserts',
      }
    ]);
  },

  async down(db, client) {
    await db.collection('categories').deleteMany({
      name: { $in: ['Fast Food', 'Italian', 'Desserts'] }
    });
  }
};
