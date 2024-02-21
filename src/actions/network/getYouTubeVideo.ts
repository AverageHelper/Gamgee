import type { VideoDetails } from "../getVideoDetails.js";
import type { videoInfo as YTVideoInfo } from "ytdl-core";
import { getBasicInfo, validateURL } from "ytdl-core";
import {
	InvalidYouTubeUrlError,
	NotFoundError,
	UnavailableError,
	VideoError,
} from "../../errors/index.js";

/**
 * Gets information about a YouTube video.
 *
 * @param url The track URL to check.
 *
 * @throws `InvalidYouTubeUrlError` if the provided URL is not a YouTube URL.
 * @throws `UnavailableError` if the video is unavailable in the United States.
 * @returns a `Promise` that resolves with the video details.
 */
export async function getYouTubeVideo(url: URL): Promise<VideoDetails> {
	const urlString = url.href;
	if (!validateURL(urlString)) throw new InvalidYouTubeUrlError(url);

	let info: YTVideoInfo;
	try {
		info = await getBasicInfo(urlString);
	} catch (error) {
		const err = new VideoError(error);
		switch (err.message) {
			case "Status code: 410":
			case "Video unavailable":
				throw new UnavailableError(url);
			case "Status code: 404":
				throw new NotFoundError(url);
			default:
				throw err;
		}
	}
	if (!info.videoDetails.availableCountries.includes("US")) {
		throw new UnavailableError(url);
	}

	const rawSeconds = Number.parseInt(info.videoDetails.lengthSeconds, 10);

	// Active streams have zero length. VODs do not.
	const seconds: number =
		info.videoDetails.isLiveContent && rawSeconds <= 0
			? Number.POSITIVE_INFINITY //
			: rawSeconds;

	return {
		url: info.videoDetails.video_url,
		title: info.videoDetails.title,
		duration: { seconds },
	};
}
