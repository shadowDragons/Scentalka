const path = require("node:path");
const os = require("node:os");
process.chdir(path.resolve(__dirname, "../.."));
let playwright;
try {
  playwright = require("playwright");
} catch {
  playwright = require(
    path.join(
      os.homedir(),
      ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
    ),
  );
}
const { chromium } = playwright;
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
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://localhost:8766/Scentalka%20Prototype.html");
    await page.waitForSelector("#setup-next");
    assert.equal(await page.locator("#modal").evaluate((el) => el.open), true);

    await page.locator("#setup-next").click();
    await page.locator('input[name="setup-scene"][value="Road"]').check();
    await page.locator("#setup-next").click();
    await page.locator("#setup-name").fill("Alex");
    await page.locator("#setup-occupation").fill("Teacher");
    await page.locator("#setup-goal").fill("Know my neighborhood better.");
    await page.locator("#setup-next").click();
    await page.locator("details.setup-npc").first().locator("summary").click();
    await page.locator("#setup-npc-Sarah-name").fill("Sam");
    await page.locator("#setup-next").click();

    const state = await page.evaluate(() => Prototype.state());
    assert.equal(state.settings.name, "Alex");
    assert.equal(state.profile.occupation, "Teacher");
    assert.equal(state.profile.goal, "Know my neighborhood better.");
    assert.equal(state.npcs.Sarah.name, "Sam");
    assert.equal(state.scene, "Road");
    assert.equal(state.area, "Bus Stop");
    assert.equal(state.time, 480);
    assert.equal(state.setupComplete, true);
    assert.equal(state.appointment, null);
    assert.equal(state.tasks.hospital, "none");

    const base = "http://localhost:8766/Scentalka%20Prototype.html";
    const guide = page.locator("#inline-guide");
    assert.equal(await page.locator("#modal").evaluate((el) => el.open), false);
    assert.match(await guide.innerText(), /Start with your world/);
    const progress = () => page.locator(".inline-guide-progress").getAttribute("aria-label");
    const noOverlap = async () => {
      await page.waitForTimeout(80);
      const geometry = await page.evaluate(() => {
        const target = document.querySelector(".inline-guide-target").getBoundingClientRect();
        const card = document.getElementById("inline-guide").getBoundingClientRect();
        return { card: card.toJSON(), target: target.toJSON(), viewport: [innerWidth,innerHeight], inside: card.left >= 0 && card.right <= innerWidth && card.top >= 0 && card.bottom <= innerHeight,
          separate: card.right <= target.left || card.left >= target.right || card.bottom <= target.top || card.top >= target.bottom,
          overflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert.equal(geometry.inside, true, `guide remains in viewport: ${JSON.stringify(geometry)}`);
      assert.equal(geometry.separate, true, "guide does not cover target");
      assert.equal(geometry.overflow, false, "no page overflow");
    };
    // Exercise the real input, not a slideshow or synthetic Next-only tour.
    await page.locator('[data-mode="world"]').click();
    assert.equal(await progress(), "Step 2 of 7");
    assert.equal(await page.locator(".inline-guide-next").isEnabled(), false);
    await page.locator("#command-input").fill("Look around.");
    assert.equal(await progress(), "Step 2 of 7", "typing does not dismiss the hint");
    assert.equal(await page.locator("#command-input").inputValue(), "Look around.");
    await noOverlap();
    await page.screenshot({ path: "原型/verification/page-guide-desktop.png" });
    await page.locator(".inline-guide-next").click();
    assert.equal(await progress(), "Step 3 of 7");
    await page.locator("#command-input").fill("");
    await page.locator("#send-button").click();
    assert.equal(await progress(), "Step 3 of 7", "invalid submission does not advance");
    await page.locator("#command-input").fill("Look around.");
    await page.locator("#command-input").press("Enter");
    assert.equal(await progress(), "Step 4 of 7");
    assert.equal(await page.locator("#feedback-label").innerText(), "AROUND YOU");
    assert.equal(await page.evaluate(() => Prototype.state().time), 480);
    await page.locator(".inline-guide-next").click();
    await page.locator("[data-contact]").first().click();
    assert.equal(await progress(), "Step 6 of 7");
    await page.locator('[data-mode="assistant"]').click();
    assert.equal(await progress(), "Step 7 of 7");
    await page.locator("#try-flow").click();
    assert.equal(await guide.count(), 0);
    assert.equal(await page.locator("#modal").evaluate((el) => el.open), true);
    await page.keyboard.press("Escape");

    // Replay in a narrow viewport and preserve unsent drafts.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-mode="world"]').click();
    await page.locator("#command-input").fill("My existing draft.");
    await page.locator("#guide-button").click();
    await noOverlap();
    await page.locator('[data-mode="world"]').click();
    assert.equal(await page.locator("#command-input").inputValue(), "My existing draft.");
    await noOverlap();
    await page.screenshot({ path: "原型/verification/page-guide-mobile.png" });
    await page.setViewportSize({ width: 390, height: 560 });
    await noOverlap();
    await page.setViewportSize({ width: 390, height: 844 });
    for (let i = 0; i < 5; i += 1) {
      await page.locator(".inline-guide-next").click();
      await noOverlap();
    }
    await page.locator(".inline-guide-next").click();
    assert.equal(await guide.count(), 0);
    await page.locator("#guide-button").click();
    await page.keyboard.press("Escape");
    assert.equal(await guide.count(), 0);

    await page.goto(base);
    await page.waitForFunction(() => Prototype.state()?.setupComplete);
    assert.equal(await page.locator("#modal").evaluate((el) => el.open), false);
    assert.equal(await guide.count(), 0);
    await page.goto(`${base}?tour=1`);
    await guide.waitFor();
    assert.match(await guide.innerText(), /Start with your world/);
    await page.locator(".inline-guide-setup").click();
    assert.match(await page.locator("#modal-content").innerText(), /FIRST-TIME SETUP/);
    assert.equal(await guide.count(), 0);
    await page.locator("[data-guide-close]").click();
    await page.goto(`${base}?setup=1`);
    await page.waitForSelector("#setup-next");
    assert.equal(await page.locator("#modal").evaluate((el) => el.open), true);
    assert.equal(await page.evaluate(() => Prototype.state().settings.name), "Alex");
    assert.equal(await page.evaluate(() => Prototype.state().scene), "Road");
    assert.deepEqual(errors, []);
    console.log("PASS setup, live page guide, actual actions, validation, keyboard submission, draft protection, replay, desktop/mobile positioning and persistence");
    await context.close();
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
