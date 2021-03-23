import StringBuilder from "./StringBuilder";

describe("String Builder", () => {
  let builder: StringBuilder;

  beforeEach(() => {
    builder = new StringBuilder();
  });

  test("builds an empty string", () => {
    expect(builder.result()).toBe("");
  });

  test("builds an empty string after empty init", () => {
    builder = new StringBuilder("");
    expect(builder.result()).toBe("");
  });

  test("builds an empty string after empty push", () => {
    builder.push("");
    expect(builder.result()).toBe("");
  });

  test("builds a single-character string from init", () => {
    builder = new StringBuilder("a");
    expect(builder.result()).toBe("a");
  });

  test("builds a single-character string from push", () => {
    builder.push("a");
    expect(builder.result()).toBe("a");
  });

  test("builds the same string after two `result` calls", () => {
    builder.push("a");
    builder.result();
    expect(builder.result()).toBe("a");
  });

  test("builds an empty string after clear", () => {
    builder.push("a");
    expect(builder.result()).toBe("a");
    builder.clear();
    expect(builder.result()).toBe("");
  });

  test("builds a newline from pushNewLine", () => {
    builder.pushNewLine();
    expect(builder.result()).toBe("\n");
  });

  test("builds a string with spaces", () => {
    builder.push("This ");
    builder.push("sentence ");
    builder.push("is ");
    builder.push("false!");
    expect(builder.result()).toBe("This sentence is false!");
  });

  describe("Markdown Formatting", () => {
    test("builds a bold string", () => {
      builder.push("For the ");
      builder.pushBold("bold");
      builder.push("!");
      expect(builder.result()).toBe("For the **bold**!");
    });

    test("builds a code string", () => {
      builder.push("Please run the ");
      builder.pushCode("?help");
      builder.push(" command.");
      expect(builder.result()).toBe("Please run the `?help` command.");
    });
  });
});
