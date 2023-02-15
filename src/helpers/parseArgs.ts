import { hideBin } from "yargs/helpers";
import { version as gamgeeVersion } from "../version.js";
import yargs from "yargs";

export interface Args {
	readonly deploy: boolean;
	readonly revoke: boolean;
}

let parsedArgs: Args | null = null;

/**
 * Retrieves the command-line arguments, if any.
 */
export function parseArgs(): Args {
	if (parsedArgs) return parsedArgs;

	parsedArgs = yargs(hideBin(process.argv))
		.option("deploy", {
			alias: "c",
			description: "Upload Discord commands, then exit",
			type: "boolean",
			default: false
		})
		.option("revoke", {
			alias: "C",
			description: "Revoke Discord commands, then exit",
			type: "boolean",
			default: false
		})
		.version(gamgeeVersion)
		.help()
		.alias("h", "help")
		.alias("v", "version")
		.parseSync();

	return parsedArgs;
}
