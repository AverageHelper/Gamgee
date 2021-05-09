import type { CommandContext } from "./Command";
import help from "./help";

const mockReplyPrivately = jest.fn();

describe("Help command", () => {
  test("describes all commands", async () => {
    const context = ({
      storage: null,
      replyPrivately: mockReplyPrivately
    } as unknown) as CommandContext;

    await help.execute(context);
    expect(mockReplyPrivately).toHaveBeenCalledTimes(1);
    expect(mockReplyPrivately).toHaveBeenCalledWith(expect.toBeString());

    const calls = mockReplyPrivately.mock.calls[0] as Array<unknown>;
    const description = calls[0];
    expect(description).toMatchSnapshot();
  });
});
