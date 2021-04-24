const entities = require("./dist/database/model");
const migrations = require("./dist/database/migrations");

module.exports = {
  type: "sqlite",
  database: "./db/db.sqlite",
  entities: Object.values(entities),
  migrations: Object.values(migrations),
  synchronize: false,
  cli: {
    entitiesDir: "src/database/model",
    migrationsDir: "src/database/migrations",
    subscribersDir: "src/database/subscribers"
  }
};
