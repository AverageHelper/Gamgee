import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		clearMocks: true,
		include: ["tests/**/*.test.ts"],
		testTimeout: 60_000,
		hookTimeout: 60_000,
		teardownTimeout: 60_000,
		retry: 2,
		setupFiles: ["./tests/hooks.ts"],
		sequence: {
			hooks: "list"
		},
		coverage: {
			enabled: false
		}
	}
});
