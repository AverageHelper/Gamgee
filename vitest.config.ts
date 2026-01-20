import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		clearMocks: true,
		dir: "src",
		include: ["**/*.test.ts"],
		sequence: {
			hooks: "list",
		},
		coverage: {
			enabled: true,
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.d.ts", "src/**/*.test.ts"],
			reportsDirectory: "coverage",
		},
	},
});
