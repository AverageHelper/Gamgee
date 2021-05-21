import { addCharactersAround } from "./wrappedText";

describe("Add pre- and postfix", () => {
  test("adds strikethrough to a normal string", () => {
    expect(addCharactersAround("test", "~~")).toBe("~~test~~");
  });

  test("does nothing to stricken text", () => {
    expect(addCharactersAround("~~test~~", "~~")).toBe("~~test~~");
  });

  test("adds strikethrough to left-stricken text", () => {
    expect(addCharactersAround("~~strike me down", "~~")).toBe("~~~~strike me down~~");
  });

  test("adds strikethrough to right-stricken text", () => {
    expect(addCharactersAround("do it~~", "~~")).toBe("~~do it~~~~");
  });

  test("does nothing to empty text", () => {
    expect(addCharactersAround("", "~~")).toBe("");
  });

  test("prevents a link embed", () => {
    expect(addCharactersAround("https://example.com", "<", ">")).toBe("<https://example.com>");
  });
});
