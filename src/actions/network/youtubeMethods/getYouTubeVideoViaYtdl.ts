import type { VideoDetails } from "../../getVideoDetails.js";
import type { YouTubeVideoInfo } from "./getYouTubeVideoViaInvidius.js";
import { getBasicInfo, validateURL } from "ytdl-core";
import { getYouTubeVideoViaInvidius, invidiusBase } from "./getYouTubeVideoViaInvidius.js";
import { InvalidYouTubeUrlError, UnavailableError, VideoError } from "../../../errors/index.js";
import { richErrorMessage } from "../../../helpers/richErrorMessage.js";
import { useLogger } from "../../../logger.js";

const logger = useLogger();

export async function getYouTubeVideoViaYtdl(
	url: URL,
	signal?: AbortSignal,
): Promise<VideoDetails> {
	const urlString = url.href;
	if (!validateURL(urlString)) throw new InvalidYouTubeUrlError(url);

	let info: YouTubeVideoInfo;
	let usedInvidius = false;
	try {
		info = await getBasicInfo(urlString, { requestOptions: { signal } });
	} catch (error) {
		logger.error(richErrorMessage("YouTube failed.", error));
		logger.debug("Trying Invidius proxy instead...");

		// Try an Invidius instance instead
		try {
			usedInvidius = true;
			info = await getYouTubeVideoViaInvidius(url, signal);
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
		metaSource: {
			platformName: "youtube",
			alternative: usedInvidius ? invidiusBase.hostname : "ytdl",
		},
	};
}
