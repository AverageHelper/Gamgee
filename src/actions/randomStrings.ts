const phrases = [
  // LOTR / Samwise
  "A wizard is never late!",
  "Books ought to have good endings.",
  "Do you remember the taste of strawberries?",
  "\"Don't you leave him Samwise Gamgee.\" And I don't mean to. I don't mean to.",
  "Hiking to Mordor...",
  "I’m coming, Mr. Frode.",
  "I ain't been droppin' no eaves, sir! Promise!",
  "I can't carry it for you, but I can carry you.",
  "I made a promise, Mr. Frodo. A promise.",
  'I wonder if people will ever say, "Let\'s hear about Frodo and the ring."',
  "Mordor!",
  "N-nothing important.",
  "Of course you are, and I'm coming with you!",
  "Potatoes. Boil 'em, mash 'em, stick 'em in a stew.",
  "There's some good in this workd, Mr. Frodo, and it's worth fighting for.",
  "We may yet, Mr. Frodo. We may.",
  "You can not hide, I see you!"

  // Other
  // "As we smile at days gone by",
  // "Bit of a tongue twister",
  // "Buffalo buffalo Buffalo buffalo buffalo buffalo Buffalo buffalo",
  // "Don't count your chickens",
  // "Down the hall, up the stairs, past the gargoyle",
  // "Fan of squirrels",
  // "Fond of cats",
  // "Jack and Jill ran up the hill",
  // "Keep moving forward",
  // "Has anyone really been far even as decided to use even go want to do look more like",
  // "I am what I am",
  // "I have a dream",
  // "I thought for a second you were joking",
  // "I used to wonder what friendship could be",
  // "I'm so hungry, I could eat a",
  // "Like and subscribe",
  // "Lorem ipsum dolor sit amet",
  // "Not a fan of spam",
  // "O be wise",
  // "Par for the course",
  // "Prose, maybe even poetry",
  // "Quite remarkable",
  // "Second star to the right, and straight on until closing time",
  // "Sponsored by",
  // "This is just a random phrase. Feel free to add to it",
  // "Thoughtful description here",
  // "Truly inspirational",
  // "Trying to rebuild a house of glass",
  // "What are the odds that I would find myself where I began",
  // "Where it is, or anything else relevant"
];

/** Returns a random phrase or sentence fragment, in sentence case, occasionally followed by punctuation. */
export function randomPhrase(): string {
  return phrases[Math.floor(Math.random() * phrases.length)];
}
