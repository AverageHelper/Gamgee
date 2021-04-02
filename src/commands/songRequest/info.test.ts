jest.mock("./actions");
import * as messageActions from "./actions";
const mockReply = messageActions.reply as jest.Mock;

import type { CommandContext } from "../Command";
import info from "./info";

describe("Song request help", () => {
  test("descibes how to submit a song", async () => {
    const context = ({
      storage: null,
      message: "Reply to this"
    } as unknown) as CommandContext;

    await info.execute(context);
    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith(context.message, expect.toBeString());

    const calls = mockReply.mock.calls[0] as Array<unknown>;
    const description = calls[1];
    expect(description).toMatchSnapshot();
  });
});
