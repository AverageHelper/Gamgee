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
		HOME !== undefined
			? replace({
					values: {
						[HOME]: "~"
					},
					delimiters: ["", ""],
					preventAssignment: true
				})
			: null,

		// Transpile source
		esbuild({
			tsconfig: "./tsconfig.prod.json",
			sourceMap: !isProduction,
			minify: isProduction
		}), // translate TypeScript to JS
		commonjs({ extensions: [".js", ".ts"] }), // translate CommonJS to ESM
		json(), // translate JSON

		// Find external dependencies
		nodeResolve({
			exportConditions: ["node"],
			preferBuiltins: true
		}),

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
		// prisma. Their `eval` calls are fairly tame, though this should
		// be audited with each update.
		const evalWhitelist = ["@prisma/client"];
		if (warning.code === "EVAL" && evalWhitelist.some(e => warning.loc?.file?.includes(e))) return;

		defaultHandler(warning);
	},
	external: [
		// Circular, uses eval
		"discord.js",

		// Circular
		"undici",
		"winston-transport",
		"winston",
		"yargs"
	],
	input: "src/main.ts",
	output: {
		file: "dist/server.js",
		format: "module",
		inlineDynamicImports: true,
		sourcemap: isProduction ? undefined : "inline"
	}
});
