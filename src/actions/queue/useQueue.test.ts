jest.mock("../messages");

import { deleteMessage } from "../messages";
const mockDeleteMessage = deleteMessage as jest.Mock;

const mockFetchEntryFromMessage = jest.fn();
const mockRemoveEntryFromMessage = jest.fn();
const mockCreateEntry = jest.fn();
const mockGetConfig = jest.fn();

const mockChannelSend = jest.fn();
const mockMessageReact = jest.fn();

import type Discord from "discord.js";
import type { QueueEntry, QueueEntryManager, UnsentQueueEntry } from "../../useQueueStorage";
import { QueueManager } from "./useQueue";

describe("Request Queue", () => {
  const guildId = "the-guild";
  const queueMessageId = "queue-message";
  const entrySenderId = "some-user";
  const entryUrl = "the-entry-url";

  let storage: QueueEntryManager;
  let queue: QueueManager;
  let queueChannel: Discord.TextChannel;
  let message: Discord.Message;
  let entry: QueueEntry;

  beforeEach(() => {
    queueChannel = ({
      id: "queue-channel",
      send: mockChannelSend
    } as unknown) as Discord.TextChannel;

    storage = ({
      fetchEntryFromMessage: mockFetchEntryFromMessage,
      removeEntryFromMessage: mockRemoveEntryFromMessage,
      create: mockCreateEntry,
      getConfig: mockGetConfig
    } as unknown) as QueueEntryManager;

    queue = new QueueManager(storage, queueChannel);

    message = ({
      id: queueMessageId,
      author: {
        id: entrySenderId
      },
      guild: {
        id: guildId
      }
    } as unknown) as Discord.Message;

    entry = ({
      senderId: entrySenderId,
      url: entryUrl
    } as unknown) as QueueEntry;

    mockFetchEntryFromMessage.mockImplementation(id => {
      if (id === queueMessageId) {
        return entry; // some entry
      }
      return null; // not an entry
    });
    mockRemoveEntryFromMessage.mockResolvedValue(undefined);
    mockCreateEntry.mockImplementation((entry: UnsentQueueEntry) => {
      return Promise.resolve({ ...entry, channelId: queueChannel.id });
    });
    mockGetConfig.mockResolvedValue({
      channelId: queueChannel.id,
      entryDurationSeconds: 430,
      cooldownSeconds: 960,
      submissionMaxQuantity: 3,
      blacklistedUsers: []
    });
    mockMessageReact.mockResolvedValue(undefined);
    mockChannelSend.mockResolvedValue({
      id: "new-message",
      react: mockMessageReact
    });
  });

  test("does nothing when a message has nothing to do with a queue entry", async () => {
    message.id = "not-a-queue-message";
    await expect(queue.deleteEntryFromMessage(message)).resolves.toBeNull();

    expect(mockRemoveEntryFromMessage).not.toHaveBeenCalled();
    expect(mockDeleteMessage).not.toHaveBeenCalled();
  });

  test("deletes a queue entry based on a message", async () => {
    message.id = queueMessageId;
    await expect(queue.deleteEntryFromMessage(message)).resolves.toBe(entry);

    expect(mockRemoveEntryFromMessage).toHaveBeenCalledTimes(1);
    expect(mockRemoveEntryFromMessage).toHaveBeenCalledWith(message.id);
    expect(mockDeleteMessage).toHaveBeenCalledTimes(1);
    expect(mockDeleteMessage).toHaveBeenCalledWith(message);
  });

  const request: UnsentQueueEntry = {
    url: "song-url",
    seconds: 43,
    sentAt: new Date(),
    senderId: "sender"
  };

  test("stores queue entries", async () => {
    await expect(queue.push(request)).resolves.toContainEntries([
      ...Object.entries(request),
      ["channelId", queueChannel.id]
    ]);

    expect(mockCreateEntry).toHaveBeenCalledTimes(1);
    expect(mockCreateEntry).toHaveBeenCalledWith({
      ...request,
      isDone: false,
      queueMessageId: "new-message"
    });

    // deploys the UI
    expect(mockMessageReact).toHaveBeenCalledTimes(3);
    expect(mockMessageReact).not.toHaveBeenCalledBefore(mockCreateEntry);

    expect(mockRemoveEntryFromMessage).not.toHaveBeenCalled();
  });

  test("message reaction errors do not let the entry stay stored", async () => {
    const error = new Error("You're gonna have a bad time.");
    mockMessageReact.mockRejectedValueOnce(error);

    await expect(queue.push(request)).rejects.toBe(error);

    expect(mockCreateEntry).toHaveBeenCalledTimes(1);
    expect(mockCreateEntry).toHaveBeenCalledWith({
      ...request,
      isDone: false,
      queueMessageId: "new-message"
    });

    // aborts by deleting the failed entry
    expect(mockRemoveEntryFromMessage).toHaveBeenCalledTimes(1);
    expect(mockRemoveEntryFromMessage).not.toHaveBeenCalledBefore(mockCreateEntry);
    expect(mockRemoveEntryFromMessage).toHaveBeenCalledWith("new-message");
  });
});
