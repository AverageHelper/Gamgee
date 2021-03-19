# Gamgee

> "There's some good in this world, Mr. Frodo, and it's worth fighting for."

A Discord bot to play around with APIs and things

## Prerequisites

This project requires [NodeJS](https://nodejs.org/) (version 12 or later), [NPM](https://npmjs.org/), and a [Discord bot account token](https://www.howtogeek.com/364225/how-to-make-your-own-discord-bot/).
To make sure you have them available on your machine,
try running the following command:

```sh
$ npm -v && node -v
6.14.11
v14.6.0
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
    - [Running the bot](#running-the-bot)
    - [Running the tests](#running-the-tests)
  - [Commands](#commands)
    - [`ping`](#ping)
    - [`video`](#video)
    - [`config`](#config)
  - [Contributing](#contributing)
  - [Built With](#built-with)
  - [Authors](#authors)
  - [License](#license)

## Usage

### Running the bot

You'll need a Discord bot account's token. See [this awesome tutorial on how to get one](https://www.howtogeek.com/364225/how-to-make-your-own-discord-bot/).

With token in hand, create a file called `.env` in the root of your project folder. Save your token in that file, like so:

```sh
# .env

DISCORD_TOKEN=YOUR_TOKEN_HERE
```

**Do not commit this file to git** or your bot _will_ get hacked.

Install the necessary dependencies:

```sh
$ npm install
```

And start the bot:

```sh
$ npm start
```

### Running the tests

To run all tests with code coverage, run:

```sh
$ npm test
```

To run tests on files you've changed and automatically rerun tests as changes occur, run:

```sh
$ npm run test:watch
```

To run the style linter, run:

```sh
$ npm run lint
```

## Commands

All commands must begin with the configured prefix (`!` by default).

### `ping`

Gamgee responds with "Pong!"

### `video`

Given a YouTube or SoundCloud video link, Gamgee responds with that video's title and duration.

### `config`

Access the persistent config.

#### `config get <key>`

Gamgee responds with the current configuration value for the provided key.

#### `config set <key> <value>`

Sets a new value for the provided key. Gamgee responds with a confirmation of the new key and value, with an option to undo.

#### Options

The following options are valid config `key`s:

- `command_prefix`

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) (soon) for details on our code of conduct and the process for submitting pull requests to us.

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
