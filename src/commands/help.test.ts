jest.mock("../actions/messages/replyToMessage");
import * as replyToMessage from "../actions/messages/replyToMessage";
import type { CommandContext } from "./Command";
const mockReplyPrivately = replyToMessage.replyPrivately as jest.Mock;

import help from "./help";

describe("Help command", () => {
  test("describes all commands", async () => {
    const context = ({
      storage: null,
      message: "Reply to this"
    } as unknown) as CommandContext;

    await help.execute(context);
    expect(mockReplyPrivately).toHaveBeenCalledTimes(1);
    expect(mockReplyPrivately).toHaveBeenCalledWith(context.message, expect.toBeString());

    const calls = mockReplyPrivately.mock.calls[0] as Array<unknown>;
    const description = calls[1];
    expect(description).toMatchSnapshot();
  });
});
