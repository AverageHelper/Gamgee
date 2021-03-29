import ytdl from "ytdl-core";
import yts from "yt-search";
import SoundCloud from "soundcloud-scraper";
import urlMetadata from "url-metadata";
import richErrorMessage from "../helpers/richErrorMessage";
import { Logger, useLogger } from "../logger";

interface VideoDetails {
  url: string;
  title: string;
  duration: {
    seconds: number;
  };

  /**
   * `true` if these details were obtained directly from a video URL.
   * `false` if these details are the result of a search operation
   * from a set of terms. */
  fromUrl: boolean;
}

/**
 * Retrieves details about a video.
 *
 * @param args A series of strings which describe a video. If the first string is a URL,
 * then that URL is treated like a YouTube or SoundCloud link, and video details are
 * retrieved directly. Otherwise, the entirety of the array is considered a search query.
 *
 * @returns A set of video details, or `null` if no video could be found from the provided query.
 */
export default async function getVideoDetails(
  args: Array<string>,
  logger: Logger | null = useLogger()
): Promise<VideoDetails | null> {
  // Try the first value as a video URL
  const urlString = args[0];
  if (urlString === undefined || urlString === "") return null;

  // Try YouTube URL
  if (ytdl.validateURL(urlString)) {
    try {
      const videoId = ytdl.getURLVideoID(urlString);
      logger?.info(`Got video ID '${videoId}'`);
      const result = await yts({ videoId });
      return {
        fromUrl: true,
        url: result.url,
        title: result.title,
        duration: result.duration
      };
    } catch (error: unknown) {
      logger?.error(
        richErrorMessage(`Failed to fetch song from YouTube using url '${urlString}'`, error)
      );
      return null;
    }
  }

  // Try SoundCloud
  const client = new SoundCloud.Client();
  try {
    const song = await client.getSongInfo(urlString);
    return {
      fromUrl: true,
      url: song.url,
      title: song.title,
      duration: { seconds: song.duration / 1000 }
    };

    // Something went wrong. Is this a valid SoundCloud link?
  } catch (error: unknown) {
    if (error instanceof TypeError) {
      logger?.debug(
        `Failed to fetch song from SoundCloud using url '${urlString}'. Likely not a SoundCloud link`
      );
    } else {
      logger?.error(
        richErrorMessage(`Failed to fetch song from SoundCloud using url '${urlString}'`, error)
      );
      return null;
    }
  }

  // Try Bandcamp
  try {
    // Get the webpage
    const metadata = await urlMetadata(urlString);

    const json = metadata.jsonld as
      | { name?: string; additionalProperty?: Array<{ name: string; value: number }> }
      | undefined;
    const seconds: number | null =
      json?.additionalProperty?.find(property => property.name === "duration_secs")?.value ?? null;
    const title: string | null = json?.name ?? null;

    if (seconds === null || title === null) return null;

    return {
      fromUrl: true,
      url: metadata.url,
      title: metadata.title,
      duration: { seconds }
    };

    // Something went wrong. Is this a valid Bandcamp link?
  } catch (error: unknown) {
    logger?.error(
      richErrorMessage(`Failed to fetch song from Bandcamp using url '${urlString}'`, error)
    );
    return null;
  }
}
