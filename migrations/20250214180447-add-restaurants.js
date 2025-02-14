module.exports = {
  async up(db, client) {
    const restaurants = [
      {
        distance: 1200,
        rating: 4.3,
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
        review_count: 250,
        transactions: ["pickup", "delivery"],
        url: "https://www.goldenbowlnyc.com",
        display_phone: "+1 212-555-6789",
        phone: "+12125556789",
        price: "$$",
        name: "Golden Bowl",
        alias: "golden-bowl-nyc",
        location: {
          country: "USA",
          city: "New York",
          address1: "123 Main Street",
          display_address: ["123 Main Street", "New York, NY 10001", "USA"],
          state: "NY",
          zip_code: "10001",
        },
        id: "golden-bowl-nyc",
        categories: [
          {
            alias: "asian",
            title: "Asian",
          },
          {
            alias: "noodles",
            title: "Noodles",
          },
        ],
        is_closed: false,
        image_url: "https://tse4.mm.bing.net/th?id=OIP.c2nqN8OX-m5j7NYbg7eHrQHaFj&w=355&h=355&c=7",
      },
      {
        distance: 800,
        rating: 4.6,
        coordinates: {
          latitude: 34.0522,
          longitude: -118.2437,
        },
        review_count: 180,
        transactions: ["pickup"],
        url: "https://www.sunnysidegrill.com",
        display_phone: "+1 323-555-4321",
        phone: "+13235554321",
        price: "$$$",
        name: "SunnySide Grill",
        alias: "sunnyside-grill-la",
        location: {
          country: "USA",
          city: "Los Angeles",
          address1: "456 Sunset Boulevard",
          display_address: ["456 Sunset Boulevard", "Los Angeles, CA 90028", "USA"],
          state: "CA",
          zip_code: "90028",
        },
        id: "sunnyside-grill-la",
        categories: [
          {
            alias: "american",
            title: "American",
          },
          {
            alias: "bbq",
            title: "BBQ",
          },
        ],
        is_closed: false,
        image_url: "https://tse4.mm.bing.net/th?id=OIP.TT09h8vKfF-coEAFlddwFAHaD5&w=249&h=249&c=7",
      },
      {
        distance: 1500,
        rating: 4.8,
        coordinates: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
        review_count: 320,
        transactions: ["delivery"],
        url: "https://www.oceanbreezeseafood.com",
        display_phone: "+1 415-555-9876",
        phone: "+14155559876",
        price: "$$$$",
        name: "Ocean Breeze Seafood",
        alias: "ocean-breeze-seafood-sf",
        location: {
          country: "USA",
          city: "San Francisco",
          address1: "789 Ocean Avenue",
          display_address: ["789 Ocean Avenue", "San Francisco, CA 94112", "USA"],
          state: "CA",
          zip_code: "94112",
        },
        id: "ocean-breeze-seafood-sf",
        categories: [
          {
            alias: "seafood",
            title: "Seafood",
          },
          {
            alias: "fine-dining",
            title: "Fine Dining",
          },
        ],
        is_closed: false,
        image_url: "https://tse2.mm.bing.net/th?id=OIP.vgEvDaozlxoa8nUJvhxRSgHaE8&w=316&h=316&c=7",
      },
    ];

    await db.collection('restaurants').insertMany(restaurants);
  },

  async down(db, client) {
    await db.collection('restaurants').deleteMany({
      id: { $in: ["golden-bowl-nyc", "sunnyside-grill-la", "ocean-breeze-seafood-sf"] }
    });
  }
};