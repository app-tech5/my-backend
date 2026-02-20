const mongoose = require('mongoose');
const Promotion = require('../src/models/Promotion');

async function updatePromotionContent() {
  try {
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/good-foods');

    console.log('🍽️ Début de la mise à jour du contenu des promotions...');
    
    const promotionContent = {
      
      percentage_discount: [
        { name: '15% Off Your Order', description: 'Get 15% discount on your entire order from any restaurant. Minimum order $20.' },
        { name: '20% Student Discount', description: 'Show your student ID and get 20% off on orders over $15.' },
        { name: '25% Weekend Special', description: 'Enjoy 25% off on all orders every Friday, Saturday and Sunday.' },
        { name: '10% First Order', description: 'Welcome bonus: 10% discount on your first order with any restaurant.' },
        { name: '30% Lunch Special', description: '30% off on all lunch orders between 11 AM and 3 PM.' },
        { name: '18% Family Discount', description: '18% off on orders over $40 for families.' }
      ],
      
      fixed_discount: [
        { name: '$5 Off Orders Over $30', description: 'Save $5 when you order for $30 or more from participating restaurants.' },
        { name: '$3 Delivery Fee Waiver', description: 'Get $3 off your delivery fee on orders over $25.' },
        { name: '$10 Off Large Orders', description: 'Enjoy $10 off when your order total exceeds $50.' },
        { name: '$7 Off Dinner Orders', description: 'Save $7 on dinner orders over $35 from 5 PM to 10 PM.' },
        { name: '$4 Off Breakfast', description: 'Start your day right with $4 off breakfast orders.' }
      ],
      
      free_delivery: [
        { name: 'Free Delivery Today', description: 'No delivery fees on all orders today. Order from your favorite restaurants.' },
        { name: 'Free Delivery Over $25', description: 'Orders over $25 qualify for free delivery from all restaurants.' },
        { name: 'Weekend Free Delivery', description: 'Enjoy free delivery every weekend. No minimum order required.' },
        { name: 'Free Delivery Wednesdays', description: 'Midweek special: Free delivery every Wednesday.' },
        { name: 'Free Delivery for New Users', description: 'New customers get free delivery on their first order.' }
      ],
      
      buy_x_get_y: [
        { name: 'Buy 1 Get 1 Free Pizza', description: 'Order one pizza and get the second one free. Valid at Italian restaurants.' },
        { name: 'Buy 2 Burgers Get 1 Free', description: 'Purchase 2 burgers and receive the third one absolutely free.' },
        { name: 'Buy 1 Get 1 Free Sushi Rolls', description: 'Sushi special: Buy one roll, get the second one free.' },
        { name: 'Buy 3 Get 1 Free Appetizers', description: 'Order 3 appetizers and get the 4th one free from any restaurant.' },
        { name: 'Buy 2 Pastas Get 1 Free', description: 'Pasta lovers: Buy 2 pastas and get the third one free.' },
        { name: 'Buy 1 Get 1 Free Dessert', description: 'Sweet deal: Buy one dessert, get the second one free.' }
      ],
      
      combo_deal: [
        { name: 'Burger + Fries + Drink', description: 'Complete meal deal: Burger, fries and drink for only $12.99.' },
        { name: 'Pizza + Salad + Dessert', description: 'Family combo: Large pizza, garden salad and chocolate cake.' },
        { name: 'Sushi Platter Special', description: 'Assorted sushi platter with miso soup and green tea.' },
        { name: 'Chicken Meal Deal', description: 'Fried chicken, coleslaw, and biscuit for $15.99.' },
        { name: 'Mexican Fiesta Combo', description: 'Burrito, taco, and chips with salsa for $18.99.' }
      ],
      
      flash_sale: [
        { name: 'Flash Sale: 30% Off', description: 'Limited time offer: 30% off on all items. Only for the next hour!' },
        { name: 'Midnight Snack Special', description: 'Late night cravings? Get 25% off all orders between 11 PM and 2 AM.' },
        { name: 'Lunch Rush Deal', description: 'Quick lunch break? 20% off all orders from 11 AM to 2 PM.' },
        { name: 'Evening Flash Sale', description: 'Last minute dinner? 35% off orders placed after 8 PM.' },
        { name: 'Morning Flash Deal', description: 'Early bird special: 25% off breakfast orders before 10 AM.' }
      ],
      
      happy_hour: [
        { name: 'Happy Hour Special', description: '50% off all drinks and appetizers from 5 PM to 7 PM daily.' },
        { name: 'Evening Happy Hour', description: 'Special pricing on cocktails and small plates from 6 PM to 8 PM.' },
        { name: 'Late Night Happy Hour', description: 'Extended happy hour from 9 PM to 11 PM with 40% off.' },
        { name: 'Afternoon Happy Hour', description: 'Early happy hour: 30% off drinks from 3 PM to 5 PM.' }
      ]
    };
    
    const promotions = await Promotion.find({});
    console.log(`📊 ${promotions.length} promotions trouvées dans la DB good-foods`);

    let updatedCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < promotions.length; i++) {
      const promotion = promotions[i];
      const promotionType = promotion.promotionType;

      console.log(`🔄 Promotion ${i + 1}/${promotions.length}: ${promotionType} - "${promotion.name}"`);

      if (promotionContent[promotionType] && promotionContent[promotionType].length > 0) {
        
        const randomContent = promotionContent[promotionType][
          Math.floor(Math.random() * promotionContent[promotionType].length)
        ];
        
        await Promotion.updateOne(
          { _id: promotion._id },
          {
            $set: {
              name: randomContent.name,
              description: randomContent.description
            }
          }
        );

        console.log(`   ✅ Mis à jour: "${randomContent.name}"`);
        updatedCount++;
      } else {
        console.log(`   ⚠️ Type non supporté: ${promotionType}`);
        skippedCount++;
      }
    }

    console.log(`\n🎉 MISE À JOUR TERMINÉE:`);
    console.log(`   - ${updatedCount} promotions mises à jour`);
    console.log(`   - ${skippedCount} promotions non modifiées (type non supporté)`);
    
    console.log(`\n🔍 VÉRIFICATION FINALE - Échantillon:`);
    const samplePromotions = await Promotion.find({}, 'name description promotionType').limit(8);
    samplePromotions.forEach((promo, index) => {
      console.log(`   ${index + 1}. [${promo.promotionType}] "${promo.name}"`);
      console.log(`      "${promo.description}"`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📪 Déconnexion DB good-foods');
  }
}

updatePromotionContent();
