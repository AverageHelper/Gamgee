import type { Command } from "./Command";

const type: Command = {
  name: "t",
  description: "Start a typing indicator.",
  async execute({ type, channel, client, logger, reply, deleteInvocation }) {
    if (!channel) return;

    logger.debug(
      `${client.user?.username.concat(" is") ?? "I am"} typing in channel ${channel.id}...`
    );
    await deleteInvocation();
    if (type === "interaction") {
      await reply("So I started typing here, but I don't think I'll finish my message.", {
        ephemeral: true
      });
    }

    void channel.startTyping();

    await new Promise(resolve => setTimeout(resolve, 5000));
    channel.stopTyping(true);

    logger.debug(`Finished typing in channel ${channel.id}`);
  }
};

export default type;
