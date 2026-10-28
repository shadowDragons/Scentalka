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
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:8766/Scentalka%20Prototype.html?verify=1");
  await page.waitForFunction(() => Prototype.state());
  const state = () => page.evaluate(() => Prototype.state()),
    cmd = (...args) =>
      page.evaluate((args) => Prototype.command(...args), args),
    reset = (k) => page.evaluate((k) => Prototype.reset(k), k);
  await reset("road");
  await cmd("Go to the sidewalk.");
  assert.equal((await state()).area, "Sidewalk");
  await cmd("Can we exchange contact details?", "npc", "Nora");
  assert.equal((await state()).contactPermissions.Nora, true);
  await cmd("Go to the bus stop.");
  await cmd("Hello.", "npc", "Nora");
  assert.equal((await state()).messages.Nora.at(-1).from, "npc");
  await reset("road");
  await cmd("Hello.", "npc", "Nora");
  assert.equal((await state()).messages.Nora.length, 0);
  assert.match((await state()).feedback, /temporary/);
  await reset("hospital");
  await cmd("Please book an appointment at 10:00 today.", "npc", "Emma");
  assert.equal((await state()).appointment, null);
  await cmd("Please book an appointment at 09:30 today.", "npc", "Emma");
  assert.equal((await state()).appointment.time, 570);
  await cmd("Please reschedule my appointment to 11:00 today.", "npc", "Emma");
  assert.equal((await state()).appointment.time, 660);
  assert.equal((await state()).bookingsHistory[0].time, 570);
  await cmd("Please reschedule my appointment to 11:00 today.", "npc", "Emma");
  assert.equal((await state()).time, 482);
  await page.locator("#world-desk").click();
  await page.locator('[data-desk="schedule"]').click();
  await page.locator("#desk-hours").click();
  await page.locator("#desk-close").fill("10:00");
  await page
    .getByRole("button", { name: "Preview hours", exact: true })
    .click();
  assert.match(await page.locator("#modal").innerText(), /at least four/);
  await page.keyboard.press("Escape");
  await reset("home");
  await cmd("Please prepare the appointment documents.", "npc", "Sarah");
  await cmd("Wait for Sarah's documents.");
  await page.waitForFunction(() => !Prototype.state().plan);
  await cmd("Go to the entrance.");
  assert.equal((await state()).docUpdateKnown, true);
  await cmd("Take the document folder.");
  assert.equal((await state()).items.folder, "you");
  assert.equal((await state()).tasks.documents, "completed");
  await cmd("Put the document folder on the tray.");
  assert.equal((await state()).items.folder, "tray");
  await cmd("Open recovery demo.");
  await page.locator("#request-failure").selectOption("reply");
  await page.locator("#arm-failure").click();
  await cmd("Take my ID card.");
  const time = (await state()).time;
  assert.equal((await state()).items.id, "you");
  await cmd("Open recovery demo.");
  await page
    .getByRole("button", { name: "Retry reply only", exact: true })
    .click();
  assert.equal((await state()).time, time);
  assert.equal((await state()).items.id, "you");
  await page.keyboard.press("Escape");
  await cmd("Open world desk.");
  await page.locator('[data-desk="new"]').click();
  await page.locator("#new-name").fill("Taylor");
  await page.locator("#new-home-role").fill("Resident");
  await page
    .getByRole("button", { name: "Start with these details", exact: true })
    .click();
  assert.equal((await state()).settings.name, "Taylor");
  assert.equal((await state()).roles.Home, "Resident");
  assert.equal((await state()).time, 420);
  // An available successor inherits duties, never the predecessor's messages or private memories.
  await page.locator("#world-desk").click();
  await page.locator('[data-desk="people"]').click();
  await page.getByRole("button", { name: "Add a person", exact: true }).click();
  await page.locator("#desk-name").fill("Robin");
  await page.locator("#desk-scene").selectOption("Hospital");
  await page.locator("#desk-area").selectOption("Reception");
  await page
    .getByRole("button", { name: "Preview person", exact: true })
    .click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  let robin = Object.keys((await state()).npcs).find((k) =>
    k.startsWith("person-"),
  );
  await page.locator('[data-desk="people"]').click();
  await page.locator('[data-edit-person="Emma"]').click();
  await page
    .getByRole("button", { name: "Archive / replace", exact: true })
    .click();
  await page.locator("#desk-successor").selectOption(robin);
  await page
    .getByRole("button", { name: "Preview handover", exact: true })
    .click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  assert.equal((await state()).npcs.Emma.archived, true);
  assert.equal((await state()).npcs[robin].service, "Emma");
  assert.equal((await state()).messages[robin].length, 0);
  await page.keyboard.press("Escape");
  await page.evaluate(() => {
    s.time = 480;
    save();
    render();
  });
  await cmd("Please book an appointment at 09:30 today.", "npc", robin);
  assert.equal((await state()).appointment.time, 570);
  assert.equal((await state()).messages[robin].at(-1).from, "npc");
  await cmd("Open world desk.");
  await page.locator('[data-desk="pharmacy"]').click();
  await page
    .getByRole("button", { name: "Open sample story", exact: true })
    .click();
  await cmd("Please collect my prescription.", "npc", "Leo");
  assert.equal((await state()).prescription.status, "Collected");
  assert.equal((await state()).items.practicePack, "you");
  const cost = (await state()).time;
  await cmd("Please collect my prescription.", "npc", "Leo");
  assert.equal((await state()).time, cost);
  await page.screenshot({ path: "原型/verification/pharmacy-verified.png" });
  await cmd("Open data management.");
  await page.locator("#desk-delete").click();
  await page.locator("#delete-confirm").fill("DELETE");
  const old = await page.evaluate(() => store.active);
  await page
    .getByRole("button", { name: "Permanently delete", exact: true })
    .click();
  assert.equal(await page.evaluate((k) => !!store.worlds[k], old), false);
  assert.notEqual(await page.evaluate(() => store.active), old);
  // Resting NPC message stays delivered until a game-time checkpoint in the next active shift.
  await reset("home");
  await page.evaluate(() => {
    s.time = 1380;
    save();
    render();
  });
  await cmd("How is your progress?", "npc", "Sarah");
  assert.equal((await state()).replyQueue.length, 1);
  await page.locator("#end-day").click();
  await page
    .getByRole("button", { name: "Begin tomorrow", exact: true })
    .click();
  assert.equal((await state()).replyQueue.length, 0);
  assert.equal(
    (await state()).messages.Sarah.filter((m) => m.from === "you").length,
    1,
  );
  await reset("home");
  await cmd("Open task board.");
  await page.locator('[data-task-detail="key"]').click();
  await page
    .getByRole("button", { name: "Edit request preset", exact: true })
    .click();
  await page.locator("#task-title").fill("Bring the family key");
  await page
    .getByRole("button", { name: "Review request wording", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save request preset", exact: true })
    .click();
  assert.equal((await state()).taskPresets.key.title, "Bring the family key");
  await page
    .getByRole("button", { name: "Back to tasks", exact: true })
    .click();
  assert.match(
    await page.locator("#modal").innerText(),
    /Bring the family key/,
  );
  await page.keyboard.press("Escape");
  await reset("home");
  await cmd("Open keyboard settings.");
  await page.locator('[data-binding="desk"]').fill("x");
  await page
    .getByRole("button", { name: "Save key bindings", exact: true })
    .click();
  await page.locator("#world-canvas").click();
  await page.keyboard.press("x");
  assert.equal(await page.locator("#modal").evaluate((d) => d.open), true);
  await page.keyboard.press("Escape");
  assert.deepEqual(errors, []);
  console.log(
    "PASS temporary/private contacts, slot conflicts/reschedule, service validation, item put/take, reply-only retry, new story, NPC succession without memory copy, prescription positive/duplicate guard, permanent deletion, queued shift reply, remapped key",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
