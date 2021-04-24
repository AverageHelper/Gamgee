jest.mock("./actions");
jest.mock("../../actions/queue/getQueueChannel");
jest.mock("../../useQueueStorage");
jest.mock("../../helpers/getUserFromMention");
jest.mock("../../actions/messages");
jest.mock("../../permissions");

import { reply } from "./actions";
const mockReply = reply as jest.Mock;

import { deleteMessage } from "../../actions/messages";
const mockDeleteMessage = deleteMessage as jest.Mock;

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
import blacklist from "./blacklist";

const mockBlacklistUser = jest.fn();

const logger = useTestLogger("error");

describe("Adding to Queue Blacklist", () => {
  const queueChannelId = "queue-channel";

  const ownerID = "server-owner";
  const badUserId = "bad-user";

  let context: CommandContext;
  let queue: QueueEntryManager;

  beforeEach(() => {
    context = ({
      message: {
        id: "command-msg",
        author: { id: "test-user" },
        guild: { ownerID }
      },
      args: ["blacklist", `<@${badUserId}>`],
      logger
    } as unknown) as CommandContext;

    queue = ({
      blacklistUser: mockBlacklistUser
    } as unknown) as QueueEntryManager;

    mockGetQueueChannel.mockResolvedValue({ id: queueChannelId });
    mockGetUserFromMention.mockResolvedValue({ id: badUserId });

    mockUseQueueStorage.mockReturnValue(queue);
    mockBlacklistUser.mockResolvedValue(undefined);
    mockReply.mockResolvedValue(undefined);
    mockDeleteMessage.mockResolvedValue(undefined);

    mockUserIsAdminForQueueInGuild.mockResolvedValue(true);
  });

  test("does nothing without a valid mention (empty space)", async () => {
    context.args = [""];
    await expect(blacklist.execute(context)).resolves.toBe(undefined);

    expect(mockBlacklistUser).not.toHaveBeenCalled();
    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith(
      context.message,
      expect.stringContaining("mention someone")
    );
  });

  test("does nothing without a mention (no further text)", async () => {
    context.args = [];
    await expect(blacklist.execute(context)).resolves.toBe(undefined);

    expect(mockBlacklistUser).not.toHaveBeenCalled();
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
    await expect(blacklist.execute(context)).resolves.toBe(undefined);

    expect(mockBlacklistUser).not.toHaveBeenCalled();
  });

  test("does nothing against the calling user", async () => {
    mockGetUserFromMention.mockResolvedValue({ id: context.message.author.id });
    await expect(blacklist.execute(context)).resolves.toBe(undefined);

    expect(mockBlacklistUser).not.toHaveBeenCalled();
    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith(
      context.message,
      expect.stringContaining("blacklist yourself")
    );
  });

  test("does nothing against the server owner", async () => {
    mockGetUserFromMention.mockResolvedValue({ id: ownerID });
    await expect(blacklist.execute(context)).resolves.toBe(undefined);

    expect(mockBlacklistUser).not.toHaveBeenCalled();
    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith(
      context.message,
      expect.stringContaining("blacklist the owner")
    );
  });

  test("does nothing against the server owner, even when the owner is the caller", async () => {
    context.message.author.id = ownerID;
    mockGetUserFromMention.mockResolvedValue({ id: ownerID });
    await expect(blacklist.execute(context)).resolves.toBe(undefined);

    expect(mockBlacklistUser).not.toHaveBeenCalled();
    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith(
      context.message,
      expect.stringContaining("blacklist yourself")
    );
  });

  test("does nothing against a user not known to the guild", async () => {
    mockGetUserFromMention.mockResolvedValue(undefined);
    await expect(blacklist.execute(context)).resolves.toBe(undefined);

    expect(mockBlacklistUser).not.toHaveBeenCalled();
  });

  test("does nothing when there's no queue", async () => {
    mockGetQueueChannel.mockResolvedValueOnce(null);
    await expect(blacklist.execute(context)).resolves.toBe(undefined);

    expect(mockBlacklistUser).not.toHaveBeenCalled();
  });

  test("does nothing when the caller is not admin", async () => {
    mockUserIsAdminForQueueInGuild.mockResolvedValueOnce(false);
    await expect(blacklist.execute(context)).resolves.toBe(undefined);

    expect(mockBlacklistUser).not.toHaveBeenCalled();
  });

  test("calls blacklistUser for queue when the caller is admin", async () => {
    await expect(blacklist.execute(context)).resolves.toBe(undefined);

    // permissions got checked
    expect(mockUserIsAdminForQueueInGuild).toHaveBeenCalledTimes(1);
    expect(mockUserIsAdminForQueueInGuild).toHaveBeenCalledWith(
      context.message.author,
      context.message.guild
    );

    // blacklist effect
    expect(mockBlacklistUser).toHaveBeenCalledTimes(1);
    expect(mockBlacklistUser).toHaveBeenCalledWith(badUserId);

    // response
    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith(
      context.message,
      expect.stringContaining(badUserId),
      false
    );
    expect(mockDeleteMessage).toHaveBeenCalledTimes(1);
    expect(mockDeleteMessage).toHaveBeenCalledWith(context.message, expect.toBeString());
  });
});
