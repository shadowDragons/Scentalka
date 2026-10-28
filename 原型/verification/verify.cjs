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
  const b = await chromium.launch({
    headless: true,
    ...(process.platform === "darwin"
      ? {
          executablePath:
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        }
      : {}),
  });
  const page = await b.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:8766/Scentalka%20Prototype.html?verify=1");
  await page.waitForFunction(() => window.Prototype?.state());
  const state = () => page.evaluate(() => Prototype.state());
  const reset = (key) => page.evaluate((k) => Prototype.reset(k), key);
  async function cmd(text, mode = "world", who) {
    if (who) await page.locator(`[data-contact="${who}"]`).click();
    await page.keyboard.press(
      mode === "world" ? "Alt+1" : mode === "npc" ? "Alt+2" : "Alt+3",
    );
    await page.locator("#command-input").fill(text);
    await page.locator("#command-input").press("Enter");
  }
  await reset("home");
  await cmd("Do you need the house key this morning?", "npc");
  assert.equal((await state()).time, 420);
  await cmd("I'll bring it to you now.", "npc");
  assert.equal((await state()).time, 421);
  await cmd("Go to the entrance.");
  assert.equal((await state()).time, 422);
  await cmd("Take the house key from the tray.");
  assert.equal((await state()).time, 423);
  await cmd("Give the house key to Sarah.");
  assert.equal((await state()).time, 424);
  assert.equal((await state()).items.key, "Sarah");
  await cmd("Give the house key to Sarah.");
  assert.equal((await state()).time, 424);
  await cmd("你好");
  assert.equal((await state()).time, 424);
  await page.locator('[data-panel="pocket"]').click();
  assert.match(await page.locator("#drawer").innerText(), /With Sarah/);
  await page.waitForTimeout(250);
  await page.screenshot({
    animations: "disabled",
    path: "原型/verification/home-complete.png",
  });
  await page.keyboard.press("Escape");
  await page.reload();
  await page.waitForFunction(() => window.Prototype?.state());
  assert.equal((await state()).items.key, "Sarah");
  console.log(
    "PASS home flow, duplicate prevention, English validation, persistence",
  );
  await reset("hospital");
  await cmd("Open the hospital directory and Emma's chat.");
  assert.equal((await state()).time, 480);
  await cmd("Do you have an appointment at nine o'clock today?", "npc");
  assert.equal((await state()).time, 480);
  await cmd("Yes, please book that time for me.", "npc");
  assert.equal((await state()).time, 481);
  assert.equal((await state()).appointment.time, 540);
  await cmd("Take my ID card and go to the hospital.");
  await page.waitForFunction(() => Prototype.state().scene === "Hospital");
  assert.equal((await state()).time, 512);
  assert.equal((await state()).items.id, "you");
  await cmd("I'm here for my nine o'clock appointment. Here is my ID.", "npc");
  assert.equal((await state()).time, 513);
  assert.equal((await state()).registered, true);
  await cmd("Wait until I'm called.");
  await page.waitForFunction(() => Prototype.state().called);
  assert.equal((await state()).time, 540);
  assert.equal((await state()).callRead, false);
  await cmd("What is in the unread message?", "assistant");
  assert.equal((await state()).callRead, false);
  assert.equal((await state()).time, 540);
  await page.locator('[data-contact="Grace"]').click();
  const open = page.locator("[data-open-message]");
  if (await open.count()) await open.first().click();
  const transcript = page.locator("[data-transcript]");
  if (await transcript.count()) await transcript.last().click();
  assert.equal((await state()).callRead, true);
  await cmd("Go to the consultation room.");
  assert.equal((await state()).time, 541);
  await cmd(
    "I have been feeling uncomfortable since yesterday.",
    "npc",
    "Daniel",
  );
  assert.equal((await state()).time, 541);
  await cmd("Thank you, that's all for now.", "npc");
  assert.equal((await state()).time, 556);
  assert.equal((await state()).appointment.status, "Completed");
  await page.waitForTimeout(250);
  await page.screenshot({
    animations: "disabled",
    path: "原型/verification/hospital-complete.png",
  });
  console.log(
    "PASS hospital booking, ID check-in, unread knowledge boundary, consultation single budget",
  );
  await reset("road");
  await cmd("Take the bus to the hospital.");
  await page.waitForFunction(() => Prototype.state().roadEvent);
  assert.equal((await state()).time, 485);
  assert.equal((await state()).busDelayRead, false);
  await cmd("Explain the delay.", "assistant");
  assert.equal((await state()).busDelayRead, false);
  assert.match(
    await page.locator("#chat-scroll").innerText(),
    /haven’t opened/,
  );
  await page.locator('[data-contact="Ben"]').click();
  await page.locator("[data-open-message]").first().click();
  if (await page.locator("[data-transcript]").count())
    await page.locator("[data-transcript]").last().click();
  assert.equal((await state()).busDelayRead, true);
  await cmd("Wait for the bus, but stop after ten minutes.");
  await page.waitForFunction(() => Prototype.state().time === 490);
  await page.keyboard.press("Escape");
  assert.equal((await state()).plan.status, "paused");
  assert.equal((await state()).time, 490);
  await cmd("Cancel the remaining plan.");
  assert.equal((await state()).appointment.status, "Booked");
  await cmd("Walk to the hospital instead.");
  await page.waitForFunction(() => Prototype.state().scene === "Hospital");
  assert.equal((await state()).time, 510);
  assert.equal((await state()).appointment.time, 540);
  await page.waitForTimeout(250);
  await page.screenshot({
    animations: "disabled",
    path: "原型/verification/road-complete.png",
  });
  console.log(
    "PASS sourced interruption, stop at checkpoint, cancel preserves booking, walk alternative",
  );
  await reset("home");
  await cmd("Go to the entrance.");
  await cmd("Give the house key to Sarah.");
  assert.equal((await state()).items.key, "tray");
  assert.equal((await state()).time, 421);
  await page.locator("#settings").click();
  await page.locator("#set-name").fill("Alex");
  await page.getByRole("button", { name: "Preview changes" }).click();
  assert.match(
    await page.locator("#settings-preview").innerText(),
    /validation passed/,
  );
  await page.locator("#save-settings").click();
  assert.equal((await state()).settings.name, "Alex");
  await page.locator("#settings").click();
  await page.getByRole("button", { name: "World pace", exact: true }).click();
  await page.locator("#set-trip").fill("16");
  await page.getByRole("button", { name: "Preview changes" }).click();
  assert.match(
    await page.locator("#settings-preview").innerText(),
    /choose 15–60/,
  );
  assert.equal(await page.locator("#save-settings").count(), 0);
  await page.keyboard.press("Escape");
  await page.locator("#role-button").click();
  await page.locator("#visit-role").selectOption("Partner");
  await page.getByRole("button", { name: "Confirm visit role" }).click();
  assert.equal((await state()).roles.Home, "Partner");
  console.log(
    "PASS failed action no time loss, settings preview/validation, visit role",
  );
  await reset("home");
  await page.waitForTimeout(250);
  await page.screenshot({
    animations: "disabled",
    path: "原型/verification/home-1440.png",
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(250);
  await page.screenshot({
    animations: "disabled",
    path: "原型/verification/home-1280.png",
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  await page.screenshot({
    animations: "disabled",
    path: "原型/verification/home-390.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  assert.deepEqual(errors, []);
  console.log("PASS viewport checks and no page errors");
  await b.close();
})();
