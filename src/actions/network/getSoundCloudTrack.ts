import type { VideoDetails } from "../getVideoDetails.js";
import { fetchWithTimeout } from "../../helpers/fetch.js";
import { richErrorMessage } from "../../helpers/richErrorMessage.js";
import { useLogger } from "../../logger.js";
import { VideoError } from "../../errors/VideoError.js";
import SoundCloud from "soundcloud-scraper";

const logger = useLogger();

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
	// TRY:
	// 1. Use an OpenGraph parser like https://iplocation.io/open-graph-checker
	// 2. Use og:url in the SoundCloud API client to get duration, use og:title for title

	// Handle redirects, because our SoundCloud client is silly
	// (*.app.goo.gl links come from the app, and redirect to the song page)
	let parsedUrl: URL;
	try {
		const response = await fetchWithTimeout(url.href, undefined, { redirect: "follow" });
		parsedUrl = new URL(response.url);
	} catch (error) {
		logger?.debug(
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
