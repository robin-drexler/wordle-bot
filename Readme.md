# Wordle bot

A bot that plays [wordle](https://www.powerlanguage.co.uk/wordle/) in a Chrome browser.

https://user-images.githubusercontent.com/474248/149675322-3df54e90-b838-4a3b-bb35-56dee114db4e.mp4

## Quick start

```
npm install
npm run play
```

## Arguments

There are a few environment variables that can be set to change the behaviour of the bot.

### `START_WORD`

The word to start the wordle with.
Otherwise starts with `stare`.

### `DAYS`

The number of days to look back or forwards to play other wordles.

To play yesterday's wordle, run:

```
DAYS=-1 npm run play
```

### `RECORD_VIDEO`

If set to `1`, the bot will record a video of its attempt to try to solve the wordle.

Video will be saved to `./videos/`.

Alternatively, you can also run `npm run record`
