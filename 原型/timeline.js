/* Game-time boundaries shared by routes, waits, household work and the timeline view. */
const Timeline = (() => {
  const absolute = (day, minute) => (day - 1) * 1440 + minute;
  const label = (at) =>
    Calendar.label({ day: Math.floor(at / 1440) + 1, time: at % 1440 });
  function normalize(st) {
    st.timelineStops ??= [];
    return st;
  }
  function boundaries(end = Calendar.now() + 1440) {
    const now = Calendar.now(),
      entries = [];
    const add = (at, kind, title, detail, source, visible = true) => {
      if (Number.isFinite(at) && at > now && at <= end)
        entries.push({ at, kind, title, detail, source, visible });
    };
    for (const q of s.replyQueue) {
      const next = Schedules.next(s.npcs[q.who]);
      if (next)
        add(
          Math.max(absolute(q.day, q.due), absolute(next.day, next.due)),
          "reply",
          `${personName(q.who)} may reply`,
          "A delivered message is waiting for an available reply block.",
          "IM",
        );
    }
    if (s.docDue && s.tasks.documents === "preparing")
      add(
        absolute(s.docDay ?? s.day, s.docDue),
        "documents",
        "Document preparation checkpoint",
        "The accepted work reaches its agreed completion time. Read the update to learn the result.",
        "Task",
      );
    const a = s.appointment;
    if (a && !Calendar.closed.includes(a.status) && !s.consultStart) {
      if (!s.called)
        add(
          Calendar.at(a),
          "appointment",
          "Hospital appointment",
          `The room-entry grace ends at ${time(a.time + 5)}.`,
          "Appointment",
        );
      add(
        Calendar.at(a) + 6,
        "missed",
        "Appointment arrival grace ends",
        "The visit becomes missed if you have not entered the consultation.",
        "Appointment",
      );
    }
    const commitment = Commitments.current();
    if (commitment?.status === "active")
      add(
        Calendar.at(commitment.due) + 1,
        "deadline",
        "Key handover deadline passed",
        "An accepted commitment needs review. Earlier attempts remain in the record.",
        "Commitment",
      );
    const q = s.standby;
    if (q && ["Waiting", "Offered"].includes(q.status)) {
      if (q.status === "Waiting")
        add(
          q.ready,
          "standby",
          "Standby availability check",
          "Reception checks for a slot. No appointment is promised.",
          "Standby",
        );
      add(
        Math.min(absolute(q.day, q.end), q.offerUntil ?? Infinity),
        "standby-end",
        "Standby window ends",
        "The queue place is released at its saved limit.",
        "Standby",
      );
    }
    if (
      s.completedActions.breakfast &&
      !s.completedActions.notebook &&
      s.scene === "Home" &&
      !s.events.some((e) => e.title === "A notebook left behind")
    )
      add(
        (s.completedActions.breakfastAt ??
          absolute(s.day, s.completedActions.breakfast)) + 5,
        "household",
        "",
        "",
        "World",
        false,
      );
    for (let day = s.day + 1; absolute(day, 0) <= end; day++)
      add(
        absolute(day, 0),
        "midnight",
        "A new game date",
        "Crossing midnight keeps ongoing tasks and ownership.",
        "Clock",
        false,
      );
    return entries.sort((a, b) => a.at - b.at);
  }
  function points(start, end) {
    return boundaries(end)
      .filter((e) => e.at > start && e.at < end)
      .map((e) => e.at);
  }
  function slice(step) {
    const now = Calendar.now(),
      end = now + step.minutes;
    const entries = boundaries(end),
      first = entries[0]?.at ?? end;
    const cut = Math.min(first, end),
      minutes = cut - now;
    return {
      current:
        cut < end ? { minutes, log: "Reached a world-time checkpoint." } : step,
      remaining: cut < end ? { ...step, minutes: end - cut } : null,
      events: entries.filter((e) => e.at === cut),
    };
  }
  function arrived(events) {
    const important = events.filter(
      (e) =>
        (e.kind === "documents" && s.tasks.documents === "ready") ||
        e.kind === "reply" ||
        (e.kind === "appointment" && s.called) ||
        (e.kind === "missed" && s.appointment?.status === "Missed") ||
        (e.kind === "deadline" && Commitments.current()?.status === "failed") ||
        (e.kind === "standby" && s.standby?.status === "Offered") ||
        (e.kind === "standby-end" &&
          !["Waiting", "Offered"].includes(s.standby?.status)),
    );
    if (!important.length) return;
    normalize(s);
    const titles = important.map((e) =>
      e.kind === "reply" ? "A scheduled reply arrived" : e.title,
    );
    s.timelineStops.push({ day: s.day, time: s.time, titles });
    if (s.timelineStops.length > 80) s.timelineStops.shift();
    pausePlan(
      `${titles.join("; ")}. Review the update, then explicitly continue or change your plan.`,
    );
  }
  function open() {
    pausePlan("Your plan is paused while you review the timeline.");
    const list = boundaries().filter((e) => e.visible),
      p = s.plan;
    const remaining = p?.steps.reduce((n, x) => n + x.minutes, 0) ?? 0;
    showModal(
      "Your world's timeline",
      `<button class="desk-back" id="timeline-back">← World desk</button><div class="timeline-now"><span class="eyebrow">GAME TIME · DAY ${s.day}</span><strong> · ${time(s.time)}</strong><p>${esc(s.scene)} · ${esc(s.area)} · Time is paused</p></div><p>Thinking, typing, listening and time away do not move this clock. Only your game actions move time forward.</p>${p ? `<div class="notice-card"><strong>${esc(p.label)}</strong><br>${esc(p.status)} · ${remaining} game minutes remain. Committed travel and completed work stay in the record.</div>` : '<div class="notice-card">No action is running. Choose what to do when you are ready.</div>'}${s.itinerary ? `<p class="desk-note">Itinerary: ${esc(s.itinerary.status)} · ${s.itinerary.steps.filter((x) => x.status === "completed").length} of ${s.itinerary.steps.length} steps completed.</p>` : ""}<h3 class="desk-section">Next known checkpoints</h3>${
        list.length
          ? list
              .slice(0, 12)
              .map(
                (e) =>
                  `<div class="detail-row"><div><strong>${label(e.at)} · ${esc(e.title)}</strong><p>${esc(e.detail)}</p></div><span class="status-chip">${esc(e.source)}</span></div>`,
              )
              .join("")
          : "<p>No confirmed time checkpoint is currently known. Private routines and unread message content are not shown here.</p>"
      }<h3 class="desk-section">Why the plan stopped</h3>${
        s.timelineStops?.length
          ? s.timelineStops
              .slice(-4)
              .reverse()
              .map(
                (e) =>
                  `<p class="desk-note">Day ${e.day} · ${time(e.time)} · ${esc(e.titles.join("; "))}</p>`,
              )
              .join("")
          : '<p class="desk-note">No scheduled interruption recorded yet.</p>'
      }<h3 class="desk-section">Recent game-time changes</h3>${
        s.logs
          .filter((e) => /game minute|checkpoint/i.test(e.text))
          .slice(-6)
          .reverse()
          .map(
            (e) =>
              `<p class="desk-note">Day ${e.day} · ${time(e.time)} · ${esc(e.text)}</p>`,
          )
          .join("") || '<p class="desk-note">No time has moved yet.</p>'
      }`,
      [
        ...(p
          ? [
              {
                label: "Resume this action",
                action: () => worldCommand("Continue the plan."),
              },
            ]
          : []),
        { label: "Review itinerary", action: () => Plans.open() },
      ],
      "WORLD TIMELINE",
    );
    $("timeline-back").onclick = () => WorldDesk.open();
  }
  return { normalize, boundaries, points, slice, arrived, label, open };
})();
