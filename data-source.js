const { DataSource } = require("typeorm");

const AppDataSource = new DataSource({
  type: "mongodb",
  host: "127.0.0.1",
  port: 27017,
  database: "monapp",
  useNewUrlParser: true,
  useUnifiedTopology: true,
  entities: ["src/entity/*.js"],
  migrations: ["src/migration/*.js"],
  synchronize: false, // Ne pas activer en prod !
});

module.exports = { AppDataSource };
