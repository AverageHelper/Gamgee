const env = require("dotenv");
const config = env.config();

// Do not throw any error if the project in running inside CI.
if (!process.env.CI && config.error) {
  throw config.error;
}

module.exports = {
  cordeTestToken: process.env.CORDE_TEST_TOKEN,
  botTestId: process.env.BOT_TEST_ID,
  botTestToken: process.env.DISCORD_TOKEN,
  guildId: process.env.GUILD_ID,
  channelId: process.env.CHANNEL_ID,
  botPrefix: process.env.BOT_PREFIX,
  testFiles: ["./test/dist"]
};
