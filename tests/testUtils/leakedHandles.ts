// FIXME: For some reason, tests can't see the types for leaked-handles, and I can't be bothered to fix that rn
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as leakedHandles from "leaked-handles";
const { set: configureObserver } = leakedHandles;

configureObserver({
	fullStack: true,
	debugSockets: true,
	timeout: 30000 // check every 30 seconds
});
