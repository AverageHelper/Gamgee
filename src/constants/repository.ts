import { version } from "../version.js";

/** Where our codebase lives. */
export const repository = new URL("https://git.average.name/AverageHelper/Gamgee");

/** A link to our changelog file. */
export const changelog = `${repository.href}/src/tag/v${version}/CHANGELOG.md`;

/** A link to the definitive list of our supported music platforms. */
export const supportedPlatformsList = `${repository.href}#supported-music-platforms`;
