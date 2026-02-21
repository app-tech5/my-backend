const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Driver = require('./src/models/Driver');
const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb://localhost:27017/good-foods', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};
const addDemoDriver = async () => {
  try {
    await connectDB();
    const demoEmail = 'driver@demo.com';
    const demoPassword = 'driver123';
    console.log('🔍 Vérification de l\'existence de l\'utilisateur driver...');
    let user = await User.findOne({ email: demoEmail });
    if (!user) {
      console.log('👤 Création de l\'utilisateur driver...');
      const hashedPassword = await bcrypt.hash(demoPassword, 10);
      user = new User({
        email: demoEmail,
        password: hashedPassword,
        name: 'Jean Dupont',
        phone: '+33123456789',
        address: '15 Rue de la Livraison, Paris',
        lat: 48.8600,
        lng: 2.3500,
        role: 'customer', 
        isActive: true,
      });
      await user.save();
      console.log('✅ Utilisateur créé:', user._id);
    } else {
      console.log('ℹ️ Utilisateur existe déjà:', user._id);
    }
    const existingDriver = await Driver.findOne({ userId: user._id });
    if (!existingDriver) {
      console.log('🚗 Création du profil driver...');
      const driver = new Driver({
        userId: user._id,
        licenseNumber: 'DEMO123456',
        vehicle: {
          type: 'scooter',
          model: 'Honda PCX 125',
          licensePlate: 'DEMO-123-AB'
        },
        location: {
          type: 'Point',
          coordinates: [2.3500, 48.8600] 
        },
        status: 'available',
        rating: 4.8,
        totalDeliveries: 42,
        documents: [
          {
            type: "permis de conduire",
            fileUrl: 'https://example.com/demo-license.jpg'
          },
          {
            type: 'carte grise',
            fileUrl: 'https://example.com/demo-registration.jpg'
          }
        ],
        isApproved: true
      });
      await driver.save();
      console.log('✅ Profil driver créé:', driver._id);
    } else {
      console.log('ℹ️ Profil driver existe déjà:', existingDriver._id);
    }
    console.log('🎉 Chauffeur de démonstration ajouté avec succès !');
    console.log('📧 Email: driver@demo.com');
    console.log('🔑 Mot de passe: driver123');
    console.log('📍 Localisation: 48.8600, 2.3500 (près des restaurants)');
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du chauffeur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
  }
};
addDemoDriver();
