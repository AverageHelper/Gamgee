// FIXME: For some reason, tests can't see the types for leaked-handles, and I can't be bothered to fix that rn
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import leakedHandles = require("leaked-handles");

leakedHandles.set({
	fullStack: true,
	debugSockets: true
});
