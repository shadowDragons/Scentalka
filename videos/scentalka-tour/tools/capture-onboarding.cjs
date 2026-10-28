const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs");
let playwright;
try {
  playwright = require("playwright");
} catch {
  playwright = require(path.join(os.homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));
}
const { chromium } = playwright;

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.platform === "darwin" ? { executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" } : {}),
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const output = path.resolve("assets/screens");
  fs.mkdirSync(output, { recursive: true });
  await page.goto("http://127.0.0.1:8766/Scentalka%20Prototype.html");
  await page.waitForSelector("#setup-next");
  const save = (name) => page.screenshot({ path: path.join(output, name), animations: "disabled" });
  await save("onboarding-intro.png");
  await page.locator("#setup-next").click();
  await save("onboarding-scene-choice.png");
  await page.locator('input[name="setup-scene"][value="Home"]').check();
  await page.locator("#setup-next").click();
  await save("onboarding-profile.png");
  await page.locator("#setup-next").click();
  await save("onboarding-npcs.png");
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
