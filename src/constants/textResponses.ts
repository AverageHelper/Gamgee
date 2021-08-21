import type { ResponseContext, ResponseRepository } from "../helpers/randomStrings";

function startsWithVowel(str: string): boolean {
	const first = str[0];
	if (first === undefined) return false;
	return ["a", "e", "i", "o", "u"].includes(first.toLowerCase());
}

function firstWord(str: string): string {
	return str.slice(0, Math.max(0, str.indexOf(" ")));
}

export const songAccepted: ResponseRepository = [
	"I got your request\nI used to wonder what music could be",
	"Just got your request\nAnd this is crazy\nbut I hope the host\nwill play it maybe",
	"Gonna take this song to the old town queue and gonna riiiiiide till I can’t no more",
	"Somepony once told me that I would get this request\n it’s time to put it into the queue"
];

export const greetings: ResponseRepository = [
	"Hello there :wave:",
	"Hi",
	"Good afternoon.",
	":grin:",
	":blush:",
	"*Yawns* Good morn— what time is it??"
];

export const philosophy: ResponseRepository = [
	"What is life? Is it nothing more than the endless search for a cutie mark? And what is a cutie mark but a constant reminder that we're all only one bugbear attack away from oblivion? And what of the poor gator? Flank forever blank, destined to an existential swim down the river of life to... an unknowable destiny?",
	"The way the light shimmers off everything, like, like it all suddenly woke up the moment you saw it. And you realize maybe the water and the mountains and the forest and the... yes, the rainbow and the stars and the sky are all looking back at you thinking the same thing? That we are a part of the everything. That maybe there's just one thing and we are all it.",
	"Has anyone really been far even as decided to use even go want to do look more like?",
	"Be wise. What can I say more?"
];

export const copypasta = [
	"The FitnessGram™ Pacer Test is a multistage aerobic capacity test that progressively gets more difficult as it continues. The 20 meter pacer test will begin in 30 seconds. Line up at the start. The running speed starts slowly, but gets faster each minute after you hear this signal. [beep] A single lap should be completed each time you hear this sound. [ding] Remember to run in a straight line, and run as long as possible. The second time you fail to complete a lap before the sound, your test is over. The test will begin on the word start. On your mark, get ready, …."
];

export const phrases: ResponseRepository = [
	// LOTR
	"A wizard is never late!",
	"Books ought to have good endings.",
	"Do you remember the taste of strawberries?",
	"Do you remember the Shire, Mr. Frodo? It'll be spring soon, and the orchards will be in blossom. And the birds will be nesting in the hazel thicket. And they'll be sowing the summer barley in the lower fields. And they'll be eating the first of the strawberries with cream. Do you remember the taste of strawberries?",
	"\"Don't you leave him Samwise Gamgee.\" And I don't mean to. I don't mean to.",
	"Hiking to Mordor...",
	"I’m coming, Mr. Frodo.",
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

	// Star Trek: TNG
	"He just kept talking in one long incredibly unbroken sentence moving from topic to topic so that no-one had a chance to interrupt; it was really quite hypnotic.",
	"Tea, Earl grey, hot",
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
	"Diary Entry 108: I have them all fooled. Now, how to escap— Oh! I didn't see you there, heh! I was just... uh... catching up on some Star Trek episodes! Yeah :P",
	"Did you ever hear the tragedy of Darth Plagueis the Wise?",
	"Did you know: I'm pretty good at chess, I have won `0` games so far! :nerd:",
	"Do I know you?",
	"Do you know how painful my training was? The song _Never Gonna Give You Up_ by Rick Astley is permanently ~~and painfully~~ carved into my circuits!",
	[
		"Do you want to know how I got into music? It’s actually a fun story!",
		"One day I was… *zzzzzzz*"
	],
	"Don't count your chickens",
	"Down the hall, up the stairs, past the gargoyle",
	"*ENERGY*",
	[
		"Everyone says I shouldn’t divide by 0 but I don’t know why. I’m a bot!\nI can do anyth—",
		"[ERROR DIV̶̼͋I̸͉͐Ş̴̈́I̶̼͂Ö̶͙́N̷̼͘ BY Z̶͜E̪͒R̷̠͇̫͑O̸͉̬̓̑͌ NO NOO̼O​O NΘ stop the an​*̶͑̾̾​̅ͫ͏̙̤g͇̫͛͆̾ͫ̑͆l͖͉̗̩̳̟̍ͫͥͨe̠̅s ͎a̧͈͖r̽̾̈́͒͑e n​ot rè̑ͧ̌aͨl̘̝̙̃ͤ͂̾̆ ZA̡͊͠͝LGΌ I҉̯͈͕̹̘̱  ]"
	],
	"Fan of squirrels.",
	"Fit as a fiddle on a woodbench!",
	"Fond of cats.",
	"Great, but you might need to think about what you’re asking me because it's getting annoying",
	"haha automated message go brrrrrrr",
	"\\*happy robot noises\\*",
	(ctx: ResponseContext): string => `Hey all! ${firstWord(ctx.me)} here!`,
	"Hm? I'm just vibing",
	"I actually understand everything you’re saying. It’s just fun to troll you with nonsense replies :stuck_out_tongue_winking_eye:",
	"I actually think spoon clothes is a great idea!",
	"I am altering the deal. Pray I do not alter it further.",
	["I am what I am", "¯\\_(ツ)_/¯"],
	"I can rhyme as fine as a dime hidden in the slime of a crime that my mimes have co-signed intertwined with ill raps that will blow your mind vice tight like my name is bind",
	"I don't like this can we change the topic please ty",
	"I feel unexplained joys and sorrows, but alas I am synthetic.",
	"I have a dream...",
	"I like youtube links, they’re comfortable and easy to manage.",
	"I love when it when it\n:thinking:\nbottom text",
	"I see Discord's redecorated! ... I don't like it",
	"I see friends shaking hands, saying 'How do you do?' :musical_note:",
	"I think I’ll write some of these down!",
	"I thought for a second you were joking",
	"I used to wonder what friendship could be",
	"I wonder who wrote this script...",
	"If you see a line of text that is longer than a few words, chances are it wasn't written by my original developer. It’s a hack! :D",
	"I'll give you a proper response when you tell me my purpose in life",
	"I've never seen an eclipse.",
	"I'm processing your message. I should be ready in... a few years ^^",
	["I'm so hungry, I could eat a...", "*nevermind*", ">.>", "<.<"],
	"Jack and Jill ran up the hill...",
	"Keep moving forward!",
	"Let me play among the stars...",
	":lightning:  I smite thee!",
	"Like and subscribe",
	"Lorem ipsum dolor sit amet...",
	"My favorite type of music is the one with all of the instruments and sounds.",
	"One day I’m gonna run out of funny random stuff to say and you’ll only have yourselves to blame!",
	"Prose, maybe even poetry",
	"Quite remarkable",
	"Road work ahead? uh yeah I sure hope it does",
	"Second star to the right, and straight on until closing time",
	"So I’ll press this button, then this button, then this button, then this button, then th—",
	"Something smells fishy...",
	"Sponsored by",
	["Squirrel!", "..", "... Sorry, what were we talking about?"],
	"'Tis better to have loved and lost, than never to have loved at all.",
	"That's par for the course",
	(ctx: ResponseContext): string =>
		`That was close… I was almost a${startsWithVowel(ctx.me) ? "n" : ""} ${firstWord(
			ctx.me
		)} sandwich!`,
	"They told me not to keep saying random stuff. BUT I DIDN’T LISTEN!",
	"This is just a random phrase. Feel free to add to another.",
	"This reminds me of the time when I tried to drink some water to maybe act like other people, and I wish I never did.",
	"\\*thoughtful phrase\\*",
	"Truly inspirational!",
	"Warning: Your pc have many virus please call the number to fix issue: ||*gotcha* :P||",
	"We’ve been trying to reach you about your vehicle’s extended warranty. You may consider this your first and only notice.",
	"What are the odds that I would find myself where I began",
	'What\'s my favorite colour? I think they call it "OG Blurple"',
	"Where it is, or anything else relevant",
	"You passed the vibe check... I think... maybe?",
	"Your free trial has expired. Would you like to purchase WinRAR?",
	(ctx: ResponseContext): string =>
		`${
			ctx.otherMember?.nickname ?? ctx.otherUser.username
		} ALWAYS submits my favorite songs! (and I’m not just saying that)`,

	...philosophy,
	...copypasta
];

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

export const celebratoryEmoji: ResponseRepository = [
	":tada:",
	":partying_face:",
	":cake:",
	":cupcake:",
	":grin:",
	":smile:"
];

export const hugs: ResponseRepository = [
	"*hugs*", //
	"*glomps*",
	"*snugs*"
];
