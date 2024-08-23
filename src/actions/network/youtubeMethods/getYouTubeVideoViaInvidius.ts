import type { videoInfo as YTVideoInfo } from "ytdl-core";
import { array, boolean, is, number, string, type } from "superstruct";
import { getURLVideoID } from "ytdl-core";
import { richErrorMessage } from "../../../helpers/richErrorMessage.js";
import { useLogger } from "../../../logger.js";
import { NotFoundError, UnavailableError, VideoError } from "../../../errors/index.js";

export interface YouTubeVideoInfo {
	videoDetails: Pick<
		YTVideoInfo["videoDetails"],
		"availableCountries" | "isLiveContent" | "lengthSeconds" | "title" | "video_url"
	>;
}

const logger = useLogger();

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

export const invidiusBase = new URL("https://iv.ggtyler.dev/"); // TODO: Make this configurable

export async function getYouTubeVideoViaInvidius(
	url: URL,
	signal?: AbortSignal,
): Promise<YouTubeVideoInfo> {
	// See https://docs.invidious.io/api/#get-apiv1videosid
	const baseUrl = invidiusBase;
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
