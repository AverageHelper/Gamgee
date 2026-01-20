import { defineConfig } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { visualizer } from "rollup-plugin-visualizer";
import analyze from "rollup-plugin-analyzer";
import commonjs from "@rollup/plugin-commonjs";
import esbuild from "rollup-plugin-esbuild";
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";

const isProduction = process.env["NODE_ENV"] === "production";

const HOME = process.env["HOME"];

export default defineConfig({
	plugins: [
		// Prisma injects the home directory. Remove that:
		HOME === undefined
			? null
			: replace({
					values: {
						[HOME]: "~",
					},
					delimiters: ["", ""],
					preventAssignment: true,
				}),

		// Transpile source
		esbuild({
			tsconfig: "./tsconfig.prod.json",
			sourceMap: !isProduction,
			minify: isProduction,
		}), // translate TypeScript to JS
		commonjs({ extensions: [".js", ".ts"] }), // translate CommonJS to ESM
		json(), // translate JSON

		// Find external dependencies
		nodeResolve({
			exportConditions: ["node"],
			preferBuiltins: true,
		}),

		// Statistics
		analyze({ filter: () => false }), // only top-level summary
		visualizer(),
	],
	external: [
		// Circular, uses eval, unexpeted token in plugin-commonjs
		"discord.js",

		// Circular
		"winston-transport",
		"winston",
	],
	input: "src/main.ts",
	output: {
		file: "dist/server.js",
		format: "module",
		inlineDynamicImports: true,
		sourcemap: isProduction ? undefined : "inline",
	},
});
