import { version } from "../version.js";

/** Where our codebase lives. */
export const repository = new URL("https://github.com/AverageHelper/Gamgee");

/** A link to our changelog file. */
export const changelog = `${repository.href}/blob/v${version}/CHANGELOG.md`;

/** A link to the definitive list of our supported music platforms. */
export const supportedPlatformsList = `${repository.href}#supported-music-platforms`;
