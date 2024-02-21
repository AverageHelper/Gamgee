import type { ParseArgsConfig } from "node:util";
import { version } from "../version.js";
import { parseArgs as _parseArgs } from "node:util";

export interface Args {
	readonly deploy: boolean;
	readonly revoke: boolean;
}

type ParseArgsOptionConfig = Exclude<ParseArgsConfig["options"], undefined>[string];

interface ArgOption extends ParseArgsOptionConfig {
	description: string;
}

let parsedArgs: Args | null = null;

/**
 * Retrieves the command-line arguments, if any.
 */
export function parseArgs(): Args {
	if (parsedArgs) return parsedArgs;

	const parsedValues = _parseArgs({
		strict: true,
		allowPositionals: false,
		options: {
			deploy: {
				type: "boolean",
				short: "c",
				description: "Upload Discord commands, then exit",
			} satisfies ArgOption,
			revoke: {
				type: "boolean",
				short: "C",
				description: "Revoke Discord commands, then exit",
			} satisfies ArgOption,
			help: {
				type: "boolean",
				short: "h",
				description: "Show help",
			} satisfies ArgOption,
			version: {
				type: "boolean",
				short: "v",
				description: "Show version number",
			} satisfies ArgOption,
		},
	}).values;

	if (parsedValues.version) {
		// Print version and exit
		process.stdout.write(`${version}\n`);
		process.exit(0);
	}

	if (parsedValues.help) {
		// Print help page and exit
		let output = "Options:";

		const stuffToWrite = [
			"-c, --deploy   Upload Discord commands, then exit   [boolean] [default: false]",
			"-C, --revoke   Revoke Discord commands, then exit   [boolean] [default: false]",
			"-h, --help     Show help                                             [boolean]",
			"-v, --version  Show version number                                   [boolean]",
		];
		for (const stuff of stuffToWrite) {
			output += "\n  ";
			output += stuff;
		}

		process.stdout.write(`${output}\n\n`);
		process.exit(0);
	}

	parsedArgs = {
		deploy: parsedValues.deploy ?? false,
		revoke: parsedValues.revoke ?? false,
	};

	return parsedArgs;
}
