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
  await page.waitForFunction(() => window.Prototype?.state());
  const state = () => page.evaluate(() => Prototype.state());
  const cmd = (text, context = "world", who) =>
    page.evaluate((v) => Prototype.command(...v), [text, context, who]);
  const reset = () => page.evaluate(() => Prototype.reset("home"));
  const desk = async (section) => {
    await cmd("Open " + section);
  };
  await reset();
  await page.locator("#world-desk").click();
  await page.screenshot({ path: "原型/verification/world-desk.png" });
  await page.locator('[data-desk="profile"]').click();
  await page.locator("#desk-name").fill("Jamie");
  await page
    .getByRole("button", { name: "Preview profile", exact: true })
    .click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  assert.equal((await state()).settings.name, "Jamie");
  await page.locator('[data-desk="people"]').click();
  await page.locator('[data-edit-person="Mia"]').click();
  await page.locator("#desk-goal").fill("Organize my notebook every morning");
  await page
    .getByRole("button", { name: "Preview person", exact: true })
    .click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  assert.equal(
    (await state()).npcs.Mia.goal,
    "Organize my notebook every morning",
  );
  await page.locator('[data-desk="people"]').click();
  await page.getByRole("button", { name: "Add a person", exact: true }).click();
  await page.locator("#desk-name").fill("Alex");
  await page
    .getByRole("button", { name: "Preview person", exact: true })
    .click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  assert.equal(Object.keys((await state()).npcs).length, 9);
  assert.equal((await state()).known.length, 2);
  await page.locator('[data-desk="people"]').click();
  await page.locator('[data-edit-person="Emma"]').click();
  await page
    .getByRole("button", { name: "Archive / replace", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Preview handover", exact: true })
    .click();
  assert.match(await page.locator("#modal").innerText(), /valid successor/);
  await page.keyboard.press("Escape");
  await desk("world pace");
  await page.locator("#pace-activeLimit").fill("4");
  await page.getByRole("button", { name: "Preview pace", exact: true }).click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  assert.equal((await state()).settings.activeLimit, 4);
  await page.keyboard.press("Escape");
  await cmd("Explain the word commitment.", "assistant");
  const helpers = (await state()).assistantHistory.length;
  assert.ok(helpers >= 2);
  await page.reload();
  await page.waitForFunction(() => Prototype.state());
  assert.equal((await state()).assistantHistory.length, helpers);
  await desk("expression book");
  await page
    .locator("#desk-expression")
    .fill("Could we agree on another time?");
  await page
    .getByRole("button", { name: "Save expression", exact: true })
    .click();
  assert.equal((await state()).expressions.length, 1);
  await page.keyboard.press("Escape");
  await reset();
  await cmd("Go to the kitchen.");
  await cmd("Prepare breakfast.");
  await page
    .getByRole("button", { name: "Start activity", exact: true })
    .click();
  await page.waitForFunction(() => !Prototype.state().plan);
  assert.equal((await state()).completedActions.breakfast, 431);
  await cmd("Wait for five minutes.");
  await page.waitForFunction(() => Prototype.state().events.length === 1);
  assert.equal((await state()).events.length, 1);
  await desk("events");
  await page.getByRole("button", { name: "Decide later", exact: true }).click();
  assert.equal((await state()).events[0].status, "deferred");
  await page.keyboard.press("Escape");
  await cmd("Cancel the remaining plan.");
  await cmd("Don't go to the hospital.");
  assert.equal((await state()).scene, "Home");
  await desk("recovery demo");
  await page.locator("#request-failure").selectOption("before");
  await page.locator("#arm-failure").click();
  const before = (await state()).time;
  await cmd("Go to the entrance.");
  assert.equal((await state()).time, before);
  await desk("recovery demo");
  await page.getByRole("button", { name: "Retry action", exact: true }).click();
  assert.equal((await state()).time, before + 1);
  await desk("recovery demo");
  await page.getByRole("button", { name: "Back to desk", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.evaluate(() => {
    s.consulted = true;
    s.appointment = { time: 540, duration: 15, status: "Completed" };
    s.tasks.summary = "accepted";
    save();
  });
  await cmd("Open writing desk.");
  await page.locator("#artifact-draft").fill("Thank you.");
  await page
    .getByRole("button", { name: "Review submission", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Submit to doctor", exact: true })
    .click();
  assert.equal(
    (await state()).artifacts.summary.versions[0].status,
    "Needs revision",
  );
  await page
    .locator("#artifact-draft")
    .fill(
      "My next step is to ask my remaining questions tomorrow. No prescription was issued.",
    );
  await page
    .getByRole("button", { name: "Review submission", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Submit to doctor", exact: true })
    .click();
  assert.equal(
    (await state()).artifacts.summary.versions[1].status,
    "Accepted",
  );
  assert.equal(
    (await state()).artifacts.summary.versions[0].text,
    "Thank you.",
  );
  await page.screenshot({ path: "原型/verification/writing-desk.png" });
  await page.keyboard.press("Escape");
  await desk("data management");
  const download = page.waitForEvent("download");
  await page.locator("#desk-export").click();
  assert.match((await download).suggestedFilename(), /scentalka-world/);
  await page.locator("#desk-hide").click();
  assert.ok((await state()).hiddenChats);
  await desk("data management");
  await page.locator("#desk-unhide").click();
  assert.deepEqual((await state()).hiddenChats, {});
  await page.keyboard.press("Escape");
  await reset();
  await cmd("I'll bring it to you now.", "npc", "Sarah");
  await page.locator("#end-day").click();
  await page
    .getByRole("button", { name: "Review next checkpoint", exact: true })
    .click();
  assert.equal((await state()).commitmentAttempts[0].status, "failed");
  await page
    .getByRole("button", { name: "Begin tomorrow", exact: true })
    .click();
  assert.equal((await state()).day, 2);
  assert.equal((await state()).tasks.key, "overdue");
  assert.ok((await state()).reflections.length);
  // Only full playback establishes full voice knowledge, while pause preserves position.
  await page.evaluate(() => {
    npc("Sarah", "A long notification that has not yet been heard.", {
      voice: true,
      opened: false,
    });
    save();
    render();
  });
  const id = (await state()).messages.Sarah.at(-1).id;
  await page.evaluate((id) => {
    window.speechSynthesis.cancel = () => {};
    window.speechSynthesis.speak = (u) => {
      window.testUtterance = u;
      u.onstart();
    };
    playMessage(id);
  }, id);
  assert.equal((await state()).messages.Sarah.at(-1).known, false);
  await page.evaluate(() => {
    window.testUtterance.onboundary({ charIndex: 7 });
  });
  await page.evaluate((id) => playMessage(id), id);
  assert.equal((await state()).messages.Sarah.at(-1).playbackChar, 7);
  await page.evaluate((id) => playMessage(id), id);
  await page.evaluate(() => window.testUtterance.onend());
  assert.equal((await state()).messages.Sarah.at(-1).known, true);
  await page.evaluate(() => Prototype.reset("home"));
  await page.locator("#world-desk").click();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.screenshot({
      path: `原型/verification/desk-${width}.png`,
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS profile, all NPCs, add/required-duty guard, pace, helper persistence, expression book, household/event, negation, recovery idempotency, immutable writing versions, export/privacy, day-end consequences, partial/full voice knowledge, responsive desk",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
