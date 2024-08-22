import type { Infer } from "superstruct";
import type { VideoDetails, VideoMetaSource } from "../getVideoDetails.js";
import { InvalidPonyFmUrlError, VideoError } from "../../errors/index.js";
import { is, string, type } from "superstruct";

// From https://github.com/Poniverse/Pony.fm/blob/a1522f3cd73d849099e4a3d897656dc8c4795dd7/app/Http/Controllers/Api/V1/TracksController.php#L129
const ponyFmTrackAPIResponse = type({
	title: string(),
	url: string(),
	duration: string(),
});

type PonyFmTrackAPIResponse = Infer<typeof ponyFmTrackAPIResponse>;

function isPonyFmTrackAPIResponse(tbd: unknown): tbd is PonyFmTrackAPIResponse {
	return is(tbd, ponyFmTrackAPIResponse);
}

const ponyFmTrackAPIError = type({
	message: string(),
});

type PonyFmTrackAPIError = Infer<typeof ponyFmTrackAPIError>;

function isPonyFmTrackAPIError(tbd: unknown): tbd is PonyFmTrackAPIError {
	return is(tbd, ponyFmTrackAPIError);
}

const metaSource: Readonly<VideoMetaSource> = {
	platformName: "pony.fm",
	alternative: null,
};

/**
 * Gets information about a Pony.fm track.
 *
 * @param trackId The Pony.fm track ID to get information for.
 * @param signal A signal that would indicate that we should abort the network request.
 *
 * @throws a `VideoError` if the track info couldn't be found for the provided ID.
 * @returns a `Promise` that resolves with the track details.
 */
async function getPonyFmTrackInfoFromId(
	trackId: number,
	signal?: AbortSignal,
): Promise<PonyFmTrackAPIResponse> {
	const response = await fetch(`https://pony.fm/api/v1/tracks/${trackId}`, { signal });
	if (response.status === 200) {
		try {
			const responseParsed: unknown = await response.json();
			if (!isPonyFmTrackAPIResponse(responseParsed)) {
				throw new VideoError(`Malformed response from Pony.fm API`); // TODO: i18n?
			}
			return responseParsed;
		} catch (error) {
			if (error instanceof SyntaxError) {
				throw new VideoError(`Malformed response from Pony.fm API`); // TODO: i18n?
			}
			throw error;
		}
	}
	if (response.status === 404) {
		const responseParsed: unknown = await response.json();
		if (!isPonyFmTrackAPIError(responseParsed)) {
			throw new VideoError(
				`Pony.fm API errored with malformed body: ${JSON.stringify(responseParsed)}`,
			); // TODO: i18n?
		}
		throw new VideoError(`Pony.fm API errored: ${responseParsed.message}`); // TODO: i18n?
	}
	throw new VideoError(`Unexpected status code from Pony.fm API: ${response.status}`); // TODO: i18n?
}

/**
 * Gets information about a Pony.fm track.
 *
 * @param url The track URL to check.
 * @param signal A signal that would indicate that we should abort the network request.
 *
 * @throws an `InvalidPonyFmUrlError` if the provided URL is not a Pony.fm URL.
 * @throws a `VideoError` if the track info couldn't be found for the provided URL.
 * @returns a `Promise` that resolves with the track details.
 */
export async function getPonyFmTrack(url: URL, signal?: AbortSignal): Promise<VideoDetails> {
	// Full link looks like this: https://pony.fm/tracks/46025-beneath-the-sea-ft-lectro-dub-studio-quinn-liv-learn-zelizine
	// Short link looks like this: https://pony.fm/t46025

	const pathnameLower = url.pathname.toLowerCase();

	// Throw out obviously invalid links
	if (url.host.toLowerCase() !== "pony.fm" || !pathnameLower.startsWith("/t")) {
		throw new InvalidPonyFmUrlError(url);
	}

	// Calculate start index based on link type
	const startIndex = pathnameLower.startsWith("racks/", 2) ? 8 : 2;

	// Parse out ID and fetch track info
	const trackId = Number.parseInt(url.pathname.slice(startIndex), 10);
	if (Number.isNaN(trackId)) {
		throw new InvalidPonyFmUrlError(url);
	}
	const trackData = await getPonyFmTrackInfoFromId(trackId, signal);

	return {
		url: trackData.url,
		title: trackData.title,
		duration: { seconds: Math.floor(Number.parseFloat(trackData.duration)) },
		metaSource,
	};
}
