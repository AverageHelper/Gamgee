import * as _entities from "./dist/database/model/index.js";
import * as _migrations from "./dist/database/migrations/index.js";

export default {
	type: "sqlite3",
	database: "./db/db.sqlite",
	entities: Object.values(_entities),
	migrations: Object.values(_migrations),
	synchronize: false,
	cli: {
		entitiesDir: "src/database/model",
		migrationsDir: "src/database/migrations",
		subscribersDir: "src/database/subscribers"
	}
};
