# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
- Nothing yet :3

## [3.2.0] - 2026-01-18
### Changed
- [BREAKING if you use Docker] The Docker container at `ghcr.io/averagehelper/gamgee` is no longer maintained, and may be deleted soon. Use `git.average.name/averagehelper/gamgee` instead. (Just replace `ghcr.io` ~> `git.average.name`)
- Moved source code to [Forgejo](https://git.average.name/AverageHelper/Gamgee), and updated user-facing source links and documentation. ([Why?](https://blog.average.name/2023-12-16-leaving-github))
- `/languages` is now slightly faster, using only one API request instead of two.
- Updated internal testing utilities.

### Fixed
- `npm run firstrun` pointed to the wrong internal commands

## [3.1.0] - 2024-08-22
### Added
- Use YouTube's first-party API when an API key is provided.
- The `/test` command now reports when an alternative source is used for querying platforms. This is especially useful to determine whether Gamgee needed to fall back on an Invidius instance when YTDL failed, or when an API key was not configured.

### Changed
- More reliable parsing of track duration data from Bandcamp, using [a polyfill](https://github.com/fullcalendar/temporal-polyfill) for the new [Temporal API](https://tc39.es/proposal-temporal/docs/duration.html) instead of RegEx.

## [3.0.0] - 2024-08-21
### Fixed
- Version bump because of a breaking change in v2.2.1. (Sorry!!) We now require Node 20. Docker users should be unaffected, since the Dockerfile \*should\* be using the latest Node anyway.

## [2.2.1] - 2024-08-21
### Changed
- BREAKING: We now require Node 20. Make sure you upgrade your system Node version if you don't use Docker.
- Network and args parsing are now handled using native structures instead of `cross-fetch` and `yargs`.
- Replaced `Jest`, `Mocha`, and `Chai` with `Vitest` for unit testing.
- Started using ESM instead of CJS modules.
- Use trailing commas to made code diffs cleaner.
- `/limits` now mentions the `/cooldown` command properly.
- Updated dependencies, and made our Rollup bundle tighter.

### Fixed
- We now halt dangling network requests when one video platform answers back. This might speed up handling request floods, since ostensibly this means Node will let go of unneeded network resources more quickly for each request.
- Handle YouTube failures by trying an [Invidius](https://docs.invidious.io/api/#get-apiv1videosid) proxy instead. For now, the only instance we'll try is https://iv.ggtyler.dev, as it seemed the most reliable at the time.

## [2.2.0] - 2024-02-18
### Added
- Translations for `/howto` command responses. (Thanks to [@karcsesz](https://github.com/karcsesz), [@vayandas](https://github.com/vayandas), and marph92 for help translating!)
- Internal logging to indicate the start of a user's submission cooldown timer.
- `.mailmap` file.

### Changed
- When the bot references a command in chat, we now use an interactive link to the new slash-command variant. Users can click or tap this command to fill in their message bar.
- Some internals to prepare for modern module syntax.

### Fixed
- Test falures on Node 18+.
- `npm run commands:deploy` and `npm run commands:revoke` work correctly now.

## [2.1.1] - 2023-04-03
### Changed
- Trying out [ESBuild](https://esbuild.github.io) instead of [terser](https://terser.org). Should hopefully make for a less memory-intensive build process for small servers.

### Fixed
- Failure to decode button interactions. New discord.js version properly utilizes the new subdependency version. (They _really_ should consider pinning their deps.)

## [2.1.0] - 2023-04-02
### Added
- Complete translations for common commands.

### Changed
- `/sr` now presents song request embeds more quickly.
- `/quo open` now logs the timestamp at which the queue was opened.

## [2.0.6] - 2023-02-24
### Fixed
- Startup loop under PM2 when the `NODE_ENV` environment variable is't available.

## [2.0.5] - 2023-02-14
### Added
- We now verify on startup that all commands were deployed.

### Changed
- Round the output of `/cooldown` _upward_ to the next second, rather than _strictly_ to the nearest second. The actual cooldown time is unchanged. This new rounding only means that folks who time their next subission to the second based on `/cooldown` will be less likely to be 0-1 seconds early.

### Fixed
- Crashes related to blacklist management

## [2.0.4] - 2023-02-08
### Changed
- Clarified the header to the results from `/test`.
- Reduced processing time for message commands by reducing the cases in which we fetch message data from Discord.
- Time-out HTTP requests after 50 seconds.
- More resilience to slow responses from media providers.
- Reduced the number of round-trip database calls when opening the queue.

## [2.0.3] - 2022-10-29
### Changed
- More thorough logging, especially around song request messages. This should help us debug some timing issues.

## [2.0.2] - 2022-09-24
### Changed
- Internal rejection logs now have more context.

### Fixed
- Submissions made with `/sr` are now hidden properly when the submission is rejected, matching the behavior of `?sr`.

## [2.0.1] - 2022-09-24
### Fixed
- Fixed issue that caused `/nowplaying` to fail for some users.

## [2.0.0] - 2022-09-21
### Added
- Support for invoking localized command names with message commands. For example, `?usuarioinfo` now behaves the same as `?userinfo`. Any user can execute a command in any supported language.

### Changed
- `/sr` and `/video` now support hiding embeds using Discord's standard angle-brackets method. Simply wrap your link in `<` and `>`, and Gamgee will parse the link in the usual way, taking care to avoid embedding the title and thumbnail publicly.
- BREAKING: Changed the way database migrations happen. After you update, please run `npm run baseline` if you do not wish your database to be reset. This command adds a field to your database that lets our ORM know that its schema is up to date. You should only have to do this once.
- BREAKING: Replaced the `DATABASE_FOLDER` environment variable with a new required `DATABASE_URL` variable. Please add this variable to your `.env` file, and set it to the value `"file:{absolute path to your database file}"`. See the [README](README.md#selecting-a-database-file-location) for an example.
- Renamed the `entry-duration` queue limit ID to `entry-duration-max`. This makes more sense alongside the `entry-duration-min` limit ID.
- Since [Node 18 supports a built-in `fetch` API](https://dev.to/andrewbaisden/the-nodejs-18-fetch-api-72m), we'll use that when its available. We fall back to `cross-fetch` otherwise.
- Clarified the descriptions of queue limits. They used to specify that time values are in seconds, but we format the number nicely with appropriate units that usually _aren't_ seconds.
- The build output is now a single file, dist/server.js.
- Updated [`discord.js`](https://github.com/discordjs/discord.js) to version [14.4.0](https://github.com/discordjs/discord.js/releases/tag/14.4.0).

### Removed
- BREAKING: Removed migrations from old v1.x.x versions. You should **run Gamgee v1.8.3** at least once if you're updating from an older Gamgee version and want to keep your database.
- BREAKING: Removed the previously-deprecated `/config` command and related migration logic. You should **run Gamgee v1.8.3** at least once if you're updating from an older Gamgee version if you want to keep your legacy guild configurations.

## [1.8.3] - 2022-09-12
### Added
- A new `LOG_LEVEL` environment variable lets you choose what log level is forwarded to the console.

### Changed
- Gamgee now automatically rotates log files daily, retaining only the last 30 days of logs. This should help to keep log bloat down for active instances.
  - You may wish to delete old plain log files after some time, since these are not rotated.
  - If you use [`pm2`](https://pm2.io/) to run your instance, you might want to look into [`pm2-logrotate`](https://github.com/keymetrics/pm2-logrotate), whose defaults presently match what Gamgee's logs do.
- Modularized our test assertions. This may come in handy if ever we need to migrate to a different test runner.

### Fixed
- YouTube VODs were considered infinitely-long, because YouTube's API still calls them "live content." Gamgee now considers VODs (or any "live content" with a set duration) the same as normal tracks.

## [1.8.2] - 2022-09-10
### Added
- Created issue templates!
- Automated deployment pipeline based on [CHANGELOG.md](CHANGELOG.md). Now, the changelog file is the source of truth for versioning Gamgee, and our CI/CD pipeline automatically cuts deployment releases based on that. Much less work for me to do to maintain those!

### Changed
- Better Hungarian translations! (Thanks again, [@karcsesz](https://github.com/karcsesz)!)
- Re-did (again) how we parse Bandcamp links. My pseudo-fork of [`url-metadata`](https://www.npmjs.com/package/url-metadata) has been replaced with a combination of [`htmlmetaparser`](https://www.npmjs.com/package/htmlmetaparser) and [`htmlparser2`](https://www.npmjs.com/package/htmlparser2). The speed is virtually identical (as far as I care to benchmark), so users shouldn't notice any difference. The main advantage here is the reduction in code size and maintenance overhead.
- Message commands now assert that numbers and strings are correctly formatted. This applies only to `?setprefix` for the moment, which previously would allow an argument longer than 3 characters, whereas `/setprefix` would properly keep the value to 3 or fewer characters.

## [1.8.1] - 2022-08-20
### Changed
- Improved French translations! (Thanks again, [@vayandas](https://github.com/vayandas)!)

## [1.8.0] - 2022-08-19
### Added
- Added a new `/setprefix` command to change the guild's preferred message-command prefix. (This means you can change the default `?` to any 1-3 char string you want!) This feature has been around for a long time, in the form of the now-gone `/config` family of subcommands. Those commands used a storage medium separate from the main SQLite database, and that was always weird to me. Enjoy the new more stable experience!
- Translations for a bunch of user-facing strings into German, Spanish, French, Hungarian, and Portuguese.

### Changed
- The `/config` command now prints a message instructing the user to use the `/setprefix` command instead.
- Moved guild-scoped message-command prefix config to the SQLite database. I plan to retain this migration code until the next Semver Major version.
- Translate duration strings to a language and format that makes sense to the user (for private responses) or to the guild (for public responses).
- `/quo stats` no longer repsonds publicly, even when the channel of invocation is the queue channel.
- `/now-playing` has been renamed to `/nowplaying`. The command retains `now-playing` as an alias, in case users wish to do things the hard way.

### Removed
- Removed legacy `/config` command subtree. Use the `/setprefix` command instead.

## [1.7.1] - 2022-08-14
### Added
- New info in [CONTRIBUTING.md](CONTRIBUTING.md) about how to contribute translations.

### Changed
- We compile into CommonJS syntax now, because Jest broke.
- Replaced `node-fetch` with `cross-fetch`, because Jest doesn't seem to like ESM (which [`node-fetch` requires](https://github.com/node-fetch/node-fetch/issues/1279)) or [`undici`](https://github.com/nodejs/undici/issues/318) anymore.
- Gamgee now speaks over 7 languages, and knows it. (More, if you count JavaScript!)
- Moved I18N calls into a single file that can be imported from anywhere in the codebase.
- Locales are now stored in [/src/locales/](src/locales). Feel free to contribute there!
- Added two functions to retrieve localized text in bulk (for Discord command registration) or for a single locale (for command responses).

## [1.7.0] - 2022-08-10
### Added
- Added naive French, German, Hungarian, Portuguese, and Spanish translations for the invocation interfaces of `/cooldown`, `/help`, `/howto`, and `/sr`. Eventually, I'd like to i18nlize every interaction based on the locale of the user (for private responses) or the locale of the guild (for public responses).
  - Slash command localizations are in open beta (according to [this message](https://discord.com/channels/613425648685547541/697138785317814292/956670963104239666) in the Discord Developers server). Use the [feature/web-slash-command-localization](https://discord.com/__development/link?s=BfVH8Z8qL1z5eLXlAUJT5uqob9jkwn937VrnvSL5kXg%3D.eyJ0YXJnZXRCdWlsZE92ZXJyaWRlIjp7ImRpc2NvcmRfd2ViIjp7InR5cGUiOiJicmFuY2giLCJpZCI6ImZlYXR1cmUvd2ViLXNsYXNoLWNvbW1hbmQtbG9jYWxpemF0aW9uIn19LCJyZWxlYXNlQ2hhbm5lbCI6bnVsbCwidmFsaWRGb3JVc2VySWRzIjpbXSwiYWxsb3dMb2dnZWRPdXQiOmZhbHNlLCJleHBpcmVzQXQiOiJXZWQsIDMxIEF1ZyAyMDIyIDE3OjU2OjQ2IEdNVCJ9) build override to see command localizations on your desktop client.
- Added the URL to this repository to the bot's profile. (For some reason, links inside of the bot description are unreliable, and seem to cause the description to go away after a while.)

### Changed
- Updated discord.js to version 14.1.2
- Made [textResponses.ts](src/constants/textResponses.ts) a bit easier for humans to read
- Migrated our integration tests from Jest to Mocha, because [`discord.js` now depends on `undici` instead of `node-fetch`](https://github.com/discordjs/discord.js/pull/7747), and [`undici` historically hasn't played well with Jest's runner](https://github.com/nodejs/undici/issues/318), and I guess [still doesn't](https://github.com/facebook/jest/issues/2549), and the [other](https://github.com/facebook/jest/issues/2549#issuecomment-983717728) [workarounds](https://github.com/facebook/jest/issues/2549#issuecomment-1098071474) [I](https://github.com/kayahr/jest-environment-node-single-context) [tried](https://github.com/nicolo-ribaudo/jest-light-runner) don't play well with ESM or the [`references`](https://www.typescriptlang.org/tsconfig#references) tsconfig option. Mocha works just fine, tho!

## [1.6.6] - 2022-07-26
### Added
- Added a robust [CHANGELOG.md](CHANGELOG.md) based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)'s example.

### Changed
- Updated discord.js to version 13.8.1
- Use native [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) instead of `Discord.Collection` when we don't need the latter's features
- `/version` links to the changelog instead of our GitHub [Releases](https://github.com/AverageHelper/Gamgee/releases) page

### Removed
- Unused module type definitions

## [1.6.5] - 2022-06-21
### Fixed
- Turns out `node-fetch-cjs` is broken. I tried [something different](https://github.com/node-fetch/node-fetch/issues/1265#issuecomment-911870827) and got `node-fetch` to work!

## [1.6.4] - 2022-06-21
### Changed
- Made `/stats` output a bit more consistent with itself.
- Dependency audit time! We've updated most every dependency except ORM stuff. (I plan to do something special about those later, so stay tuned!)
  - `node-fetch` is [ESM-only now](https://github.com/node-fetch/node-fetch#commonjs), but [Jest doesn't play well with that](https://github.com/node-fetch/node-fetch/issues/1265) yet. There's a race to see whether that'll get fixed [before Node 18 gets popular](https://dev.to/andrewbaisden/the-nodejs-18-fetch-api-72m). In the meantime, we use `node-fetch-cjs` instead.
  - Updated Prettier means that we no longer need parentheses around `as unknown` casts.
  - Updated ESLint rules have pointed out that we really shouldn't be returning un-`await`ed Promises. I've fixed that, and my tooling assures me that every returned `Promise` now gets an `await` friend! 😄 We may never know if this change made a difference at runtime, but even an invisible improvement is a good improvement imo.
  - We now require Node 16.10.x, because Jest does.
- Slightly better internal organization, taking advantage of clearer discord.js TypeScript definitions

### Fixed
- Fixed a bug which could allow multiple requests to sneak into the queue if they were submitted at about the same time as the queue auto-closed.
- Dev note: If you use VS Code and the Prettier extension, you may need to reload your window after pulling this down, or else Prettier might not correctly apply its updated opinions.

## [1.6.3] - 2022-06-15
### Fixed
- Fixes (I hope) a bug that caused button interactions to sometimes fail as the interaction token expires during long-running database writes. We now defer interactions first!

## [1.6.2] - 2022-06-15
### Changed
- `?ping` no longer pings the calling user, to be consistent with the behavior of `/ping`

### Fixed
- Fixed crash when users would send a message in a voice text channel
- `/t` now replies ephemerally always, even if Gamgee thinks the channel is a DM

## [1.6.1] - 2022-06-07
### Changed
- **No runtime changes** this version. The only change was to a setup file that handled the (infrequent) deployment of app commands to Discord. If you had trouble with the deployment in 1.6.0, this should fix that.
- Due to [discord-api-docs#4830](https://github.com/discord/discord-api-docs/pull/4830), we no longer try to set app command permissions. We'll handle that with the same runtime fallback that message command permissions use.
- In the future, we may set the default command permissions using new API constructs, and lean on Discord's UI to let guild admins configure command permissions as they see fit.

## [1.6.0] - 2022-05-17
After updating, be sure to run `npm ci && npm run build:clean && npm run migrate` before running the bot.

### Added
- Add a new limit for the minimum duration of a submission
- Special messaging when the queue is very nearly full

### Changed
- Make `/stats` output clearer
- Clearer message when Gamgee auto-closes an overfull queue
- Reorganize some code internally so we can better catch Slash Command edge cases
- Known Issues:
  - The command deployment script removes guild-level slash-commands. Working on a fix for that now. **As a workaround, avoid running `npm run setup` or `npm run commands:deploy` in this version.**

## [1.5.0] - 2022-04-23
### Added
- This update adds a field to the database schema, and adds new commands. Remember to run `npm run setup` to migrate the database and update Discord's command index.
- Added `/stats` to show users their personal queue stats
- Added `/cooldown` to show users their personal cooldown timer
- Added a configurable limit to the queue's total estimated playtime
  - If a submission would take the total playtime over the configured limit, then Gamgee closes the queue.
  - You'd remove the limit in the same way you remove other limits: set it to `0` or `null`.
- Gamgee tells you the length of your submission if it was rejected for length reasons

### Changed
- Gamgee only shows the number of users who used `/now-playing` when that number is greater than zero.
- Made `/version` readout less verbose
- Updated TypeScript to version 4.6.3, and cleaned up the code a bit
- Named imports are nice
- Organized internal error structures

### Removed
- Removed personal stats functionality from `/limits`

### Fixed
- Gamgee no longer adds "(Reply from ...)" when the message it's replying to was already a DM
- Preprocess SoundCloud links so Gamgee doesn't balk at query params or redirect links
- [For bot admins] Fixed migration errors. You should be able to run `npm run migrate` or `npm run setup` now without issues!
- Fixed some edgy crash cases

## [1.4.1] - 2022-04-22
### Changed
- Named exports are nice

### Fixed
- Fixed some dependency vulnerabilities
- Fixed an issue which would cause `/now-playing` to wreck the formatting of queue messages

## [1.4.0] - 2022-03-17
### Added
- Add support for [Pony.FM](https://web.archive.org/web/20220305145229/https://pony.fm/) track links
- Link to platform support documentation everywhere it makes sense

### Changed
- Move platform support documentation to [README](https://github.com/AverageHelper/Gamgee/blob/0f7c126efc6c72ed3ba98b204624779e6cc1cba4/README.md#supported-music-platforms)

## [1.3.2] - 2022-03-09
### Fixed
- Fixed a bug where running `/quo restart` would fail to clear queues over 100 messages while silently dropping the local queue cache.

## [1.3.1] - 2022-03-08
### Added
- Include a link to our repository when users run `/version`
- Add [@karcsesz](https://github.com/karcsesz) to the README list of contributors
- Add proper [Code of Conduct](CODE_OF_CONDUCT.md) and [Contributing](CONTRIBUTING.md) docs
- More random things to say

### Changed
- Functional refactor: Trying to slim down on the spaghetti, I've refactored most of the core structures from object methods to free functions. [Data shouldn't have conceptual responsibilities over data.](https://youtu.be/QM1iUe6IofM) There's lots more cleanup work to be done, especially to organize these new functions in a sane way, but the preliminary work is done.
- Improved formatting of interaction counts
- Re-do how we parse Bandcamp links. (The [`url-metadata`](https://www.npmjs.com/package/url-metadata) package is not well-maintained, and contains some minor security vulnerabilities that GitHub _really_ wants me to fix. Since the package is quite small, I moved it in-house for now and patched it myself.)
- Update our compile target to native ESM syntax. (You _are_ running Node 16, _right?_ ;)
- Ditch an old database migrator that hasn't been relevant since before v1.0.0
- Clarified some documentation comments, especially in textResponses.ts

## [1.3.0] - 2022-02-27
### Added
- Added a "Likes" counter to the request queue. Most users won't notice this, but DJs might.
- Every time a user runs `/now-playing` or its variants on a song that they didn't submit, the Likes counter increments.
- Subsequent invocations from the same user do not add to that counter
- NOTE: You _should not_ have to run the migrator, since we only _added_ an optional field to the database here.
- Coming soon: The ability to disable the Likes counter, for DJs who are concerned about it.

## [1.2.5] - 2022-02-14
### Fixed
- Bandcamp support hotfix

## [1.2.4] - 2022-02-06
### Added
- Some more silly random quotes
- That's it. That's the update.

## [1.2.3] - 2022-01-11
### Changed
- Updated `ytdl-core` again

### Fixed
- Fixed `github-metadata` dependency issue by ditching it and calling the GitHub API ourselves lol
- Fixed `sqlite3` dependency issue by installing a fork instead

## [1.2.2] - 2022-01-10
### Changed
- Clearer comments in some handy places
- Update ytdl-core

### Removed
- Remove redundant logging around the `now-playing` command, now that that's fixed.

## [1.2.1] - 2021-11-29
### Fixed
- Set `sentAt` to the _current time_ as we insert a queue entry, instead of using Discord's incoming message timestamp. This _should_ fix the ordering issue with `?now-playing`.

## [1.2.0] - 2021-11-10
### Added
- Add support for aliasing commands.
  - Certain predefined strings may be used as aliases to commands. This does not affect the behavior of slash-commands, since those have autocomplete.
  - Add `?nowplaying` as an alias for `?now-playing`

### Changed
- Better ergonimics for `/sr` reply timing.
  - Before, we only embedded the user's requested song after a successful queue entry.
  - Now, we embed the song right away then remove the embed if queue constraints reject the song. Just like `?sr`.
- More consistency between `/sr` and `?sr`.
  - For `/sr` requests, Gamgee emulates the message behavior of `?sr` requests.
- _Slightly_ more aggressive about pinging users when we need to get their attention.

### Fixed
- Fixed a bug that caused Gamgee to crash when users sent non-URL song requests.

## [1.1.0] - 2021-11-08
### Added
- Added a contributor to the README. (Thanks again, [@ajnrules](https://github.com/ajnrules)!)

### Changed
- Simplified a few things
- Complicated some others
- Made my `JobQueue` class [its own package](https://www.npmjs.com/package/@averagehelper/job-queue).

### Fixed
- Song requests that use `/sr` now behave more closely to requests that use `?sr`
  - There has been some confusion to do with the way Gamgee handled slash-command requests. Basically, we would only post that the song had been requested if the request made it in. This means that the crowd often saw the request and the confirmation go in at the same time when people used `/sr`, whereas other requests (using `?sr`) had more time between request and confirmation.
  - I'm pretty sure Gamgee treated both kinds of requests fairly; it just didn't tell everybody about `/sr` requests until they already got in.
  - This should make things more clear for the crowd, if a bit jumpy in the chat for requesters. Gonna iron that out later.

## [1.0.0] - 2021-09-16
### Added
- Add a `/test` and `?test` command to check that Gamgee can still talk to our video APIs
- More silly random responses lol

### Changed
- Update to Discord.js v13
- Updated README
- More stable slash commands for song requests
- Gamgee considers YouTube live streams to be videos of infinite length
- Improved queue stats output
- Inform users publicly when we can't reach their DMs
- Improved debug logging

### Fixed
- `?help` and `/help` now work in DMs

## [1.0.0-beta.8] - 2021-07-17
### Changed
- **UI:** Use new buttons for interactivity instead of reactions (see [discordjs/discord.js#5674](https://github.com/discordjs/discord.js/pull/5674)). This means that reaction buttons are no longer necessary, and there is zero delay between posting a message and making that message interactive; it's all one `send` or `edit` call.
- **Bandground:** Use a specific Discord.js commit, so we can run `npm install` without breaking things while we use this bleeding-edge build of DJS
- **Bandground:** Update dependencies to fix a security issue.

## [1.0.0-beta.7] - 2021-05-30
### Changed
- Just a minor update to the way we shim `Promise.any`.

## [1.0.0-beta.6] - 2021-05-29
### Changed
- More reliably hide embeds when marking queue messages as Done

## [1.0.0-beta.3] - 2021-05-21
### Changed
- Start fetching song info right away, and process other queue checks while we wait on that.

## [1.0.0-beta.2] - 2021-05-20
### Added
- Added a basic one-way interaction interface with synchronous dispatch
  - Gamgee replies more quickly to song requests, allowing the queue messages to acquire their reaction buttons in a separate context

### Fixed
- Replies now ping the recipient by default. This has been tested with song request acceptance replies

## [1.0.0-beta.1] - 2021-05-16
### Added
- Add support for slash commands

### Changed
- Reorganize commands slightly to better support Discord's slash commands structure
- Restructure the command context to reduce imports and make user interfaces more generic
- Please note: We're using a pre-release version of Discord.js in order to use its TypeScripted slash command structures. You may experience some subtle bugs.

## [1.0.0-alpha.9] - 2021-04-28
### Added
- Add a `?now-playing` command. This will send users the URL of the oldest unplayed song in the queue. This works best if the DJ keeps up with marking played songs as "Done".

## [1.0.0-alpha.8] - 2021-04-25
### Changed
- Make the `?sr blacklist` command print the list of blacklisted users in DMs (if the sender is a queue admin of course).
- Log less with every message. (This isn't a chat log after all!)
- Let the runner deal with adding timestamps to console logs, for formatting and brevity. We still record timestamps in our own log files, but a runner like PM2 can display them much better than I know how to when users use the `--time` or `--timestamp` flag when starting or logging, respectively.

## [1.0.0-alpha.7] - 2021-04-23
### Added
- Add a user blacklist to the song request queue.
- Add timestamps to console logs

## [1.0.0-alpha.6] - 2021-04-18
### Added
- Added a silly little command to fetch metadata about the repo and report some of it to users. (I frequently get asked what language I wrote Gamgee in, so I built a command to have the bot answer for me.)

### Changed
- Made logging _much_ more useful around common flows, like responding to commands (especially song requests).

## [1.0.0-alpha.5] - 2021-04-13
### Added
- Added a button to completely delete requests from the queue. This action restores the submitter's submission limits otherwise occupied by that request.

### Fixed
- Fixed a bug where song requests would not be properly stored.

## [1.0.0-alpha.4] - 2021-04-13
### Added
- Added a `Role` table to the database. This will be useful later.

## [1.0.0-alpha.3] - 2021-04-07
### Changed
- Serialize all song request processing

## [0.0.0] - 2021-03-14
### Added
- Initial commit

[Unreleased]: https://git.average.name/AverageHelper/Gamgee/compare/v3.2.0...HEAD
[3.2.0]: https://git.average.name/AverageHelper/Gamgee/compare/v3.1.0...v3.2.0
[3.1.0]: https://git.average.name/AverageHelper/Gamgee/compare/v3.0.0...v3.1.0
[3.0.0]: https://git.average.name/AverageHelper/Gamgee/compare/v2.2.1...v3.0.0
[2.2.1]: https://git.average.name/AverageHelper/Gamgee/compare/v2.2.0...v2.2.1
[2.2.0]: https://git.average.name/AverageHelper/Gamgee/compare/v2.1.1...v2.2.0
[2.1.1]: https://git.average.name/AverageHelper/Gamgee/compare/v2.1.0...v2.1.1
[2.1.0]: https://git.average.name/AverageHelper/Gamgee/compare/v2.0.6...v2.1.0
[2.0.6]: https://git.average.name/AverageHelper/Gamgee/compare/v2.0.5...v2.0.6
[2.0.5]: https://git.average.name/AverageHelper/Gamgee/compare/v2.0.4...v2.0.5
[2.0.4]: https://git.average.name/AverageHelper/Gamgee/compare/v2.0.3...v2.0.4
[2.0.3]: https://git.average.name/AverageHelper/Gamgee/compare/v2.0.2...v2.0.3
[2.0.2]: https://git.average.name/AverageHelper/Gamgee/compare/v2.0.1...v2.0.2
[2.0.1]: https://git.average.name/AverageHelper/Gamgee/compare/v2.0.0...v2.0.1
[2.0.0]: https://git.average.name/AverageHelper/Gamgee/compare/v1.8.3...v2.0.0
[1.8.3]: https://git.average.name/AverageHelper/Gamgee/compare/v1.8.2...v1.8.3
[1.8.2]: https://git.average.name/AverageHelper/Gamgee/compare/v1.8.1...v1.8.2
[1.8.1]: https://git.average.name/AverageHelper/Gamgee/compare/v1.8.0...v1.8.1
[1.8.0]: https://git.average.name/AverageHelper/Gamgee/compare/v1.7.1...v1.8.0
[1.7.1]: https://git.average.name/AverageHelper/Gamgee/compare/v1.7.0...v1.7.1
[1.7.0]: https://git.average.name/AverageHelper/Gamgee/compare/v1.6.6...v1.7.0
[1.6.6]: https://git.average.name/AverageHelper/Gamgee/compare/v1.6.5...v1.6.6
[1.6.5]: https://git.average.name/AverageHelper/Gamgee/compare/v1.6.4...v1.6.5
[1.6.4]: https://git.average.name/AverageHelper/Gamgee/compare/v1.6.3...v1.6.4
[1.6.3]: https://git.average.name/AverageHelper/Gamgee/compare/v1.6.2...v1.6.3
[1.6.2]: https://git.average.name/AverageHelper/Gamgee/compare/v1.6.1...v1.6.2
[1.6.1]: https://git.average.name/AverageHelper/Gamgee/compare/v1.6.0...v1.6.1
[1.6.0]: https://git.average.name/AverageHelper/Gamgee/compare/v1.5.0...v1.6.0
[1.5.0]: https://git.average.name/AverageHelper/Gamgee/compare/v1.4.1...v1.5.0
[1.4.1]: https://git.average.name/AverageHelper/Gamgee/compare/v1.4.0...v1.4.1
[1.4.0]: https://git.average.name/AverageHelper/Gamgee/compare/v1.3.2...v1.4.0
[1.3.2]: https://git.average.name/AverageHelper/Gamgee/compare/v1.3.1...v1.3.2
[1.3.1]: https://git.average.name/AverageHelper/Gamgee/compare/v1.3.0...v1.3.1
[1.3.0]: https://git.average.name/AverageHelper/Gamgee/compare/v1.2.5...v1.3.0
[1.2.5]: https://git.average.name/AverageHelper/Gamgee/compare/v1.2.4...v1.2.5
[1.2.4]: https://git.average.name/AverageHelper/Gamgee/compare/v1.2.3...v1.2.4
[1.2.3]: https://git.average.name/AverageHelper/Gamgee/compare/v1.2.2...v1.2.3
[1.2.2]: https://git.average.name/AverageHelper/Gamgee/compare/v1.2.1...v1.2.2
[1.2.1]: https://git.average.name/AverageHelper/Gamgee/compare/v1.2.0...v1.2.1
[1.2.0]: https://git.average.name/AverageHelper/Gamgee/compare/v1.1.0...v1.2.0
[1.1.0]: https://git.average.name/AverageHelper/Gamgee/compare/v1.0.0...v1.1.0
[1.0.0]: https://git.average.name/AverageHelper/Gamgee/compare/v1.0.0-beta.8...v1.0.0
[1.0.0-beta.8]: https://git.average.name/AverageHelper/Gamgee/compare/v1.0.0-beta.7...v1.0.0-beta.8
[1.0.0-beta.7]: https://git.average.name/AverageHelper/Gamgee/compare/v1.0.0-beta.6...v1.0.0-beta.7
[1.0.0-beta.6]: https://git.average.name/AverageHelper/Gamgee/compare/v1.0.0-beta.3...v1.0.0-beta.6
[1.0.0-beta.3]: https://git.average.name/AverageHelper/Gamgee/compare/v1.0.0-beta.2...v1.0.0-beta.3
[1.0.0-beta.2]: https://git.average.name/AverageHelper/Gamgee/compare/v1.0.0-beta.1...v1.0.0-beta.2
[1.0.0-beta.1]: https://git.average.name/AverageHelper/Gamgee/compare/v1.0.0-alpha.9...v1.0.0-beta.1
[1.0.0-alpha.9]: https://git.average.name/AverageHelper/Gamgee/compare/v1.0.0-alpha.8...v1.0.0-alpha.9
[1.0.0-alpha.8]: https://git.average.name/AverageHelper/Gamgee/compare/v1.0.0-alpha.7...v1.0.0-alpha.8
[1.0.0-alpha.7]: https://git.average.name/AverageHelper/Gamgee/compare/v1.0.0-alpha.6...v1.0.0-alpha.7
[1.0.0-alpha.6]: https://git.average.name/AverageHelper/Gamgee/compare/v1.0.0-alpha.5...v1.0.0-alpha.6
[1.0.0-alpha.5]: https://git.average.name/AverageHelper/Gamgee/compare/v1.0.0-alpha.4...v1.0.0-alpha.5
[1.0.0-alpha.4]: https://git.average.name/AverageHelper/Gamgee/compare/v1.0.0-alpha.3...v1.0.0-alpha.4
[1.0.0-alpha.3]: https://git.average.name/AverageHelper/Gamgee/compare/v0.0.0...v1.0.0-alpha.3
[0.0.0]: https://git.average.name/AverageHelper/Gamgee/releases/tag/v0.0.0
