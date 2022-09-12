import { expectDefined, expectToContain } from "../../tests/testUtils/expectations/jest.js";
import { richErrorMessage } from "./richErrorMessage.js";

describe("Rich error messages", () => {
	test("contains relevant information about the error", () => {
		const error = new Error("A really specific problem occurred.");
		const richMessage = richErrorMessage("Couldn't do a thing.", error);

		expectToContain(richMessage, error.name);
		expectToContain(richMessage, error.message);
		expectToContain(richMessage, error.stack);
	});

	test("contains relevant information about each error in an AggregateError", () => {
		const error1 = new TypeError("A really specific problem occurred.");
		const error2 = new RangeError("Another really specific problem occurred.");
		const error3 = new Error("A third really specific problem occurred.");
		const error = new AggregateError([error1, error2, error3], "Things went poorly");
		const richMessage = richErrorMessage("Couldn't do a thing.", error);

		expectToContain(richMessage, error.name);
		expectToContain(richMessage, error1.name);
		expectToContain(richMessage, error2.name);
		expectToContain(richMessage, error3.name);
		expectToContain(richMessage, error.message);
		expectToContain(richMessage, error1.message);
		expectToContain(richMessage, error2.message);
		expectToContain(richMessage, error3.message);
		expectDefined(error1.stack);
		expectToContain(richMessage, error1.stack);
		expectDefined(error2.stack);
		expectToContain(richMessage, error2.stack);
		expectDefined(error3.stack);
		expectToContain(richMessage, error3.stack);
	});
});
