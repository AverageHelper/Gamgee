import type Discord from "discord.js";
import type { JobErrorHandler } from "./actions/queue/jobQueue";
import { REACTION_BTN_MUSIC } from "./constants/reactions";
import { useLogger } from "./logger";
import { useJobQueue } from "./actions/queue/jobQueue";

const logger = useLogger();

const DEBUG = false;
function debugLog(message: string): void {
  if (!DEBUG) return;
  logger.debug(message);
}

export interface MessageButton {
  emoji: Discord.EmojiIdentifierResolvable;
}

export interface InteractionConfig {
  message: Discord.Message;
  buttons: Array<MessageButton>;
}

const spacerButton: MessageButton = {
  emoji: REACTION_BTN_MUSIC
};

async function makeInteractive(job: InteractionConfig): Promise<void> {
  const allReactions = job.message.reactions.cache;
  const buttonReactions = allReactions.filter(rxn => {
    debugLog(`Found rxn with emote ${rxn.emoji.toString()}`);
    const isSpacer = rxn.emoji.name === spacerButton.emoji;
    debugLog(
      `Rxn is${isSpacer ? "" : " not"} a spacer. (Does${
        isSpacer ? "" : " not"
      } have emote ${spacerButton.emoji.toString()})`
    );
    return !isSpacer;
  });

  debugLog(
    `There are ${allReactions.size} total reactions already, ${
      allReactions.size - buttonReactions.size
    } of which are spacer(s)`
  );

  // Remove non-spacer buttons
  await Promise.allSettled(
    buttonReactions.map(async rxn => {
      debugLog(`Removing rxn with emote ${rxn.emoji.toString()}`);
      await rxn.remove();
      debugLog(`Removed rxn with emote ${rxn.emoji.toString()}`);
    })
  );

  // Add the spacer if it's not there already
  if (allReactions.size !== buttonReactions.size) {
    await job.message.react(spacerButton.emoji);
    debugLog(`Added rxn with emote ${spacerButton.emoji.toString()}`);
  }

  // Add other buttons
  await Promise.allSettled(
    job.buttons.map(async button => {
      debugLog(`Started adding rxn with emote ${button.emoji.toString()}`);
      await job.message.react(button.emoji);
      debugLog(`Added rxn with emote ${button.emoji.toString()}`);
    })
  );
}

export class DiscordInterface {
  private readonly client: Discord.Client;

  constructor(client: Discord.Client) {
    this.client = client;
  }

  makeInteractive(
    message: Discord.Message,
    buttons: NonEmptyArray<MessageButton>,
    onFailure?: JobErrorHandler<InteractionConfig>
  ): void {
    const key = `${message.channel.id}_${message.id}`;
    const queue = useJobQueue<InteractionConfig>(key);
    const ct = buttons.length;

    queue.process(makeInteractive);

    queue.on("start", () => {
      logger.verbose(`Started making message ${message.id} interactive with ${ct} buttons`);
    });
    queue.on("finish", () => {
      logger.verbose(`Finished making message ${message.id} interactive`);
    });
    if (onFailure) {
      queue.on("error", onFailure);
    }
    queue.createJob({ message, buttons });
  }

  // Interfaces for sending messages in various ways, for configuring reaction button interfaces, attaching events to these, etc.
}
