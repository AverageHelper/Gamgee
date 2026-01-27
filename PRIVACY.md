# Privacy

This document describes how Gmagee handles user data. This document may be updated periodically. To be notified proactively about updates to this document, you may subscribe to this file's commit feed at <https://git.average.name/AverageHelper/Gamgee/rss/branch/main/PRIVACY.md> using an RSS reader.

## What is stored, and how

Every user interaction that the bot can see is logged. By default, Gamgee records logs to both the standard output and to a local file at `<working directory>/logs`. The stored logs are only kept locally on the machine running the bot, and Gamgee automatically deletes logs older than 90 days.

Gamgee does not intentionally store personally-identifying information, except that which is sent to the bot in user-generated messages. Gamgee does not interpret or transform this data except to manage the music queue.
