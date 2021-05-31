import richErrorMessage from "./richErrorMessage";
import AggregateError from "es-aggregate-error";

describe("Rich error messages", () => {
  test("contains relevant information about the error", () => {
    const error = new Error("A really specific problem occurred.");
    const richMessage = richErrorMessage("Couldn't do a thing.", error);

    expect(richMessage).toContain(error.name);
    expect(richMessage).toContain(error.message);
    expect(richMessage).toContain(error.stack);
  });

  test("contains relevant information about each error in an AggregateError", () => {
    const error1 = new TypeError("A really specific problem occurred.");
    const error2 = new RangeError("Another really specific problem occurred.");
    const error3 = new Error("A third really specific problem occurred.");
    const error = new AggregateError([error1, error2, error3]);
    const richMessage = richErrorMessage("Couldn't do a thing.", error);

    expect(richMessage).toContain(error.name);
    expect(richMessage).toContain(error1.name);
    expect(richMessage).toContain(error2.name);
    expect(richMessage).toContain(error3.name);
    expect(richMessage).toContain(error.message);
    expect(richMessage).toContain(error1.message);
    expect(richMessage).toContain(error2.message);
    expect(richMessage).toContain(error3.message);
    expect(error1.stack).toBeDefined();
    expect(richMessage).toContain(error1.stack);
    expect(error2.stack).toBeDefined();
    expect(richMessage).toContain(error2.stack);
    expect(error3.stack).toBeDefined();
    expect(richMessage).toContain(error3.stack);
  });
});
