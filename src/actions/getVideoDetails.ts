import ytdl from "ytdl-core";
import yts from "yt-search";
import { useLogger } from "../logger";

const logger = useLogger();

export default async function getVideoDetails(
  args: string[]
): Promise<yts.VideoMetadataResult | yts.VideoSearchResult | null> {
  // Try the first value as a video URL
  const urlString = args[0];
  if (ytdl.validateURL(urlString)) {
    const videoId = ytdl.getURLVideoID(urlString);
    logger.info(`Got video ID '${videoId}'`);
    return yts({ videoId });
  } else {
    // Try the rest as a search query
    const query = args.join(" ");
    const { videos } = await yts(query);
    if (!videos.length) return null;
    return videos[0];
  }
}
