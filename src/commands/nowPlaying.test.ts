jest.mock("../actions/messages");
jest.mock("../actions/queue/useQueue");
jest.mock("../actions/queue/getQueueChannel");
jest.mock("../permissions");
jest.mock("./songRequest/actions");

import * as messageActions from "../actions/messages";
const mockReplyWithMention = messageActions.replyWithMention as jest.Mock;
const mockReplyPrivately = messageActions.replyPrivately as jest.Mock;
const mockDeleteMessage = messageActions.deleteMessage as jest.Mock;

import { useQueue } from "../actions/queue/useQueue";
const mockUseQueue = useQueue as jest.Mock;

import getQueueChannel from "../actions/queue/getQueueChannel";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import { userIsAdminForQueueInGuild } from "../permissions";
const mockUserIsAdminForQueueInGuild = userIsAdminForQueueInGuild as jest.Mock;

import { reply } from "./songRequest/actions";
const mockReply = reply as jest.Mock;

const mockGetAllEntries = jest.fn();

import type Discord from "discord.js";
import nowPlaying from "./nowPlaying";
import { useTestLogger } from "../../tests/testUtils/logger";
import type { CommandContext } from "./Command";
import type { QueueEntry } from "../useQueueStorage";

const logger = useTestLogger("error");

describe("Now-Playing", () => {
  const queueChannelId = "queue-channel";
  let context: CommandContext;

  beforeEach(() => {
    context = ({
      logger,
      message: {
        guild: "the guild",
        channel: {
          id: "not-queue-channel"
        }
      }
    } as unknown) as CommandContext;

    mockUseQueue.mockReturnValue({
      getAllEntries: mockGetAllEntries
    });
    mockGetAllEntries.mockResolvedValue([]);
    mockReplyWithMention.mockResolvedValue(undefined);
    mockReplyPrivately.mockResolvedValue(undefined);
    mockDeleteMessage.mockResolvedValue(undefined);
    mockUserIsAdminForQueueInGuild.mockResolvedValue(false);
    mockGetQueueChannel.mockResolvedValue({ id: queueChannelId });
  });

  test("does nothing when not in a guild", async () => {
    context.message = ({
      guild: null
    } as unknown) as Discord.Message;
    await expect(nowPlaying.execute(context)).resolves.toBe(undefined);

    expect(mockDeleteMessage).not.toHaveBeenCalled();
    expect(mockReplyPrivately).not.toHaveBeenCalled();
    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith(context.message, "Can't do that here.");
  });

  test("informs the user when no queue is set up", async () => {
    mockGetQueueChannel.mockResolvedValue(null);

    await expect(nowPlaying.execute(context)).resolves.toBe(undefined);

    expect(mockUseQueue).not.toHaveBeenCalled();

    expect(mockDeleteMessage).toHaveBeenCalledTimes(1);
    expect(mockReplyWithMention).not.toHaveBeenCalled();
    expect(mockReplyPrivately).toHaveBeenCalledTimes(1);
    expect(mockReplyPrivately).toHaveBeenCalledWith(
      context.message,
      expect.stringContaining("no queue")
    );
  });

  test.each`
    values
    ${[]}
    ${[{ isDone: true }]}
    ${[{ isDone: true }, { isDone: true }]}
    ${[{ isDone: true }, { isDone: true }, { isDone: true }]}
  `(
    "informs the user if all entries are done or the queue is empty",
    async ({ values }: { values: Array<QueueEntry> }) => {
      mockGetAllEntries.mockResolvedValue(values);

      await expect(nowPlaying.execute(context)).resolves.toBe(undefined);

      expect(mockUseQueue).toHaveBeenCalledTimes(1);

      expect(mockDeleteMessage).toHaveBeenCalledTimes(1);
      expect(mockReplyWithMention).not.toHaveBeenCalled();
      expect(mockReplyPrivately).toHaveBeenCalledTimes(1);
      expect(mockReplyPrivately).toHaveBeenCalledWith(
        context.message,
        expect.stringContaining("nothing")
      );
    }
  );

  test.each`
    values
    ${[{ isDone: false, url: "first!", senderId: "me" }]}
    ${[{ isDone: false, url: "first!", senderId: "me" }, { isDone: false }]}
    ${[{ isDone: false, url: "first!", senderId: "me" }, { isDone: false }, { isDone: false }]}
    ${[{ isDone: true }, { isDone: false, url: "first!", senderId: "me" }, { isDone: false }]}
    ${[{ isDone: true }, { isDone: true }, { isDone: false, url: "first!", senderId: "me" }]}
    ${[{ isDone: false, url: "first!", senderId: "me" }, { isDone: true }, { isDone: false }]}
  `(
    "provides the URL of the most recent not-done song",
    async ({ values }: { values: Array<QueueEntry> }) => {
      mockGetAllEntries.mockResolvedValue(values);

      await expect(nowPlaying.execute(context)).resolves.toBe(undefined);

      expect(mockUseQueue).toHaveBeenCalledTimes(1);

      expect(mockDeleteMessage).toHaveBeenCalledTimes(1);
      expect(mockReplyWithMention).not.toHaveBeenCalled();
      expect(mockReplyPrivately).toHaveBeenCalledTimes(1);
      expect(mockReplyPrivately).toHaveBeenCalledWith(
        context.message,
        expect.stringContaining("first!")
      );
      expect(mockReplyPrivately).toHaveBeenCalledWith(
        context.message,
        expect.stringContaining("<@me>")
      );
    }
  );
});
