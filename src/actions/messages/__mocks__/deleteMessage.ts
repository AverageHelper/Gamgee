import "../../../../tests/testUtils/leakedHandles.js";

export const deleteMessage = jest.fn().mockResolvedValue(true);
export const deleteMessageWithId = jest.fn().mockResolvedValue(true);
export const bulkDeleteMessagesWithIds = jest.fn().mockResolvedValue(true);
