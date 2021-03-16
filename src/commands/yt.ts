import type { CommandContext } from "./index";
import ytdl from "ytdl-core";
import yts from "yt-search";

export default async function yt(context: CommandContext): Promise<string> {
  const { params } = context;
  if (params.length < 1) {
    return "Invalid command structure. Expected a YouTube link or video ID";
  }
  const query = params[0];
  let videoId: string;

  try {
    if (ytdl.validateURL(query)) {
      videoId = ytdl.getURLVideoID(query);
    } else {
      videoId = query;
      // const { videos } = await yts(args.slice(1).join(" "));
      // if (!videos.length) return message.channel.send("No songs were found!");
      // song = {
      //   title: videos[0].title,
      //   url: videos[0].url
      // };
    }

    const video = await yts({ videoId });
    return `${video.title}: (${video.duration.seconds / 60} mins)`;
  } catch (error) {
    console.error("Failed to run query", query, error);
    return "That video query gave me an error.";
  }
}
