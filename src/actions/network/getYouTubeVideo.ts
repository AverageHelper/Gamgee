import type { VideoDetails } from "../getVideoDetails.js";
import { validateURL } from "ytdl-core";
import { getYouTubeVideoViaApi } from "./youtubeMethods/getYouTubeVideoViaApi.js";
import { getYouTubeVideoViaYtdl } from "./youtubeMethods/getYouTubeVideoViaYtdl.js";
import { getEnv } from "../../helpers/environment.js";
import { InvalidYouTubeUrlError } from "../../errors/index.js";
import { useLogger } from "../../logger.js";

const logger = useLogger();

/**
 * Gets information about a YouTube video.
 *
 * @param url The track URL to check.
 * @param signal A signal that would indicate that we should abort the network request.
 *
 * @throws `InvalidYouTubeUrlError` if the provided URL is not a YouTube URL.
 * @throws `UnavailableError` if the video is unavailable in the United States.
 * @returns a `Promise` that resolves with the video details.
 */
export async function getYouTubeVideo(url: URL, signal?: AbortSignal): Promise<VideoDetails> {
	const urlString = url.href;
	if (!validateURL(urlString)) throw new InvalidYouTubeUrlError(url);

	const YOUTUBE_API_KEY = getEnv("YOUTUBE_API_KEY");
	if (YOUTUBE_API_KEY) {
		logger.debug("Found YouTube API key! Using first-party API...");
		return await getYouTubeVideoViaApi(YOUTUBE_API_KEY, url, signal);
	}

	// Try alternatives instead
	logger.debug("No YouTube API key found. Trying alternatives...");
	return await getYouTubeVideoViaYtdl(url, signal);
}
