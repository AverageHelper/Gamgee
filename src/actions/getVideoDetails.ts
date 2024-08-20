import type { Logger } from "../logger.js";
import { getBandcampTrack } from "./network/getBandcampTrack.js";
import { getPonyFmTrack } from "./network/getPonyFmTrack.js";
import { getSoundCloudTrack } from "./network/getSoundCloudTrack.js";
import { getYouTubeVideo } from "./network/getYouTubeVideo.js";
import { richErrorMessage } from "../helpers/richErrorMessage.js";
import { MILLISECONDS_IN_SECOND } from "../constants/time.js";
import { useLogger } from "../logger.js";

export interface VideoDetails {
	url: string;
	title: string;
	duration: {
		seconds: number;
	};
}

/**
 * Retrieves details about a video.
 *
 * @param urlOrString The location of an online video. If the URL is a YouTube
 * or SoundCloud link, video details are retrieved directly. If the value is a
 * string, only the substring up to (but not including) the first whitespace
 * is considered.
 * @param logger The place to report errors.
 *
 * @returns a details about the video, or `null` if no video could be
 * found from the provided query.
 */
export async function getVideoDetails(
	urlOrString: URL | string,
	logger: Logger | null = useLogger(),
): Promise<VideoDetails | null> {
	let timeout: NodeJS.Timeout | undefined;

	try {
		const url: URL =
			typeof urlOrString === "string" ? new URL(urlOrString.split(/\s+/u)[0] ?? "") : urlOrString;

		// Abort after a few seconds if all handlers are taking too long
		const aborter = new AbortController();
		const timeoutSeconds = 8;
		timeout = setTimeout(() => aborter.abort(), timeoutSeconds * MILLISECONDS_IN_SECOND);

		const result = await Promise.any([
			getYouTubeVideo(url, aborter.signal),
			getSoundCloudTrack(url, aborter.signal),
			getBandcampTrack(url, aborter.signal),
			getPonyFmTrack(url, aborter.signal),
		]);

		// Abort other requests
		aborter.abort();

		return result;
	} catch (error) {
		logger?.error(
			richErrorMessage(`Failed to fetch song using url '${urlOrString.toString()}'`, error),
		);
		return null;
	} finally {
		clearTimeout(timeout);
	}
}
