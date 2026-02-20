const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goodfood', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connecté à MongoDB');
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error);
    process.exit(1);
  }
};

const Product = require('../src/models/Product');
const Variant = require('../src/models/Variant');

const fixVariantIntegrity = async () => {
  try {
    console.log('🔧 Correction de l\'intégrité des variants...\n');
    
    const productsWithVariants = await Product.find({
      'variants.0': { $exists: true }
    });

    console.log(`📦 Analyse de ${productsWithVariants.length} produits avec variants...\n`);

    let fixedCount = 0;
    let removedCount = 0;
    
    for (const product of productsWithVariants) {
      const originalVariants = product.variants;
      const validVariants = [];

      for (const variantRef of originalVariants) {
        
        const variantExists = await Variant.findById(variantRef.value);

        if (variantExists) {
          
          validVariants.push(variantRef);
        } else {
          
          console.log(`❌ Variant manquant supprimé: "${variantRef.label}" (${variantRef.value}) dans "${product.name}"`);
          removedCount++;
        }
      }
      
      if (validVariants.length !== originalVariants.length) {
        await Product.findByIdAndUpdate(product._id, {
          variants: validVariants,
          updated_at: new Date()
        });
        fixedCount++;
        console.log(`✅ Produit "${product.name}" corrigé (${originalVariants.length} → ${validVariants.length} variants)`);
      }
    }

    console.log('\n📊 RAPPORT DE CORRECTION:');
    console.log('=' .repeat(40));
    console.log(`   • Produits analysés: ${productsWithVariants.length}`);
    console.log(`   • Produits corrigés: ${fixedCount}`);
    console.log(`   • Références invalides supprimées: ${removedCount}`);

    if (fixedCount === 0) {
      console.log('\n🎉 Aucune correction nécessaire !');
    } else {
      console.log('\n⚠️  Corrections appliquées. Vérifiez que tout fonctionne correctement.');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
};

const createMissingVariants = async () => {
  try {
    console.log('🆕 Création de variants manquants...\n');
    
    const commonVariants = [
      { name: 'Jalapeños', extra: 2.50, available: true },
      { name: 'Champignons', extra: 1.50, available: true },
      { name: 'Oignons', extra: 1.00, available: true },
      { name: 'Olives', extra: 2.00, available: true },
      { name: 'Pepperoni', extra: 3.00, available: true },
      { name: 'Double fromage', extra: 2.50, available: true },
      { name: 'Sauce épicée', extra: 1.50, available: true },
      { name: 'Bacon', extra: 3.50, available: true }
    ];

    let createdCount = 0;

    for (const variantData of commonVariants) {
      
      const existingVariant = await Variant.findOne({ name: variantData.name });

      if (!existingVariant) {
        const newVariant = new Variant(variantData);
        await newVariant.save();
        console.log(`✅ Variant créé: "${variantData.name}" (+${variantData.extra}€)`);
        createdCount++;
      }
    }

    console.log(`\n📊 ${createdCount} variants créés`);

  } catch (error) {
    console.error('❌ Erreur lors de la création des variants:', error);
  }
};

const runScript = async (action = 'fix') => {
  await connectDB();

  if (action === 'fix') {
    await fixVariantIntegrity();
  } else if (action === 'create') {
    await createMissingVariants();
  } else if (action === 'both') {
    await fixVariantIntegrity();
    console.log('\n');
    await createMissingVariants();
  }

  await mongoose.connection.close();
  console.log('\n🔚 Script terminé');
};

if (require.main === module) {
  const action = process.argv[2] || 'fix'; 
  console.log(`🚀 Exécution du script avec action: ${action}`);
  runScript(action);
}

module.exports = { fixVariantIntegrity, createMissingVariants };

