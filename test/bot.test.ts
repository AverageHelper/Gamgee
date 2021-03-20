import { group, test, expect, beforeEach } from "@averagehelper/corde";

beforeEach(() => {
  // Reset the database file somehow
});

group("Main commands", () => {
  test("help command returns the help text", () => {
    expect("help").toReturn(`Commands:
\`?config\` - Read and modify config options. *(Server owner only. No touch!)*
\`?ping\` - Ping Gamgee's server to check latency.
\`?queue\` - Prints a handy message to let people know how to queue-up.
    \`?queue info\` - Reports the status of the current queue. *(Server owner only. No touch!)*
    \`?queue open <channel name>\` - Sets the channel up as a new queue. Any existing queue is saved, but queue and request commands will go to this new queue instead. *(Server owner only. No touch!)*
    \`?queue close\` - Closes the current queue. *(Server owner only. No touch!)*
    \`?queue restart\` - Empties the queue and starts a fresh queue session. *(Server owner only. No touch!)*
    \`?queue limit [entry-duration|cooldown]\` - Sets a limit value on the queue. *(Server owner only. No touch!)*
\`?sr\` - Submit a song to the queue.
    \`?sr <song name or YouTube link>\` - Attempts to add the given content to the queue.
\`?t\` - Start typing :wink:
\`?video\` - Query YouTube or SoundCloud for video data.
    \`?video {link}\` - Puts the video title and duration in chat.`);
  });
});
