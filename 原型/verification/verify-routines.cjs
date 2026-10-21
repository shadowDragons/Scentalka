const assert = require("node:assert/strict");
const {
  chromium,
} = require("/Users/junbinzhong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:8766/Scentalka%20Prototype.html");
  await page.waitForFunction(() => window.Prototype?.state());
  const state = () => page.evaluate(() => Prototype.state()),
    cmd = (...a) => page.evaluate((a) => Prototype.command(...a), a),
    reset = (k = "home") => page.evaluate((k) => Prototype.reset(k), k);
  const button = (name) => page.getByRole("button", { name, exact: true }),
    close = () => page.keyboard.press("Escape");
  const edit = async (id) => {
    await cmd("Open daily routines.");
    await page.locator(`[data-edit-person="${id}"]`).click();
    await button("Daily routine").click();
  };
  await reset();
  await edit("Sarah");
  await page.locator("#routine-end-0").fill("08:00");
  await page.locator("#routine-add").click();
  await page.locator("#routine-start-1").fill("08:10");
  await page.locator("#routine-end-1").fill("09:00");
  await page.locator("#routine-area-1").selectOption("Kitchen");
  await page.locator("#routine-activity-1").fill("Preparing breakfast");
  await button("Preview routine").click();
  assert.match(await page.locator("#modal").innerText(), /Preparing breakfast/);
  await button("Save routine").click();
  assert.equal((await state()).npcs.Sarah.schedule.length, 2);
  await close();
  await page.reload();
  await page.waitForFunction(() => Prototype.state());
  assert.equal((await state()).npcs.Sarah.schedule[1].area, "Kitchen");
  await edit("Sarah");
  await page.locator("#routine-start-1").fill("07:50");
  await button("Preview routine").click();
  assert.match(await page.locator("#modal").innerText(), /must not overlap/);
  await button("Keep editing").click();
  await page.locator("#routine-start-1").fill("08:00");
  await button("Preview routine").click();
  assert.match(await page.locator("#modal").innerText(), /enough game time/);
  await close();
  await edit("Emma");
  await page.locator("#routine-start-0").fill("09:00");
  await button("Preview routine").click();
  assert.match(await page.locator("#modal").innerText(), /full opening window/);
  await close();
  await page.evaluate(() => {
    s.time = 485;
    s.scene = "Home";
    s.area = "Entrance";
    save();
    render();
  });
  await cmd("Where are you?", "npc", "Sarah");
  assert.equal((await state()).replyQueue.length, 1);
  assert.equal(
    (await state()).messages.Sarah.filter(
      (m) => m.from === "you" && m.text === "Where are you?",
    ).length,
    1,
  );
  await cmd("Wait for 30 minutes.");
  await page.waitForFunction(() => Prototype.state().plan?.status === "paused");
  assert.equal((await state()).time, 490);
  assert.equal((await state()).replyQueue.length, 0);
  assert.equal(
    (await state()).plan.steps.reduce((n, x) => n + x.minutes, 0),
    25,
  );
  assert.equal(
    (await state()).messages.Sarah.filter(
      (m) => m.from === "you" && m.text === "Where are you?",
    ).length,
    1,
  );
  assert.match(
    (await state()).messages.Sarah.at(-1).text,
    /Kitchen.*preparing breakfast/,
  );
  await cmd("Cancel the remaining plan.");
  await edit("Sarah");
  await page.screenshot({ path: "原型/verification/routines-1440.png" });
  await close();
  await reset("road");
  await page.evaluate(() => {
    s.time = 720;
    s.area = "Sidewalk";
    s.npcs.Nora.schedule = [
      {
        start: 700,
        end: 780,
        scene: "Road",
        area: "Sidewalk",
        activity: "Lunch errands",
        reply: true,
      },
    ];
    save();
    render();
  });
  await cmd("Open the public directory.");
  assert.equal(
    await page.locator('[data-directory-contact="Nora"]').count(),
    1,
  );
  await close();
  await cmd("Open Nora chat.");
  assert.match(await page.locator("#composer-target").innerText(), /NORA/);
  await cmd("Can we exchange contact details?", "npc", "Nora");
  assert.equal((await state()).contactPermissions.Nora, true);
  await reset();
  await cmd("Drink some water.");
  assert.equal((await state()).time, 420);
  await cmd("Go to the kitchen.");
  await cmd("Take the water bottle.");
  assert.equal((await state()).items.bottle, "you");
  for (let i = 0; i < 3; i++) await cmd("Drink some water.");
  assert.equal((await state()).objectState.bottle.remaining, 0);
  let t = (await state()).time;
  await cmd("Drink some water.");
  assert.equal((await state()).time, t);
  await cmd("Go to the living room.");
  t = (await state()).time;
  await cmd("Refill the water bottle.");
  assert.equal((await state()).time, t);
  await cmd("Take the snack.");
  await cmd("Eat the snack.");
  assert.equal((await state()).items.snack, "consumed");
  t = (await state()).time;
  await cmd("Eat the snack.");
  await cmd("Take the snack.");
  assert.equal((await state()).time, t);
  await cmd("Go to the kitchen.");
  await cmd("Refill the water bottle.");
  assert.equal((await state()).objectState.bottle.remaining, 3);
  t = (await state()).time;
  await cmd("Refill the water bottle.");
  assert.equal((await state()).time, t);
  await cmd("Put the water bottle on the kitchen shelf.");
  assert.equal((await state()).items.bottle, "kitchen shelf");
  await cmd("Take the water bottle.");
  assert.equal((await state()).items.bottle, "you");
  await cmd("Go to the entrance.");
  await cmd("Take my ID card.");
  await cmd("Drop my ID card.");
  assert.equal((await state()).groundItems.id.area, "Entrance");
  await cmd("Go to the kitchen.");
  t = (await state()).time;
  await cmd("Take my ID card.");
  assert.equal((await state()).items.id, "ground");
  assert.equal((await state()).time, t);
  await page.reload();
  await page.waitForFunction(() => Prototype.state());
  assert.equal((await state()).groundItems.id.area, "Entrance");
  await cmd("Go to the entrance.");
  await cmd("Take my ID card.");
  assert.equal((await state()).items.id, "you");
  assert.equal((await state()).groundItems.id, undefined);
  await cmd("Open everyday objects.");
  await page.screenshot({ path: "原型/verification/objects-1440.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: "原型/verification/objects-390.png" });
  assert.equal(
    await page
      .locator("body")
      .evaluate((d) => d.scrollWidth > d.clientWidth + 1),
    false,
  );
  await close();
  await reset("hospital");
  await page.evaluate(() => {
    s.scene = "Hospital";
    s.area = "Reception";
    s.items.id = "you";
    save();
    render();
  });
  await cmd("Please book an appointment at 09:00 today.", "npc", "Emma");
  await cmd("Drop my ID card.");
  await cmd("I'm here for my appointment. Here is my ID.", "npc", "Emma");
  assert.equal((await state()).registered, false);
  await cmd("Take my ID card.");
  await cmd("I'm here for my appointment. Here is my ID.", "npc", "Emma");
  assert.equal((await state()).registered, true);
  assert.deepEqual(errors, []);
  console.log(
    "PASS routine edit/reload, overlap/travel/service guards, queued reply checkpoint/no duplicate send, actual location, edited Nora availability, finite water/refill, single snack, drop/recover/ID checks, desktop/mobile",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
