jest.mock("./actions");
jest.mock("../../actions/queue/getQueueChannel");
jest.mock("../../useQueueStorage");
jest.mock("../../helpers/getUserFromMention");
jest.mock("../../actions/messages");
jest.mock("../../permissions");

import { reply } from "./actions";
const mockReply = reply as jest.Mock;

import { deleteMessage, replyPrivately } from "../../actions/messages";
const mockDeleteMessage = deleteMessage as jest.Mock;
const mockReplyPrivately = replyPrivately as jest.Mock;

import getUserFromMention from "../../helpers/getUserFromMention";
const mockGetUserFromMention = getUserFromMention as jest.Mock;

import { userIsAdminForQueueInGuild } from "../../permissions";
const mockUserIsAdminForQueueInGuild = userIsAdminForQueueInGuild as jest.Mock;

import getQueueChannel from "../../actions/queue/getQueueChannel";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import { useQueueStorage } from "../../useQueueStorage";
const mockUseQueueStorage = useQueueStorage as jest.Mock;

import type Discord from "discord.js";
import type { QueueEntryManager } from "../../useQueueStorage";
import type { CommandContext } from "../Command";
import { useTestLogger } from "../../../tests/testUtils/logger";
import whitelist from "./whitelist";

const mockWhitelistUser = jest.fn();

const logger = useTestLogger("error");

describe("Removing from Queue Blacklist", () => {
  const queueChannelId = "queue-channel";

  const ownerID = "server-owner";
  const goodUserId = "good-user";

  let context: CommandContext;
  let queue: QueueEntryManager;

  beforeEach(() => {
    context = ({
      message: {
        id: "command-msg",
        author: { id: "test-user" },
        guild: { ownerID }
      },
      args: [`<@${goodUserId}>`],
      logger
    } as unknown) as CommandContext;

    queue = ({
      whitelistUser: mockWhitelistUser
    } as unknown) as QueueEntryManager;

    mockGetQueueChannel.mockResolvedValue({ id: queueChannelId });
    mockGetUserFromMention.mockResolvedValue({ id: goodUserId });

    mockUseQueueStorage.mockReturnValue(queue);
    mockWhitelistUser.mockResolvedValue(undefined);
    mockReply.mockResolvedValue(undefined);
    mockReplyPrivately.mockResolvedValue(undefined);
    mockDeleteMessage.mockResolvedValue(undefined);

    mockUserIsAdminForQueueInGuild.mockResolvedValue(true);
  });

  test("does nothing without a valid mention (empty space)", async () => {
    context.args = [""];
    await expect(whitelist.execute(context)).resolves.toBe(undefined);

    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith(
      context.message,
      expect.stringContaining("mention someone")
    );
  });

  test("does nothing without a mention (no further text)", async () => {
    context.args = [];
    await expect(whitelist.execute(context)).resolves.toBe(undefined);

    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith(
      context.message,
      expect.stringContaining("mention someone")
    );
  });

  test("does nothing when not in a guild", async () => {
    context.message = ({
      guild: null
    } as unknown) as Discord.Message;
    await expect(whitelist.execute(context)).resolves.toBe(undefined);

    expect(mockWhitelistUser).not.toHaveBeenCalled();
  });

  test("does nothing for the calling user", async () => {
    mockGetUserFromMention.mockResolvedValue({ id: context.message.author.id });
    await expect(whitelist.execute(context)).resolves.toBe(undefined);

    expect(mockWhitelistUser).not.toHaveBeenCalled();
    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith(
      context.message,
      expect.stringContaining("whitelist yourself")
    );
  });

  test("does nothing for a user not known to the guild", async () => {
    mockGetUserFromMention.mockResolvedValue(undefined);
    await expect(whitelist.execute(context)).resolves.toBe(undefined);

    expect(mockWhitelistUser).not.toHaveBeenCalled();
  });

  test("does nothing when there's no queue", async () => {
    mockGetQueueChannel.mockResolvedValueOnce(null);
    await expect(whitelist.execute(context)).resolves.toBe(undefined);

    expect(mockWhitelistUser).not.toHaveBeenCalled();
  });

  test("does nothing when the caller is not admin", async () => {
    mockUserIsAdminForQueueInGuild.mockResolvedValueOnce(false);
    await expect(whitelist.execute(context)).resolves.toBe(undefined);

    expect(mockWhitelistUser).not.toHaveBeenCalled();
  });

  test("calls whitelistUser for queue when the caller is admin", async () => {
    await expect(whitelist.execute(context)).resolves.toBe(undefined);

    // permissions got checked
    expect(mockUserIsAdminForQueueInGuild).toHaveBeenCalledTimes(1);
    expect(mockUserIsAdminForQueueInGuild).toHaveBeenCalledWith(
      context.message.author,
      context.message.guild
    );

    // whitelist effect
    expect(mockWhitelistUser).toHaveBeenCalledTimes(1);
    expect(mockWhitelistUser).toHaveBeenCalledWith(goodUserId);

    // response
    expect(mockReply).not.toHaveBeenCalled();
    expect(mockReplyPrivately).toHaveBeenCalledTimes(1);
    expect(mockReplyPrivately).toHaveBeenCalledWith(
      context.message,
      expect.stringContaining(goodUserId)
    );
    expect(mockDeleteMessage).toHaveBeenCalledTimes(1);
    expect(mockDeleteMessage).toHaveBeenCalledWith(context.message, expect.toBeString());
  });
});
