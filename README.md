# Gamgee

> "There's some good in this world, Mr. Frodo, and it's worth fighting for."
>
> - J. R. R. Tolkien

Gamgee is a helpful companion bot for music video suggestions. Ever wanted an easy way to manage a queue of crowd-requested songs? Ever had people who spam the queue, post too frequently, or post looooooooong songs? Gamgee handles all of that for you!

This project started out as a simple Discord bot to play around with APIs and things. As for the name, I thought it was neat. I was on a LOTR kick at the time. Samwise Gamgee is a name that deserves to be remembered.

## Prerequisites

This project requires [NodeJS](https://nodejs.org/) (version 16.6 or later), [NPM](https://npmjs.org/), and a [Discord bot account token](https://www.howtogeek.com/364225/how-to-make-your-own-discord-bot/).
To make sure you have them available on your machine,
try running the following command:

```sh
$ npm -v && node -v
7.20.3
v16.6.2
```

## Clone the Repo

```sh
$ cd path/to/parent
$ git clone https://github.com/AverageHelper/Gamgee.git
$ cd Gamgee
```

## Table of contents

- [Gamgee](#Gamgee)
  - [Prerequisites](#prerequisites)
  - [Clone the Repo](#clone-the-repo)
  - [Table of contents](#table-of-contents)
  - [Usage](#usage)
    - [Get a Token](#get-a-token)
    - [Register Slash Commands](#register-slash-commands)
    - [Command Permissions](#command-permissions)
    - [Run the bot](#run-the-bot)
    - [Autogenerated Files](#autogenerated-files)
  - [Commands](#commands)
    - [`config`](#config)
    - [`help`](#help)
    - [`howto`](#howto)
    - [`languages`](#languages)
    - [`limits`](#limits)
    - [`now-playing`](#now-playing)
    - [`ping`](#ping)
    - [`quo`](#quo)
    - [`sr`](#sr)
    - [`test`](#test)
    - [`t`](#t)
    - [`version`](#version)
    - [`video`](#video-url)
  - [Contributing](#contributing)
  - [Built With](#built-with)
  - [Authors](#authors)
  - [License](#license)

## Usage

### Get a Token

You'll need a Discord bot account's token. See [this awesome tutorial on how to get one](https://www.howtogeek.com/364225/how-to-make-your-own-discord-bot/).

Create a file called `.env` in the root of this project folder. Paste your token into that file:

```sh
# .env

DISCORD_TOKEN=YOUR_TOKEN_GOES_HERE
```

### Register Slash Commands

If you want support for Discord [Slash Commands](https://support.discord.com/hc/en-us/articles/1500000368501-Slash-Commands-FAQ), you'll need to deploy the commands directly.

Once you have your bot's account token in the .env file, run the following command to tell Gamgee to tell Discord about our commands:

```sh
$ npm run commands:deploy
```

**Do not commit this file to git** or your bot _will_ get "hacked".

### Command Permissions

Some commands require special permission to run. We'll soon add a command for you to specify which roles define access, but for now you may specify those in the .env file.

- `EVENTS_ROLE_ID` and `QUEUE_ADMIN_ROLE_ID` specify the IDs of user roles which grant access to the queue-admin commands (the [`quo`](#quo) commands, except for [`quo setup`](#quo-setup-channel) and [`quo teardown`](#quo-teardown)).
- `QUEUE_CREATOR_ROLE_ID` and `BOT_ADMIN_ROLE_ID` specify the IDs of user roles which grant access to certain owner-level commands (the [`quo setup`](#quo-setup-channel) and [`quo teardown`](#quo-teardown) commands)
- The server owner may do anything. They own the place.

### Run the bot

Install the necessary dependencies:

```sh
$ npm install
```

Since Gamgee is just a Node program, any Node process manager will do.

```sh
$ node .  # or
$ npm start  # or
$ pm2 start .
```

#### Selecting a database file location

If the default database location (the `Gamgee/db/` folder) won't work for your setup, you may select a different path where our database files should go. Put it in your `.env` file:

```sh
# .env

DISCORD_TOKEN=YOUR_TOKEN_GOES_HERE
DATABASE_FOLDER=./foo/bar/baz # The database will go in this folder, at baz/db.sqlite
```

### Autogenerated Files

Gamgee generates some files as needed. This is normal, and you should not bother with most of them.

- `node_modules/` contains our dependent packages. This folder is _massive_, and that's on purpose. You don't need to worry about what's behind this curtain.
- `dist/` contains the compiled bot code. What, did you think we ran the TypeScript directly? SMH my head, mate.
- `logs/` contains log files for events that the server thinks might be useful one day. Most of these have to do with smol important things Gamgee does without you worrying. Feel free to look in here if you're ever curious. You may delete them periodically, if you want.
- `db/` contains Gamgee's database if you've not selected your own DB path. Don't touch this unless you know what you're doing.

## Commands

All commands must begin with a command prefix (`/` for Slash Commands; `?` by default for messages; a mention to the bot.) Yes, you can mention the bot to run commands. For example, if your bot's account name is EC, `@EC help` will run the `help` command. (This is handy in case you forget the command prefix, or don't feel like typing `/`. ;)

### `config`

Controls access to the server config. This command may only be run by the server owner (and is therefore unavailable in DMs). Responses will be ephemeral (if using [Slash Commands](https://support.discord.com/hc/en-us/articles/1500000368501-Slash-Commands-FAQ)), or a reply in-channel (if using message commands).

#### `config get [key]`

Responds with the current configuration value for the provided key. The only valid key is `command_prefix`.

#### `config set [key] <value>`

Sets a new value for the provided config key. Gamgee responds with a confirmation of the new key and value, with an option to undo. The only valid key is `command_prefix`.

#### `config unset [key]`

Resets a config key value to the default. The only valid key is `command_prefix`.

### `help`

Prints the list of commands available to the user. The result is either an "ephemeral" reply, or a DM.

### `howto`

Prints instructions for how to use the song request queue. Anyone may use this command.

### `languages`

Prints the list of languages that make up Gamgee's source code.

### `limits`

Prints the limits on the song request queue. Learn more about the available limits under the [`quo limit`](#quo-limit-key-value) command.

### `now-playing`

Sends a DM to the user with the earliest queue entry that is not marked "Done". If all entries are marked "Done", or the queue is empty, then Gamgee will make the user aware of that.

### `ping`

Responds with "Pong!"

### `quo`

Manages the song request queue. This command may only be run by "admin" or "queue-admin" users.

#### `quo setup #channel`

Specify the channel to use as the song queue. This is where queue items will go. I wouldn't recommend changing this during an event, because Gamgee won't remember the items in the old channel.

[This command requires special permissions.](#command-permissions)

#### `quo teardown`

Instructs Gamgee to forget the queue channel. Gamgee won't bother deleting queue messages, so you may wanna clean things up with [`quo restart`](#quo-restart) first.

[This command requires special permissions.](#command-permissions)

#### `quo blacklist <@user>`

Manage the queue blacklist. If you mention a user, that user will not be permitted to submit songs to the queue. The command by itself will print out the blacklist. Gamgee will be as private about this as possible. (The slash command will return an "ephemeral" message, and a message command will send a DM.)

#### `quo whitelist @user`

Mention a user with this command to remove them from the blacklist. The mentioned user will be permitted to send song requests again!

#### `quo open`

If a request queue has been [set up](#quo-setup), then Gamgee will open the queue for requests. This command deletes the user's invocation, but sends a message in the channel that the queue is open and waiting.

#### `quo close`

If a request queue has been [set up](#quo-setup) and that queue is [open](#quo-open), then the queue will be closed. This command deletes the user's invocation, but sends a message in the channel that the queue is open and waiting.

#### `quo limit [key] <value>`

Manage queue limits. Provide a numeric value to set a new value for the limit, or leave just specify the limit to see its current value. To see the value of all limits run the [`limits`](#limits) command. The available limits are as follows:

- `entry-duration` - The maximum length that a song can be.
- `cooldown` - How long a user must wait between submissions. This limit takes the amount of time from the user's most recent valid queue entry. If the configured cooldown has not elapsed, that user cannot make another submission yet. Gamgee will tell the user how much longer they have.
- `count` - The maximum number of submissions a user may have in the queue. You may increase this limit for everybody, remove users' submissions from the queue, or `restart` the queue to allow users to submit again.

Interactions with this command are public in the channel where you send them.

#### `quo stats`

Prints statistics about the current request queue, including the total duration of entries.

#### `quo restart`

Erase all queue entries from the queue. This is handy to do after an event is over. Be sure to run this at some point between events, or the previous event's limits will still apply!

### `sr`

Access the song queue. Run this command alone to print instructions on how to submit to the request queue.

#### `sr <url>`

Submits a song to the queue. Users must provide a valid YouTube, SoundCloud, or Bandcamp link in order to be considered.

### `test`

Runs test queries against YouTube, SoundCloud, and Bandcamp, and responds with useful statistics. This is handy for making sure that Gamgee still knows how to talk to external services whose API may change without notice.

### `t`

Triggers the typing indicator in the current channel. This is mostly for fun and giggles.

### `version`

Display's the current version of Gamgee Core. (see [package.json](https://github.com/AverageHelper/Gamgee/blob/main/package.json#L3))

### `video <url>`

Given a YouTube, SoundCloud, or Bandcamp track link, Gamgee responds with that video's title and duration. Handy for testing specific cases. Anyone may use this command at any time.

## Contributing

We welcome contributions of all sorts!

1.  Fork it!
2.  Create your feature branch: `git checkout -b my-new-feature`
3.  Add your changes: `git add .`
4.  Commit your changes: `git commit -am 'Add some feature'`
5.  Push to the branch: `git push origin my-new-feature`
6.  Submit a pull request :sunglasses:

## Built With

- [Visual Studio Code](https://code.visualstudio.com/)
- [Discord.js](https://discord.js.org/)
- Love

## Authors

- **James Robinson** - _Initial work_ - [AverageHelper](https://github.com/AverageHelper)

## License

[GNU General Public License v3.0](LICENSE)
