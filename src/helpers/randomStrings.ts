import { phrases, questions, songAccepted } from "../constants/textResponses";
import randomElementOfArray from "./randomElementOfArray";

/** Returns a random phrase or sentence fragment, in sentence case, occasionally followed by punctuation. */
export function randomPhrase(): string {
  return randomElementOfArray(phrases);
}

let lastQuestion = questions[0];

/** Returns a random query. */
export function randomQuestion(): string {
  let result = randomElementOfArray(questions);
  while (result === lastQuestion) {
    result = randomElementOfArray(questions);
  }
  lastQuestion = result;
  return result;
}

let lastAcceptance = songAccepted[0];

export function randomAcceptance(): string {
  let result = randomElementOfArray(songAccepted);
  while (result === lastAcceptance) {
    result = randomElementOfArray(songAccepted);
  }
  lastAcceptance = result;
  return result;
}
