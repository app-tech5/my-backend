module.exports = {
  async up(db, client) {
    const restaurants = [
      {
        distance: 1200,
        rating: 4.3,
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
        review_count: 250,
        serviceModes: [
          { value: "pickup", label: "Pickup" },
          { value: "delivery", label: "Delivery" },
        ],
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
          address2: "Suite 101",
          address3: "",
          display_address: [
            "123 Main Street",
            "Suite 101",
            "New York, NY 10001",
            "USA",
          ],
          state: "NY",
          zip_code: "10001",
        },
        id: "golden-bowl-nyc",
        categories: [
          {
            alias: "asian",
            title: "Asian",
            image: "https://i.imgur.com/3QZQZQZ.jpg",
            value: "asian",
            label: "Asian",
          },
          {
            alias: "noodles",
            title: "Noodles",
            image: "https://i.imgur.com/3QZQZQZ.jpg",
            value: "noodles",
            label: "Noodles",
          },
        ],
        is_closed: false,
        isAvailableForDelivery: true,
        isActivated: true,
        // image_url: "https://tse4.mm.bing.net/th?id=OIP.c2nqN8OX-m5j7NYbg7eHrQHaFj&w=355&h=355&c=7",
        theme: "modern",
        country: "USA",
        city: "New York",
        latitude: "40.7128",
        longitude: "-74.0060",
        description:
          "A modern Asian restaurant specializing in noodles and fusion cuisine.",
        image: "http://localhost:5000/api/uploads/1740075218890.jpg",
        users: {
          // name: "John Doe",
          // phone: "+12125556789",
          // email: "john.doe@goldenbowl.com",
          // password: "hashedpassword123", // Remplace par un mot de passe hashé en production
          value: "1234",
          label: "john.doe@goldenbowl.com"
        },
        address: "123 Main Street, New York, NY 10001",
        collectTime: 0.5,
        openingTime: "10:00",
        closingTime: "22:00",
        // openingTime: new Date().setHours(10, 0, 0, 0), // 10:00 AM
        // closingTime: new Date().setHours(22, 0, 0, 0), // 10:00 PM
        createdAt: new Date(),
        deliveryOptions: {
          deliveryType: "fixed",
          isDeliveryAvailable: true,
          isOrderAmountBasedFee: true,
          fixedFee: 1.00,
          orderAmountThreshold: 20,
        },
        tax: {
          id: "tax-nyc-1",
          location: "New York",
          rate: "8.875%",
          name: "NY Sales Tax",
          value: "8.875",
          label: "Sales Tax",
        },
        commission_rate: 15,
        reward: "10% off on first order",
      },
      {
        distance: 800,
        rating: 4.6,
        coordinates: {
          latitude: 34.0522,
          longitude: -118.2437,
        },
        review_count: 180,
        serviceModes: [{ value: "pickup", label: "Pickup" }],
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
          address2: "",
          address3: "",
          display_address: [
            "456 Sunset Boulevard",
            "Los Angeles, CA 90028",
            "USA",
          ],
          state: "CA",
          zip_code: "90028",
        },
        id: "sunnyside-grill-la",
        categories: [
          {
            alias: "american",
            title: "American",
            image: "https://i.imgur.com/4R4R4R4.jpg",
            value: "american",
            label: "American",
          },
          {
            alias: "bbq",
            title: "BBQ",
            image: "https://i.imgur.com/4R4R4R4.jpg",
            value: "bbq",
            label: "BBQ",
          },
        ],
        is_closed: false,
        isAvailableForDelivery: true,
        isActivated: true,
        // image_url: "https://tse4.mm.bing.net/th?id=OIP.TT09h8vKfF-coEAFlddwFAHaD5&w=249&h=249&c=7",
        theme: "rustic",
        country: "USA",
        city: "Los Angeles",
        latitude: "34.0522",
        longitude: "-118.2437",
        description:
          "A rustic American grill famous for its BBQ and hearty meals.",
        image: "http://localhost:5000/api/uploads/1740075685913.jpg",
        users: {
          // name: "Jane Smith",
          // phone: "+13235554321",
          // email: "jane.smith@sunnysidegrill.com",
          // password: "hashedpassword456", // Remplace par un mot de passe hashé en production
          value: "12345",
          label: "jane.smith@sunnysidegrill.com"
          
        },
        address: "456 Sunset Boulevard, Los Angeles, CA 90028",
        collectTime: 0.75,
        openingTime: "11:00",
        closingTime: "21:00",
        // openingTime: new Date().setHours(11, 0, 0, 0), // 10:00 AM
        // closingTime: new Date().setHours(21, 0, 0, 0), // 10:00 PM
        createdAt: new Date(),
        deliveryOptions: {
          deliveryType: "distance",
          isDeliveryAvailable: true,
          isOrderAmountBasedFee: true,
          distanceFee: {
            base: "1",
            perKm: "2"
          },
          orderAmountThreshold: 40,
          // deliveryType: "standard",
          // isDeliveryAvailable: true,
          // isOrderAmountBasedFee: true,
          // fixedFee: 5.00,
          // orderAmountThreshold: 20,
        },
        tax: {
          id: "tax-la-1",
          location: "Los Angeles",
          rate: "9.50%",
          name: "CA Sales Tax",
          value: "9.50",
          label: "Sales Tax",
        },
        commission_rate: 12,
        reward: "Free dessert on orders above $50",
      },
      {
        distance: 1500,
        rating: 4.8,
        coordinates: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
        review_count: 320,
        serviceModes: [{ value: "delivery", label: "Delivery" }],
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
          address2: "",
          address3: "",
          display_address: [
            "789 Ocean Avenue",
            "San Francisco, CA 94112",
            "USA",
          ],
          state: "CA",
          zip_code: "94112",
        },
        id: "ocean-breeze-seafood-sf",
        categories: [
          {
            alias: "seafood",
            title: "Seafood",
            image: "https://i.imgur.com/5S5S5S5.jpg",
            value: "seafood",
            label: "Seafood",
          },
          {
            alias: "fine-dining",
            title: "Fine Dining",
            image: "https://i.imgur.com/5S5S5S5.jpg",
            value: "fine-dining",
            label: "Fine Dining",
          },
        ],
        is_closed: false,
        isAvailableForDelivery: true,
        isActivated: true,
        // image_url: "https://tse2.mm.bing.net/th?id=OIP.vgEvDaozlxoa8nUJvhxRSgHaE8&w=316&h=316&c=7",
        theme: "luxury",
        country: "USA",
        city: "San Francisco",
        latitude: "37.7749",
        longitude: "-122.4194",
        description:
          "A luxury seafood restaurant offering the finest dining experience.",
        image: "http://localhost:5000/api/uploads/1740075783437.jpg",
        users: {
          // name: "Michael Brown",
          // phone: "+14155559876",
          // email: "michael.brown@oceanbreeze.com",
          // password: "hashedpassword789", // Remplace par un mot de passe hashé en production
          value: "123",
          label: "michael.brown@oceanbreeze.com"
        },
        address: "789 Ocean Avenue, San Francisco, CA 94112",
        collectTime: 1,
        openingTime: "12:00",
        closingTime: "23:00",
        // openingTime: new Date().setHours(12, 0, 0, 0), // 10:00 AM
        // closingTime: new Date().setHours(23, 0, 0, 0), // 10:00 PM
        createdAt: new Date(),
        deliveryOptions: {
          deliveryType: "free",
          isDeliveryAvailable: true,
          isOrderAmountBasedFee: false,
          isFreeDelivery: {
            enabled: false
          },
        },
        tax: {
          id: "tax-sf-1",
          location: "San Francisco",
          rate: "8.50%",
          name: "SF Sales Tax",
          value: "8.50",
          label: "Sales Tax",
        },
        commission_rate: 18,
        reward: "Complimentary wine on orders above $100",
      },
    ];

    await db.collection("restaurants").insertMany(restaurants);
  },

  async down(db, client) {
    await db.collection("restaurants").deleteMany({
      id: {
        $in: [
          "golden-bowl-nyc",
          "sunnyside-grill-la",
          "ocean-breeze-seafood-sf",
        ],
      },
    });
  },
};
