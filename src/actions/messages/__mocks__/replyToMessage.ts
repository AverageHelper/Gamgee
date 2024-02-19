import { vi } from "vitest";

export const sendPrivately = vi.fn().mockResolvedValue(null);
export const replyPrivately = vi.fn().mockResolvedValue(undefined);
export const reply = vi.fn().mockResolvedValue(undefined);
