import getChannelIdFromMention from "./getChannelIdFromMention";
import { useTestLogger } from "../../tests/testUtils/logger";

const logger = useTestLogger("error");

describe("Channel ID from mention string", () => {
  test("returns null from an empty string", () => {
    expect(getChannelIdFromMention("", logger)).toBeNull();
  });

  test("returns null from badly-formatted string", () => {
    expect(getChannelIdFromMention("54321", logger)).toBeNull();
  });

  test("returns null from the front half of a mention", () => {
    expect(getChannelIdFromMention("<#", logger)).toBeNull();
    expect(getChannelIdFromMention("<#54321", logger)).toBeNull();
  });

  test("returns null from the back half of a mention", () => {
    expect(getChannelIdFromMention(">", logger)).toBeNull();
    expect(getChannelIdFromMention("54321>", logger)).toBeNull();
  });

  test("returns the string between valid mention identifiers", () => {
    expect(getChannelIdFromMention("<#>", logger)).toBe("");
    expect(getChannelIdFromMention("<#54321>", logger)).toBe("54321");
    expect(getChannelIdFromMention("<#percy>", logger)).toBe("percy");
  });
});
