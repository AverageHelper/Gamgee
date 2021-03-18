import type { Command } from "./index";
import { useLogger } from "../logger";

const logger = useLogger();

const type: Command = {
  name: "t",
  description: "Start typing :wink:",
  async execute(context) {
    const { message } = context;
    const channel = message.channel;

    logger.info(`Started typing in channel ${channel.id}`);
    void channel.startTyping();
    await message
      .delete()
      .catch(error =>
        logger.error(
          `I don't seem to have deletion privileges here: ${JSON.stringify(error, undefined, 2)}`
        )
      );

    setTimeout(() => {
      void channel.stopTyping();
      logger.info(`Finished typing in channel ${channel.id}`);
    }, 3000);
  }
};

export default type;
