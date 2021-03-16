import type { Command } from "./index";
import ytdl from "ytdl-core";
import yts from "yt-search";

const yt: Command = {
  name: "yt",
  description: "Query YouTube for video data.",
  async execute(context) {
    const { message, args } = context;
    async function reply(body: string) {
      await message.reply(body);
    }

    if (args.length < 1) {
      return reply("Invalid command structure. Expected a YouTube link or video ID");
    }
    const query = args[0];
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
      return reply(`${video.title}: (${video.duration.seconds / 60} mins)`);
    } catch (error) {
      console.error("Failed to run query", query, error);
      return reply("That video query gave me an error.");
    }
  }
};

export default yt;
