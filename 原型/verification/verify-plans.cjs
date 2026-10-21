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
  const state = () => page.evaluate(() => Prototype.state());
  const cmd = (...a) => page.evaluate((a) => Prototype.command(...a), a);
  const reset = (k = "home") => page.evaluate((k) => Prototype.reset(k), k);
  const button = (name) => page.getByRole("button", { name, exact: true });
  const close = () => page.keyboard.press("Escape");
  async function setFixture(fn) {
    await close();
    await page.evaluate(fn);
  }
  // The actual composer previews compound instructions; preview does not act.
  await reset();
  await page.locator('[data-mode="world"]').click();
  await page
    .locator("#command-input")
    .fill("Go to the entrance then invent a car");
  await page.locator("#send-button").click();
  assert.match(
    await page.locator("#modal").innerText(),
    /Unsupported or ambiguous/,
  );
  assert.equal(await button("Save itinerary").count(), 0);
  assert.equal((await state()).area, "Living Room");
  assert.equal((await state()).time, 420);
  await close();
  await cmd("Open itinerary.");
  await button("Create itinerary").click();
  await page
    .locator("#plan-editor")
    .fill(
      "Go to the entrance.\nTake the house key.\nMessage Sarah: I have the key with me.\nGive the key to Sarah.",
    );
  await button("Preview steps").click();
  await button("Save itinerary").click();
  assert.equal((await state()).time, 420);
  await button("Run next step").click();
  assert.equal((await state()).area, "Entrance");
  assert.equal((await state()).itinerary.steps[0].status, "completed");
  assert.equal((await state()).items.key, "tray"); // No automatic next action.
  await page.reload();
  await page.waitForFunction(() => Prototype.state());
  await cmd("Open itinerary.");
  await button("Run next step").click();
  assert.equal((await state()).items.key, "you");
  await cmd("Open itinerary.");
  await button("Run next step").click();
  assert.equal(
    await page.locator("#command-input").inputValue(),
    "I have the key with me.",
  );
  assert.equal(
    (await state()).messages.Sarah.filter((m) => m.from === "you").length,
    0,
  );
  await page.locator("#send-button").click();
  assert.equal((await state()).itinerary.steps[2].status, "completed");
  await cmd("Open itinerary.");
  await page.screenshot({ path: "原型/verification/itinerary-1440.png" });
  await button("Run next step").click();
  assert.equal((await state()).items.key, "Sarah");
  assert.equal((await state()).itinerary.status, "completed");
  // Edit retains completed checkpoints. Cancel retains the real picked-up ID.
  await reset();
  await cmd("Go to the entrance then take the ID card then wait for 5 minutes");
  await button("Save itinerary").click();
  await button("Run next step").click();
  await cmd("Open itinerary.");
  await button("Run next step").click();
  await cmd("Open itinerary.");
  await button("Edit remaining steps").click();
  await page.locator("#plan-editor").fill("Wait for 10 minutes.");
  await button("Preview steps").click();
  await button("Save itinerary").click();
  assert.equal(
    (await state()).itinerary.steps.filter((x) => x.status === "completed")
      .length,
    2,
  );
  assert.equal((await state()).itineraryHistory.length, 1);
  await button("Cancel remaining itinerary").click();
  assert.equal((await state()).items.id, "you");
  await close();
  // Async action stops at a checkpoint and restores as paused, never replays completed travel.
  await reset("hospital");
  await cmd("Walk to the hospital then go to the waiting area");
  await button("Save itinerary").click();
  await button("Run next step").click();
  await page.waitForFunction(() => Prototype.state().scene === "Road");
  await page.keyboard.press("Escape");
  assert.equal((await state()).plan.status, "paused");
  const checkpoint = (await state()).time;
  await page.reload();
  await page.waitForFunction(() => Prototype.state());
  assert.equal((await state()).time, checkpoint);
  await cmd("Continue the plan.");
  await page.waitForFunction(() => !Prototype.state().plan);
  assert.equal((await state()).itinerary.steps[0].status, "completed");
  assert.equal((await state()).area, "Reception");
  await cmd("Open itinerary.");
  await button("Run next step").click();
  assert.equal((await state()).area, "Waiting Area");
  // Cross-day booking through actual slot UI; draft does not reserve it.
  await reset("hospital");
  await cmd("Show hospital schedule.");
  await page.locator("#calendar-day").selectOption("2");
  await page.locator('[data-slot="540"]').click();
  assert.equal((await state()).appointment, null);
  assert.match(await page.locator("#command-input").inputValue(), /day 2/);
  await page.locator("#send-button").click();
  assert.equal((await state()).appointment.day, 2);
  assert.equal((await state()).appointment.time, 540);
  await cmd("Please book an appointment at 09:00 tomorrow.", "npc", "Emma");
  assert.equal((await state()).bookingsHistory.length, 0);
  await setFixture(() => {
    s.time = 1080;
    advance(20);
    save();
    render();
  });
  assert.equal((await state()).appointment.status, "Booked");
  await page.locator("#end-day").click();
  await button("Begin tomorrow").click();
  assert.equal((await state()).day, 2);
  assert.equal((await state()).time, 420);
  assert.equal((await state()).appointment.status, "Booked");
  await setFixture(() => {
    s.time = 480;
    s.scene = "Hospital";
    s.area = "Reception";
    s.items.id = "you";
    save();
    render();
  });
  await cmd("I am here to check in. Here is my ID.", "npc", "Emma");
  assert.equal((await state()).registered, true);
  // Midnight advances day once, pauses offline, missed visits cannot be checked in.
  await reset("road");
  await setFixture(() => {
    s.time = 1438;
    s.appointment = { day: 2, time: 540, status: "Booked", duration: 15 };
    save();
    render();
  });
  await cmd("Wait for 5 minutes.");
  await page.waitForFunction(() => !Prototype.state().plan);
  assert.equal((await state()).day, 2);
  assert.equal((await state()).time, 3);
  assert.equal((await state()).appointment.status, "Booked");
  await page.reload();
  await page.waitForFunction(() => Prototype.state());
  assert.equal((await state()).time, 3);
  await setFixture(() => {
    s.time = 550;
    s.scene = "Hospital";
    s.area = "Reception";
    s.items.id = "you";
    advance(0);
    save();
    render();
  });
  assert.equal((await state()).appointment.status, "Missed");
  await cmd("I am here to check in. Here is my ID.", "npc", "Emma");
  assert.equal((await state()).registered, false);
  // Standby actual UI prepares own message, join verifies physical ID, duplicate no charge.
  await reset("hospital");
  await cmd("Please join the standby queue.", "npc", "Emma");
  assert.equal((await state()).standby, undefined);
  await setFixture(() => {
    s.scene = "Hospital";
    s.area = "Reception";
    s.items.id = "you";
    save();
    render();
  });
  await cmd("Open standby queue.");
  await page.locator("#queue-join").click();
  await page.locator("#send-button").click();
  assert.equal((await state()).standby.status, "Waiting");
  const joined = (await state()).time;
  await cmd("Please join the standby queue.", "npc", "Emma");
  assert.equal((await state()).time, joined);
  await cmd("Wait for 5 minutes.");
  await page.waitForFunction(
    () => Prototype.state().standby.status === "Offered",
  );
  assert.equal((await state()).appointment, null);
  await cmd("Cancel the remaining plan.");
  assert.equal((await state()).standby.status, "Offered");
  await cmd("I accept the offered standby slot.", "npc", "Emma");
  assert.equal((await state()).appointment, null);
  await cmd("Open standby queue.");
  await page.locator("#queue-accept").click();
  await cmd("Open standby queue.");
  await page.screenshot({ path: "原型/verification/standby-1440.png" });
  await page.locator("#queue-accept").click();
  await page.locator("#send-button").click();
  assert.equal((await state()).standby.status, "Booked");
  assert.equal((await state()).appointment.time, 510);
  assert.equal((await state()).queueHistory.at(-1).status, "Booked");
  // Offer expiry releases only queue; preserves booked visit. Capacity and closing guards.
  await reset("road");
  await setFixture(() => {
    s.scene = "Hospital";
    s.area = "Reception";
    s.items.id = "you";
    save();
    render();
  });
  await cmd("Please join the standby queue.", "npc", "Emma");
  await cmd("Wait for 5 minutes.");
  await page.waitForFunction(
    () => Prototype.state().standby.status === "Offered",
  );
  await cmd("Cancel the remaining plan.");
  await cmd("Wait for 5 minutes.");
  await page.waitForFunction(
    () => Prototype.state().standby.status === "Offer expired",
  );
  assert.equal((await state()).appointment.time, 540);
  assert.equal((await state()).appointment.status, "Booked");
  await cmd("I accept the offered standby slot.", "npc", "Emma");
  assert.equal((await state()).appointment.time, 540);
  await setFixture(() => {
    s.sampleQueueCount = 3;
    save();
  });
  await cmd("Please join the standby queue.", "npc", "Emma");
  assert.equal((await state()).standby.status, "Offer expired");
  assert.match(
    (await state()).messages.Emma.at(-1).text,
    /three standby places/,
  );
  await setFixture(() => {
    s.sampleQueueCount = 2;
    s.time = 1078;
    save();
  });
  await cmd("Please join the standby queue.", "npc", "Emma");
  assert.match(
    (await state()).messages.Emma.at(-1).text,
    /not enough service time/,
  );
  // Commitment deadline changes append history; new remedy preserves original failure.
  await reset();
  await cmd("I'll bring it to you now.", "npc", "Sarah");
  assert.equal((await state()).commitmentAttempts.length, 1);
  await cmd("Please change the key handover to 14:00 today.", "npc", "Sarah");
  assert.equal((await state()).commitmentAttempts[0].due.time, 840);
  assert.equal((await state()).commitmentAttempts[0].changes.length, 1);
  await setFixture(() => {
    s.time = 839;
    save();
  });
  await cmd("Wait for 5 minutes.");
  await page.waitForFunction(() => Prototype.state().tasks.key === "overdue");
  assert.equal((await state()).commitmentAttempts[0].status, "failed");
  await cmd("Cancel the remaining plan.");
  await cmd(
    "Please arrange a new key handover at 09:00 tomorrow.",
    "npc",
    "Sarah",
  );
  assert.equal((await state()).commitmentAttempts.length, 2);
  assert.equal((await state()).commitmentAttempts[0].status, "failed");
  await page.locator("#end-day").click();
  await button("Begin tomorrow").click();
  assert.equal((await state()).day, 2);
  assert.equal((await state()).commitmentAttempts[1].status, "active");
  await cmd("Go to the entrance.");
  await cmd("Take the house key.");
  await cmd("Give the house key to Sarah.");
  assert.equal((await state()).commitmentAttempts[1].status, "completed");
  assert.equal((await state()).commitmentAttempts[0].status, "failed");
  assert.equal((await state()).tasks.key, "overdue");
  await cmd("Open commitment history.");
  assert.match(await page.locator("#modal").innerText(), /FOLLOW-UP/);
  await page.screenshot({ path: "原型/verification/commitment-history.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await close();
  await cmd("Open itinerary.");
  await button("Create itinerary").click();
  await page.screenshot({ path: "原型/verification/itinerary-390.png" });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  assert.equal(
    await page
      .locator("#modal")
      .evaluate((d) => d.scrollWidth > d.clientWidth + 1),
    false,
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await close();
  await cmd("Open world desk.");
  await page.screenshot({ path: "原型/verification/desk-plans.png" });
  await close();
  await reset();
  await cmd("Open task board.");
  await page.locator('[data-task-detail="key"]').click();
  await button("Edit request preset").click();
  await page.locator("#task-deadline").fill("11:00");
  await button("Review request wording").click();
  assert.match(await page.locator("#modal").innerText(), /11:00/);
  await button("Save request preset").click();
  assert.equal((await state()).taskPresets.key.deadlineTime, 660);
  await close();
  await cmd("I'll bring it to you now.", "npc", "Sarah");
  const promisedTime = (await state()).time;
  await cmd("I'll bring it to you now.", "npc", "Sarah");
  assert.equal((await state()).time, promisedTime);
  assert.equal((await state()).commitmentAttempts.length, 1);
  await reset();
  await setFixture(() => {
    s.tasks.key = "overdue";
    s.commitmentAttempts = [];
    save();
  });
  await page.reload();
  await page.waitForFunction(() => Prototype.state());
  assert.equal((await state()).commitmentAttempts[0].migrated, true);
  assert.equal((await state()).commitmentAttempts[0].due, null);
  await cmd("Open commitment history.");
  assert.match(
    await page.locator("#modal").innerText(),
    /no missing facts have been invented/,
  );
  await close();
  await cmd(
    "Please arrange a new key handover at 09:00 tomorrow.",
    "npc",
    "Sarah",
  );
  assert.equal((await state()).commitmentAttempts[0].status, "failed");
  assert.equal((await state()).commitmentAttempts[1].followup, true);
  await reset("road");
  await setFixture(() => {
    s.scene = "Hospital";
    s.area = "Reception";
    s.items.id = "you";
    save();
    render();
  });
  await cmd("Please join the standby queue.", "npc", "Emma");
  await cmd("Please leave the standby queue.", "npc", "Emma");
  assert.equal((await state()).standby.status, "Left by request");
  assert.equal((await state()).appointment.status, "Booked");
  await cmd("Please cancel my appointment.", "npc", "Emma");
  const cancelledTime = (await state()).time;
  await cmd("Please cancel my appointment.", "npc", "Emma");
  assert.equal((await state()).time, cancelledTime);
  assert.equal((await state()).appointment.status, "Cancelled");
  assert.deepEqual(errors, []);
  console.log(
    "PASS executable itinerary and exact IM drafts, unknown-step rejection, edit/cancel/reload, async checkpoints, cross-day slot UI, midnight, missed check-in guard, standby ID/duplicate/offer/expiry/capacity/closing, append-only deadline renegotiation and failed-attempt follow-up, desktop/mobile",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
