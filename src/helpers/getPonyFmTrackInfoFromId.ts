import fetch from "node-fetch";
import { VideoError } from "../actions/getVideoDetails.js";
import { isObject, isString } from "./guards.js";

// Based on https://github.com/Poniverse/Pony.fm/blob/a1522f3cd73d849099e4a3d897656dc8c4795dd7/app/Http/Controllers/Api/V1/TracksController.php#L129
export interface PonyFmTrackAPIResponse {
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
		isString(((resp as unknown) as PonyFmTrackAPIResponse).title) &&
		isString(((resp as unknown) as PonyFmTrackAPIResponse).duration) &&
		isString(((resp as unknown) as PonyFmTrackAPIResponse).url)
	);
}

export interface PonyFmTrackAPIError {
	message: string;
}

function isPonyFmTrackAPIError(resp: unknown): resp is PonyFmTrackAPIError {
	return isObject(resp) && isString(((resp as unknown) as PonyFmTrackAPIError).message);
}

/**
 * Gets information about a Pony.fm track.
 *
 * @param trackId The Pony.fm track ID to get information for.
 *
 * @throws a `VideoError` if the track info couldn't be found for the provided ID.
 * @returns a `Promise` that resolves with the track details.
 */
export async function getPonyFmTrackInfoFromId(trackId: number): Promise<PonyFmTrackAPIResponse> {
	const response = await fetch(`https://pony.fm/api/v1/tracks/${trackId}`);
	if (response.status === 200) {
		const responseParsed = (await response.json()) as unknown;
		if (!isPonyFmTrackAPIResponse(responseParsed)) {
			throw new VideoError(`Malformed response from Pony.fm API`);
		}
		return responseParsed;
	}
	if (response.status === 404) {
		const responseParsed = (await response.json()) as unknown;
		if (!isPonyFmTrackAPIError(responseParsed)) {
			throw new VideoError(
				`Pony.fm API errored with malformed body: ${JSON.stringify(responseParsed)}`
			);
		}
		throw new VideoError(`Pony.fm API errored: ${responseParsed.message}`);
	}
	throw new VideoError(`Unexpected status code from Pony.fm API: ${response.status}`);
}
