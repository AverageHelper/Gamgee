jest.mock("../../actions/messages");
jest.mock("../../actions/queue/useQueue");
jest.mock("../../actions/queue/getQueueChannel");
jest.mock("../../permissions");

import { bulkDeleteMessagesWithIds } from "../../actions/messages";
const mockBulkDeleteMessagesWithIds = bulkDeleteMessagesWithIds as jest.Mock;

import { useQueue } from "../../actions/queue/useQueue";
const mockUseQueue = useQueue as jest.Mock;

import getQueueChannel from "../../actions/queue/getQueueChannel";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import { userIsAdminForQueueInGuild } from "../../permissions";
const mockUserIsAdminForQueueInGuild = userIsAdminForQueueInGuild as jest.Mock;

const mockGetAllEntries = jest.fn();
const mockQueueClear = jest.fn();

import type Discord from "discord.js";
import type { CommandContext } from "../Command";
import restart from "./restart";
import { useTestLogger } from "../../../tests/testUtils/logger";

const mockPrepareForLongRunningTasks = jest.fn().mockResolvedValue(undefined);
const mockReply = jest.fn().mockResolvedValue(undefined);
const mockReplyPrivately = jest.fn().mockResolvedValue(undefined);

const logger = useTestLogger("error");

describe("Clear queue contents", () => {
  let context: CommandContext;

  beforeEach(() => {
    context = ({
      logger,
      guild: "the guild",
      channel: {
        id: "not-queue-channel"
      },
      prepareForLongRunningTasks: mockPrepareForLongRunningTasks,
      reply: mockReply,
      replyPrivately: mockReplyPrivately
    } as unknown) as CommandContext;

    mockUseQueue.mockReturnValue({
      getAllEntries: mockGetAllEntries,
      clear: mockQueueClear
    });
    mockGetAllEntries.mockResolvedValue([]);
    mockQueueClear.mockResolvedValue(undefined);
    mockReplyPrivately.mockResolvedValue(undefined);
    mockUserIsAdminForQueueInGuild.mockResolvedValue(false);
  });

  test("does nothing about a message with no guild", async () => {
    context.guild = null;
    await expect(restart.execute(context)).resolves.toBeUndefined();

    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith("Can't do that here.");
    expect(mockUseQueue).not.toHaveBeenCalled();
  });

  test("does nothing when admin and no queue is set up", async () => {
    mockGetQueueChannel.mockResolvedValue(null);
    mockUserIsAdminForQueueInGuild.mockResolvedValue(true);

    await expect(restart.execute(context)).resolves.toBeUndefined();

    expect(mockReplyPrivately).not.toHaveBeenCalled();
    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith("No queue is set up. Maybe that's what you wanted...?");
    expect(mockUseQueue).not.toHaveBeenCalled();
  });

  test("does nothing when not admin and no queue is set up", async () => {
    mockGetQueueChannel.mockResolvedValue(null);
    mockUserIsAdminForQueueInGuild.mockResolvedValue(false);

    await expect(restart.execute(context)).resolves.toBeUndefined();

    // Non-admins outside the queue channel get a permission error
    expect(mockReply).not.toHaveBeenCalled();
    expect(mockReplyPrivately).toHaveBeenCalledTimes(1);
    expect(mockReplyPrivately).toHaveBeenCalledWith(
      "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that..."
    );
    expect(mockUseQueue).not.toHaveBeenCalled();
  });

  test("does nothing when not admin and not in queue channel", async () => {
    mockGetQueueChannel.mockResolvedValue({ id: "queue-channel" });
    mockUserIsAdminForQueueInGuild.mockResolvedValue(false);

    await expect(restart.execute(context)).resolves.toBeUndefined();

    expect(mockReply).not.toHaveBeenCalled();
    expect(mockReplyPrivately).toHaveBeenCalledTimes(1);
    expect(mockReplyPrivately).toHaveBeenCalledWith(
      "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that..."
    );
    expect(mockUseQueue).not.toHaveBeenCalled();
  });

  test.each`
    channelId              | isAdmin
    ${"not-queue-channel"} | ${true}
    ${"queue-channel"}     | ${true}
    ${"queue-channel"}     | ${false}
  `(
    "clears the queue when admin==$isAdmin and in $channelId",
    async ({ channelId, isAdmin }: { channelId: string; isAdmin: boolean }) => {
      const queueChannel = { id: "queue-channel" };
      const queueEntries = [
        { queueMessageId: "message1" },
        { queueMessageId: "message2" },
        { queueMessageId: "message3" }
      ];
      mockGetQueueChannel.mockResolvedValue(queueChannel);
      mockUserIsAdminForQueueInGuild.mockResolvedValue(isAdmin);
      mockGetAllEntries.mockResolvedValue(queueEntries);
      context.channel = ({
        id: channelId
      } as unknown) as Discord.TextChannel;

      await expect(restart.execute(context)).resolves.toBeUndefined();

      // Feedback
      expect(mockPrepareForLongRunningTasks).toHaveBeenCalledTimes(1);
      expect(mockReply).toHaveBeenCalledTimes(1);
      expect(mockReply).toHaveBeenCalledWith("The queue has restarted.");

      // Actions
      expect(mockUseQueue).toHaveBeenCalledTimes(1);
      expect(mockUseQueue).toHaveBeenCalledWith(queueChannel);
      expect(mockBulkDeleteMessagesWithIds).toHaveBeenCalledTimes(1);
      expect(mockBulkDeleteMessagesWithIds).toHaveBeenCalledWith(
        queueEntries.map(entry => entry.queueMessageId),
        queueChannel
      );
      expect(mockQueueClear).toHaveBeenCalledTimes(1);
    }
  );
});
