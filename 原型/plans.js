/* A user-owned itinerary. Only supported actions execute; IM steps remain drafts. */
const Plans = (() => {
  function normalize(st) {
    st.itineraryHistory ??= [];
    if (st.itinerary?.status === "executing") st.itinerary.status = "paused";
    return st;
  }
  function parse(text) {
    const t = text.toLowerCase().replace(/[.!]+$/, "");
    if (/^(don't|do not|never|no\b)/.test(t)) return null;
    const message = text.match(/^(?:message|tell|ask) (\w+):\s*(.+)$/i);
    if (message) {
      const matches = Object.entries(s.npcs).filter(
        ([id, p]) =>
          !p.archived &&
          (p.name.toLowerCase() === message[1].toLowerCase() ||
            id.toLowerCase() === message[1].toLowerCase()),
      );
      if (matches.length === 1)
        return { kind: "message", who: matches[0][0], text: message[2] };
      return null;
    }
    if (/^(go|move|walk|return|head) (to |back |home)/.test(t)) {
      for (const [scene, areas] of Object.entries(WorldDesk.areas))
        for (const area of [...areas].sort((a, b) => b.length - a.length))
          if (
            t === `go to the ${area.toLowerCase()}` ||
            t === `go to ${area.toLowerCase()}`
          )
            return { kind: "place", scene, area };
      if (/^(walk|go|head) to (the )?hospital$/.test(t))
        return { kind: "place", scene: "Hospital", area: "Reception" };
      if (/^(go|return|head) (back )?(to )?home$/.test(t))
        return { kind: "place", scene: "Home", area: "Entrance" };
      return null;
    }
    const item = t.match(
      /^(take|pick up|give|hand over|put) (?:the |my )?(house key|key|id card|id|document folder|folder|phone)(.*)$/,
    );
    if (item) {
      const key = /key/.test(item[2])
        ? "key"
        : /id/.test(item[2])
          ? "id"
          : /folder/.test(item[2])
            ? "folder"
            : "phone";
      const take = /take|pick up/.test(item[1]),
        give = /give|hand over/.test(item[1]);
      if (take && !/^(| from the (tray|cabinet))$/.test(item[3])) return null;
      if (give && (key !== "key" || !/^ to sarah$/.test(item[3]))) return null;
      if (!take && !give && !/^ (on|in) the (tray|cabinet)$/.test(item[3]))
        return null;
      return {
        kind: "item",
        key,
        owner: take
          ? "you"
          : give
            ? WorldDesk.route("Sarah")
            : item[3].includes("tray")
              ? "tray"
              : "cabinet",
      };
    }
    const wait = t.match(/^wait (?:for )?(\d+) minutes?$/);
    if (wait && +wait[1] >= 1 && +wait[1] <= s.settings.wait)
      return { kind: "wait", minutes: +wait[1] };
    if (/^(prepare|make) breakfast$/.test(t))
      return { kind: "household", effect: "breakfast" };
    if (/^tidy(?: the room)?$/.test(t))
      return { kind: "household", effect: "tidy" };
    if (/^rest$/.test(t)) return { kind: "household", effect: "rest" };
    return null;
  }
  function editor(text) {
    const p = s.itinerary;
    const initial =
      text ??
      (p
        ? p.steps
            .filter((x) => x.status !== "completed")
            .map((x) => x.command)
            .join("\n")
        : "Go to the entrance.\nTake the house key.\nGive the key to Sarah.");
    showModal(
      "Make a little room for a plan",
      `<p>One step per line, up to eight. Use supported movement, take / put / give, a bounded wait or household activity. For an IM step: <strong>Message Sarah: your exact words</strong>. IM steps only prepare a draft; you press Send.</p><label class="writing-label">Remaining steps<textarea id="plan-editor" rows="6" maxlength="1500">${esc(initial)}</textarea></label><p class="desk-note">Completed steps stay in the record. Unsupported steps block the whole preview. Each next step needs your explicit Run next step; a changed condition or an event stops execution.</p>`,
      [
        { label: "Back", action: open },
        {
          label: "Preview steps",
          primary: true,
          action: () => preview($("plan-editor").value),
        },
      ],
      "YOUR ITINERARY",
    );
  }
  function preview(text) {
    const lines = text
      .split(/\n|;|\bthen\b/i)
      .map((x) => x.trim().replace(/[, ]+$/, ""))
      .filter(Boolean);
    const steps = lines.map((command) => ({
      id: crypto.randomUUID(),
      command,
      action: parse(command),
      status: "pending",
    }));
    const valid =
      lines.length > 0 &&
      lines.length <= 8 &&
      steps.every((x) => x.action) &&
      !/[\u3400-\u9fff]/.test(text);
    showModal(
      "Know what will happen",
      `<ol class="plan-list">${steps.map((x) => `<li><strong>${esc(x.command)}</strong><small>${x.action ? (x.action.kind === "message" ? `Draft to ${esc(personName(x.action.who))} · Send yourself` : `Supported ${x.action.kind} step · Conditions checked when run`) : "Unsupported or ambiguous. Rewrite this step before saving."}</small></li>`).join("")}</ol><div class="notice-card">${valid ? "No action, time, message or promise has been committed. The saved plan will wait for you to run each step." : "This plan cannot be saved. Use one to eight supported, unambiguous steps; no unsupported clause will be dropped."}</div>`,
      [
        { label: "Edit steps", action: () => editor(text) },
        ...(valid
          ? [
              {
                label: "Save itinerary",
                primary: true,
                action: () => {
                  if (s.plan)
                    return feedback(
                      "Finish or cancel the current action before replacing an itinerary.",
                    );
                  const old = s.itinerary;
                  if (old)
                    s.itineraryHistory.push({
                      ...structuredClone(old),
                      status: "Revised",
                      day: s.day,
                      time: s.time,
                    });
                  const done =
                    old?.steps.filter((x) => x.status === "completed") || [];
                  s.itinerary = {
                    id: crypto.randomUUID(),
                    day: s.day,
                    time: s.time,
                    status: "ready",
                    steps: [...done, ...steps],
                  };
                  log(
                    "Saved a supported itinerary; no action executed by preview.",
                  );
                  save();
                  open();
                },
              },
            ]
          : []),
      ],
      "PLAN PREVIEW",
    );
  }
  function active() {
    return s.itinerary?.steps.find((x) => x.status !== "completed");
  }
  function open() {
    observe();
    const p = s.itinerary,
      step = active();
    showModal(
      "One step, then the next",
      `<button class="desk-back" id="plan-back">← World desk</button><p>Your itinerary pauses between steps. Completed actions remain real if you edit or cancel the rest.</p>${p ? `<span class="status-chip">${esc(p.status)}</span><ol class="plan-list">${p.steps.map((x) => `<li><strong>${esc(x.command)}</strong><small>${esc(x.status)}${x.reason ? ` · ${esc(x.reason)}` : ""}${x.done ? ` · Day ${x.done.day} ${time(x.done.time)}` : ""}</small></li>`).join("")}</ol>` : '<div class="notice-card">No saved itinerary yet. Start with a complete example and change it.</div>'}${s.itineraryHistory.length ? `<p class="desk-note">${s.itineraryHistory.length} previous plan version(s) retained. Your Journal keeps committed action details.</p>` : ""}`,
      [
        {
          label: p ? "Edit remaining steps" : "Create itinerary",
          action: () => editor(),
        },
        ...(step && p.status !== "cancelled"
          ? [
              {
                label:
                  step.status === "executing"
                    ? "Check step result"
                    : step.status === "draft ready"
                      ? "Review message step"
                      : "Run next step",
                primary: true,
                action: () => run(),
              },
            ]
          : []),
        ...(p && !["completed", "cancelled"].includes(p.status)
          ? [{ label: "Cancel remaining itinerary", action: cancel }]
          : []),
      ],
      "YOUR ITINERARY",
    );
    $("plan-back").onclick = () => WorldDesk.open();
  }
  function run() {
    const p = s.itinerary,
      step = active();
    if (!step || p.status === "cancelled") return;
    if (s.plan) {
      feedback(
        "Continue or cancel the current action before running another itinerary step.",
      );
      return;
    }
    if (step.status === "draft ready") {
      prepareMessage(step);
      return;
    }
    if (!parse(step.command)) {
      step.reason = "This step is no longer supported. Edit it first.";
      save();
      open();
      return;
    }
    step.start = {
      day: s.day,
      time: s.time,
      now: Calendar.now(),
      logs: s.logs.length,
      messages: (s.messages[step.action.who] || []).map((x) => x.id),
      effect: s.completedActions[step.action.effect],
    };
    step.status = "executing";
    p.status = "executing";
    step.reason = "";
    $("modal").close();
    if (step.action.kind === "message") {
      prepareMessage(step);
      return;
    }
    setMode("world");
    worldCommand(step.command);
    observe();
    save();
    if (step.status === "executing" && !s.plan && !$("modal").open) {
      step.status = "blocked";
      p.status = "paused";
      step.reason = s.feedback || "Conditions have changed. Review the action.";
      save();
      open();
    }
  }
  function prepareMessage(step) {
    const who = step.action.who;
    if (Life.gate(step.action.text, who, false)) {
      step.status = "blocked";
      step.reason = "Contact permission is required.";
      s.itinerary.status = "paused";
      save();
      return;
    }
    const key = `npc:${who}`;
    const apply = () => {
      selectContact(who);
      s.drafts[key] = step.action.text;
      step.status = "draft ready";
      s.itinerary.status = "awaiting your message";
      save();
      render();
      $("command-input").focus();
    };
    if (s.drafts[key]?.trim() && s.drafts[key] !== step.action.text)
      showModal(
        "Keep your unsent words?",
        "<p>The planned message only becomes a draft after your confirmation. It will never be sent automatically.</p>",
        [
          { label: "Keep my draft", action: open },
          { label: "Use planned draft", primary: true, action: apply },
        ],
      );
    else apply();
  }
  function observe() {
    const p = s.itinerary,
      step = active();
    if (!step || !["executing", "draft ready"].includes(step.status)) return;
    const a = step.action;
    const done =
      a.kind === "place"
        ? s.scene === a.scene && s.area === a.area
        : a.kind === "item"
          ? s.items[a.key] === a.owner
          : a.kind === "wait"
            ? Calendar.now() >= step.start.now + a.minutes && !s.plan
            : a.kind === "household"
              ? s.completedActions[a.effect] !== step.start.effect
              : a.kind === "message"
                ? (s.messages[a.who] || []).some(
                    (m) =>
                      m.from === "you" &&
                      m.text === a.text &&
                      !step.start.messages.includes(m.id),
                  )
                : false;
    if (done) {
      step.status = "completed";
      step.done = { day: s.day, time: s.time };
      p.status = active() ? "ready" : "completed";
      log(
        `Itinerary checkpoint recorded: ${step.command}. Remaining steps require your next instruction.`,
      );
      save();
    }
  }
  function cancel() {
    if (!s.itinerary || s.itinerary.status === "cancelled") return;
    if (s.plan) cancelPlan();
    s.itinerary.status = "cancelled";
    s.itinerary.steps
      .filter((x) => x.status !== "completed")
      .forEach((x) => (x.status = "cancelled"));
    log(
      "Remaining itinerary cancelled. Completed steps and delivered messages were preserved.",
    );
    save();
    open();
  }
  function world(text) {
    if (
      /^(open|show|review) (my |the )?(itinerary|multi.step plan)[.!]?$/i.test(
        text,
      )
    ) {
      open();
      return true;
    }
    if (/cancel.*itinerary/i.test(text)) {
      cancel();
      return true;
    }
    if (/run (the )?next (itinerary )?step/i.test(text)) {
      run();
      return true;
    }
    if (/\bthen\b|;/.test(text)) {
      preview(text);
      return true;
    }
    return false;
  }
  return { normalize, open, preview, observe, world };
})();
