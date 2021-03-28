import ytdl from "ytdl-core";
import yts from "yt-search";
import SoundCloud from "soundcloud-scraper";
import richErrorMessage from "../helpers/richErrorMessage";
import { useLogger } from "../logger";

const logger = useLogger();

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
export default async function getVideoDetails(args: Array<string>): Promise<VideoDetails | null> {
  // Try the first value as a video URL
  const urlString = args[0];
  if (urlString === undefined || urlString === "") return null;

  // Try YouTube URL
  if (ytdl.validateURL(urlString)) {
    const videoId = ytdl.getURLVideoID(urlString);
    logger.info(`Got video ID '${videoId}'`);
    const result = await yts({ videoId });
    return {
      fromUrl: true,
      url: result.url,
      title: result.title,
      duration: result.duration
    };
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
    logger.error(
      richErrorMessage(`Failed to fetch song from SoundCloud using url '${urlString}'`, error)
    );
    return null;
  }
}
