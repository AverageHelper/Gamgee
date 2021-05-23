import {
  celebratoryEmoji,
  greetings,
  philosophy,
  phrases,
  questions,
  songAccepted
} from "../constants/textResponses";
import Discord from "discord.js";
import randomElementOfArray from "./randomElementOfArray";

export type ResponseRepository = [string, string, ...Array<string>];

/* Greetings */

export function randomGreeting(): string {
  return randomResponseFromArray("greetings", greetings);
}

/* Phrases */

export function randomPhrase(): string {
  return randomResponseFromArray("phrases", phrases);
}

/* Philosophy */

export function randomPhilosophy(): string {
  return randomResponseFromArray("philosophy", philosophy);
}

/* Questions */

export function randomQuestion(): string {
  return randomResponseFromArray("questions", questions);
}

/* Song Acceptance */

export function randomAcceptance(): string {
  return randomResponseFromArray("songAccepted", songAccepted);
}

/* Celebration */

export function randomCelebration(): string {
  return randomResponseFromArray("celebration", celebratoryEmoji);
}

const lastResponses = new Discord.Collection<string, string>();

/**
 * Returns a random value from the provided `array`, making sure that the value
 * does not match the value previously given (if the array is longer than 1 item)
 *
 * @param key The key by which to differentiate this array from the next.
 * @param array The array from which to source a response.
 *
 * @returns A string from the array.
 */
function randomResponseFromArray(key: string, array: ResponseRepository): string {
  let result = randomElementOfArray(array) ?? "";
  const lastResult = lastResponses.get(key);
  while (result === lastResult) {
    result = randomElementOfArray(array) ?? "";
  }
  lastResponses.set(key, result);
  return result;
}
