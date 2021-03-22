import Discord from "discord.js";
import requireEnv from "./requireEnv";

const COMMAND_PREFIX = requireEnv("BOT_PREFIX");

const TESTER_TOKEN = requireEnv("CORDE_TEST_TOKEN");
const TESTER_ID = requireEnv("CORDE_BOT_ID");
const UUT_ID = requireEnv("BOT_TEST_ID");

const TEST_CHANNEL_ID = requireEnv("CHANNEL_ID");
const QUEUE_CHANNEL_ID = requireEnv("QUEUE_CHANNEL_ID");

// Prepare Discord client
let isLoggedIn = false;
const client = new Discord.Client();

async function testerClient(): Promise<Discord.Client> {
  if (!isLoggedIn) {
    await client.login(TESTER_TOKEN);
    isLoggedIn = true;
  }
  return client;
}

async function sendMessage(
  content: string,
  channelId: string = TEST_CHANNEL_ID
): Promise<Discord.Message> {
  const client = await testerClient();
  const channel = await client.channels.fetch(channelId);
  if (!channel.isText()) throw new Error(`Channel ${channelId} is not a text channel.`);

  return channel.send(content);
}

function sendCommand(name: string, channelId: string = TEST_CHANNEL_ID): Promise<Discord.Message> {
  return sendMessage(`${COMMAND_PREFIX}${name}`, channelId);
}

async function getLastMessageFromChannel(channelId: string): Promise<Discord.Message | null> {
  const client = await testerClient();
  const channel = await client.channels.fetch(channelId);
  if (!channel.isText()) throw new Error(`Channel ${channelId} is not a text channel.`);

  return channel.lastMessage;
}

async function commandResponseInSameChannel(
  command: string,
  channelId: string = TEST_CHANNEL_ID
): Promise<Discord.Message | null> {
  const commandMessage = await sendCommand(command, channelId);

  for (let i = 0; i < 50; i++) {
    await new Promise(resolve => setTimeout(resolve, 120));
    const response = await getLastMessageFromChannel(commandMessage.channel.id);
    if (
      (response?.createdTimestamp ?? 0) > commandMessage.createdTimestamp &&
      response?.author.id === UUT_ID
    ) {
      return response;
    }
  }
  return null;
}

afterAll(() => {
  if (isLoggedIn) {
    client.destroy();
  }
});

describe(`${COMMAND_PREFIX}video`, () => {
  const url = "https://youtu.be/dQw4w9WgXcQ";
  const info = `<@${TESTER_ID}>, Rick Astley - Never Gonna Give You Up (Video): (3 minutes, 32 seconds)`;

  test("returns the title and duration of a song with normal spacing", async () => {
    const response = await commandResponseInSameChannel(`video ${url}`);
    expect(response?.content).toBe(info);
  });

  test("returns the title and duration of a song with suboptimal spacing", async () => {
    const response = await commandResponseInSameChannel(`video ${url}`);
    expect(response?.content).toBe(info);
  });
});

describe(`${COMMAND_PREFIX}sr`, () => {
  test("returns the queue instructional text", async () => {
    const response = await commandResponseInSameChannel("sr info");
    expect(response?.content).toBe(
      `To submit a song, type \`${COMMAND_PREFIX}sr <link>\`.
For example: \`${COMMAND_PREFIX}sr https://youtu.be/dQw4w9WgXcQ\`
I will respond with a text verification indicating your song has joined the queue!`
    );
  });

  test("yells at the tester for trying to set up a queue", async () => {
    let response = await commandResponseInSameChannel("sr setup");
    expect(response?.content).toBe("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");

    response = await commandResponseInSameChannel(`sr setup <#${QUEUE_CHANNEL_ID}>`);
    expect(response?.content).toBe("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
  });

  test("yells at the tester for trying to open a queue", async () => {
    const response = await commandResponseInSameChannel("sr open");
    expect(response?.content).toBe("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
  });

  test("yells at the tester for trying to close the queue", async () => {
    const response = await commandResponseInSameChannel("sr close");
    expect(response?.content).toBe("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
  });

  test("yells at the tester for trying to set limits on the queue", async () => {
    const response = await commandResponseInSameChannel("sr limit");
    expect(response?.content).toBe("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
  });

  test("yells at the tester for trying to see queue statistics", async () => {
    const response = await commandResponseInSameChannel("sr stats");
    expect(response?.content).toBe("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
  });

  test("yells at the tester for trying to restart the queue", async () => {
    const response = await commandResponseInSameChannel("sr restart");
    expect(response?.content).toBe("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
  });

  // TODO: Add a test for sr <song link>
});

describe(`help`, () => {
  test("returns the help text", async () => {
    const response = await commandResponseInSameChannel("help");
    expect(response?.content).toBe(`Commands:
\`${COMMAND_PREFIX}config\` - Read and modify config options. *(Server owner only. No touch!)*
\`${COMMAND_PREFIX}ping\` - Ping my host server to check latency.
\`${COMMAND_PREFIX}sr <YouTube or SoundCloud link>\` - Submit a song to the queue.
    \`${COMMAND_PREFIX}sr info\` - Prints a handy message to let people know how to queue-up.
    \`${COMMAND_PREFIX}sr setup <channel name>\` - Set a channel as the 'queue' channel. *(Server owner only. No touch!)*
    \`${COMMAND_PREFIX}sr open\` - Start accepting song requests to the queue.
    \`${COMMAND_PREFIX}sr close\` - Stop accepting song requests to the queue.
    \`${COMMAND_PREFIX}sr limit <entry-duration|cooldown|count>\` - Sets a limit value on the queue. (Time in seconds, where applicable)
    \`${COMMAND_PREFIX}sr stats\` - Reports statistics on the current queue.
    \`${COMMAND_PREFIX}sr restart\` - Empties the queue and starts a fresh queue session.
\`${COMMAND_PREFIX}t\` - Start typing :wink:
\`${COMMAND_PREFIX}video <YouTube or SoundCloud link>\` - Puts the video title and duration in chat.`);
  });
});
