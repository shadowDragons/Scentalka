/* Keyboard and request recovery experiments for this local prototype. */
const Controls = (() => {
  const bindings = {
    help: "h",
    journal: "j",
    pocket: "i",
    contacts: "c",
    events: "e",
    desk: "g",
    talk: " ",
    stop: "Control+.",
  };
  let held = false,
    pressPending = false,
    releasePending = false;
  function normalize(st) {
    st.bindings ??= { ...bindings };
    st.failureMode ??= "none";
    st.requestLedger ??= [];
    return st;
  }
  function open(useDefaults = false) {
    showModal(
      "Make the keys feel natural",
      `<p>Shortcuts work outside text fields. Tab and Enter always operate controls; Alt shortcuts remain available. Hold the talk key, then release to stop recording and review the transcript.</p><div class="form-grid">${Object.entries(
        useDefaults ? bindings : s.bindings,
      )
        .map(
          ([k, v]) =>
            `<label>${{ help: "Assistant", journal: "Journal", pocket: "Pocket", contacts: "Contacts", events: "Events", desk: "World desk", talk: "Hold to talk", stop: "Stop current plan" }[k]}<input data-binding="${k}" value="${esc(v === " " ? "Space" : v)}" maxlength="20"></label>`,
        )
        .join(
          "",
        )}</div><div class="notice-card">Enter focuses the input when you are outside a control. Ctrl + . always stops a world plan, even while typing. Text drafts are preserved while dictating.</div>`,
      [
        { label: "Back", action: showShortcuts },
        { label: "Restore defaults", action: () => open(true) },
        {
          label: "Save key bindings",
          primary: true,
          action: () => {
            const next = {};
            document
              .querySelectorAll("[data-binding]")
              .forEach(
                (el) =>
                  (next[el.dataset.binding] =
                    el.value.trim().toLowerCase() === "space"
                      ? " "
                      : el.value.trim()),
              );
            const values = Object.values(next);
            if (
              new Set(values.map((v) => v.toLowerCase())).size !==
                values.length ||
              values.some(
                (v) => !v || !(v.length === 1 || /^Control\+[a-z.]$/i.test(v)),
              )
            )
              return showModal(
                "Choose distinct keys",
                `<p>Use one character, Space or Control + a character. Each action needs a different key.</p>`,
                [{ label: "Try again", primary: true, action: open }],
              );
            s.bindings = next;
            save();
            toast("Keyboard preferences saved.");
          },
        },
      ],
      "KEYBOARD PREFERENCES",
    );
  }
  function key(e) {
    return e.ctrlKey ? "Control+" + e.key : e.key;
  }
  function typing() {
    return /INPUT|TEXTAREA|SELECT|BUTTON|A/.test(
      document.activeElement?.tagName,
    );
  }
  document.addEventListener(
    "keydown",
    async (e) => {
      if (!s) return;
      if (e.ctrlKey && e.key === ".") {
        e.preventDefault();
        pausePlan();
        stopPlayback();
        return;
      }
      if (e.key === "Escape" && Voices.busy()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        cancelRecording();
        return;
      }
      if ($("modal").open || typing() || e.altKey || e.metaKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        $("command-input").focus();
        return;
      }
      const action = Object.entries(s.bindings).find(
        ([, v]) => v.toLowerCase() === key(e).toLowerCase(),
      )?.[0];
      if (!action || e.repeat) return;
      e.preventDefault();
      const actions = {
        help: () => setMode("assistant"),
        journal: () => openDrawer("journal"),
        pocket: () => openDrawer("pocket"),
        contacts: openDirectory,
        events: () => Life.openEvents(),
        timeline: () => Timeline.open(),
        desk: () => WorldDesk.open(),
        stop: pausePlan,
      };
      if (action === "talk") {
        if (held || recorder?.state === "recording") return;
        held = true;
        releasePending = false;
        pressPending = true;
        await recordVoice();
        pressPending = false;
        if (releasePending && recorder?.state === "recording") recordVoice();
        return;
      }
      actions[action]?.();
    },
    true,
  );
  document.addEventListener(
    "keyup",
    (e) => {
      if (!s || key(e).toLowerCase() !== s.bindings.talk.toLowerCase() || !held)
        return;
      e.preventDefault();
      held = false;
      if (pressPending) releasePending = true;
      else if (recorder?.state === "recording") recordVoice();
    },
    true,
  );
  function recovery() {
    showModal(
      "When a request needs another try",
      `<p>These prototype controls simulate failure stages. They do not call a model or a network service. The next non-UI world command is recorded under one request ID.</p><label class="desk-select">Next world command<select id="request-failure"><option value="none">No simulated failure</option><option value="before">Fail before action</option><option value="reply">Action committed · reply unavailable</option></select></label><button class="primary-button" id="arm-failure">Use this simulation</button><h3 class="desk-section">Recent requests</h3>${
        s.requestLedger.length
          ? s.requestLedger
              .slice(-8)
              .reverse()
              .map(
                (r) =>
                  `<div class="detail-row"><div><strong>${esc(r.text)}</strong><p>${esc(r.status)}<br>Request ${r.id.slice(0, 8)} · Attempts ${r.attempts}</p></div>${r.status === "Failed before action" ? `<button data-retry-request="${r.id}" class="secondary-button">Retry action</button>` : r.status === "Committed · reply failed" ? `<button data-retry-request="${r.id}" class="secondary-button">Retry reply only</button>` : ""}</div>`,
              )
              .join("")
          : "<p>No requests recorded yet.</p>"
      }`,
      [{ label: "Back to desk", action: () => WorldDesk.open() }],
      "LOCAL RECOVERY DEMO",
    );
    $("request-failure").value = s.failureMode;
    $("arm-failure").onclick = () => {
      s.failureMode = $("request-failure").value;
      save();
      $("modal").close();
      toast("The next world action uses your selected failure simulation.");
    };
    document.querySelectorAll("[data-retry-request]").forEach(
      (b) =>
        (b.onclick = () => {
          const r = s.requestLedger.find(
            (r) => r.id === b.dataset.retryRequest,
          );
          if (r.status === "Committed · reply failed") {
            r.attempts++;
            r.status = "Reply recovered";
            log(
              `Reply recovered for request ${r.id}. The world action was not repeated.`,
            );
            save();
            recovery();
            return;
          }
          if (r.status !== "Failed before action") return;
          r.attempts++;
          r.status = "Retrying";
          $("modal").close();
          worldCommand(r.text);
          r.status = "Processed · inspect world result";
          save();
          render();
        }),
    );
  }
  function before(text) {
    if (
      /^(open|show|view)|settings|desk|task board|privacy|schedule|correction|misunderstanding|end.*day|help/i.test(
        text,
      )
    )
      return null;
    const r = {
      id: crypto.randomUUID(),
      text,
      time: s.time,
      day: s.day,
      status: "Received",
      attempts: 1,
    };
    s.requestLedger.push(r);
    const failure = s.failureMode;
    s.failureMode = "none";
    if (failure === "before") {
      r.status = "Failed before action";
      save();
      feedback(
        "This simulated request failed before any action. Retry it from World desk → Recovery demo. No game time passed.",
        "Action not committed",
      );
      return false;
    }
    r.replyFailure = failure === "reply";
    r.status = "Processing";
    return r;
  }
  function after(r) {
    if (!r) return;
    r.status = r.replyFailure
      ? "Committed · reply failed"
      : "Processed · inspect world result";
    r.result = s.feedback;
    if (r.replyFailure)
      feedback(
        "The world command was processed. Its reply was unavailable. Inspect the state or retry the reply only in the recovery demo.",
        "Check the committed result",
      );
    save();
  }
  return { normalize, open, recovery, before, after };
})();
