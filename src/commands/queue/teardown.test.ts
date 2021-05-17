jest.mock("../../useGuildStorage");

import { useGuildStorage } from "../../useGuildStorage";
const mockUseGuildStorage = useGuildStorage as jest.Mock;

import type { GuildedCommandContext } from "../Command";
import { useTestLogger } from "../../../tests/testUtils/logger";
import teardown from "./teardown";

const mockSetQueueChannel = jest.fn();
const mockReply = jest.fn().mockResolvedValue(undefined);

const logger = useTestLogger("error");

describe("Queue teardown", () => {
  let context: GuildedCommandContext;

  beforeEach(() => {
    context = ({
      guild: "the guild",
      logger,
      reply: mockReply
    } as unknown) as GuildedCommandContext;

    mockUseGuildStorage.mockReturnValue({
      setQueueChannel: mockSetQueueChannel
    });
    mockSetQueueChannel.mockResolvedValue(undefined);
  });

  test("unsets the guild queue", async () => {
    await expect(teardown.execute(context)).resolves.toBeUndefined();

    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith("Queue deleted.");
    expect(mockSetQueueChannel).toHaveBeenCalledTimes(1);
    expect(mockSetQueueChannel).toHaveBeenCalledWith(null);
  });
});
