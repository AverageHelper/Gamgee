import "../../../../tests/testUtils/leakedHandles.js";

export const sendPrivately = jest.fn().mockResolvedValue(null);
export const replyPrivately = jest.fn().mockResolvedValue(undefined);
export const reply = jest.fn().mockResolvedValue(undefined);
