import getUserIdFromMention from "./getUserIdFromMention";
import { useTestLogger } from "../../tests/testUtils/logger";

const logger = useTestLogger("error");

describe("User ID from mention string", () => {
  test("returns null from an empty string", () => {
    expect(getUserIdFromMention("", logger)).toBeNull();
  });

  test("returns null from badly-formatted string", () => {
    expect(getUserIdFromMention("54321", logger)).toBeNull();
  });

  test("returns null from the front half of a mention", () => {
    expect(getUserIdFromMention("<@", logger)).toBeNull();
    expect(getUserIdFromMention("<@!", logger)).toBeNull();
    expect(getUserIdFromMention("<@54321", logger)).toBeNull();
    expect(getUserIdFromMention("<@!54321", logger)).toBeNull();
  });

  test("returns null from the back half of a mention", () => {
    expect(getUserIdFromMention(">", logger)).toBeNull();
    expect(getUserIdFromMention("54321>", logger)).toBeNull();
  });

  test("returns the string between valid mention identifiers", () => {
    expect(getUserIdFromMention("<@>", logger)).toBe("");
    expect(getUserIdFromMention("<@!>", logger)).toBe("");
    expect(getUserIdFromMention("<@54321>", logger)).toBe("54321");
    expect(getUserIdFromMention("<@!54321>", logger)).toBe("54321");
    expect(getUserIdFromMention("<@percy>", logger)).toBe("percy");
    expect(getUserIdFromMention("<@!percy>", logger)).toBe("percy");
  });
});
