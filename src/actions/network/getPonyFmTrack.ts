import type { URL } from "node:url";
import type { VideoDetails } from "../getVideoDetails.js";
import { fetchWithTimeout } from "../../helpers/fetch.js";
import { isObject, isString } from "../../helpers/guards.js";
import { InvalidPonyFmUrlError, VideoError } from "../../errors/index.js";

// Based on https://github.com/Poniverse/Pony.fm/blob/a1522f3cd73d849099e4a3d897656dc8c4795dd7/app/Http/Controllers/Api/V1/TracksController.php#L129
interface PonyFmTrackAPIResponse {
	// id: number;
	title: string;
	// description: string;
	// lyrics: string;
	// user: {
	//	id: number;
	//	name: string;
	//	url: string;
	//	avatars: {
	//		thumbnail: string;
	//		small: string;
	//		normal: string;
	//	};
	// };
	// stats: {
	//	views: number;
	//	plays: number;
	//	downloads: number;
	//	comments: number;
	//	favourites: number;
	// };
	url: string;
	// is_vocal: boolean;
	// is_explicit: boolean;
	// is_downloadable: boolean;
	// published_at: {
	//	date: string;
	//	timezone_type: number;
	//	timezone: string;
	// };
	duration: string;
	// genre?: {
	//	id: number;
	//	name: string;
	// };
	// type: {
	//	id: number;
	//	name: string;
	// };
	// covers: {
	//	thumbnail: string;
	//	small: string;
	//	normal: string;
	// };
	// source: string;
	// streams: {
	//	mp3: {
	//		url: string;
	//		mime_type: string;
	//	};
	// };
}

function isPonyFmTrackAPIResponse(resp: unknown): resp is PonyFmTrackAPIResponse {
	return (
		isObject(resp) &&
		isString((resp as unknown as PonyFmTrackAPIResponse).title) &&
		isString((resp as unknown as PonyFmTrackAPIResponse).duration) &&
		isString((resp as unknown as PonyFmTrackAPIResponse).url)
	);
}

interface PonyFmTrackAPIError {
	message: string;
}

function isPonyFmTrackAPIError(resp: unknown): resp is PonyFmTrackAPIError {
	return isObject(resp) && isString((resp as unknown as PonyFmTrackAPIError).message);
}

/**
 * Gets information about a Pony.fm track.
 *
 * @param trackId The Pony.fm track ID to get information for.
 *
 * @throws a `VideoError` if the track info couldn't be found for the provided ID.
 * @returns a `Promise` that resolves with the track details.
 */
async function getPonyFmTrackInfoFromId(
	trackId: number,
	timeoutSeconds?: number
): Promise<PonyFmTrackAPIResponse> {
	const response = await fetchWithTimeout(
		`https://pony.fm/api/v1/tracks/${trackId}`,
		timeoutSeconds
	);
	if (response.status === 200) {
		try {
			const responseParsed = (await response.json()) as unknown;
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
		const responseParsed = (await response.json()) as unknown;
		if (!isPonyFmTrackAPIError(responseParsed)) {
			throw new VideoError(
				`Pony.fm API errored with malformed body: ${JSON.stringify(responseParsed)}`
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
 *
 * @throws an `InvalidPonyFmUrlError` if the provided URL is not a Pony.fm URL.
 * @throws a `VideoError` if the track info couldn't be found for the provided URL.
 * @returns a `Promise` that resolves with the track details.
 */
export async function getPonyFmTrack(url: URL, timeoutSeconds?: number): Promise<VideoDetails> {
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
	const trackData = await getPonyFmTrackInfoFromId(trackId, timeoutSeconds);

	return {
		url: trackData.url,
		title: trackData.title,
		duration: { seconds: Math.floor(Number.parseFloat(trackData.duration)) }
	};
}
