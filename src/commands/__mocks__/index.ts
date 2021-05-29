import Discord from "discord.js";

interface MockCommand {
  name: string;
  execute: jest.Mock;
}

export { invokeCommand } from "../../actions/invokeCommand";

export const allCommands = new Discord.Collection<string, MockCommand>();

allCommands.set("config", {
  name: "config",
  execute: jest.fn().mockResolvedValue(undefined)
});
allCommands.set("help", {
  name: "help",
  execute: jest.fn().mockResolvedValue(undefined)
});
allCommands.set("howto", {
  name: "howto",
  execute: jest.fn().mockResolvedValue(undefined)
});
allCommands.set("languages", {
  name: "languages",
  execute: jest.fn().mockResolvedValue(undefined)
});
allCommands.set("limits", {
  name: "limits",
  execute: jest.fn().mockResolvedValue(undefined)
});
allCommands.set("now-playing", {
  name: "now-playing",
  execute: jest.fn().mockResolvedValue(undefined)
});
allCommands.set("ping", {
  name: "ping",
  execute: jest.fn().mockResolvedValue(undefined)
});
allCommands.set("quo", {
  name: "quo",
  execute: jest.fn().mockResolvedValue(undefined)
});
allCommands.set("sr", {
  name: "sr",
  execute: jest.fn().mockResolvedValue(undefined)
});
allCommands.set("t", {
  name: "t",
  execute: jest.fn().mockResolvedValue(undefined)
});
allCommands.set("version", {
  name: "version",
  execute: jest.fn().mockResolvedValue(undefined)
});
allCommands.set("video", {
  name: "video",
  execute: jest.fn().mockResolvedValue(undefined)
});
