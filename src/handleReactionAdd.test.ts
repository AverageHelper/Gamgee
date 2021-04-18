jest.mock("./actions/queue/getQueueChannel");
jest.mock("./actions/queue/useQueue");

import getQueueChannel from "./actions/queue/getQueueChannel";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import { useQueue } from "./actions/queue/useQueue";
const mockUseQueue = useQueue as jest.Mock;

const mockMarkDone = jest.fn().mockResolvedValue(undefined);
const mockMarkNotDone = jest.fn().mockResolvedValue(undefined);
const mockDeleteEntryFromMessage = jest.fn().mockResolvedValue(undefined);

import type Discord from "discord.js";
import { handleReactionAdd } from "./handleReactionAdd";
import { REACTION_BTN_DELETE, REACTION_BTN_DONE, REACTION_BTN_UNDO } from "./constants/reactions";
import { useTestLogger } from "../tests/testUtils/logger";

const logger = useTestLogger("error");

describe("Reaction-add handler", () => {
  const selfId = "this-bot";
  const senderId = "a-user";
  const queueChannelId = "queue-channel";

  const entry = {
    queueMessageId: "some-particular-message",
    isDone: false
  };
  let reaction: Discord.MessageReaction;
  let sender: Discord.User;

  beforeEach(() => {
    reaction = ({
      client: {
        user: {
          id: selfId
        }
      },
      message: {
        channel: {
          id: queueChannelId
        }
      },
      emoji: {
        name: ":face_with_monocle:"
      }
    } as unknown) as Discord.MessageReaction;
    sender = ({
      bot: false,
      id: senderId
    } as unknown) as Discord.User;

    mockGetQueueChannel.mockResolvedValue({
      id: queueChannelId
    });
    mockUseQueue.mockReturnValue({
      getEntryFromMessage: jest.fn().mockResolvedValue(entry),
      markDone: mockMarkDone,
      markNotDone: mockMarkNotDone,
      deleteEntryFromMessage: mockDeleteEntryFromMessage
    });
  });

  test("extra emote triggers no action", async () => {
    await expect(handleReactionAdd(reaction, sender, logger)).resolves.toBeUndefined();

    expect(mockMarkDone).not.toHaveBeenCalled();
    expect(mockMarkNotDone).not.toHaveBeenCalled();
    expect(mockDeleteEntryFromMessage).not.toHaveBeenCalled();
  });

  test("Done button triggers mark-done action", async () => {
    reaction.emoji.name = REACTION_BTN_DONE;
    await expect(handleReactionAdd(reaction, sender, logger)).resolves.toBeUndefined();

    expect(mockMarkDone).toHaveBeenCalledTimes(1);
    expect(mockMarkNotDone).not.toHaveBeenCalled();
    expect(mockDeleteEntryFromMessage).not.toHaveBeenCalled();
  });

  test("Undo button triggers mark-not-done action", async () => {
    reaction.emoji.name = REACTION_BTN_UNDO;
    await expect(handleReactionAdd(reaction, sender, logger)).resolves.toBeUndefined();

    expect(mockMarkNotDone).toHaveBeenCalledTimes(1);
    expect(mockMarkDone).not.toHaveBeenCalled();
    expect(mockDeleteEntryFromMessage).not.toHaveBeenCalled();
  });

  test("Delete button triggers delete action", async () => {
    reaction.emoji.name = REACTION_BTN_DELETE;
    await expect(handleReactionAdd(reaction, sender, logger)).resolves.toBeUndefined();

    expect(mockDeleteEntryFromMessage).toHaveBeenCalledTimes(1);
    expect(mockMarkDone).not.toHaveBeenCalled();
    expect(mockMarkNotDone).not.toHaveBeenCalled();
  });
});
