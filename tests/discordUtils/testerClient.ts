import Discord from "discord.js";
import requireEnv from "../requireEnv";

export let isClientLoggedIn = false;
const client = new Discord.Client();

export async function testerClient(): Promise<Discord.Client> {
  const TESTER_TOKEN = requireEnv("CORDE_TEST_TOKEN");
  if (!isClientLoggedIn) {
    await client.login(TESTER_TOKEN);
    isClientLoggedIn = true;
  }
  return client;
}
