import type { Command } from "./index";
import { deleteMessage } from "../actions/messages/deleteMessage";
import { useLogger } from "../logger";

const logger = useLogger();

const type: Command = {
  name: "t",
  description: "Start typing. :wink:",
  async execute(context) {
    const { message } = context;
    const channel = message.channel;

    logger.info(`Started typing in channel ${channel.id}`);
    void channel.startTyping();
    await deleteMessage(message, "Spam: Users don't need to see this command run");

    setTimeout(() => {
      void channel.stopTyping();
      logger.info(`Finished typing in channel ${channel.id}`);
    }, 3000);
  }
};

export default type;
