import ytdl from "ytdl-core";
import SoundCloud from "soundcloud-scraper";
import urlMetadata from "url-metadata";
import richErrorMessage from "../helpers/richErrorMessage";
import any from "../helpers/any";
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

async function getYouTubeVideo(url: string): Promise<VideoDetails> {
  if (!ytdl.validateURL(url)) throw new TypeError("Not a valid YouTube URL");

  const info = await ytdl.getBasicInfo(url);
  if (!info.videoDetails.availableCountries.includes("US")) {
    throw new Error("That video is not available in the United States");
  }
  return {
    fromUrl: true,
    url: info.videoDetails.video_url,
    title: info.videoDetails.title,
    duration: { seconds: Number.parseInt(info.videoDetails.lengthSeconds, 10) }
  };
}

async function getSoundCloudVideo(url: string): Promise<VideoDetails> {
  const client = new SoundCloud.Client();
  const song = await client.getSongInfo(url);
  return {
    fromUrl: true,
    url: song.url,
    title: song.title,
    duration: { seconds: Math.floor(song.duration / 1000) }
  };
}

async function getBandcampVideo(url: string): Promise<VideoDetails> {
  const metadata = await urlMetadata(url);

  const json = metadata.jsonld as
    | { name?: string; additionalProperty?: Array<{ name: string; value: number }> }
    | undefined;
  const seconds: number | null =
    json?.additionalProperty?.find(property => property.name === "duration_secs")?.value ?? null;
  const title: string | null = json?.name ?? null;

  if (seconds === null || title === null) throw new TypeError("Duration and title not found");

  return {
    fromUrl: true,
    url: metadata.url,
    title: metadata.title,
    duration: { seconds: Math.floor(seconds) }
  };
}

/**
 * Retrieves details about a video.
 *
 * @param args A series of strings which describe a video. If the first string is a URL,
 * then that URL is treated like a YouTube or SoundCloud link, and video details are
 * retrieved directly. Otherwise, the entirety of the array is considered a search query.
 *
 * @returns a details about the video, or `null` if no video could be found from the provided query.
 */
export default async function getVideoDetails(
  args: Array<string>,
  logger: Logger | null = useLogger()
): Promise<VideoDetails | null> {
  // Try the first value as a video URL
  const urlString = args[0];
  if (urlString === undefined || urlString === "") return null;

  try {
    return await any([
      getYouTubeVideo(urlString), //
      getSoundCloudVideo(urlString),
      getBandcampVideo(urlString)
    ]);
  } catch (error: unknown) {
    logger?.error(richErrorMessage(`Failed to fetch song using url '${urlString}'`, error));
    return null;
  }
}
