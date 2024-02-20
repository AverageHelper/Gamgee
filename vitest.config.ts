import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		clearMocks: true,
		include: ["src/**/*.test.ts"],
		sequence: {
			hooks: "list"
		},
		coverage: {
			enabled: true,
			all: true,
			include: ["src/**/*!(.d)!(.test).ts"],
			reportsDirectory: "coverage"
		}
	}
});
