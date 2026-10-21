const path = require("node:path"),
  os = require("node:os");
process.chdir(path.resolve(__dirname, "../.."));
let pw;
try {
  pw = require("playwright");
} catch {
  pw = require(
    path.join(
      os.homedir(),
      ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
    ),
  );
}
const { chromium } = pw;
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.platform === "darwin"
      ? {
          executablePath:
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        }
      : {}),
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:8766/Scentalka%20Prototype.html");
  await page.waitForFunction(() => window.Prototype?.state());
  await page.evaluate(() =>
    Prototype.command("I'll bring it to you now.", "npc", "Sarah"),
  );
  await page.keyboard.press("Alt+1");
  await page.waitForTimeout(300);
  await page.screenshot({
    path: "原型/verification/home-preview.png",
    animations: "disabled",
  });
  await page.keyboard.press("Alt+3");
  assert.match(
    await page.locator("#chat-heading").innerText(),
    /Your assistant/,
  );
  await page.locator("#command-input").fill("my private help draft");
  await page.keyboard.press("Alt+2");
  await page.locator("#command-input").fill("my message to Sarah");
  await page.locator('[data-contact="Mia"]').click();
  assert.equal(await page.locator("#command-input").inputValue(), "");
  await page.locator('[data-contact="Sarah"]').click();
  assert.equal(
    await page.locator("#command-input").inputValue(),
    "my message to Sarah",
  );
  await page.keyboard.press("Alt+3");
  assert.equal(
    await page.locator("#command-input").inputValue(),
    "my private help draft",
  );
  // A new copy must never replace the previous story.
  await page.locator("#open-review").click();
  await page.locator("#reset-fixture").click();
  await page
    .getByRole("button", { name: "Create a new copy", exact: true })
    .click();
  assert.equal(await page.evaluate(() => Prototype.state().time), 420);
  await page.locator("#open-review").click();
  assert.equal(await page.locator('[data-fixture*="-copy-"]').count(), 1);
  await page.locator('[data-fixture="home"]').click();
  assert.equal(await page.evaluate(() => Prototype.state().time), 421);
  // Denied microphone access must keep text available and not move world time.
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException("Denied", "NotAllowedError"));
  });
  await page.locator("#mic-button").click();
  await page.waitForTimeout(100);
  assert.match(
    await page.locator("#toast").innerText(),
    /Microphone unavailable/,
  );
  assert.equal(await page.evaluate(() => Prototype.state().time), 421);
  console.log(
    "PASS independent context drafts, assistant identity, non-destructive new copy, denied mic fallback",
  );
  await page.evaluate(() => Prototype.reset("road"));
  await page.evaluate(() => Prototype.command("Take the bus to the hospital."));
  await page.waitForFunction(() => Prototype.state().roadEvent);
  await page.locator('[data-contact="Ben"]').click();
  await page.locator("[data-open-message]").click();
  if (await page.locator("[data-transcript]").count())
    await page.locator("[data-transcript]").click();
  await page.keyboard.press("Alt+1");
  await page.waitForTimeout(250);
  await page.screenshot({
    path: "原型/verification/road-interruption.png",
    animations: "disabled",
  });
  await page.evaluate(() =>
    Prototype.command("Wait for the bus, but stop after ten minutes."),
  );
  await page.keyboard.press("Alt+3");
  assert.equal(
    await page.evaluate(() => Prototype.state().plan.status),
    "paused",
  );
  const paused = await page.evaluate(() => Prototype.state().time);
  await page.waitForTimeout(3400);
  assert.equal(await page.evaluate(() => Prototype.state().time), paused);
  console.log("PASS help pauses fast-forward");
  await page.evaluate(() => Prototype.reset("home"));
  await page.evaluate(() =>
    Prototype.command(
      "Please prepare the appointment documents.",
      "npc",
      "Sarah",
    ),
  );
  const due = await page.evaluate(() => Prototype.state().docDue);
  assert.equal(due, 431);
  await page.evaluate(() => Prototype.command("Wait for Sarah's documents."));
  await page.waitForFunction(() => Prototype.state().time === 431);
  assert.equal(
    await page.evaluate(() => Prototype.state().docUpdateKnown || false),
    false,
  );
  await page.keyboard.press("Alt+T");
  assert.match(
    await page.locator("#drawer").innerText(),
    /new update is waiting/,
  );
  await page.keyboard.press("Escape");
  await page.keyboard.press("Alt+I");
  assert.match(await page.locator("#drawer").innerText(), /Last known: Home/);
  console.log("PASS unread task-result boundary");
  await page.keyboard.press("Escape");
  await page.locator("#settings").click();
  await page.getByRole("button", { name: "World pace", exact: true }).click();
  await page.locator("#set-trip").fill("33");
  await page
    .getByRole("button", { name: "Preview changes", exact: true })
    .click();
  await page.screenshot({
    path: "原型/verification/settings-preview.png",
    animations: "disabled",
  });
  assert.deepEqual(errors, []);
  console.log("PASS no page errors in supplemental flows");
  await browser.close();
})();
