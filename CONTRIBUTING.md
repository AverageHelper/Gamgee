<!-- Adapted from https://github.com/PurpleBooth/a-good-readme-template/blob/main/CONTRIBUTING.md -->

# Contributing

## Translations

Our app currently only makes sense in United States English. We're
tooled to support any language and locale, if only we have translations
set up and installed.

The [English strings file](/src/locales/en-US.json) defines the keys
the app needs translated.

To update an existing translation:

1. Start a fork as you would normally do when contributing to a project
   on GitHub.
2. Find the relevant strings file.
3. Start translating! Test your work using `npm start`.
4. Create a Pull Request as described [below](#pull-requests).

To create a translation for a language which we don't yet support:

1. Start a fork as you would normally do when contributing to a project
   on GitHub.
2. Create a new file of the same format.
3. Reference your new strings file in the [i18n index file](/src/i18n.ts).
4. Start translating! Test your work using `npm start`.
5. Create a Pull Request as described [below](#pull-requests).

## Issues

[Issues](https://github.com/AverageHelper/Gamgee/issues/new/choose) are very valuable to this project.

- Ideas are a valuable source of contributions others can make
- Problems show where this project is lacking
- With a question you show where contributors can improve the user
  experience

Thank you for creating them.

## Pull Requests

Pull requests are a great way to get your ideas into this repository.

When deciding if I merge a pull request I look at the following
things:

### Does it state intent?

You should be clear which problem you're trying to solve with your
contribution.

For example:

> Add link to code of conduct in README.md

Doesn't tell me anything about why you're doing that

> Add link to code of conduct in README.md because users don't always
> look in the CONTRIBUTING.md

Tells me the problem that you have found, and the pull request shows me
the action you have taken to solve it.

### Is it of good quality?

- There are no spelling mistakes
- It reads well
- For English contributions: Has a good score on
  [Grammarly](https://www.grammarly.com) or [Hemingway
  App](https://hemingwayapp.com)

### Does it move this repository closer to my vision for the project?

The aim of this project is:

- To provide a simple interface for participants in a music-sharing event to share music they enjoy with a DJ
- Usable by someone who is familiar with Discord and Discord bots
- Fosters a culture of respect and gratitude in the open source space

### Does it follow the contributor covenant?

This repository has a [code of conduct](/CODE_OF_CONDUCT.md), I will
remove things that do not respect it.
