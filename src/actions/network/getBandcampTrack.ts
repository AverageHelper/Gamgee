import type { VideoDetails } from "../getVideoDetails.js";
import { array, is, string, type } from "superstruct";
import { fetchMetadata } from "../../helpers/fetchMetadata.js";
import { richErrorMessage } from "../../helpers/richErrorMessage.js";
import { secondsFromIso8601Duration } from "../../helpers/secondsFromIso8601Duration.js";
import { useLogger } from "../../logger.js";
import { VideoError } from "../../errors/index.js";

const logger = useLogger();

const bandcampJsonld = array(
	type({
		/** The title of the track. */
		name: string(),
		/** An ISO 8601 duration string. */
		duration: string(),
	}),
);

/**
 * Gets information about a Bandcamp track.
 *
 * @param url The track URL to check.
 * @param signal A signal that would indicate that we should abort the network request.
 *
 * @throws an error if metadata couldn't be found on the webpage pointed to by the
 * provided `url`, or a `VideoError` if no song duration or title could be found in
 * that metadata.
 * @returns a `Promise` that resolves with the track details.
 */
export async function getBandcampTrack(url: URL, signal?: AbortSignal): Promise<VideoDetails> {
	const metadata = await fetchMetadata(url, signal);

	const jsonld = metadata.jsonld ?? [];
	if (!is(jsonld, bandcampJsonld)) throw new VideoError("Duration or title not found");

	const json = jsonld[0];
	if (!json) throw new VideoError("Duration and title not found");

	const durationString = json["duration"];
	let durationSeconds: number;
	try {
		let durationStringToParse = durationString;
		// Bandcamp's duration strings often don't parse correctly...
		if (durationString.startsWith("P00H")) {
			logger.debug(`Got nonstandard duration string '${durationString}'. Attempting workaround...`);
			durationStringToParse = `PT${durationString.slice(1)}`;
		}
		durationSeconds = secondsFromIso8601Duration(durationStringToParse);
	} catch (error) {
		logger.error(
			richErrorMessage(`Failed to parse ISO 8601 duration string '${durationString}'.`, error),
		);
		throw new VideoError("Duration could not be parsed");
	}

	const title: string = json["name"];
	if (!title) throw new VideoError("Title not found");

	return {
		url: url.href,
		title,
		duration: { seconds: durationSeconds },
	};
}
