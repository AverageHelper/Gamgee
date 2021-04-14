jest.mock("../messages");

import { deleteMessage } from "../messages";
const mockDeleteMessage = deleteMessage as jest.Mock;

const mockFetchEntryFromMessage = jest.fn();
const mockRemoveEntryFromMessage = jest.fn();

import type Discord from "discord.js";
import type { QueueEntryManager } from "../../useQueueStorage";
import { QueueManager } from "./useQueue";

describe("Request Queue", () => {
  const queueMessageId = "queue-message";

  let storage: QueueEntryManager;
  let queue: QueueManager;
  let queueChannel: Discord.TextChannel;
  let message: Discord.Message;

  beforeEach(() => {
    mockFetchEntryFromMessage.mockImplementation(id => {
      if (id === queueMessageId) {
        return {}; // some entry
      }
      return null; // not an entry
    });
    mockRemoveEntryFromMessage.mockResolvedValue(undefined);

    queueChannel = ({
      id: "queue-channel"
    } as unknown) as Discord.TextChannel;

    storage = ({
      fetchEntryFromMessage: mockFetchEntryFromMessage,
      removeEntryFromMessage: mockRemoveEntryFromMessage
    } as unknown) as QueueEntryManager;

    queue = new QueueManager(storage, queueChannel);

    message = ({
      id: queueMessageId
    } as unknown) as Discord.Message;
  });

  test("does nothing when a message has nothing to do with a queue entry", async () => {
    message.id = "not-a-queue-message";
    await expect(queue.deleteEntryFromMessage(message)).resolves.toBeUndefined();

    expect(mockRemoveEntryFromMessage).not.toHaveBeenCalled();
    expect(mockDeleteMessage).not.toHaveBeenCalled();
  });

  test("deletes a queue entry based on a message", async () => {
    message.id = queueMessageId;
    await expect(queue.deleteEntryFromMessage(message)).resolves.toBeUndefined();

    expect(mockRemoveEntryFromMessage).toHaveBeenCalledTimes(1);
    expect(mockRemoveEntryFromMessage).toHaveBeenCalledWith(message.id);
    expect(mockDeleteMessage).toHaveBeenCalledTimes(1);
    expect(mockDeleteMessage).toHaveBeenCalledWith(message);
  });
});
