jest.mock("../../permissions");
jest.mock("../../useGuildStorage");

import { userIsAdminInGuild } from "../../permissions";
const mockUserIsAdminInGuild = userIsAdminInGuild as jest.Mock;

import { useGuildStorage } from "../../useGuildStorage";
const mockUseGuildStorage = useGuildStorage as jest.Mock;

import type { CommandContext } from "../Command";
import { useTestLogger } from "../../../tests/testUtils/logger";
import teardown from "./teardown";

const mockSetQueueChannel = jest.fn();
const mockReply = jest.fn().mockResolvedValue(undefined);
const mockReplyPrivately = jest.fn().mockResolvedValue(undefined);

const logger = useTestLogger("error");

describe("Queue teardown", () => {
  let context: CommandContext;

  beforeEach(() => {
    context = ({
      guild: "the guild",
      logger,
      reply: mockReply,
      replyPrivately: mockReplyPrivately
    } as unknown) as CommandContext;

    mockReplyPrivately.mockResolvedValue(undefined);
    mockUserIsAdminInGuild.mockResolvedValue(true);
    mockUseGuildStorage.mockReturnValue({
      setQueueChannel: mockSetQueueChannel
    });
    mockSetQueueChannel.mockResolvedValue(undefined);
  });

  test("does nothing about a message with no guild", async () => {
    context.guild = null;
    await expect(teardown.execute(context)).resolves.toBeUndefined();

    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith("Can't do that here.");
    expect(mockSetQueueChannel).not.toHaveBeenCalled();
  });

  test("does nothing when the sender doesn't have permission", async () => {
    mockUserIsAdminInGuild.mockResolvedValue(false);
    await expect(teardown.execute(context)).resolves.toBeUndefined();

    expect(mockReply).not.toHaveBeenCalled();
    expect(mockReplyPrivately).toHaveBeenCalledTimes(1);
    expect(mockReplyPrivately).toHaveBeenCalledWith(
      "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that..."
    );
    expect(mockSetQueueChannel).not.toHaveBeenCalled();
  });

  test("unsets the guild queue", async () => {
    await expect(teardown.execute(context)).resolves.toBeUndefined();

    expect(mockReplyPrivately).not.toHaveBeenCalled();
    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith("Queue deleted.");
    expect(mockSetQueueChannel).toHaveBeenCalledTimes(1);
    expect(mockSetQueueChannel).toHaveBeenCalledWith(null);
  });
});
