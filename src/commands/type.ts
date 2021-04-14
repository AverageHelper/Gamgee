import type { Command } from "./Command";
import { deleteMessage } from "../actions/messages/deleteMessage";
import { useLogger } from "../logger";

const logger = useLogger();

const type: Command = {
  name: "t",
  description: "Start typing. :wink:",
  async execute(context) {
    const { message, client } = context;
    const channel = message.channel;

    logger.debug(
      `${client.user?.username.concat(" is") ?? "I am"} typing in channel ${channel.id}...`
    );
    await deleteMessage(message, "Spam: Users don't need to see this command run");

    setTimeout(() => {
      channel.stopTyping(true);
    }, 5000);

    await channel.startTyping();
    logger.debug(`Finished typing in channel ${channel.id}`);
  }
};

export default type;
