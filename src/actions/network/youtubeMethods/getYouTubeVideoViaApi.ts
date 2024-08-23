import type { VideoDetails, VideoMetaSource } from "../../getVideoDetails.js";
import { array, enums, is, literal, optional, string, type } from "superstruct";
import { getURLVideoID } from "ytdl-core";
import { secondsFromIso8601Duration } from "../../../helpers/secondsFromIso8601Duration.js";
import { useLogger } from "../../../logger.js";
import { richErrorMessage } from "../../../helpers/richErrorMessage.js";
import { VideoError } from "../../../errors/VideoError.js";
import { UnavailableError } from "../../../errors/UnavailableError.js";

const logger = useLogger();

const metaSource: Readonly<VideoMetaSource> = {
	platformName: "youtube",
	alternative: null,
};

// See https://developers.google.com/youtube/v3/docs/videos/list
const youtubeDataApiResponse = type({
	kind: literal("youtube#videoListResponse"),
	items: array(
		// See https://developers.google.com/youtube/v3/docs/videos
		type({
			id: string(),
			snippet: type({
				title: string(),
				liveBroadcastContent: enums(["live", "none", "upcoming"]),
			}),
			contentDetails: type({
				/** An ISO 8601 duration string */
				duration: string(),
				regionRestriction: optional(
					type({
						allowed: optional(array(string())),
						blocked: optional(array(string())),
					}),
				),
			}),
		}),
	),
});

export async function getYouTubeVideoViaApi(
	key: string,
	url: URL,
	signal?: AbortSignal,
): Promise<VideoDetails> {
	const videoId = getURLVideoID(url.href);
	const api = new URL("https://www.googleapis.com/youtube/v3/videos");
	api.searchParams.set("key", key);
	api.searchParams.set("id", videoId);
	api.searchParams.set("maxResults", "1");
	api.searchParams.set("part", "snippet,contentDetails,id");

	const response = await fetch(api, { signal });
	const info: unknown = await response.json();
	if (!is(info, youtubeDataApiResponse)) {
		const message = `Malformed response from YouTube Data API with status ${response.status}.`; // TODO: i18n?
		logger.error(richErrorMessage(message, info));
		throw new VideoError(message);
	}

	// Construct a VideoDetails from the response payload
	const video = info.items[0];
	if (!video) {
		throw new UnavailableError(url);
	}

	if (
		video.contentDetails.regionRestriction?.blocked?.includes("US") ||
		video.snippet.liveBroadcastContent === "upcoming"
	) {
		throw new UnavailableError(url);
	}

	let durationSeconds: number;
	if (video.snippet.liveBroadcastContent === "live") {
		durationSeconds = Number.POSITIVE_INFINITY;
	} else {
		durationSeconds = secondsFromIso8601Duration(video.contentDetails.duration);
	}

	return {
		url: `https://www.youtube.com/watch?v=${video.id}`, // TODO: Is there a way to get a canonical URL from YouTube directly?
		title: video.snippet.title,
		duration: {
			seconds: durationSeconds,
		},
		metaSource,
	};
}
