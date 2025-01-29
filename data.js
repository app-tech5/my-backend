const transactions = [
    {
      id: '1',
      user: {
        avatar: 'https://cdn.pixabay.com/photo/2013/07/13/12/07/avatar-159236__340.png',
        name: 'John Doe',
      },
      userRole: 'Customer',
      amount: 100.5,
      platformCommission: 10.05,
      restaurantPayout: 80.4,
      deliveryPayout: 10.05,
      type: 'Payment',
      date: new Date(),
      status: 'Completed',
      description: 'Payment for order #12345',
    },
    {
      id: '2',
      user: {
        avatar: 'https://cdn.pixabay.com/photo/2013/07/13/12/07/avatar-159236__340.png',
        name: 'Jane Smith',
      },
      userRole: 'Restaurant',
      amount: 200.75,
      platformCommission: 20.08,
      restaurantPayout: 160.6,
      deliveryPayout: 20.08,
      type: 'Refund',
      date: new Date(),
      status: 'Pending',
      description: 'Refund for order #67890',
    },
    {
      id: '3',
      user: {
        avatar: 'https://cdn.pixabay.com/photo/2013/07/13/12/07/avatar-159236__340.png',
        name: 'Alice Johnson',
      },
      userRole: 'Delivery',
      amount: 150.25,
      platformCommission: 15.03,
      restaurantPayout: 120.2,
      deliveryPayout: 15.03,
      type: 'Payment',
      date: new Date(),
      status: 'Failed',
      description: 'Payment for order #54321',
    },
  ];

  
  module.exports = {
    transactions
  };