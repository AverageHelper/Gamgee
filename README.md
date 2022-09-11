# Gamgee

> "There's some good in this world, Mr. Frodo, and it's worth fighting for."
>
> - J. R. R. Tolkien

Gamgee is a helpful companion bot for music video suggestions. Ever wanted an easy way to manage a queue of crowd-requested songs? Ever had people who spam the queue, post too frequently, or post looooooooong songs? Gamgee handles all of that for you!

This project started out as a simple Discord bot to play around with APIs and things. As for the name, I thought it was neat. I was on a LOTR kick at the time. Samwise Gamgee is a name that deserves to be remembered.

## Authors & Contributors

- [**AverageHelper**](https://github.com/AverageHelper) - _Creator_
- [**ajnrules**](https://github.com/ajnrules) - _Contributor_
- [**bendai94**](https://github.com/bendai94) - _Contributor_
- [**karcsesz**](https://github.com/karcsesz) - _Contributor_
- [**vayandas**](https://github.com/vayandas) - _Contributor_

## Prerequisites

This project requires [NodeJS](https://nodejs.org/) (version 16.10 or later), [NPM](https://npmjs.org/), and a [Discord bot account token](https://www.howtogeek.com/364225/how-to-make-your-own-discord-bot/).
To make sure you have them available on your machine,
try running the following command:

```sh
$ npm -v && node -v
7.20.3
v16.15.1
```

## Clone the Repo

```sh
$ cd path/to/parent
$ git clone https://github.com/AverageHelper/Gamgee.git
$ cd Gamgee
```

## Table of contents

- [Gamgee](#Gamgee)
  - [Authors & Contributors](#authors--contributors)
  - [Prerequisites](#prerequisites)
  - [Clone the Repo](#clone-the-repo)
  - [Table of contents](#table-of-contents)
  - [Usage](#usage)
    - [Get your own bot token](#get-your-own-bot-token)
    - [Invite your bot to your server](#invite-your-bot-to-your-server)
    - [Register Slash Commands](#register-slash-commands)
    - [Command Permissions](#command-permissions)
    - [Run the bot](#run-the-bot)
      - [Selecting a database file location](#selecting-a-database-file-location)
    - [Autogenerated Files](#autogenerated-files)
    - [Supported Music Platforms](#supported-music-platforms)
  - [Commands](#commands)
    - [`setprefix`](#setprefix)
    - [`help`](#help)
    - [`howto`](#howto)
    - [`languages`](#languages)
    - [`limits`](#limits)
    - [`nowplaying`](#nowplaying)
    - [`ping`](#ping)
    - [`quo`](#quo)
    - [`sr`](#sr)
    - [`test`](#test)
    - [`t`](#t)
    - [`version`](#version)
    - [`video`](#video-url)
  - [Contributing](#contributing)
  - [Built With](#built-with)
  - [License](#license)

## Usage

You might have arrived here about a bot already running on Gamgee. For example, some friends of mine run an instance for [our server](https://twitter.com/blepcon). If you'd like to learn more about using a hosted instance of Gamgee in your own server, send a DM to [@oddmusicpony](https://twitter.com/oddmusicpony) on Twitter.

<!-- TODO: Create a Discord server for folks to join about running their own hosted instance of Gamgee, or perhaps using an existing one. -->

You could add that bot to your own server if you'd like (coming soon™), or you can run you own instance:

### Get your own bot token

Note that, by running Gamgee, you agree to be bound by the Discord's [Developer Terms of Service](https://support-dev.discord.com/hc/en-us/articles/8562894815383) and [Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327), as well as [Gamgee's own license](/LICENSE). With that in mind, you'll need a token for a Discord bot account. See [this awesome tutorial on how to get one](https://www.howtogeek.com/364225/how-to-make-your-own-discord-bot/).

Create a file called `.env` in the root of this project folder. Paste your token into that file:

```sh
# .env

DISCORD_TOKEN=YOUR_TOKEN_GOES_HERE
```

### Invite your bot to your server

Go to https://discordapi.com/permissions.html#377957215296 and paste in your bot's client ID to get an invite link.

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

Since Gamgee is just a Node script, any Node process manager will do.

```sh
$ node .
# or
$ npm start
# or
$ pm2 start .
```

#### Selecting a database file location

If the default database location (the `Gamgee/db/` folder) won't work for your setup, you may select a different path where our database files should go. Put it in your `.env` file:

```sh
# .env

# Your own bot token
DISCORD_TOKEN=YOUR_TOKEN_GOES_HERE

# Where the database files should live
DATABASE_FOLDER=./foo/bar/baz # The database will go in this folder, at baz/db.sqlite
```

### Autogenerated Files

Gamgee generates some files as needed. This is normal, and you should not bother with most of them.

- `node_modules/` contains our dependent packages. This folder is _massive_, and that's on purpose. You don't need to worry about what's behind this curtain.
- `dist/` contains the compiled bot code. What, did you think we ran the TypeScript directly? SMH my head, mate.
- `logs/` contains log files for events that the server thinks might be useful one day. Most of these have to do with the many smol-but-important things Gamgee does in the background that you shouldn't worry about. Feel free to look in here if you're ever curious. These logs rotate automatically every day, with only the last 30 days retained.
- `db/` contains Gamgee's database, if you've not selected your own DB path. Don't touch this unless you know what you're doing.

### Supported Music Platforms

We support the following media platforms:

- [YouTube](https://www.youtube.com/)
- [SoundCloud](https://soundcloud.com/)
- [Bandcamp](https://bandcamp.com/)
- [Pony.FM](https://pony.fm/)

If you'd like us to support another platform, please [submit an issue](https://github.com/AverageHelper/Gamgee/issues/new?labels=enhancement&template=feature_request.md)!

## Commands

All commands must begin with a command prefix (`/` for Slash Commands; `?` by default for messages; a mention to the bot.) Yes, you can mention the bot to run commands. For example, if your bot's account name is EC, `@EC help` will run the `help` command. (This is handy in case you forget the command prefix, or don't feel like typing `/`. ;)

### `setprefix`

Controls the prefix which marks normal messages as command invocations (such as the `?` in `?help`). This command may only be run by the server owner (and is therefore unavailable in DMs). Responses will be ephemeral (if using [Slash Commands](https://support.discord.com/hc/en-us/articles/1500000368501-Slash-Commands-FAQ)), or a private DM (if using message commands).

[This command requires special permissions.](#command-permissions)

### `help`

Prints the list of commands available to the user. The result is either an "ephemeral" reply, or a DM.

### `howto`

Prints instructions for how to use the song request queue. Anyone may use this command.

### `languages`

Prints the list of languages that make up Gamgee's source code.

### `limits`

Prints the limits on the song request queue. Learn more about the available limits under the [`quo limit`](#quo-limit-key-value) command.

### `nowplaying`

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

- `entry-duration` - The maximum amount of time (in seconds) that a song can be.
- `entry-duration-min` - The minimum amount of time (in seconds) that a song can be.
- `queue-duration` - The minimum amount of time (in seconds) of song time that may reside in the queue if every song in the queue were played end-to-end.
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

Submits a song to the queue. For songs to be considered, submissions must be a valid track link from a [supported platform](#supported-music-platforms).

### `test`

Runs test queries against each of our [supported platforms](#supported-music-platforms), and responds with useful statistics. This is handy for making sure that Gamgee still knows how to talk to external services whose API may change without notice.

### `t`

Triggers the typing indicator in the current channel. This is mostly for fun and giggles.

### `version`

Display's the current version of Gamgee Core. (see [package.json](https://github.com/AverageHelper/Gamgee/blob/main/package.json#L3))

### `video <url>`

Given a track link from a [supported platform](#supported-music-platforms), Gamgee responds with that video's title and duration. Handy for testing specific cases. Anyone may use this command at any time.

## Contributing

This project is entirely open source. Do with it what you will. If you're willing to help me improve this project, consider [filing an issue](https://github.com/AverageHelper/Gamgee/issues/new/choose).

See [CONTRIBUTING.md](/CONTRIBUTING.md) for ways to contribute.

## Built With

- [Visual Studio Code](https://code.visualstudio.com/)
- [Discord.js](https://discord.js.org/)
- Love

## License

Gamgee's source is licensed under the [GNU General Public License v3.0](LICENSE).

Furthermore, by installing and running an instance of Gamgee yourself, you agree
to be bound by the terms of the [Discord Developer Terms of Service](https://support-dev.discord.com/hc/en-us/articles/8562894815383) and the [Discord Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327). If you wish not to be bound by these terms, and instead use a hosted instance of Gamgee, send a DM to [@oddmusicpony](https://twitter.com/oddmusicpony) on Twitter.
