import { removeCharactersAround } from "./unwrappedText";

describe("Remove strikethrough", () => {
  test("removes strikethrough from normal stricken text", () => {
    expect(removeCharactersAround("~~test~~", "~~")).toBe("test");
  });

  test("removes one strikethrough from over-stricken text", () => {
    expect(removeCharactersAround("~~~~test~~~~", "~~")).toBe("~~test~~");
    expect(removeCharactersAround("~~test~~~~", "~~")).toBe("test~~");
    expect(removeCharactersAround("~~~~test~~", "~~")).toBe("~~test");
  });

  test("does nothing to empty text", () => {
    expect(removeCharactersAround("", "~~")).toBe("");
  });

  test("does nothing to unstricken text", () => {
    expect(removeCharactersAround("not stricken", "~~")).toBe("not stricken");
  });

  test("does nothing to left-half-stricken text", () => {
    expect(removeCharactersAround("~~not really stricken", "~~")).toBe("~~not really stricken");
  });

  test("does nothing to right-half-stricken text", () => {
    expect(removeCharactersAround("not really stricken~~", "~~")).toBe("not really stricken~~");
  });

  test("allows a link embed", () => {
    expect(removeCharactersAround("<https://example.com>", "<", ">")).toBe("https://example.com");
  });
});
