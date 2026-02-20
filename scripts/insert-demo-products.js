const { MongoClient } = require('mongodb');
const { faker } = require('@faker-js/faker');
const { ObjectId } = require('mongodb');

const PREMIUM_FOOD_IMAGES = [
  
  'https://cdn.pixabay.com/photo/2016/03/05/19/02/hamburger-1238246_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/12/09/08/18/pizza-3007395_1280.jpg',
  'https://cdn.pixabay.com/photo/2020/10/05/19/55/hamburger-5630646_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/03/05/19/02/sandwich-1238247_1280.jpg',
  'https://cdn.pixabay.com/photo/2014/10/19/20/59/hamburger-494706_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/03/05/19/03/hamburger-1238251_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/01/03/11/33/pizza-1949183_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/08/30/13/21/pizza-2696207_1280.jpg',
  
  'https://cdn.pixabay.com/photo/2018/07/18/19/12/pasta-3547078_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/11/23/18/31/pasta-1854245_1280.jpg',
  'https://cdn.pixabay.com/photo/2015/04/08/13/13/pasta-712664_1280.jpg',
  'https://cdn.pixabay.com/photo/2018/08/31/19/13/pasta-3641268_1280.jpg',
  'https://cdn.pixabay.com/photo/2014/12/16/23/45/pasta-570683_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/03/23/19/57/asparagus-2169305_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/11/16/18/51/spaghetti-2953420_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/12/26/17/28/food-1932466_1280.jpg',
  
  'https://cdn.pixabay.com/photo/2016/03/05/19/02/salad-1238245_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/01/11/11/33/cake-1971556_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/03/05/19/02/vegetables-1238244_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/08/11/23/48/mushrooms-1589869_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/10/09/19/29/eat-2834549_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/11/29/04/00/breakfast-1866954_1280.jpg',
  'https://cdn.pixabay.com/photo/2014/12/11/02/55/cornucopia-563796_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/01/22/02/13/plate-1155127_1280.jpg',
  
  'https://cdn.pixabay.com/photo/2018/07/10/21/23/pancakes-3529653_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/11/29/13/02/breakfast-1869716_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/05/07/08/56/pancakes-2291908_1280.jpg',
  'https://cdn.pixabay.com/photo/2018/02/13/23/41/milk-3150328_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/11/29/09/49/food-1868153_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/11/18/19/00/bread-1836411_1280.jpg',
  
  'https://cdn.pixabay.com/photo/2017/10/15/11/41/sushi-2853382_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/11/23/18/31/curry-1854249_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/09/28/18/13/rice-2795746_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/10/13/14/50/noodles-1738583_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/08/25/15/21/rice-2680223_1280.jpg',
  'https://cdn.pixabay.com/photo/2018/03/15/12/16/food-3228057_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/03/05/19/03/appetizers-1238253_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/06/29/20/09/mexican-2456038_1280.jpg',
  
  'https://cdn.pixabay.com/photo/2017/01/11/11/33/cake-1971552_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/03/27/19/44/dessert-1283131_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/03/31/18/02/strawberry-dessert-2191973_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/11/29/04/31/cake-1866867_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/11/22/18/52/cake-1850011_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/03/17/10/29/cake-2153336_1280.jpg',
  'https://cdn.pixabay.com/photo/2014/08/14/14/38/macarons-417893_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/03/30/15/33/chocolate-2188871_1280.jpg',
  
  'https://cdn.pixabay.com/photo/2016/03/27/21/34/coffee-1284041_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/03/27/19/44/juice-1283134_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/08/06/04/35/coffee-2591461_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/07/21/11/17/smoothie-1531598_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/07/12/22/30/smoothie-1512604_1280.jpg',
  'https://cdn.pixabay.com/photo/2015/07/10/14/59/juice-839486_1280.jpg',
  
  'https://cdn.pixabay.com/photo/2016/03/05/19/02/meat-1238248_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/11/23/18/31/fried-chicken-1853686_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/03/23/19/57/asparagus-2169305_1280.jpg',
  'https://cdn.pixabay.com/photo/2014/10/23/18/05/barbecue-500054_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/01/08/18/27/camera-1128213_1280.jpg',
  'https://cdn.pixabay.com/photo/2015/12/08/00/41/ribs-1081420_1280.jpg',
  
  'https://cdn.pixabay.com/photo/2016/03/05/19/02/fish-1238243_1280.jpg',
  'https://cdn.pixabay.com/photo/2018/09/14/11/12/food-3676808_1280.jpg',
  'https://cdn.pixabay.com/photo/2014/11/05/15/57/salmon-518032_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/06/26/17/15/seafood-2442567_1280.jpg',
  
  'https://cdn.pixabay.com/photo/2016/03/05/19/02/french-fries-1238249_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/01/11/11/33/nachos-1971555_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/03/05/19/02/appetizer-1238250_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/08/23/08/53/group-of-objects-1614731_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/05/23/22/36/vegetables-2338824_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/11/29/11/37/food-1869223_1280.jpg'
];

function getPremiumFoodImage() {
  return PREMIUM_FOOD_IMAGES[Math.floor(Math.random() * PREMIUM_FOOD_IMAGES.length)];
}

async function insertDemoProducts() {
  
  const mongoUri = 'mongodb://127.0.0.1:27017/good-foods';
  const dbName = 'good-foods';

  console.log('🔍 Utilisation de:', mongoUri);

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');

    const db = client.db(dbName);
    const productsCollection = db.collection('products');
    const restaurantsCollection = db.collection('restaurants');
    const categoriesCollection = db.collection('categories');
    const variantsCollection = db.collection('variants');
    
    const existingProductsCount = await productsCollection.countDocuments();
    if (existingProductsCount > 0) {
      console.log(`ℹ️ ${existingProductsCount} produits existent déjà`);
      console.log('🗑️ Suppression des produits existants...');
      await productsCollection.deleteMany({});
      console.log('✅ Produits supprimés');
    }
    
    const restaurants = await restaurantsCollection.find({}).toArray();
    const categories = await categoriesCollection.find({}).toArray();
    const variants = await variantsCollection.find({}).toArray();

    if (restaurants.length === 0 || categories.length === 0) {
      console.log('❌ Pas assez de données : restaurants ou catégories manquants');
      return;
    }

    console.log(`📊 Génération de 150 produits pour ${restaurants.length} restaurants...`);
    
    const mockProducts = [];

    for (let i = 0; i < 150; i++) {
      const restaurant = faker.helpers.arrayElement(restaurants);
      const category = faker.helpers.arrayElement(categories);
      
      const selectedVariants = variants.length > 0
        ? faker.helpers.arrayElements(variants, faker.number.int({ min: 0, max: 3 }))
            .map(variant => ({
              value: variant._id,
              label: variant.name
            }))
        : [];

      const hasDiscount = faker.datatype.boolean({ probability: 0.25 });
      const ratingAverage = faker.number.float({ min: 1, max: 5, precision: 0.1 });

      const product = {
        name: faker.food.dish(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price({ min: 2, max: 30 })),
        currency: 'EUR',
        image: getPremiumFoodImage(),
        category: category._id,
        categories: {
          value: category._id.toString(),
          label: category.name
        },
        restaurant: restaurant._id,
        restaurants: {
          value: restaurant._id.toString(),
          label: restaurant.name
        },
        availability: faker.datatype.boolean({ probability: 0.85 }),
        preparation_time: faker.number.int({ min: 5, max: 45 }),
        tags: faker.helpers.arrayElements(
          ['bio', 'végétarien', 'épicé', 'sans gluten', 'vegan', 'fait maison'],
          faker.number.int({ min: 0, max: 3 })
        ),
        ingredients: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () =>
          faker.commerce.productMaterial()
        ),
        discount: {
          isActive: hasDiscount,
          percentage: hasDiscount ? faker.number.int({ min: 5, max: 25 }) : 0,
          startDate: hasDiscount ? faker.date.recent() : null,
          endDate: hasDiscount ? faker.date.soon({ days: 30 }) : null
        },
        rating: {
          average: ratingAverage,
          count: faker.number.int({ min: 0, max: 100 })
        },
        variants: selectedVariants,
        created_at: faker.date.past({ years: 1 }),
        updated_at: faker.date.recent({ days: 30 })
      };

      mockProducts.push(product);
    }
    
    const validProducts = mockProducts.filter(product => {
      return product.image &&
             product.image.trim() !== '' &&
             product.image !== null &&
             product.image !== undefined;
    });

    const invalidProductsCount = mockProducts.length - validProducts.length;
    if (invalidProductsCount > 0) {
      console.log(`⚠️ ${invalidProductsCount} produits invalides filtrés (sans image)`);
    }
    
    const result = await productsCollection.insertMany(validProducts);
    console.log(`✅ ${result.insertedCount} produits valides insérés avec succès !`);
    
    const totalProducts = await productsCollection.countDocuments();
    const productsByRestaurant = await productsCollection.aggregate([
      { $group: { _id: "$restaurant", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    console.log(`📊 Total produits dans la base : ${totalProducts}`);
    console.log(`🏪 Produits par restaurant (Top 5) :`);
    productsByRestaurant.slice(0, 5).forEach((item, index) => {
      console.log(`   ${index + 1}. Restaurant ${item._id} : ${item.count} produits`);
    });
    
    const productsWithoutImages = await productsCollection.countDocuments({
      $or: [
        { image: { $exists: false } },
        { image: null },
        { image: "" },
        { image: { $regex: /^\s*$/ } }
      ]
    });

    if (productsWithoutImages > 0) {
      console.log(`❌ ERREUR : ${productsWithoutImages} produits sans image valide dans la base !`);
      throw new Error('Produits sans images détectés dans la base de données');
    } else {
      console.log('✅ SUCCÈS : Tous les produits ont des images valides !');
      console.log(`🎯 Probabilité de variété : ${PREMIUM_FOOD_IMAGES.length} images pour ${totalProducts} produits`);
      console.log(`📈 Ratio image unique : 1/${Math.round(totalProducts / PREMIUM_FOOD_IMAGES.length)} en moyenne`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
    console.log('🔌 Connexion fermée');
  }
}

insertDemoProducts();
