/* Deadline attempts are append-only. A remedy is a new arrangement, never rewritten history. */
const Commitments = (() => {
  function normalize(st) {
    st.commitmentAttempts ??= [];
    if (
      !st.commitmentAttempts.length &&
      ["overdue", "cancelled"].includes(st.tasks.key)
    ) {
      st.commitmentAttempts.push({
        id: crypto.randomUUID(),
        task: "key",
        status: st.tasks.key === "overdue" ? "failed" : "cancelled",
        accepted: null,
        due: null,
        followup: false,
        changes: [],
        migrated: true,
      });
    }
    return st;
  }
  const current = () =>
    s.commitmentAttempts.filter((a) => a.task === "key").at(-1);
  function record(due, followup = false) {
    const a = {
      id: crypto.randomUUID(),
      task: "key",
      status: "active",
      accepted: { day: s.day, time: s.time },
      due,
      followup,
      priorTaskStatus: followup ? s.tasks.key : null,
      changes: [],
    };
    s.commitmentAttempts.push(a);
    log(
      `${followup ? "Follow-up" : "Original"} key handover agreed, due ${Calendar.label(due)}.`,
    );
    return a;
  }
  function tick() {
    if (s.tasks.key === "accepted" && !current())
      record({ day: s.day, time: s.taskPresets.key.deadlineTime ?? 720 });
    const a = current();
    if (!a || a.status !== "active") return;
    if (s.items.key === WorldDesk.route("Sarah")) {
      a.status = "completed";
      a.finished = { day: s.day, time: s.time };
      if (a.followup) s.tasks.key = a.priorTaskStatus ?? "overdue";
      log(
        `${a.followup ? "Follow-up" : "Original"} key handover completed by physical transfer; previous attempts retained.`,
      );
      return;
    }
    if (Calendar.now() > Calendar.at(a.due)) {
      a.status = "failed";
      a.finished = { day: s.day, time: s.time };
      s.tasks.key = "overdue";
      s.npcs[WorldDesk.route("Sarah")].trust = "Needs a new arrangement";
      log(
        `Key handover attempt ${a.id.slice(0, 8)} missed ${Calendar.label(a.due)}. It remains failed; no automatic extension.`,
      );
      npc(
        "Sarah",
        "The agreed key handover time has passed. I still do not have the key. Please ask for a new handover time if you want to make another arrangement.",
        { opened: false },
      );
      pausePlan(
        "A commitment deadline passed. Review Sarah’s IM before continuing.",
      );
    }
  }
  function handover() {
    tick();
    const a = current();
    if (a?.status === "failed") {
      s.tasks.key = "overdue";
      log(
        "Late key delivery recorded without erasing the missed commitment. No follow-up had been agreed.",
      );
    }
    if (a?.followup) s.tasks.key = a.priorTaskStatus ?? "overdue";
  }
  function detail() {
    const attempts = s.commitmentAttempts.filter((a) => a.task === "key");
    showModal(
      "A promise has a history",
      `<p>Default: an accepted morning key request is due at ${time(s.taskPresets.key.deadlineTime ?? 720)} on the acceptance day. Change this preset before accepting the request. Ignoring an invitation creates no deadline. A new arrangement needs Sarah’s actual acceptance in IM.</p>${attempts.length ? attempts.map((a, i) => `<article class="expression-entry"><span class="eyebrow">${a.followup ? "FOLLOW-UP" : "ORIGINAL"} · ${esc(a.status.toUpperCase())}</span><h3>Handover ${i + 1} · ${a.due ? Calendar.label(a.due) : "Earlier saved arrangement"}</h3><p>${a.migrated ? "Imported from your earlier task status. Exact acceptance time and deadline were not stored; no missing facts have been invented." : `Accepted: ${Calendar.label(a.accepted)}`}${a.finished ? `<br>Result recorded: ${Calendar.label(a.finished)}` : ""}</p>${a.changes.map((c) => `<p class="desk-note">Agreed deadline changed from ${Calendar.label(c.from)} to ${Calendar.label(c.to)} on ${Calendar.label(c.at)}.</p>`).join("")}</article>`).join("") : '<div class="notice-card">No key commitment accepted yet.</div>'}<p>To renegotiate, write your own message, for example: “Please change the key handover to 14:00 today.” After failure, ask: “Please arrange a new key handover at 09:00 tomorrow.” Completion still requires handing over the real key.</p>`,
      [
        { label: "Back to tasks", action: () => Life.openTasks() },
        {
          label: "Open Sarah’s IM",
          primary: true,
          action: () => selectContact(WorldDesk.route("Sarah")),
        },
      ],
      "COMMITMENTS & FOLLOW-UPS",
    );
  }
  function input(text, who) {
    if (WorldDesk.behavior(who) !== "Sarah") return false;
    const t = text.toLowerCase(),
      a = current();
    if (
      /key/.test(t) &&
      /change|extend|reschedule|new.*handover|arrange.*handover/.test(t)
    ) {
      const m = t.match(/(\d{1,2}):(\d{2})/),
        d = t.match(/day (\d+)/);
      if (!m) {
        npc(
          who,
          "Please suggest a specific HH:MM and today, tomorrow or day N. Nothing has changed yet.",
        );
        return true;
      }
      if (+m[1] > 23 || +m[2] > 59) {
        npc(who, "Use a valid 24-hour time. Our arrangement is unchanged.");
        return true;
      }
      const due = {
        day: d ? +d[1] : s.day + (/tomorrow/.test(t) ? 1 : 0),
        time: +m[1] * 60 + +m[2],
      };
      const p = s.npcs[who];
      if (
        due.day < s.day ||
        due.day > s.day + 6 ||
        due.time < p.start ||
        due.time >= p.end ||
        Calendar.at(due) <= Calendar.now() + s.pending + s.settings.simple
      ) {
        npc(
          who,
          `Choose a future time during my ${time(p.start)}–${time(p.end)} active hours, within the next seven game days.`,
        );
        return true;
      }
      if (s.items.key === who) {
        npc(who, "I already have the key. No duplicate handover is needed.");
        return true;
      }
      commit(s.settings.simple, () => {
        if (a?.status === "active") {
          a.changes.push({
            from: { ...a.due },
            to: due,
            at: { day: s.day, time: s.time },
          });
          a.due = due;
          log(
            `Sarah agreed to change the active key deadline to ${Calendar.label(due)}.`,
          );
        } else {
          record(due, !!a);
          if (!a) s.tasks.key = "accepted";
        }
        npc(
          who,
          `Agreed. Please bring the key to me at the entrance by ${Calendar.label(due)}. ${a?.status === "failed" ? "This is a new follow-up; our missed arrangement remains in the record." : "The key has not changed hands yet."}`,
        );
      });
      return true;
    }
    const accepts =
      /(?:i'll|i will|let me|sure|yes|bring).*(?:key|bring|you|now)|^(sure|yes|okay)[.!]?$/.test(
        t,
      ) && !/can't|cannot|won't|not now|sorry/.test(t);
    if (a && accepts) {
      npc(
        who,
        a.status === "failed"
          ? "Our previous handover was missed. Please propose a specific new time for a follow-up."
          : `We already have this handover arrangement: ${a.due ? Calendar.label(a.due) : "earlier saved arrangement"} · ${a.status}. No duplicate promise was created.`,
      );
      return true;
    }
    if (!a && accepts && s.items.key !== who) {
      const m = (s.taskMeta.key ??= {});
      const active = Object.values(s.tasks).filter((v) =>
        [
          "accepted",
          "preparing",
          "booked",
          "registered",
          "in-progress",
          "revision",
          "submitted",
        ].includes(v),
      ).length;
      if (
        active >= s.settings.activeLimit ||
        m.cooldownUntil > s.day * 1440 + s.time ||
        s.time + s.pending + s.settings.simple >=
          (s.taskPresets.key.deadlineTime ?? 720)
      ) {
        npc(
          who,
          "That morning request cannot be accepted under the current deadline, workload or declined-request cooldown. We can explicitly agree on a suitable new handover time.",
        );
        return true;
      }
    }
    if (/can't|cannot|won't|not now|no,|sorry/.test(t) && /key|bring/.test(t)) {
      commit(s.settings.simple, () => {
        if (a?.status === "active") {
          a.status = "cancelled";
          a.finished = { day: s.day, time: s.time };
          s.tasks.key = a.followup ? "overdue" : "cancelled";
        } else if (!a) {
          s.tasks.key = "declined";
          (s.taskMeta.key ??= {}).cooldownUntil =
            s.day * 1440 + s.time + s.settings.cooldown * 60;
        }
        npc(
          who,
          "Thank you for letting me know. I will make another arrangement. Any earlier missed handover remains in our record.",
        );
        log(
          "Sarah acknowledged your refusal or cancellation. Earlier attempts remain unchanged.",
        );
      });
      return true;
    }
    if (
      s.tasks.documents === "completed" &&
      /prepare|organize|organise/.test(t) &&
      /document|folder/.test(t)
    ) {
      npc(
        who,
        "That folder was already prepared and collected. The completed task is retained; a new need would require a different request.",
      );
      return true;
    }
    return false;
  }
  function checkpoint() {
    const a = current();
    return a?.status === "active" ? Calendar.at(a.due) + 1 : Infinity;
  }
  return { normalize, tick, handover, detail, input, checkpoint, current };
})();
