import type { CommandContext } from "../Command";
import info from "./info";

const mockReply = jest.fn().mockResolvedValue(undefined);

describe("Song request help", () => {
  test("descibes how to submit a song", async () => {
    const context = ({
      storage: null,
      reply: mockReply
    } as unknown) as CommandContext;

    await info.execute(context);
    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith(expect.toBeString());

    const calls = mockReply.mock.calls[0] as Array<unknown>;
    const description = calls[0];
    expect(description).toMatchSnapshot();
  });
});
