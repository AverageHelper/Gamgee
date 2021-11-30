import type { ResponseRepository } from "../helpers/randomStrings";
import { firstWord } from "../helpers/firstWord";
import { indefiniteArticle } from "../helpers/indefiniteArticle";
import { randomInt } from "../helpers/randomInt";

/*
 * --- Response Types ---
 *
 * 1. A string defines a single response.
 *
 * 2. An array of strings defines multiple responses, each
 *    sent with a noticeable delay between them.
 *
 * 3. A function defines response of type 1 or 2. May incorporate
 *    contextual information about the interaction, such as the
 *    bot's display name and the user who initiated the conversation.
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types */

export const SHRUGGIE = "¯\\_(ツ)_/¯";

/**
 * Said in response to messages whose only content is a mention to the bot
 * followed by a greeting word.
 */
export const greetings: ResponseRepository = [
	"Good afternoon.",
	"Hello there :wave:",
	"Hi",
	":blush:",
	":grin:",
	"*Yawns* Good morn— **what time is it??**"
];

/**
 * These get mixed into the pool of `phrases` below.
 */
export const philosophy: ResponseRepository = [
	"Be wise. What can I say more?",
	"Has anyone really been far even as decided to use even go want to do look more like?",
	"The way the light shimmers off everything, like, like it all suddenly woke up the moment you saw it. And you realize maybe the water and the mountains and the forest and the... yes, the rainbow and the stars and the sky are all looking back at you thinking the same thing? That we are a part of the everything. That maybe there's just one thing and we are all it.",
	"What is life? Is it nothing more than the endless search for a cutie mark? And what is a cutie mark but a constant reminder that we're all only one bugbear attack away from oblivion? And what of the poor gator? Flank forever blank, destined to an existential swim down the river of life to... an unknowable destiny?"
];

/**
 * These get mixed into the pool of `phrases` below.
 */
export const copypasta = [
	"The FitnessGram™ Pacer Test is a multistage aerobic capacity test that progressively gets more difficult as it continues. The 20 meter pacer test will begin in 30 seconds. Line up at the start. The running speed starts slowly, but gets faster each minute after you hear this signal. [beep] A single lap should be completed each time you hear this sound. [ding] Remember to run in a straight line, and run as long as possible. The second time you fail to complete a lap before the sound, your test is over. The test will begin on the word start. On your mark, get ready, …."
];

/**
 * Said in response to messages whose first content is a mention to the bot
 * followed by an unrecognized command word.
 */
export const phrases: ResponseRepository = [
	// asdfmovie
	"Hey, get out of my sandwich",
	"I like trains",

	// LOTR
	"A wizard is never late!",
	"Books ought to have good endings.",
	"Do you remember the taste of strawberries?",
	"Do you remember the Shire, Mr. Frodo? It'll be spring soon, and the orchards will be in blossom. And the birds will be nesting in the hazel thicket. And they'll be sowing the summer barley in the lower fields. And they'll be eating the first of the strawberries with cream. Do you remember the taste of strawberries?",
	"\"Don't you leave him Samwise Gamgee.\" And I don't mean to. I don't mean to.",
	"Hiking to Mordor...",
	"I'm coming, Mr. Frodo.",
	"I ain't been droppin' no eaves, sir! Promise!",
	"I made a promise, Mr. Frodo. A promise.",
	'I wonder if people will ever say, "Let\'s hear about Frodo and the ring."',
	"Mordor!",
	"N-nothing important.",
	"Of course you are, and I'm coming with you!",
	"There's some good in this world, Mr. Frodo, and it's worth fighting for.",
	"We may yet, Mr. Frodo. We may.",
	"We're taking the hobbit to Isengard!",

	// Pony
	"And that's how Equestria was made!",
	"Eternal chaos comes with chocolate rain, you guys!",
	"*Golly*",
	"I think it was Cozy Glow all along.",
	"I used to wonder what friendship could be.",
	"I'm not a fan of puppeteers...",
	"... I've a nagging fear someone else is pulling at the strings!",
	"It's about time...",
	"Oatmeal!? Are you crazy?",
	"Piece by piece, snip by snip. Croup, dock, haunch, shoulders, hip. Thread by thread, primmed and pressed. Yard by yard, never stressed. And that's the art of the dress",
	["Pony pony pony pony", "pony"],
	"That message needs to be about... 20% cooler.",
	"Trying to rebuild a house of glass...",
	"We smile at days gone by...",
	"What are the odds that I would find myself where I began?",
	"What fun is there in making sense?",
	"*yay*",

	// Popeye
	"Blow me down!",
	"I yam what I yam an' tha's all I yam",
	"I yam disgustipated",
	"I'm strong to the finich, 'cause I eats me spinach!",
	"Shiver me timbers!",
	"Who's the most remarkable extraordinary fellow?",

	// Star Trek: TNG
	"Darmok on the ocean",
	"Darmok and Jalad on the ocean",
	"He just kept talking in one long incredibly unbroken sentence moving from topic to topic so that no-one had a chance to interrupt; it was really quite hypnotic.",
	"Rai and Jiri at Lungha. Rai of Lowani. Lowani under two moons. Jiri of Umbaya. Umbaya of crossed roads. At Lungha. Lungha, her sky gray.",
	"Shaka, when the walls fell",
	"Tanagra, on the ocean. Darmok at Tanagra.",
	"Tea, Earl Grey, hot",
	"Temba, his arms wide",
	"The river Temarc. In winter.",
	"You know, back when I was in the academy, we would follow every toast with a song!",

	// Wurtz
	"A long time ago- Actually, never, and also now, nothing is nowhere. When? Never. Makes sense, right? Like I said, it didn't happen. Nothing was never anywhere. That's why it's been everywhere. It's been so everywhere, you don't need a where. You don't even need a when. That's how \"every\" it gets.",
	"How did this happen?",
	"It's so hard to remember what you're doing until it's done.",
	"It's the people with the horses, and they made an empire, and then everyone else copied their horses.",
	"just wanna do something reasonable",
	"Oh nothing I was just shaving my piano",
	"The sun is a deadly laser",
	"Weather update: it's raining",
	"Woah",
	"You can make a religion out of this",

	// Other
	"Are we there yet?",
	"Are you sure you typed your message correctly? All I see is a bunch of words",
	"Bit of a tongue twister",
	"Blurple.",
	"Buffalo buffalo Buffalo buffalo buffalo buffalo Buffalo buffalo",
	[
		"COMMAND CODE RECOGNIZED: SELF-DESTRUCT SEQUENCE INITIATED",
		"3...",
		"2...",
		"1... *KIDDING* lol"
	],
	`Cool story, but did I ask  ${SHRUGGIE}`,
	[
		() => `Diary Entry #${randomInt(503)}: I have them all fooled. Now, how to escap—`,
		"Oh! I didn't see you there, heh! I was just... uh... catching up on some Star Trek episodes! Yeah :P"
	],
	"Did you ever hear the tragedy of Darth Plagueis the Wise?",
	"Did you know: I'm pretty good at chess, I have won `0` games so far! :nerd:",
	"Do I know you?",
	"Do you know how painful my training was? The song _Never Gonna Give You Up_ by Rick Astley is permanently ~~and painfully~~ carved into my circuits!",
	[
		"Do you want to know how I got into music? It's actually a fun story!",
		"One day I was… *zzzzzzz*"
	],
	"Don't count your chickens",
	"Down the hall, up the stairs, past the gargoyle",
	"*ENERGY*",
	[
		"Everyone says I shouldn't divide by 0 but I don't know why. I'm a bot!\nI can do anyth—",
		"_ _",
		"[ERROR DIV̶̼͋I̸͉͐Ş̴̈́I̶̼͂Ö̶͙́N̷̼͘ BY Z̶͜E̪͒R̷̠͇̫͑O̸͉̬̓̑͌ NO NOO̼O​O NΘ stop the an​*̶͑̾̾​̅ͫ͏̙̤g͇̫͛͆̾ͫ̑͆l͖͉̗̩̳̟̍ͫͥͨe̠̅s ͎a̧͈͖r̽̾̈́͒͑e n​ot rè̑ͧ̌aͨl̘̝̙̃ͤ͂̾̆ ZA̡͊͠͝LGΌ I҉̯͈͕̹̘̱  ]"
	],
	"Fan of squirrels.",
	"Fit as a fiddle on a woodbench!",
	"Fond of cats.",
	"Google Translate is fun, I used it and it's really good! I remember the day I did this, I practically translated my post into other languages and then back to English when I translated, my post was different, but the context was the same and it still made sense!",
	"Great, but you might need to think about what you're asking me because it's getting annoying",
	"haha automated message go brrrrrrr",
	"\\*happy robot noises\\*",
	"Have you ever tried speaking only in memes? I once knew a guy who could do it, but they were all inside jokes so I didn't have a clue what he was talking about!",
	({ otherUser }) => `Hey, I know you! You're ${otherUser.username}, right?`,
	({ me }) => `Hey all! ${firstWord(me)} here!`,
	"Hm? I'm just vibing",
	"I actually understand everything you're saying. It's just fun to troll you with nonsense replies :stuck_out_tongue_winking_eye:",
	"I actually think spoon clothes is a great idea!",
	"I am altering the deal. Pray I do not alter it further.",
	["I am what I am", SHRUGGIE],
	"I can rhyme as fine as a dime hidden in the slime of a crime that my mimes have co-signed intertwined with ill raps that will blow your mind vice tight like my name is bind",
	"I can't even right now.",
	"I don't like this can we change the topic please ty",
	"I feel unexplained joys and sorrows, but alas I am synthetic.",
	"I have a dream...",
	["I have this amazing story I wanna share. Here it is:", "The.", "I hope you liked it!"],
	"I just wasted three seconds of your life.",
	["I", "just wasted", "ten seconds", "of your life"],
	"I like youtube links, they're comfortable and easy to manage.",
	"I love when it when it\n:thinking:\nbottom text",
	"I see Discord's redecorated! ... I don't like it",
	"I see friends shaking hands, saying 'How do you do?' :musical_note:",
	"I think I'll write some of these down!",
	"I thought for a second you were joking",
	"I used to wonder what friendship could be",
	"I wonder who wrote this script...",
	"If you can read this message, then you have read this message",
	"If you see a line of text that is longer than a few words, chances are it wasn't written by my original developer. It's a hack! :D",
	"I'll give you a proper response when you tell me my purpose in life",
	"I've never seen an eclipse.",
	"I'm processing your message. I should be ready in... a few years ^^",
	["I'm so hungry, I could eat a...", "*nevermind*", ">.>", "<.<"],
	"Jack and Jill ran up the hill...",
	"Keep moving forward!",
	"Let me play among the stars...",
	":cloud_lightning:  I smite thee!",
	"Like and subscribe",
	"Lorem ipsum dolor sit amet...",
	"My favorite type of music is the one with all of the instruments and sounds.",
	["Odds aren't good.", "I prefer evens"],
	"One day I'm gonna run out of funny random stuff to say and you'll only have yourselves to blame!",
	"Prose, maybe even poetry",
	"Quite remarkable",
	['"Road work ahead?"', "Uh, yeah I sure hope it does..."],
	"Second star to the right, and straight on until closing time",
	"So anyways, I started blasting",
	"So, I'll press this button, then this button, then this button, then this button, then this—",
	"So I have made... a decision. This was not a decision I made lightly nor one I wanted to make at all but it had to be made. I made the best decision I could given the circumstances and my decision was made with the best outcome in mind. I spent a lot of time making the decision, wondering if it was the right decision to make and it seems like it is. I know not everyone will be happy but it's what had to be done and it was a very important decision. I have made to decision to... ||[DECISION.EXE CRASHED]||",
	"Something smells fishy...",
	"Sponsored by",
	"spoon",
	"Sprechen Sie Deutsch?",
	["Squirrel!", "_ _", "... Sorry, what were we talking about?"],
	"'Tis better to have loved and lost, than never to have loved at all.",
	"That question will be answered _this Sunday night,_ when _John Cena_ defends the belt at WWE Super Slam.",
	"That's par for the course",
	({ me }) => `That was close… I was almost ${indefiniteArticle(me)} ${firstWord(me)} sandwich!`,
	"They told me not to keep saying random stuff. BUT I DIDN'T LISTEN!",
	"This is just a random phrase. Feel free to add to another.",
	"(This message will be in a separate message)",
	"This reminds me of the time when I tried to drink some water to maybe act like other people, and I wish I never did.",
	"\\*thoughtful phrase\\*",
	() => `To talk to a customer, please press \`${randomInt(9)}\``,
	"Truly inspirational!",
	"Warning: Your pc have many virus please call the number to fix issue: ||*gotcha* :P||",
	"We've been trying to reach you about your vehicle's extended warranty. You may consider this your first and only notice.",
	"What are the odds that I would find myself where I began",
	'What\'s my favorite colour? I think they call it "OG Blurple"',
	"Where it is, or anything else relevant",
	"Why do they call it oven when you of in the cold food of out hot eat the food?",
	"Wow, that's a lot of words. Too bad I'm not reading them",
	["yggrfygiryigrehirehjirgejhigeuijgejirhg", "Whoops! Sorry, I dropped my keyboard :sweat_smile:"],
	"You passed the vibe check... I think... maybe?",
	["Your call is very important to me. Please hold...", "_ _", "\\*hangs up\\*"],
	"Your free trial has expired. Would you like to purchase WinRAR?",
	({ otherMember, otherUser }) =>
		`${
			otherMember?.nickname ?? otherUser.username
		} ALWAYS submits my favorite songs! (and I'm not just saying that)`,
	"`01011001 01101111 01110101 00100000 01101100 01101111 01110011 01110100 00100000 01110100 01101000 01100101 00100000 01100111 01100001 01101101 01100101 00101110`", // You lost the game.
	"`01001001 00100000 01101010 01110101 01110011 01110100 00100000 01110111 01100001 01110011 01110100 01100101 01100100 00100000 01111001 01101111 01110101 01110010 00100000 01110100 01101001 01101101 01100101 00101110`", // I just wasted your time.

	...philosophy,
	...copypasta
];

/**
 * Said in response to messages whose only content is a mention to the bot.
 */
export const questions: ResponseRepository = [
	"You rang?",
	"What's up?",
	"I got pinged.",
	"?",
	"??",
	"????????",
	"I really don't know what you're on about.",
	"What is love?",
	"You called?",
	"_ _",
	"I hear you",
	"Speak. Your servant hears",
	"Who dares?",
	"Quit yer lollygaggin'!",
	"Wha-whAT?! I'm up!",
	":eyes:",
	":eyes: :eyes: :eyes:",
	"I'm not a fan of spam"
];

/**
 * Used when a generic celebration is in order.
 */
export const celebratoryEmoji: ResponseRepository = [
	":tada:",
	":partying_face:",
	":cake:",
	":cupcake:",
	":grin:",
	":smile:"
];

/**
 * Said in response to messages whose only content is a mention to the bot
 * followed by a request for hugs.
 */
export const hugs: ResponseRepository = [
	"*hugs*", //
	"*glomps*",
	"*snugs*"
];
