import type Discord from "discord.js";
import type { Command } from "./index";
import getVideoDetails from "../actions/getVideoDetails";
import getQueueChannel from "../actions/getQueueChannel";
import { useLogger } from "../logger";

const logger = useLogger();

interface QueueEntry {
  url: string;
  sentAt: Date;
  sender: Discord.User;
}

const name = "sr";

const yt: Command = {
  name,
  description: "Submit a song to the queue.",
  uses: [
    [`${name} <song name or YouTube link>`, "Attempts to add the given content to the queue."]
  ],
  async execute(context) {
    const { message, args } = context;

    async function reject_public(reason: string) {
      await message.channel.send(reason);
    }
    if (args.length < 1) {
      return reject_public("You're gonna have to add a song link or title to that.");
    }

    const queueChannel = await getQueueChannel(context);
    if (!queueChannel) {
      return reject_public(
        "No queue channel has been set up yet. Ask an administrator to set one up."
      );
    }

    async function accept(entry: QueueEntry, sendUrl = false) {
      await Promise.all([
        queueChannel?.send(message.content),
        message.channel.send(
          `${sendUrl ? entry.url + "\n" : ""}**${message.author.username}**, Submission Accepted!`
        )
      ]);
    }

    try {
      const video = await getVideoDetails(args);
      if (video === null) {
        return reject_public("No songs were found!");
      }

      const url = video.url;
      const sentAt = message.createdAt;
      const sender = message.author;

      // Whether this is a search result and we therefore haven't had this link embedded yet
      const shouldSendUrl = "type" in video && video.type === "video";

      return accept({ url, sentAt, sender }, shouldSendUrl);

      // Handle fetch errors
    } catch (error) {
      logger.error("Failed to run query", args, error);
      return reject_public("That video query gave me an error.");
    }
  }
};

export default yt;
