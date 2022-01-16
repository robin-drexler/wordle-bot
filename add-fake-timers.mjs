import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { findUp } from "find-up";

// @ts-ignore
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 *
 * @param {import('playwright-core').Page} page
 * @param {number} time
 */
export async function addFakeTimers(page, time) {
  const nodeModules = await findUp("node_modules", {
    cwd: __dirname,
    type: "directory",
  });
  console.log(resolve(nodeModules, "sinon", "pkg", "sinon.js"));

  await page.addInitScript({
    path: resolve(nodeModules, "sinon", "pkg", "sinon.js"),
  });

  await page.addInitScript((time) => {
    // @ts-ignore
    window.__clock = sinon.useFakeTimers(time);
  }, time);

  return async function afterLoad() {
    await page.evaluate(() => {
      // @ts-ignore
      window.__clock.tick(1000);
      // @ts-ignore
      window.__clock.restore();
    });
  };
}
