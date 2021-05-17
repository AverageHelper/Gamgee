import type Discord from "discord.js";
import type { Command } from "./Command";
import { useQueue } from "../actions/queue/useQueue";
import getQueueChannel from "../actions/queue/getQueueChannel";
import randomElementOfArray from "../helpers/randomElementOfArray";
import StringBuilder from "../helpers/StringBuilder";

const uncertainties = ["There’s a good chance", "I’m like 85% sure", "Very likely,", "I think"];
let lastUncertainty: string | null = null;

function randomUncertainty(): string {
  let random = randomElementOfArray(uncertainties) ?? "";
  while (random === lastUncertainty) {
    random = randomElementOfArray(uncertainties) ?? "";
  }
  lastUncertainty = random;
  return random;
}

const current = ["it’s", "they’re playing", "you’re hearing", "this is"];
let lastCurrent: string | null = null;

function randomCurrent(): string {
  let random = randomElementOfArray(current) ?? "";
  while (random === lastCurrent) {
    random = randomElementOfArray(current) ?? "";
  }
  lastCurrent = random;
  return random;
}

const nowPlaying: Command = {
  name: "now-playing",
  description: "Reveal the current song in the queue (or my best guess).",
  requiresGuild: true,
  async execute({ guild, logger, replyPrivately, deleteInvocation }) {
    await deleteInvocation();

    const queueChannel: Discord.TextChannel | null = await getQueueChannel(guild);

    if (!queueChannel) {
      logger.debug("There is no queue channel for this guild.");
      return replyPrivately("There's no queue set up right now, so nothing is playing.");
    }

    const queue = useQueue(queueChannel);
    const allEntries = await queue.getAllEntries();
    const firstNotDone = allEntries.find(entry => !entry.isDone);

    if (!firstNotDone) {
      logger.debug(`The song queue is currently empty.`);
      return replyPrivately("There's nothing playing right now.");
    }

    logger.debug(`The oldest unplayed song is at ${firstNotDone.url}.`);

    const response = new StringBuilder();

    response.push(randomUncertainty());
    response.push(" ");

    response.push(randomCurrent());
    response.push(" ");

    response.push(`<@${firstNotDone.senderId}>'s submission: `);
    response.push(firstNotDone.url);
    // TODO: Also read out the song's title. Store this in the database as it comes in.

    return replyPrivately(response.result(), true);
  }
};

export default nowPlaying;
