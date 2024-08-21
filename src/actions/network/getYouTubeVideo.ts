import type { VideoDetails } from "../getVideoDetails.js";
import type { videoInfo as YTVideoInfo } from "ytdl-core";
import { array, boolean, is, number, string, type } from "superstruct";
import { getBasicInfo, validateURL, getURLVideoID } from "ytdl-core";
import { useLogger } from "../../logger.js";
import { richErrorMessage } from "../../helpers/richErrorMessage.js";
import {
	InvalidYouTubeUrlError,
	NotFoundError,
	UnavailableError,
	VideoError,
} from "../../errors/index.js";

const logger = useLogger();

interface YouTubeVideoInfo {
	videoDetails: Pick<
		YTVideoInfo["videoDetails"],
		"availableCountries" | "isLiveContent" | "lengthSeconds" | "title" | "video_url"
	>;
}

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

	let info: YouTubeVideoInfo;
	try {
		info = await getBasicInfo(urlString, { requestOptions: { signal } });
	} catch (error) {
		logger.error(richErrorMessage("YouTube failed.", error));
		logger.debug("Trying Invidius proxy instead...");

		// Try an Invidius instance instead
		// TODO: Report upstream that a proxy was used, and show that in `/test` output
		try {
			info = await invidius(url, signal);
		} catch (error) {
			if (error instanceof VideoError) {
				throw error;
			}
			throw new VideoError(error);
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

const invVideoInfo = type({
	title: string(),
	videoId: string(),
	allowedRegions: array(string()),
	lengthSeconds: number(),
	liveNow: boolean(),
});

const invVideoError = type({
	error: string(),
});

async function invidius(url: URL, signal?: AbortSignal): Promise<YouTubeVideoInfo> {
	// See https://docs.invidious.io/api/#get-apiv1videosid
	const baseUrl = new URL("https://iv.ggtyler.dev/"); // TODO: Make this configurable
	const videoId = getURLVideoID(url.href);
	const detailsUrl = new URL(`/api/v1/videos/${videoId}`, baseUrl);
	const response = await fetch(detailsUrl, { signal });

	const responseParsed: unknown = await response.json();
	switch (response.status) {
		case 200: {
			try {
				if (!is(responseParsed, invVideoInfo)) {
					const message = `Malformed response from Invidius proxy ${baseUrl.hostname} with status ${response.status}.`; // TODO: i18n?
					logger.error(richErrorMessage(message, responseParsed));
					throw new VideoError(message);
				}
				// return responseParsed;
				const video_url = new URL("https://www.youtube.com/watch?v=");
				video_url.searchParams.set("v", responseParsed.videoId);
				return {
					videoDetails: {
						availableCountries: responseParsed.allowedRegions,
						isLiveContent: responseParsed.liveNow,
						lengthSeconds: `${responseParsed.lengthSeconds}`,
						title: responseParsed.title,
						video_url: video_url.href,
					},
				};
			} catch (error) {
				if (error instanceof SyntaxError) {
					const message = `Malformed response from Invidius proxy ${baseUrl.hostname} with status ${response.status}.`; // TODO: i18n?
					logger.error(richErrorMessage(message, responseParsed));
					throw new VideoError(message);
				}
				throw error;
			}
		}

		case 404: {
			if (!is(responseParsed, invVideoError)) {
				const message = `Malformed response from Invidius proxy ${baseUrl.hostname} with status ${response.status}.`; // TODO: i18n?
				logger.error(richErrorMessage(message, responseParsed));
				throw new VideoError(message);
			}
			logger.error(
				richErrorMessage(`Invidius proxy ${baseUrl.hostname} answered 404.`, responseParsed),
			);
			if (responseParsed.error === "Video unavailable") {
				// Not sure why this sometimes comes back from both 404 and 500...
				throw new UnavailableError(url);
			}
			throw new NotFoundError(url);
		}

		case 410: // TODO: Should 410 be a "youtube is down" error from the proxy?
		case 500: {
			if (!is(responseParsed, invVideoError)) {
				const message = `Malformed response from Invidius proxy ${baseUrl.hostname} with status ${response.status}.`; // TODO: i18n?
				logger.error(richErrorMessage(message, responseParsed));
				throw new VideoError(message);
			}
			const message = `Invidius proxy ${baseUrl.hostname} errored with status ${response.status}.`; // TODO: i18n?
			logger.error(richErrorMessage(message, responseParsed));
			if (responseParsed.error === "This video is not available") {
				// Not sure why this sometimes comes back from both 404 and 500...
				throw new UnavailableError(url);
			}
			throw new VideoError(message);
		}

		default: {
			const message = `Unexpected status code ${response.status} from Invidius proxy ${baseUrl.hostname}`; // TODO: i18n?
			logger.error(richErrorMessage(message, responseParsed));
			throw new VideoError(message);
		}
	}
}
