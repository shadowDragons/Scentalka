const path = require("node:path"),
  os = require("node:os"),
  assert = require("node:assert/strict");
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
(async () => {
  const browser = await pw.chromium.launch({
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
  const state = () => page.evaluate(() => Prototype.state());
  async function example() {
    const before = await state();
    const count = Object.values(before.messages).flat().length;
    await page.locator('[data-flow-example="0"]').click();
    assert.equal((await state()).time, before.time);
    assert.equal(Object.values((await state()).messages).flat().length, count);
    assert.ok(await page.locator("#command-input").inputValue());
    await page.locator("#command-input").press("Enter");
  }
  async function choose(k) {
    await page.keyboard.press("Alt+f");
    await page.locator(`[data-choose-flow="${k}"]`).click();
  }
  // Use only the visible next-example controls and Enter, no engine command helpers.
  for (let i = 0; i < 8 && (await state()).items.key !== "Sarah"; i++)
    await example();
  assert.equal((await state()).items.key, "Sarah");
  assert.equal((await state()).time, 424);
  console.log(
    "PASS next-example family flow; preparing a draft sends nothing and takes no time",
  );
  // Continue this exact world into the hospital; no reset or independent save.
  await choose("hospital");
  for (let i = 0; i < 22 && !(await state()).consulted; i++) {
    await example();
    if ((await state()).plan?.status === "running")
      await page.waitForFunction(
        () =>
          !Prototype.state().plan ||
          Prototype.state().plan.status !== "running",
      );
  }
  assert.equal((await state()).appointment.status, "Completed");
  assert.equal((await state()).items.key, "Sarah");
  assert.equal((await state()).time, 556);
  console.log(
    "PASS same-world home → road → hospital flow through booking, ID, check-in, call and consultation",
  );
  await page.waitForTimeout(400);
  await page.screenshot({
    path: "原型/verification/flow-hospital.png",
    animations: "disabled",
  });
  // Draft replacement is explicit and cancellation retains the user's draft.
  await page.keyboard.press("Alt+1");
  await page.locator("#command-input").fill("Keep my unfinished thought.");
  await page.locator('[data-flow-example="0"]').click();
  assert.match(
    await page.locator("#modal").innerText(),
    /Keep your current draft/,
  );
  await page
    .getByRole("button", { name: "Keep my draft", exact: true })
    .click();
  assert.equal(
    await page.locator("#command-input").inputValue(),
    "Keep my unfinished thought.",
  );
  console.log("PASS unsent draft protection");
  await page.evaluate(() => Prototype.reset("home"));
  await page.keyboard.press("Alt+1");
  await page.locator("#command-input").fill("Go outside.");
  await page.locator("#command-input").press("Enter");
  await page.waitForFunction(() => Prototype.state().scene === "Road");
  assert.equal((await state()).time, 430);
  await page.locator("#command-input").fill("Go home.");
  await page.locator("#command-input").press("Enter");
  await page.waitForFunction(() => Prototype.state().scene === "Home");
  assert.equal((await state()).time, 440);
  console.log("PASS explicit Home ↔ Road travel before hospital opens");
  await page.locator("#command-input").fill("Wait for ten minutes.");
  await page.locator("#command-input").press("Enter");
  await page.waitForFunction(() => !Prototype.state().plan);
  assert.equal((await state()).time, 450);
  console.log("PASS spelled-out bounded wait");
  await page.evaluate(() => Prototype.reset("road"));
  await choose("road");
  await example();
  await page.waitForFunction(() => Prototype.state().roadEvent);
  await example();
  assert.equal((await state()).busDelayRead, true);
  await example();
  await page.waitForFunction(() => Prototype.state().time === 490);
  await page.keyboard.press("Escape");
  await example();
  assert.equal((await state()).appointment.status, "Booked");
  await example();
  await page.waitForFunction(() => Prototype.state().scene === "Hospital");
  assert.equal((await state()).time, 510);
  console.log(
    "PASS next-example delay, read, bounded wait, stop, cancel and walk flow",
  );
  await page.evaluate(() => Prototype.reset("home"));
  await page.waitForTimeout(250);
  await page.screenshot({
    path: "原型/verification/flow-home.png",
    animations: "disabled",
  });
  await page.keyboard.press("Alt+f");
  await page.screenshot({
    path: "原型/verification/flow-picker.png",
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 800 });
    await page.waitForTimeout(100);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.screenshot({
      path: `原型/verification/flow-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
  assert.deepEqual(errors, []);
  console.log("PASS responsive examples and no page errors");
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
