import { chromium } from "playwright";
import { suggestWord } from "./suggest-word.mjs";

async function wait(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

/**
 *
 * @param {import('playwright-core').Page} page
 */
async function getPositions(page) {
  let forbidden = await page
    .locator("#keyboard [data-state='absent']")
    .elementHandles();

  const absent = await Promise.all(
    forbidden.map((elementHandle) => elementHandle.getAttribute("data-key"))
  );

  const allRows = await page.locator("#board .row").elementHandles();

  const correct = new Map();
  const present = new Map();

  const rows = [];

  for (const row of allRows) {
    const tiles = await row.$$(".tile");

    for (const [tileIndex, tile] of tiles.entries()) {
      const letter = await (await tile.innerText()).toLowerCase();
      const state = await tile.getAttribute("data-state");

      if (state === "empty") {
        break;
      }

      if (state === "correct") {
        const toSet = correct.get(letter) || [];
        toSet.push(tileIndex);
        correct.set(letter, toSet);
      }
      if (state === "present") {
        const toSet = present.get(letter) || [];
        toSet.push(tileIndex);
        present.set(letter, toSet);
      }
    }
  }
  return {
    absent,
    present,
    correct,
  };
}

/**
 *
 * @param {import('playwright-core').Page} page
 */
async function runTries(page, suggestion = "", bannedWords = [], counter = 0) {
  const { absent, correct, present } = await getPositions(page);
  suggestion = suggestion || suggestWord(absent, correct, present, bannedWords);

  await enterWord(page, suggestion);
  const worked = await wordWorked(page);

  if (!worked) {
    await eraseCurrentWord(page);
    bannedWords.push(suggestion);
  } else {
    counter++;
  }
  const hasWon = await checkHasWon(page);
  console.log({ hasWon });

  // todo check if there's no more row to try instead of counting
  if (counter >= 5 || hasWon) {
    return;
  }

  return runTries(page, "", bannedWords, counter);
}

/**
 *
 * @param {import('playwright-core').Page} page
 */
async function enterWord(page, word) {
  await page.keyboard.type(word);
  await page.keyboard.press("Enter");
  await wait(3);
}

/**
 *
 * @param {import('playwright-core').Page} page
 */
async function eraseCurrentWord(page) {
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
}

/**
 *
 * @param {import('playwright-core').Page} page
 */
async function wordWorked(page) {
  const tiles = await page.locator("#board .tile").elementHandles();

  for (const tile of tiles) {
    const state = await tile.getAttribute("data-state");
    if (state === "tbd") {
      return false;
    }
  }

  return true;
}

async function checkHasWon(page) {
  const allRows = await page.locator("#board .row").elementHandles();

  for (const row of allRows) {
    let allCorrect = true;
    const tiles = await row.$$(".tile");

    for (const tile of tiles) {
      const letter = await (await tile.innerText()).toLowerCase();
      const state = await tile.getAttribute("data-state");

      if (state !== "correct") {
        allCorrect = false;
        break;
      }
    }

    if (allCorrect) {
      return true;
    }
  }

  return false;
}

async function main() {
  console.log("GO");
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext(
    process.env.RECORD_VIDEO ? { recordVideo: { dir: "videos/" } } : {}
  );

  const page = await context.newPage();
  console.log("PAGE");

  await page.goto("https://www.powerlanguage.co.uk/wordle/");
  await page.locator(".close-icon").click();

  // todo plan for the game not being won
  await runTries(page, "woods");

  if (process.env.RECORD_VIDEO) {
    await context.close();
    await browser.close();
  }
}

main();
