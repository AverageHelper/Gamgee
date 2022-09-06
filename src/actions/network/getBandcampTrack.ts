import type { Metadata } from "../../helpers/urlMetadata/index.js";
import type { URL } from "node:url";
import type { VideoDetails } from "../getVideoDetails.js";
import { isString } from "../../helpers/guards.js";
import { VideoError } from "../../errors/index.js";
import urlMetadata from "../../helpers/urlMetadata/index.js";

/**
 * Gets information about a Bandcamp track.
 *
 * @param url The track URL to check.
 *
 * @throws an error if metadata couldn't be found on the webpage pointed to by the
 * provided `url`, or a `VideoError` if no song duration or title could be found in
 * that metadata.
 * @returns a `Promise` that resolves with the track details.
 */
export async function getBandcampTrack(url: URL): Promise<VideoDetails> {
	// TODO: look into https://www.npmjs.com/package/metascraper
	let metadata: Metadata;
	try {
		metadata = await urlMetadata(url, { timeout: 5000 });
	} catch (error) {
		throw new VideoError(error);
	}

	type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
	const json = metadata.jsonld as
		| { name?: string; duration: `${string}H${Digit}${Digit}M${Digit}${Digit}S` }
		| undefined;
	if (!json) throw new VideoError("Duration and title not found");
	if (!json.duration || !isString(json.duration)) throw new VideoError("Duration data not found");

	const durationPropertiesMatch = json.duration.matchAll(/H([0-9]+)M([0-9]+)S/gu);
	const durationProperties = Array.from(durationPropertiesMatch)[0] as
		| [string, string, string, ...Array<string>] // at least 3 strings
		| undefined;

	// Sanity checks (I have a college education and I don't understand regex)
	if (!durationProperties || durationProperties.length < 3 || !durationProperties.every(isString))
		throw new VideoError("Duration not found");

	const minutes = Number.parseInt(durationProperties[1], 10);
	const seconds = Number.parseInt(durationProperties[2], 10);
	if (Number.isNaN(minutes) || Number.isNaN(seconds)) throw new VideoError("Duration not found");

	const totalSeconds = minutes * 60 + seconds;

	const title: string | null = json.name ?? null;
	if (title === null || !title) throw new VideoError("Title not found");

	return {
		url: metadata.url ?? url.href,
		title,
		duration: { seconds: Math.floor(totalSeconds) }
	};
}
