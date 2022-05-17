import type { Logger } from "../logger.js";
import type { Metadata } from "../helpers/urlMetadata/index.js";
import { getPonyFmTrackInfoFromId } from "../helpers/getPonyFmTrackInfoFromId.js";
import { isString } from "../helpers/guards.js";
import { richErrorMessage } from "../helpers/richErrorMessage.js";
import { URL } from "url";
import { useLogger } from "../logger.js";
import fetch from "node-fetch";
import SoundCloud from "soundcloud-scraper";
import urlMetadata from "../helpers/urlMetadata/index.js";
import ytdl from "ytdl-core";
import {
	InvalidPonyFmUrlError,
	InvalidYouTubeUrlError,
	NotFoundError,
	UnavailableError,
	VideoError
} from "../errors/index.js";

export interface VideoDetails {
	url: string;
	title: string;
	duration: {
		seconds: number;
	};
}

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
	if (!ytdl.validateURL(urlString)) throw new InvalidYouTubeUrlError(url);

	let info: ytdl.videoInfo;
	try {
		info = await ytdl.getBasicInfo(urlString);
	} catch (error) {
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
 * Gets information about a SoundCloud track.
 *
 * @param url The track URL to check.
 *
 * @throws an error if SoundCloud song information could not be found at the
 * provided `url`.
 * @returns a `Promise` that resolves with the track details.
 */
export async function getSoundCloudTrack(
	url: URL,
	logger: Logger | null = useLogger()
): Promise<VideoDetails> {
	// Handle redirects, because our SoundCloud client is silly
	// (*.app.goo.gl links come from the app, and redirect to the song page)
	let parsedUrl: URL;
	try {
		// FIXME: This makes the function take twice as long to run
		const response = await fetch(url, { redirect: "follow" });
		parsedUrl = new URL(response.url);
	} catch (error) {
		logger?.error(
			richErrorMessage(`Failed to follow redirects from '${url.href}'. Using the original.`, error)
		);
		parsedUrl = url;
	}

	// Remove query params, because our SoundCloud client is silly
	parsedUrl.search = "";

	const client = new SoundCloud.Client();
	let song: SoundCloud.Song;
	try {
		song = await client.getSongInfo(parsedUrl.href);
	} catch (error) {
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
	let metadata: Metadata;
	try {
		metadata = await urlMetadata(url, { timeout: 5000 });
	} catch (error) {
		throw new VideoError(error);
	}

	type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
	const json = metadata.jsonld as
		| { name?: string; duration: `${string}H${Digit}${Digit}M${Digit}${Digit}S` }
		| undefined;
	if (!json) throw new VideoError("Duration and title not found");
	if (!json.duration || !isString(json.duration)) throw new VideoError("Duration data not found");

	const durationPropertiesMatch = json.duration.matchAll(/H([0-9]+)M([0-9]+)S/gu);
	const durationProperties = Array.from(durationPropertiesMatch)[0] as
		| [string, string, string, ...Array<string>] // at least 3 strings
		| undefined;

	// Sanity checks (I have a college education and I don't understand regex)
	if (!durationProperties || durationProperties.length < 3 || !durationProperties.every(isString))
		throw new VideoError("Duration not found");

	const minutes = Number.parseInt(durationProperties[1], 10);
	const seconds = Number.parseInt(durationProperties[2], 10);
	if (Number.isNaN(minutes) || Number.isNaN(seconds)) throw new VideoError("Duration not found");

	const totalSeconds = minutes * 60 + seconds;

	const title: string | null = json.name ?? null;
	if (title === null || !title) throw new VideoError("Title not found");

	return {
		url: metadata.url ?? url.href,
		title,
		duration: { seconds: Math.floor(totalSeconds) }
	};
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
export async function getPonyFmTrack(url: URL): Promise<VideoDetails> {
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
	const trackData = await getPonyFmTrackInfoFromId(trackId);

	return {
		url: trackData.url,
		title: trackData.title,
		duration: { seconds: Math.floor(Number.parseFloat(trackData.duration)) }
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
export async function getVideoDetails(
	urlOrString: URL | string,
	logger: Logger | null = useLogger()
): Promise<VideoDetails | null> {
	try {
		const url: URL =
			typeof urlOrString === "string" ? new URL(urlOrString.split(/ +/u)[0] ?? "") : urlOrString;
		return await Promise.any([
			getYouTubeVideo(url), //
			getSoundCloudTrack(url),
			getBandcampTrack(url),
			getPonyFmTrack(url)
		]);
	} catch (error) {
		logger?.error(
			richErrorMessage(`Failed to fetch song using url '${urlOrString.toString()}'`, error)
		);
		return null;
	}
}
