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
  "You can not hide, I see you!",

  // Pony
  "It's about time...",
  "Trying to rebuild a house of glass...",
  "We smile at days gone by...",
  "What are the odds that I would find myself where I began?",
  "I used to wonder what friendship could be",
  "I'm not a fan of puppeteers",
  "I've a nagging fear someone else is pulling at the strings",

  // Popeye
  "Blow me down!",
  "I yam what I yam an' tha's all I yam",
  "That's all I can stands, 'cause I can't stands no more!",
  "Shiver me timbers!",
  "I yam disgustipated",
  "I'm strong to the finich, 'cause I eats me spinach!",

  // Other
  "Bit of a tongue twister",
  "Buffalo buffalo Buffalo buffalo buffalo buffalo Buffalo buffalo",
  "Don't count your chickens",
  "Down the hall, up the stairs, past the gargoyle",
  "Fan of squirrels",
  "Fond of cats",
  "Jack and Jill ran up the hill",
  "Keep moving forward",
  "Has anyone really been far even as decided to use even go want to do look more like?",
  "I am what I am",
  "I have a dream",
  "I thought for a second you were joking",
  "I used to wonder what friendship could be",
  "I'm so hungry, I could eat a",
  "Like and subscribe",
  "Lorem ipsum dolor sit amet",
  "Not a fan of spam",
  "O be wise",
  "Par for the course",
  "Prose, maybe even poetry",
  "Quite remarkable",
  "Second star to the right, and straight on until closing time",
  "Sponsored by",
  "This is just a random phrase. Feel free to add to another",
  "Thoughtful description here",
  "Truly inspirational",
  "What are the odds that I would find myself where I began",
  "Where it is, or anything else relevant"
];

function randomElementOfArray<T>(array: Array<T>): T {
  return array[Math.floor(Math.random() * array.length)];
}

/** Returns a random phrase or sentence fragment, in sentence case, occasionally followed by punctuation. */
export function randomPhrase(): string {
  return randomElementOfArray(phrases);
}

const questions = [
  "You rang?",
  "What's up?",
  "I got pinged.",
  "?",
  "??",
  "????????",
  "I really don't know what you're on about.",
  "What is love?",
  "You called?",
  "",
  "I hear you",
  "Speak. Your servant hears",
  "Who dares?",
  "Quit yer lollygaggin'!",
  "Wha-whAT?! I'm up!",
  ":eyes:",
  ":eyes: :eyes: :eyes:",
  "I'm not a fan of spam"
  // "What is life? Is it nothing more than the endless search for a cutie mark? And what is a cutie mark but a constant reminder that we're all only one bugbear attack away from oblivion? And what of the poor gator? Flank forever blank, destined to an existential swim down the river of life to... an unknowable destiny?"
];

let lastResult = questions[0];

/** Returns a random query. */
export function randomQuestion(): string {
  let result = randomElementOfArray(questions);
  while (result === lastResult) {
    result = randomElementOfArray(questions);
  }
  lastResult = result;
  return result;
}
