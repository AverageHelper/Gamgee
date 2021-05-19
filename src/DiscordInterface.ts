import type Discord from "discord.js";
import { REACTION_BTN_MUSIC } from "./constants/reactions";
import { useLogger } from "./logger";
import { useJobQueue } from "./actions/queue/jobQueue";
import richErrorMessage from "./helpers/richErrorMessage";

const logger = useLogger();

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
  try {
    await job.message.reactions.removeAll();
    await job.message.react(spacerButton.emoji);
    for (const button of job.buttons) {
      await job.message.react(button.emoji);
    }
  } catch (error: unknown) {
    logger.error(richErrorMessage("Failed to add reactions to message.", error));
  }
}

export class DiscordInterface {
  private readonly client: Discord.Client;

  constructor(client: Discord.Client) {
    this.client = client;
  }

  makeInteractive(message: Discord.Message, buttons: NonEmptyArray<MessageButton>): void {
    const key = `${message.channel.id}_${message.id}`;
    const queue = useJobQueue<InteractionConfig>(key);

    queue.process(makeInteractive);

    queue.on("start", () => {
      logger.verbose(
        `Started making message ${message.id} interactive with ${buttons.length} buttons`
      );
    });
    queue.on("finish", () => {
      logger.verbose(`Finished making message ${message.id} interactive`);
    });
    queue.createJob({ message, buttons });
  }

  // Interfaces for sending messages in various ways, for configuring reaction button interfaces, attaching events to these, etc.
}
