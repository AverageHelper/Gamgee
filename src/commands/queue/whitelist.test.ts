jest.mock("../../actions/queue/getQueueChannel");
jest.mock("../../useQueueStorage");
jest.mock("../../helpers/getUserFromMention");
jest.mock("../../permissions");

import getUserFromMention from "../../helpers/getUserFromMention";
const mockGetUserFromMention = getUserFromMention as jest.Mock;

import { userIsAdminForQueueInGuild } from "../../permissions";
const mockUserIsAdminForQueueInGuild = userIsAdminForQueueInGuild as jest.Mock;

import getQueueChannel from "../../actions/queue/getQueueChannel";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import { useQueueStorage } from "../../useQueueStorage";
const mockUseQueueStorage = useQueueStorage as jest.Mock;

import type { QueueEntryManager } from "../../useQueueStorage";
import type { GuildedCommandContext } from "../Command";
import { useTestLogger } from "../../../tests/testUtils/logger";
import whitelist from "./whitelist";

const mockWhitelistUser = jest.fn();
const mockReply = jest.fn().mockResolvedValue(undefined);
const mockReplyPrivately = jest.fn().mockResolvedValue(undefined);
const mockDeleteMessage = jest.fn().mockResolvedValue(undefined);

const logger = useTestLogger("error");

describe("Removing from Queue Blacklist", () => {
  const queueChannelId = "queue-channel";

  const ownerID = "server-owner";
  const goodUserId = "good-user";

  let context: GuildedCommandContext;
  let queue: QueueEntryManager;

  beforeEach(() => {
    context = ({
      user: { id: "test-user" },
      guild: { ownerID },
      options: [
        {
          name: "user",
          value: `<@${goodUserId}>`
        }
      ],
      logger,
      reply: mockReply,
      replyPrivately: mockReplyPrivately,
      deleteInvocation: mockDeleteMessage
    } as unknown) as GuildedCommandContext;

    queue = ({
      whitelistUser: mockWhitelistUser
    } as unknown) as QueueEntryManager;

    mockGetQueueChannel.mockResolvedValue({ id: queueChannelId });
    mockGetUserFromMention.mockResolvedValue({ id: goodUserId });

    mockUseQueueStorage.mockReturnValue(queue);
    mockWhitelistUser.mockResolvedValue(undefined);
    mockReply.mockResolvedValue(undefined);
    mockDeleteMessage.mockResolvedValue(undefined);

    mockUserIsAdminForQueueInGuild.mockResolvedValue(true);
  });

  test("does nothing without a valid mention (empty space)", async () => {
    context.options = [];
    await expect(whitelist.execute(context)).resolves.toBe(undefined);

    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith(expect.stringContaining("mention someone"), {
      ephemeral: true
    });
  });

  test("does nothing without a mention (no further text)", async () => {
    context.options = [];
    await expect(whitelist.execute(context)).resolves.toBe(undefined);

    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith(expect.stringContaining("mention someone"), {
      ephemeral: true
    });
  });

  test("does nothing for the calling user", async () => {
    mockGetUserFromMention.mockResolvedValue({ id: context.user.id });
    await expect(whitelist.execute(context)).resolves.toBe(undefined);

    expect(mockWhitelistUser).not.toHaveBeenCalled();
    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith(expect.stringContaining("whitelist yourself"), {
      ephemeral: true
    });
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
    expect(mockUserIsAdminForQueueInGuild).toHaveBeenCalledWith(context.user, context.guild);

    // whitelist effect
    expect(mockWhitelistUser).toHaveBeenCalledTimes(1);
    expect(mockWhitelistUser).toHaveBeenCalledWith(goodUserId);

    // response
    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith(expect.stringContaining(goodUserId), {
      shouldMention: false,
      ephemeral: true
    });
    expect(mockDeleteMessage).toHaveBeenCalledTimes(1);
    expect(mockDeleteMessage).toHaveBeenCalledWith();
  });
});
