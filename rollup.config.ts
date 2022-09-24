import { defineConfig } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import { visualizer } from "rollup-plugin-visualizer";
import analyze from "rollup-plugin-analyzer";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";

const isProduction = process.env["NODE_ENV"] === "production";

export default defineConfig({
	plugins: [
		// Transpile source
		typescript({
			tsconfig: "./tsconfig.prod.json",
			sourceMap: !isProduction
		}), // translate TypeScript to JS
		commonjs({ extensions: [".js", ".ts"] }), // translate CommonJS to ESM
		json(), // translate JSON

		// Find external dependencies
		nodeResolve({
			exportConditions: ["node"],
			preferBuiltins: true
		}),

		// Minify output
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
		// TODO: PR @averagehelper/job-queue to fix this
		if (warning.code === "THIS_IS_UNDEFINED") return;

		// Ignore "Use of eval is strongly discouraged" warnings from
		// certain packages. Their `eval` calls are fairly tame, though
		// they should be audited with every update.
		const evalWhitelist = [
			"@prisma/client", //
			"discord.js"
		];
		if (warning.code === "EVAL" && evalWhitelist.some(e => warning.loc?.file?.includes(e))) return;

		const circularWhitelist = [
			"async", //
			"undici",
			"winston-transport",
			"winston",
			"yargs"
		];
		if (
			warning.code === "CIRCULAR_DEPENDENCY" &&
			circularWhitelist.some(d => warning.importer?.includes(d))
		)
			return;

		defaultHandler(warning);
	},
	external: ["discord.js"],
	input: "src/main.ts",
	output: {
		file: "dist/server.js",
		format: "commonjs",
		inlineDynamicImports: true,
		sourcemap: isProduction ? undefined : "inline"
	}
});
