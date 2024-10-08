import type { VideoDetails, VideoMetaSource } from "../getVideoDetails.js";
import type { Song } from "soundcloud-scraper";
import { Client as SoundCloudClient } from "soundcloud-scraper";
import { richErrorMessage } from "../../helpers/richErrorMessage.js";
import { useLogger } from "../../logger.js";
import { VideoError } from "../../errors/VideoError.js";

const logger = useLogger();

const metaSource: Readonly<VideoMetaSource> = {
	platformName: "soundcloud",
	alternative: null,
};

/**
 * Gets information about a SoundCloud track.
 *
 * @param url The track URL to check.
 * @param signal A signal that would indicate that we should abort the network request.
 *
 * @throws an error if SoundCloud song information could not be found at the
 * provided `url`.
 * @returns a `Promise` that resolves with the track details.
 */
export async function getSoundCloudTrack(url: URL, signal?: AbortSignal): Promise<VideoDetails> {
	// TRY:
	// 1. Use an OpenGraph parser like https://iplocation.io/open-graph-checker
	// 2. Use og:url in the SoundCloud API client to get duration, use og:title for title

	// Handle redirects, because our SoundCloud client is silly
	// (*.app.goo.gl links come from the app, and redirect to the song page)
	let parsedUrl: URL;
	try {
		const response = await fetch(url.href, { redirect: "follow", signal });
		parsedUrl = new URL(response.url);
	} catch (error) {
		logger?.debug(
			richErrorMessage(`Failed to follow redirects from '${url.href}'. Using the original.`, error),
		);
		parsedUrl = url;
	}

	// Remove query params, because our SoundCloud client is silly
	parsedUrl.search = "";

	const client = new SoundCloudClient();
	let song: Song;
	try {
		song = await client.getSongInfo(parsedUrl.href, { requestOptions: { signal } });
	} catch (error) {
		throw new VideoError(error);
	}
	return {
		url: song.url,
		title: song.title,
		duration: { seconds: Math.floor(song.duration / 1000) },
		metaSource,
	};
}
