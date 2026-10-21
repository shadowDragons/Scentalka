// Controlled browser callback tests. No real microphone, codec, recognition service or audio quality is claimed.
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
  await page.addInitScript(() => {
    window.mockVoice = {
      permission: "pending",
      stopped: 0,
      recorders: [],
      recognizers: [],
      throwRecognition: false,
      spoken: 0,
    };
    const stream = () => ({
      getTracks: () => [
        {
          stop() {
            mockVoice.stopped++;
          },
        },
      ],
    });
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia() {
          return new Promise((resolve, reject) => {
            mockVoice.resolvePermission = () => resolve(stream());
            if (mockVoice.permission === "allow") resolve(stream());
            if (mockVoice.permission === "deny")
              reject(new Error("simulated denial"));
          });
        },
      },
    });
    window.MediaRecorder = class {
      constructor() {
        this.state = "inactive";
        this.mimeType = "audio/webm";
        mockVoice.recorders.push(this);
      }
      start() {
        this.state = "recording";
      }
      stop() {
        this.state = "inactive";
        queueMicrotask(() => {
          this.ondataavailable?.({
            data: new Blob(["controlled audio fixture"]),
          });
          this.onstop?.();
        });
      }
    };
    window.SpeechRecognition = class {
      constructor() {
        mockVoice.recognizers.push(this);
      }
      start() {
        if (mockVoice.throwRecognition)
          throw new Error("simulated unsupported recognition");
      }
      stop() {}
      abort() {}
    };
    speechSynthesis.speak = () => {
      mockVoice.spoken++;
    };
    speechSynthesis.cancel = () => {};
    window.Audio = class {
      constructor() {
        this.currentTime = 0;
        this.duration = 10;
      }
      play() {
        return Promise.resolve();
      }
      pause() {}
    };
  });
  await page.goto("http://localhost:8766/Scentalka%20Prototype.html");
  await page.waitForFunction(() => window.Prototype?.state());
  const state = () => page.evaluate(() => Prototype.state()),
    cmd = (...a) => page.evaluate((a) => Prototype.command(...a), a),
    button = (name) => page.getByRole("button", { name, exact: true });
  const start = async () => {
    await page.locator("#mic-button").click();
  };
  const stop = async () => {
    await page.locator("#mic-button").click();
    await page.waitForFunction(() => !Voices.busy());
  };
  const result = async (text, confidence = 0.52, index = -1) =>
    page.evaluate(
      ([text, confidence, index]) => {
        mockVoice.recognizers.at(index).onresult({
          results: [
            [
              { transcript: text, confidence },
              { transcript: "Alternative words", confidence: 0 },
            ],
          ],
        });
      },
      [text, confidence, index],
    );
  await page.evaluate(() => {
    Prototype.reset("home");
    setMode("world");
  });
  await page.locator("#command-input").fill("Keep my original draft.");
  const t = (await state()).time;
  await start();
  assert.equal(await page.evaluate(() => Voices.pending()), true);
  await page.keyboard.press("Escape");
  assert.equal(await page.evaluate(() => Voices.busy()), false);
  await page.evaluate(() => mockVoice.resolvePermission());
  await page.waitForFunction(() => mockVoice.stopped > 0);
  assert.equal(await page.evaluate(() => mockVoice.recorders.length), 0);
  assert.equal((await state()).drafts.world, "Keep my original draft.");
  assert.equal((await state()).time, t);
  await page.evaluate(() => {
    mockVoice.permission = "allow";
    selectContact("Sarah");
  });
  await page.locator("#command-input").fill("Hello.");
  await start();
  await result("Could you repeat that?");
  await stop();
  assert.match(
    (await state()).drafts["npc:Sarah"],
    /Hello\. Could you repeat that\?/,
  );
  assert.ok((await state()).voiceDrafts["npc:Sarah"]);
  await page.locator("#voice-review").click();
  assert.match(await page.locator("#modal").innerText(), /uncertain words/);
  await page.locator("#voice-transcript").fill("Where are you?");
  await page.screenshot({ path: "原型/verification/voice-review-1440.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: "原型/verification/voice-review-390.png" });
  assert.equal(
    await page
      .locator("body")
      .evaluate((d) => d.scrollWidth > d.clientWidth + 1),
    false,
  );
  await button("Keep voice draft").scrollIntoViewIfNeeded();
  await page.screenshot({path:"原型/verification/voice-review-actions-390.png"});
  await page.keyboard.press("Escape");
  await page.locator("#voice-review").click();
  assert.equal(
    await page.locator("#voice-transcript").inputValue(),
    "Where are you?",
  );
  await button("Use text only").click();
  await page.locator("#send-button").click();
  assert.equal(
    (await state()).messages.Sarah.filter((m) => m.from === "you").at(-1).type,
    "text",
  );
  assert.match((await state()).messages.Sarah.at(-1).text, /Home.*Entrance/);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .locator("#command-input")
    .fill("Please prepare the appointment documents.");
  await start();
  await stop();
  await page.locator("#voice-review").click();
  await button("Keep voice draft").click();
  await page.locator("#send-button").click();
  let own = (await state()).messages.Sarah.filter((m) => m.from === "you");
  assert.equal(own.at(-1).type, "voice");
  assert.ok(own.at(-1).audioData);
  assert.equal((await state()).voiceDrafts["npc:Sarah"], undefined);
  await result("Late words after sending.");
  assert.equal((await state()).drafts["npc:Sarah"], "");
  assert.equal((await state()).voiceReviews["npc:Sarah"], undefined);
  await page.locator("#command-input").fill("Thank you.");
  await page.locator("#send-button").click();
  own = (await state()).messages.Sarah.filter((m) => m.from === "you");
  assert.equal(own.at(-1).type, "text");
  assert.equal(own.at(-1).audioData, null);
  // Recognition may fail to start while independent audio capture still succeeds.
  await page.evaluate(() => (mockVoice.throwRecognition = true));
  await page.locator("#command-input").fill("My intended words.");
  await start();
  assert.equal(await page.evaluate(() => Voices.busy()), true);
  await stop();
  assert.ok((await state()).voiceDrafts["npc:Sarah"]);
  assert.match(
    (await state()).voiceReviews["npc:Sarah"].recognition,
    /could not start/,
  );
  const before = await state();
  await page.evaluate(() => (mockVoice.throwRecognition = false));
  await start();
  await result("This should be cancelled.");
  await page.keyboard.press("Escape");
  await result("Late result that must be ignored.");
  assert.equal((await state()).drafts["npc:Sarah"], before.drafts["npc:Sarah"]);
  assert.equal(
    (await state()).voiceDrafts["npc:Sarah"],
    before.voiceDrafts["npc:Sarah"],
  );
  assert.deepEqual(
    (await state()).voiceReviews["npc:Sarah"],
    before.voiceReviews["npc:Sarah"],
  );
  await page.evaluate(() => (mockVoice.permission = "deny"));
  await start();
  await page.waitForFunction(() => !Voices.busy());
  assert.equal((await state()).drafts["npc:Sarah"], before.drafts["npc:Sarah"]);
  // Queue does not expose unread words; Play keeps the exact input context.
  const id = await page.evaluate(() => {
    npc("Mia", "Private fixture content not yet known.", {
      voice: true,
      opened: false,
    });
    return s.messages.Mia.at(-1).id;
  });
  await cmd("Open voice queue.");
  assert.doesNotMatch(
    await page.locator("#modal").innerText(),
    /Private fixture content/,
  );
  const target = await page.evaluate(() => [mode, contact]);
  await page.locator(`[data-queue-play="${id}"]`).click();
  assert.deepEqual(await page.evaluate(() => [mode, contact]), target);
  assert.equal((await state()).messages.Mia.at(-1).known, false);
  await page.screenshot({ path: "原型/verification/listening-queue-1440.png" });
  await page.keyboard.press("Escape");
  await page.evaluate(() => (mockVoice.permission = "allow"));
  await start();
  const spoken = await page.evaluate(() => mockVoice.spoken);
  await page.evaluate((id) => playMessage(id), id);
  assert.equal(await page.evaluate(() => mockVoice.spoken), spoken);
  await page.keyboard.press("Escape");
  assert.equal(await page.evaluate(() => Voices.busy()), false);
  await page.evaluate(() => WorldDesk.open("data"));
  await page.locator("#desk-remove-audio").click();
  await button("Remove audio").click();
  assert.deepEqual((await state()).voiceDrafts, {});
  assert.deepEqual((await state()).voiceReviews, {});
  assert.equal((await state()).drafts["npc:Sarah"], before.drafts["npc:Sarah"]);
  assert.deepEqual(errors, []);
  console.log(
    "PASS simulated voice permission cancel/late stream cleanup, recognition append/confidence/review/edit preservation, text-only send, single audio send/no leaked attachment, recognition startup failure, cancel/late recognition/permission denial, unread listening queue/recipient isolation/recording playback guard, desktop/mobile",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
