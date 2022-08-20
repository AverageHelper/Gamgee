/**
 * An error object which identifies a missing environment variable.
 */
export class EnvVariableNotFoundError extends Error {
	constructor(name: string) {
		super(`${name} not found in environment variables.`); // TODO: i18n?
		this.name = "EnvVariableNotFoundError";
	}
}
