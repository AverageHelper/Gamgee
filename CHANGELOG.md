# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
- Nothing, yet!

## [1.6.6]
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

Dev note: If you use VS Code and the Prettier extension, you may need to reload your window after pulling this down, or else Prettier might not correctly apply its updated opinions.

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

In the future, we may set the default command permissions using new API constructs, and lean on Discord's UI to let guild admins configure command permissions as they see fit.

## [1.6.0] - 2022-05-17
After updating, be sure to run `npm ci && npm run build:clean && npm run migrate` before running the bot.

### Added
- Add a new limit for the minimum duration of a submission
- Special messaging when the queue is very nearly full

### Changed
- Make `/stats` output clearer
- Clearer message when Gamgee auto-closes an overfull queue
- Reorganize some code internally so we can better catch Slash Command edge cases

### Known Issues
- The command deployment script removes guild-level slash-commands. Working on a fix for that now. **As a workaround, avoid running `npm run setup` or `npm run commands:deploy` in this version.**

## [1.5.0] - 2022-04-23
This update adds a field to the database schema, and adds new commands. Remember to run `npm run setup` to migrate the database and update Discord's command index.

### Added
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
- Add @karcsesz to the README list of contributors
- Add proper [Code of Conduct](CODE_OF_CONDUCT.md) and [Contributing](CONTRIBUTING.md) docs
- More random things to say

### Changed
- Functional refactor: Trying to slim down on the spaghetti, I've refactored most of the core structures from object methods to free functions. [Data shouldn't have conceptual responsibilities over data.](https://youtu.be/QM1iUe6IofM) There's lots more cleanup work to be done, especially to organize these new functions in a sane way, but the preliminary work is done.
- Improved formatting of interaction counts
- Re-do how we parse Bandcamp links. (The [url-metadata](https://www.npmjs.com/package/url-metadata) package is not well-maintained, and contains some minor security vulnerabilities that GitHub _really_ wants me to fix. Since the package is quite small, I moved it in-house for now and patched it myself.)
- Update our compile target to native ESM syntax. (You _are_ running Node 16, _right?_ ;)
- Ditch an old database migrator that hasn't been relevant since before v1.0.0
- Clarified some documentation comments, especially in textResponses.ts

## [1.3.0] - 2022-02-27
### Added
Added a "Likes" counter to the request queue. Most users won't notice this, but DJs might.
- Every time a user runs `/now-playing` or its variants on a song that they didn't submit, the Likes counter increments.
- Subsequent invocations from the same user do not add to that counter

NOTE: You _should not_ have to run the migrator, since we only _added_ an optional field to the database here.

Coming soon: The ability to disable the Likes counter, for DJs who are concerned about it.

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
- Added a contributor to the README. (Thanks again, @ajnrules!)

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
### Changes
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

Please note:
- We're using a pre-release version of Discord.js in order to use its TypeScripted slash command structures. You may experience some subtle bugs.

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

## [Initial commit] - 2021-03-14
### Added
- Initial commit

[Unreleased]: https://github.com/AverageHelper/Gamgee/compare/v1.6.6...HEAD
[1.6.6]: https://github.com/AverageHelper/Gamgee/compare/v1.6.5...v1.6.6
[1.6.5]: https://github.com/AverageHelper/Gamgee/compare/v1.6.4...v1.6.5
[1.6.4]: https://github.com/AverageHelper/Gamgee/compare/v1.6.3...v1.6.4
[1.6.3]: https://github.com/AverageHelper/Gamgee/compare/v1.6.2...v1.6.3
[1.6.2]: https://github.com/AverageHelper/Gamgee/compare/v1.6.1...v1.6.2
[1.6.1]: https://github.com/AverageHelper/Gamgee/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/AverageHelper/Gamgee/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/AverageHelper/Gamgee/compare/v1.4.1...v1.5.0
[1.4.1]: https://github.com/AverageHelper/Gamgee/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/AverageHelper/Gamgee/compare/v1.3.2...v1.4.0
[1.3.2]: https://github.com/AverageHelper/Gamgee/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/AverageHelper/Gamgee/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/AverageHelper/Gamgee/compare/v1.2.5...v1.3.0
[1.2.5]: https://github.com/AverageHelper/Gamgee/compare/v1.2.4...v1.2.5
[1.2.4]: https://github.com/AverageHelper/Gamgee/compare/v1.2.3...v1.2.4
[1.2.3]: https://github.com/AverageHelper/Gamgee/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/AverageHelper/Gamgee/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/AverageHelper/Gamgee/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/AverageHelper/Gamgee/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/AverageHelper/Gamgee/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/AverageHelper/Gamgee/compare/v1.0.0-beta.8...v1.0.0
[1.0.0-beta.8]: https://github.com/AverageHelper/Gamgee/compare/v1.0.0-beta.7...v1.0.0-beta.8
[1.0.0-beta.7]: https://github.com/AverageHelper/Gamgee/compare/v1.0.0-beta.6...v1.0.0-beta.7
[1.0.0-beta.6]: https://github.com/AverageHelper/Gamgee/compare/v1.0.0-beta.3...v1.0.0-beta.6
[1.0.0-beta.3]: https://github.com/AverageHelper/Gamgee/compare/v1.0.0-beta.2...v1.0.0-beta.3
[1.0.0-beta.2]: https://github.com/AverageHelper/Gamgee/compare/v1.0.0-beta.1...v1.0.0-beta.2
[1.0.0-beta.1]: https://github.com/AverageHelper/Gamgee/compare/v1.0.0-alpha.9...v1.0.0-beta.1
[1.0.0-alpha.9]: https://github.com/AverageHelper/Gamgee/compare/v1.0.0-alpha.8...v1.0.0-alpha.9
[1.0.0-alpha.8]: https://github.com/AverageHelper/Gamgee/compare/v1.0.0-alpha.7...v1.0.0-alpha.8
[1.0.0-alpha.7]: https://github.com/AverageHelper/Gamgee/compare/v1.0.0-alpha.6...v1.0.0-alpha.7
[1.0.0-alpha.6]: https://github.com/AverageHelper/Gamgee/compare/v1.0.0-alpha.5...v1.0.0-alpha.6
[1.0.0-alpha.5]: https://github.com/AverageHelper/Gamgee/compare/v1.0.0-alpha.4...v1.0.0-alpha.5
[1.0.0-alpha.4]: https://github.com/AverageHelper/Gamgee/compare/v1.0.0-alpha.3...v1.0.0-alpha.4
[1.0.0-alpha.3]: https://github.com/AverageHelper/Gamgee/releases/tag/v1.0.0-alpha.3
[Initial commit]: https://github.com/AverageHelper/Gamgee/commit/ac2efa4ed2b3422b3c423e3a5527671193525b1e
