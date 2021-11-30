import type { Logger } from "../logger";
import { URL } from "url";
import { useLogger } from "../logger";
import isError from "../helpers/isError";
import richErrorMessage from "../helpers/richErrorMessage";
import SoundCloud from "soundcloud-scraper";
import urlMetadata from "url-metadata";
import ytdl from "ytdl-core";

export interface VideoDetails {
	url: string;
	title: string;
	duration: {
		seconds: number;
	};
}

export class VideoError extends Error implements NodeJS.ErrnoException {
	code = "500";

	constructor(error: unknown) {
		super("Unknown error");

		if (isError(error)) {
			this.message = error.message;
			this.code = error.code ?? "500";
			this.stack = error.stack;
		} else {
			this.message = JSON.stringify(error);
		}
		this.name = "VideoError";
	}
}

export class NotFoundError extends VideoError {
	code = "404";

	constructor(url: URL) {
		super(`No video found at ${url.toString()}`);
		this.name = "NotFoundError";
	}
}

export class UnavailableError extends VideoError {
	code = "410";

	constructor(url: URL) {
		super(`The video at this URL is not available: ${url.toString()}`);
		this.name = "UnavailableError";
	}
}

export class InvalidYouTubeUrlError extends VideoError {
	code = "422";

	constructor(url: URL) {
		super(`This URL isn't a valid YouTube video URL: ${url.toString()}`);
		this.name = "InvalidYouTubeUrlError";
	}
}

/**
 * Gets information about a YouTube video.
 *
 * @param url The track URL to check.
 *
 * @throws `InvalidYouTubeUrlError` if the provided URL is not a YouTube URL.
 * @throws `UnavailableError` if the video is unavailable in the United States.
 * @throws `NotFoundError` if the video could not be found.
 * @returns a `Promise` that resolves with the video details.
 */
export async function getYouTubeVideo(url: URL): Promise<VideoDetails> {
	const urlString = url.toString();
	if (!ytdl.validateURL(urlString)) throw new InvalidYouTubeUrlError(url);

	let info: ytdl.videoInfo;
	try {
		info = await ytdl.getBasicInfo(urlString);
	} catch (error: unknown) {
		const err = new VideoError(error);
		switch (err.message) {
			case "Status code: 410":
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

	let seconds: number;
	if (info.videoDetails.isLiveContent) {
		seconds = Number.POSITIVE_INFINITY;
	} else {
		seconds = Number.parseInt(info.videoDetails.lengthSeconds, 10);
	}

	return {
		url: info.videoDetails.video_url,
		title: info.videoDetails.title,
		duration: { seconds }
	};
}

/**
 * Gets information about an Odysee video.
 *
 * @param url The track URL to check.
 *
 * @throws `NotFoundError` if the video could not be found.
 * @returns a `Promise` that resolves with the video details.
 */
export async function getOdyseeVideo(url: URL): Promise<VideoDetails> {
	try {
		// FIXME: This doesn't really work; ytdl-core checks the domain that it's a YouTube one
		const info = await ytdl.getBasicInfo(url.toString());

		let seconds: number;
		if (info.videoDetails.isLiveContent) {
			seconds = Number.POSITIVE_INFINITY;
		} else {
			seconds = Number.parseInt(info.videoDetails.lengthSeconds, 10);
		}

		return {
			url: info.videoDetails.video_url,
			title: info.videoDetails.title,
			duration: { seconds }
		};
	} catch (error: unknown) {
		const err = new VideoError(error);
		switch (err.message) {
			case "Status code: 404":
				throw new NotFoundError(url);
			default:
				throw err;
		}
	}
}

/**
 * Gets information about a SoundCloud track.
 *
 * @param url The track URL to check.
 *
 * @throws an error if SoundCloud song information could not be found at the
 * provided `url`.
 * @returns a `Promise` that resolves with the track details.
 */
export async function getSoundCloudTrack(url: URL): Promise<VideoDetails> {
	const urlString = url.toString();
	const client = new SoundCloud.Client();
	let song: SoundCloud.Song;
	try {
		song = await client.getSongInfo(urlString);
	} catch (error: unknown) {
		throw new VideoError(error);
	}
	return {
		url: song.url,
		title: song.title,
		duration: { seconds: Math.floor(song.duration / 1000) }
	};
}

/**
 * Gets information about a Bandcamp track.
 *
 * @param url The track URL to check.
 *
 * @throws an error if metadata couldn't be found on the webpage pointed to by the
 * provided `url`, or a `VideoError` if no song duration or title could be found in
 * that metadata.
 * @returns a `Promise` that resolves with the track details.
 */
export async function getBandcampTrack(url: URL): Promise<VideoDetails> {
	const urlString = url.toString();
	let metadata: urlMetadata.Result;
	try {
		metadata = await urlMetadata(urlString, { timeout: 5000 });
	} catch (error: unknown) {
		throw new VideoError(error);
	}
	const json = metadata.jsonld as
		| { name?: string; additionalProperty?: Array<{ name: string; value: number }> }
		| undefined;

	const durationProperty = json?.additionalProperty?.find(prop => prop.name === "duration_secs");

	const seconds: number | null = durationProperty?.value ?? null;
	const title: string | null = json?.name ?? null;
	if (seconds === null || title === null) throw new VideoError("Duration and title not found");

	return {
		url: metadata.url,
		title: metadata.title,
		duration: { seconds: Math.floor(seconds) }
	};
}

/**
 * Retrieves details about a video.
 *
 * @param urlOrString The location of an online video. If the URL is a YouTube
 * or SoundCloud link, video details are retrieved directly.
 * @param logger A logger to use to report errors.
 *
 * @returns a details about the video, or `null` if no video could be
 * found from the provided query.
 */
export default async function getVideoDetails(
	urlOrString: URL | string,
	logger: Logger | null = useLogger()
): Promise<VideoDetails | null> {
	try {
		const url: URL =
			typeof urlOrString === "string" ? new URL(urlOrString.split(/ +/u)[0] ?? "") : urlOrString;
		return await Promise.any([
			getYouTubeVideo(url),
			getOdyseeVideo(url),
			getSoundCloudTrack(url),
			getBandcampTrack(url)
		]);
	} catch (error: unknown) {
		logger?.error(
			richErrorMessage(`Failed to fetch song using url '${urlOrString.toString()}'`, error)
		);
		return null;
	}
}
