import { defineConfig, globalIgnores } from "eslint/config";
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import prettier from "eslint-plugin-prettier";
import unicorn from "eslint-plugin-unicorn";
import promise from "eslint-plugin-promise";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import fileProgress from "eslint-plugin-file-progress";
import globals from "globals";
import * as tsParser from "@typescript-eslint/parser";
import vitest from "@vitest/eslint-plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default defineConfig([
	globalIgnores(["coverage", "eslint.config.mjs", "ecosystem.config.cjs", "**/dist", "**/node_modules", "src/database/prisma", "src/version.ts"]),
	{
		extends: fixupConfigRules(
			compat.extends(
				"strictest/eslint",
				"strictest/promise",
				"strictest/typescript-eslint",
				// "strictest/unicorn", // TODO: Incorporate these manually
				"eslint:recommended",
				"plugin:import/recommended",
				"plugin:import/typescript",
				"plugin:@typescript-eslint/recommended",
				"plugin:@typescript-eslint/recommended-requiring-type-checking",
				"plugin:prettier/recommended",
			),
		),

		plugins: {
			prettier: fixupPluginRules(prettier),
			promise,
			unicorn,
			"@typescript-eslint": fixupPluginRules(typescriptEslint),
			"file-progress": fileProgress,
		},

		languageOptions: {
			globals: {
				...globals.node,
			},

			parser: tsParser,
			ecmaVersion: 5,
			sourceType: "commonjs",

			parserOptions: {
				project: "./tsconfig.prod.json",
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				tsconfigRootDir: import.meta.dirname,
			},
		},

		settings: {
			"import/resolver": {
				typescript: true,
				node: true,
			},
		},

		rules: {
			// ...promise.configs["flat/recommended"].rules:
			"promise/always-return": "error",
			"promise/no-return-wrap": "error",
			"promise/param-names": "error",
			"promise/catch-or-return": "error",
			"promise/no-native": "off",
			"promise/no-nesting": "warn",
			"promise/no-promise-in-callback": "warn",
			"promise/no-callback-in-promise": "warn",
			"promise/avoid-new": "off",
			"promise/no-new-statics": "error",
			"promise/no-return-in-finally": "warn",
			"promise/valid-params": "warn",

			...unicorn.configs.unopinionated.rules,
			"file-progress/activate": process.env.CI ? 0 : 1, // display progress indicator only when running locally
			"prettier/prettier": "warn",
			"no-constant-condition": "warn",
			"no-console": "warn",
			"no-redeclare": "off", // TS handles this
			"no-dupe-else-if": "warn",
			"spaced-comment": ["warn", "always", { exceptions: ["*"] }], // doc comments exist
			"import/extensions": ["error", "always", { ts: "never" }], // require extensions
			"consistent-return": "off", // TS handles this
			"no-duplicate-imports": "off", // eslint-plugin-import handles this
			"@typescript-eslint/no-empty-interface": "off",
			"@typescript-eslint/require-await": "warn",
			"@typescript-eslint/no-deprecated": "warn",
			"@typescript-eslint/no-inferrable-types": "off",
			"@typescript-eslint/no-invalid-void-type": ["error", { allowAsThisParameter: true }],
			"@typescript-eslint/explicit-member-accessibility": [
				"error",
				{
					accessibility: "no-public",
					overrides: { properties: "off" },
				},
			],
			"@typescript-eslint/explicit-function-return-type": [
				"error",
				{
					allowConciseArrowFunctionExpressionsStartingWithVoid: true,
				},
			],
			"@typescript-eslint/consistent-type-definitions": ["warn", "interface"],
			"@typescript-eslint/array-type": ["warn", { default: "generic" }],
			"@typescript-eslint/dot-notation": "off",
			"@typescript-eslint/no-unused-vars": "warn",
			"unicorn/catch-error-name": ["warn", { name: "error" }],
			"unicorn/no-process-exit": "off", // we are a CLI app lol
			"unicorn/no-useless-undefined": "off", // checking for undefined return is useful for tests
			"unicorn/text-encoding-identifier-case": ["error", { withDash: true }],
		},
	},
	{
		files: [
			"**/*.ts",
			"./*.mjs",
			"./*.cjs",
			"src/**/*.test.ts",
			"src/**/__mocks__/**/*.ts",
			"tests/**/*.ts",
		],

		plugins: {
			vitest,
		},

		languageOptions: {
			ecmaVersion: 5,
			sourceType: "script",
			parser: tsParser,
			parserOptions: {
				project: "./tsconfig.test.json",
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				tsconfigRootDir: import.meta.dirname,
			},
		},

		rules: {
			...vitest.configs.recommended.rules,
			"vitest/expect-expect": [
				"warn",
				{
					assertFunctionNames: [
						"expect",
						"expectArray",
						"expectArrayOfLength",
						"expectDefined",
						"expectNull",
						"expectToContain",
						"expectUndefined",
						"expectValueEqual",
					],
				},
			],
			"max-nested-callbacks": "off", // unit tests involve a lot of nested callbacks
			"prettier/prettier": "warn",
		},
	},
	{
		files: ["scripts/**/*.ts"],

		languageOptions: {
			ecmaVersion: 5,
			sourceType: "script",

			parserOptions: {
				project: "./tsconfig.test.json",
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				tsconfigRootDir: import.meta.dirname,
			},
		},

		rules: {
			"no-console": ["warn", { allow: ["error", "warn", "info"] }],
		},
	},
]);
