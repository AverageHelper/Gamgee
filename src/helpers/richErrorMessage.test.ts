import richErrorMessage from "./richErrorMessage";

describe("Rich error messages", () => {
  test("contains relevant information about the error", () => {
    const error = new Error("A really specific problem occurred.");
    const richMessage = richErrorMessage("Couldn't do a thing.", error);

    expect(richMessage).toContain(error.name);
    expect(richMessage).toContain(error.message);
    expect(richMessage).toContain(error.stack);
  });
});
