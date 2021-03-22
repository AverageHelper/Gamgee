import { group, test, expect } from "corde";

const COMMAND_PREFIX = process.env.BOT_PREFIX;
const SENDER_ID = process.env.CORDE_BOT_ID;
const QUEUE_CHANNEL_ID = process.env.QUEUE_CHANNEL_ID;

/**
 * An error object which identifies a missing environment variable.
 */
class EnvironmentVariableNotFoundError extends Error {
  constructor(name: string) {
    super(`${name} not found in environment variables.`);
  }
}

if (!COMMAND_PREFIX) throw new EnvironmentVariableNotFoundError("BOT_PREFIX");
if (!SENDER_ID) throw new EnvironmentVariableNotFoundError("CORDE_BOT_ID");
if (!QUEUE_CHANNEL_ID) throw new EnvironmentVariableNotFoundError("QUEUE_CHANNEL_ID");

group(`${COMMAND_PREFIX}video`, () => {
  const url = "https://youtu.be/dQw4w9WgXcQ";
  const info = `<@${SENDER_ID}>, Rick Astley - Never Gonna Give You Up (Video): (3 minutes, 32 seconds)`;

  test("returns the title and duration of a song with normal spacing", () => {
    expect(`video ${url}`).toReturn(info);
  });

  test("returns the title and duration of a song with suboptimal spacing", () => {
    expect(`video                     ${url}`).toReturn(info);
  });
});

group(`${COMMAND_PREFIX}sr`, () => {
  test("returns the queue instructional text", () => {
    expect("sr info").toReturn(
      `To submit a song, type \`${COMMAND_PREFIX}sr <link>\`.
For example: \`${COMMAND_PREFIX}sr https://youtu.be/dQw4w9WgXcQ\`
I will respond with a text verification indicating your song has joined the queue!`
    );
  });

  test("yells at the tester for trying to set up a queue", () => {
    expect("sr setup").toReturn("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
    expect(`sr setup <#${QUEUE_CHANNEL_ID}>`).toReturn(
      "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that..."
    );
  });

  test("yells at the tester for trying to open a queue", () => {
    expect("sr open").toReturn("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
  });

  test("yells at the tester for trying to close the queue", () => {
    expect("sr close").toReturn("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
  });

  test("yells at the tester for trying to set limits on the queue", () => {
    expect("sr limit").toReturn("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
  });

  test("yells at the tester for trying to see queue statistics", () => {
    expect("sr stats").toReturn("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
  });

  test("yells at the tester for trying to restart the queue", () => {
    expect("sr restart").toReturn("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
  });

  // TODO: Add a test for sr <song link>
});

group(`${COMMAND_PREFIX}help`, () => {
  test("returns the help text", () => {
    expect("help").toReturn(`Commands:
\`${COMMAND_PREFIX}config\` - Read and modify config options. *(Server owner only. No touch!)*
\`${COMMAND_PREFIX}ping\` - Ping my host server to check latency.
\`${COMMAND_PREFIX}sr <YouTube or SoundCloud link>\` - Submit a song to the queue.
    \`${COMMAND_PREFIX}sr info\` - Prints a handy message to let people know how to queue-up.
    \`${COMMAND_PREFIX}sr setup <channel name>\` - Set a channel as the 'queue' channel. *(Server owner only. No touch!)*
    \`${COMMAND_PREFIX}sr open\` - Start accepting song requests to the queue.
    \`${COMMAND_PREFIX}sr close\` - Stop accepting song requests to the queue.
    \`${COMMAND_PREFIX}sr limit <entry-duration|cooldown|count>\` - Sets a limit value on the queue.
    \`${COMMAND_PREFIX}sr stats\` - Reports the status of the current queue.
    \`${COMMAND_PREFIX}sr restart\` - Empties the queue and starts a fresh queue session.
\`${COMMAND_PREFIX}t\` - Start typing :wink:
\`${COMMAND_PREFIX}video <YouTube or SoundCloud link>\` - Puts the video title and duration in chat.`);
  });
});
