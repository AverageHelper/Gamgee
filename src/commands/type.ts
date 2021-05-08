import type { Command } from "./Command";

const type: Command = {
  name: "t",
  description: "Start typing. :wink:",
  async execute({ channel, client, logger, deleteInvocation }) {
    if (!channel) return;

    logger.debug(
      `${client.user?.username.concat(" is") ?? "I am"} typing in channel ${channel.id}...`
    );
    await deleteInvocation();

    void channel.startTyping();

    await new Promise(resolve => setTimeout(resolve, 5000));
    channel.stopTyping(true);

    logger.debug(`Finished typing in channel ${channel.id}`);
  }
};

export default type;
