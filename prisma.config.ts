import "dotenv/config.js"; // FIXME: Can't we use Node's built-in `--env-file` instead? 😢
import { defineConfig, env } from "prisma/config"; // eslint-disable-line import/extensions

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: env("DATABASE_URL"),
	},
});
