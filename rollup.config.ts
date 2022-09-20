import { defineConfig } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import { visualizer } from "rollup-plugin-visualizer";
import analyze from "rollup-plugin-analyzer";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";

export default defineConfig({
	plugins: [
		// Transpile source
		typescript({ tsconfig: "./tsconfig.prod.json" }), // translate TypeScript to JS
		commonjs({ extensions: [".js", ".ts"] }), // translate CommonJS to ESM
		json(), // translate JSON

		// // Find external dependencies
		nodeResolve({
			exportConditions: ["node"],
			preferBuiltins: true
		}),

		// // Minify output
		process.env["NODE_ENV"] === "production" ? terser() : null,

		// Statistics
		analyze({ filter: () => false }), // only top-level summary
		visualizer()
	],
	onwarn(warning, defaultHandler) {
		// Ignore "`this` has been rewritten to `undefined`" warnings.
		// They usually relate to modules that were transpiled from
		// TypeScript, and check their context by querying the value
		// of global `this`.
		if (warning.code === "THIS_IS_UNDEFINED") return;

		defaultHandler(warning);
	},
	external: [
		// Weirdness
		"@prisma/client",

		// Circular
		"undici",
		"@discordjs/builders",
		"@discordjs/rest",
		"discord.js",
		"winston-transport",
		"winston",
		"async",
		"yargs"
	],
	input: "src/main.ts",
	output: {
		file: "dist/server.js",
		format: "commonjs",
		inlineDynamicImports: true,
		sourcemap: "inline"
	}
});
