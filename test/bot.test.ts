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

group(`?video`, () => {
  const url = "https://youtu.be/dQw4w9WgXcQ";
  const info = `<@${SENDER_ID}>, Rick Astley - Never Gonna Give You Up (Video): (3 minutes, 32 seconds)`;

  test("returns the title and duration of a song with normal spacing", () => {
    expect(`video ${url}`).toReturn(info);
  });

  test("returns the title and duration of a song with suboptimal spacing", () => {
    expect(`video                     ${url}`).toReturn(info);
  });
});

group(`?queue`, () => {
  test("returns the queue instructional text", () => {
    expect("queue").toReturn(
      `To submit a song, type \`${COMMAND_PREFIX}sr <link>\`.
For example: \`${COMMAND_PREFIX}sr https://youtu.be/dQw4w9WgXcQ\`
I will respond with a text verification indicating your song has joined the queue!`
    );
  });

  test("yells at the tester for trying to access queue stats", () => {
    expect("queue info").toReturn("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
  });

  test("yells at the tester for trying to open a queue", () => {
    expect("queue open").toReturn("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
    expect(`queue open <#${QUEUE_CHANNEL_ID}>`).toReturn(
      "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that..."
    );
  });

  test("yells at the tester for trying to close the queue", () => {
    expect("queue close").toReturn("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
  });

  test("yells at the tester for trying to restart the queue", () => {
    expect("queue restart").toReturn(
      "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that..."
    );
  });

  test("yells at the tester for trying to set limits on the queue", () => {
    expect("queue limit").toReturn("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
  });
});

group(`?help`, () => {
  test("returns the help text", () => {
    expect("help").toReturn(`Commands:
\`${COMMAND_PREFIX}config\` - Read and modify config options. *(Server owner only. No touch!)*
\`${COMMAND_PREFIX}ping\` - Ping my host server to check latency.
\`${COMMAND_PREFIX}queue\` - Prints a handy message to let people know how to queue-up.
    \`${COMMAND_PREFIX}queue info\` - Reports the status of the current queue. *(Server owner only. No touch!)*
    \`${COMMAND_PREFIX}queue open <channel name>\` - Sets the channel up as a new queue. Any existing queue is saved, but queue and request commands will go to this new queue instead. *(Server owner only. No touch!)*
    \`${COMMAND_PREFIX}queue close\` - Closes the current queue. *(Server owner only. No touch!)*
    \`${COMMAND_PREFIX}queue restart\` - Empties the queue and starts a fresh queue session. *(Server owner only. No touch!)*
    \`${COMMAND_PREFIX}queue limit [entry-duration|cooldown]\` - Sets a limit value on the queue. *(Server owner only. No touch!)*
\`${COMMAND_PREFIX}sr\` - Submit a song to the queue.
    \`${COMMAND_PREFIX}sr <song name or YouTube link>\` - Attempts to add the given content to the queue.
\`${COMMAND_PREFIX}t\` - Start typing :wink:
\`${COMMAND_PREFIX}video\` - Query YouTube or SoundCloud for video data.
    \`${COMMAND_PREFIX}video {link}\` - Puts the video title and duration in chat.`);
  });
});
