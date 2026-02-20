
const dotenv = require('dotenv');
dotenv.config(); 

const config = {
  mongodb: {
    
    url: process.env.MONGO_URI,
    
    databaseName: process.env.MONGODB_DATABASE,

    options: {
      useNewUrlParser: true, 
      useUnifiedTopology: true, 
      
    }
  },
  
  migrationsDir: "migrations",
  
  changelogCollectionName: "changelog",
  
  lockCollectionName: "changelog_lock",
  
  lockTtl: 0,
  
  migrationFileExtension: ".js",
  
  useFileHash: false,
  
  moduleSystem: 'commonjs',
};

module.exports = config;
