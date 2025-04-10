const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

// Ajout de la constante pour contrôler le nombre de rapports
const NUMBER_OF_REPORTS = 15; // Modifier ce nombre selon le besoin

function generateMockReports(generatedBy) {
  const reportTypes = ["sales", "driver_performance", "customer_behavior"];
  const reports = [];
  const currentDate = new Date();

  // Modification pour générer le nombre souhaité de rapports
  for (let i = 0; i < NUMBER_OF_REPORTS; i++) {
    const reportType = reportTypes[i % reportTypes.length]; // Alternance des types
    const monthsToSubtract = Math.floor(i / reportTypes.length); // Pour varier les dates
    
    const baseDate = new Date(currentDate);
    baseDate.setMonth(currentDate.getMonth() - monthsToSubtract);
    
    const report = {
      _id: new mongoose.Types.ObjectId(),
      title: getReportTitle(reportType, baseDate, i),
      reportType: reportType,
      dateRange: generateDateRange(reportType, baseDate),
      filters: generateFilters(reportType),
      metrics: generateMetrics(reportType),
      generatedBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Ajout de propriétés spécifiques pour certains types de rapports
    if (reportType === "customer_behavior") {
      report.isRecurring = faker.datatype.boolean();
      if (report.isRecurring) {
        report.recurrencePattern = faker.helpers.arrayElement(["daily", "weekly", "monthly"]);
      }
    }

    reports.push(report);
  }

  return reports;
}

// Helper functions
// Modification mineure de getReportTitle pour éviter les doublons
function getReportTitle(reportType, date, index) {
  const typeTitles = {
    sales: `Sales Report - ${date.toLocaleDateString('en-US', { month: 'long' })} ${date.getFullYear()}${index > 0 ? ` (${index})` : ''}`,
    driver_performance: `Driver Performance - Week ${faker.number.int({ min: 1, max: 52 })}${index > 0 ? ` (${index})` : ''}`,
    customer_behavior: `${faker.helpers.arrayElement(["Premium", "Regular", "New"])} Customer Analysis${index > 0 ? ` (${index})` : ''}`
  };
  return typeTitles[reportType];
}

// Les fonctions suivantes restent strictement identiques à votre version originale
function generateDateRange(reportType, baseDate) {
  const start = new Date(baseDate);
  start.setDate(1);
  
  const end = new Date(start);
  if (reportType === "driver_performance") {
    start.setDate(faker.number.int({ min: 1, max: 28 }));
    end.setDate(start.getDate() + 6);
  } else if (reportType === "customer_behavior") {
    start.setMonth(start.getMonth() - 2);
  } else {
    end.setMonth(start.getMonth() + 1);
    end.setDate(0);
  }

  return {
    start: start,
    end: end
  };
}

function generateFilters(reportType) {
  const filters = {};
  
  if (reportType === "sales") {
    filters.restaurantIds = Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, 
      () => new mongoose.Types.ObjectId());
    filters.orderStatuses = ["completed"];
  } else if (reportType === "driver_performance") {
    filters.driverIds = Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, 
      () => new mongoose.Types.ObjectId());
  }
  
  return filters;
}

function generateMetrics(reportType) {
  const metrics = {};
  
  switch(reportType) {
    case "sales":
    const totalOrders = faker.number.int({ min: 500, max: 2000 });
    metrics.totalOrders = totalOrders;
    metrics.completedOrders = Math.floor(totalOrders * 0.95);
    metrics.cancellationRate = faker.number.float({ 
      min: 1.0, 
      max: 5.0, 
      fractionDigits: 1 
    });
    metrics.grossRevenue = faker.number.int({ min: 20000, max: 100000 });
    metrics.netProfit = metrics.grossRevenue * faker.number.float({ 
      min: 0.3, 
      max: 0.5, 
      fractionDigits: 2 
    });
    metrics.averageOrderValue = faker.number.float({ 
      min: 20.0, 
      max: 50.0, 
      fractionDigits: 2 
    });
    metrics.averageDeliveryTime = faker.number.int({ min: 20, max: 45 });
    break;
      
    case "driver_performance":
      metrics.totalDeliveries = faker.number.int({ min: 100, max: 500 });
      metrics.onTimeRate = faker.number.int({ min: 80, max: 95, precision: 0.1 });
      metrics.averageRating = faker.number.int({ min: 3.5, max: 5, precision: 0.1 });
      metrics.totalEarnings = faker.number.int({ min: 1000, max: 5000 });
      break;
      
    case "customer_behavior":
      metrics.activeCustomers = faker.number.int({ min: 500, max: 2000 });
      metrics.repeatOrderRate = faker.number.int({ min: 30, max: 60, precision: 0.1 });
      metrics.averageOrdersPerCustomer = faker.number.int({ min: 2, max: 5, precision: 0.1 });
      metrics.favoriteCategories = faker.helpers.arrayElements(
        ["Burgers", "Pizzas", "Asian", "Mexican", "Salads", "Desserts", "Breakfast"],
        faker.number.int({ min: 2, max: 4 })
      );
      break;
  }
  
  return metrics;
}

// La partie module.exports reste strictement identique à votre version originale
module.exports = {
  async up(db, client) {
    try {
      await db.collection("reports").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }

    const user = await db.collection('users').findOne({});
    const generatedBy = user ? user._id : new mongoose.Types.ObjectId();

    const mockReports = generateMockReports(generatedBy);
    
    await db.collection('reports').insertMany(mockReports);
  },

  async down(db, client) {
    await db.collection('reports').deleteMany({});
    await db.collection('reports').dropIndex("reportType_1");
    await db.collection('reports').dropIndex("dateRange.start_-1");
    await db.collection('reports').dropIndex("filters.restaurantIds_1");
  }
};
// const mongoose = require('mongoose');

// module.exports = {
//   async up(db, client) {
//     // Insert sample reports data
//     await db.collection('reports').insertMany([
//       {
//         _id: new mongoose.Types.ObjectId('67cc29e162de2f9a5b4f439a'),
//         title: "Sales Report - January 2024",
//         reportType: "sales",
//         dateRange: {
//           start: new Date('2024-01-01T00:00:00Z'),
//           end: new Date('2024-01-31T23:59:59Z')
//         },
//         filters: {
//           restaurantIds: [
//             new mongoose.Types.ObjectId('5f8d0d55b54764421b7156c1'),
//             new mongoose.Types.ObjectId('5f8d0d55b54764421b7156c2')
//           ],
//           orderStatuses: ["completed"]
//         },
//         metrics: {
//           totalOrders: 1245,
//           completedOrders: 1200,
//           cancellationRate: 3.6,
//           grossRevenue: 45280.50,
//           netProfit: 15848.18,
//           averageOrderValue: 37.73,
//           averageDeliveryTime: 32.5
//         },
//         generatedBy: new mongoose.Types.ObjectId('67c62fae5a9b19466ee230d6'),
//         createdAt: new Date(),
//         updatedAt: new Date()
//       },
//       {
//         _id: new mongoose.Types.ObjectId('67cc29e162de2f9a5b4f439b'),
//         title: "Driver Performance - Week 05",
//         reportType: "driver_performance",
//         dateRange: {
//           start: new Date('2024-01-29T00:00:00Z'),
//           end: new Date('2024-02-04T23:59:59Z')
//         },
//         filters: {
//           driverIds: [
//             new mongoose.Types.ObjectId('5f8d0d55b54764421b7156d1'),
//             new mongoose.Types.ObjectId('5f8d0d55b54764421b7156d2')
//           ]
//         },
//         metrics: {
//           totalDeliveries: 342,
//           onTimeRate: 89.2,
//           averageRating: 4.7,
//           totalEarnings: 2565.00
//         },
//         generatedBy: new mongoose.Types.ObjectId('67c62fae5a9b19466ee230d6'),
//         createdAt: new Date(),
//         updatedAt: new Date()
//       },
//       {
//         _id: new mongoose.Types.ObjectId('67cc29e162de2f9a5b4f439c'),
//         title: "Premium Customer Analysis",
//         reportType: "customer_behavior",
//         dateRange: {
//           start: new Date('2023-12-01T00:00:00Z'),
//           end: new Date('2024-01-31T23:59:59Z')
//         },
//         metrics: {
//           activeCustomers: 845,
//           repeatOrderRate: 42.3,
//           averageOrdersPerCustomer: 3.2,
//           favoriteCategories: ["Burgers", "Pizzas", "Asian"]
//         },
//         generatedBy: new mongoose.Types.ObjectId('67c62fae5a9b19466ee230d6'),
//         isRecurring: true,
//         recurrencePattern: "monthly",
//         createdAt: new Date(),
//         updatedAt: new Date()
//       }
//     ]);

//   },

//   async down(db, client) {
//     // Rollback: Remove inserted data
//     await db.collection('reports').deleteMany({
//       _id: {
//         $in: [
//           new mongoose.Types.ObjectId('67cc29e162de2f9a5b4f439a'),
//           new mongoose.Types.ObjectId('67cc29e162de2f9a5b4f439b'),
//           new mongoose.Types.ObjectId('67cc29e162de2f9a5b4f439c')
//         ]
//       }
//     });
    
//     // Drop indexes
//     await db.collection('reports').dropIndex("reportType_1");
//     await db.collection('reports').dropIndex("dateRange.start_-1");
//     await db.collection('reports').dropIndex("filters.restaurantIds_1");
//   }
// };