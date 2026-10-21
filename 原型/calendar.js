/* Day-aware hospital capacity, explicit booking and bounded standby queue. */
const Calendar = (() => {
  const closed = ["Completed", "Missed", "Cancelled", "Interrupted"];
  const now = () => (s.day - 1) * 1440 + s.time;
  const at = (a) => ((a?.day ?? s.day) - 1) * 1440 + (a?.time ?? 0);
  const label = (a) => `Day ${a.day ?? s.day} · ${time(a.time)}`;
  function normalize(st) {
    if (st.time >= 1440) {
      st.day += Math.floor(st.time / 1440);
      st.time %= 1440;
    }
    if (st.appointment) st.appointment.day ??= st.day;
    if (st.docDue) st.docDay ??= st.day;
    st.queueHistory ??= [];
    return st;
  }
  function occupied(day, minute) {
    return (
      (s.externalBookings || []).some(
        (a) => a.day === day && a.time === minute,
      ) || (s.externalSlots || [600, 780]).includes(minute)
    );
  }
  function valid(day, minute, cost = 0) {
    return (
      day >= s.day &&
      day <= s.day + 6 &&
      minute >= s.settings.open &&
      minute + 30 <= s.settings.close &&
      minute % 30 === 0 &&
      (day - 1) * 1440 + minute > now() + s.pending + cost &&
      !occupied(day, minute)
    );
  }
  function slots(day = s.day) {
    day = Math.max(s.day, Math.min(day, s.day + 6));
    let html = "";
    for (let t = s.settings.open; t + 30 <= s.settings.close; t += 30) {
      const current =
        s.appointment &&
        (s.appointment.day ?? s.day) === day &&
        s.appointment.time === t &&
        !closed.includes(s.appointment.status);
      const unavailable = !valid(day, t, s.settings.simple);
      html += `<button class="slot-button ${current ? "selected" : ""}" data-slot="${t}" ${unavailable || current ? "disabled" : ""}><strong>${time(t)}</strong><small>${current ? "Your booking" : unavailable ? "Unavailable" : "Available"}</small></button>`;
    }
    showModal(
      "Find a time that fits",
      `<button class="desk-back" id="calendar-back">← World desk</button><p>One doctor, one patient per 30-minute slot. Selecting a time prepares your own reception request.</p><label class="desk-select">Appointment day<select id="calendar-day">${Array.from({ length: 7 }, (_, i) => `<option value="${s.day + i}" ${s.day + i === day ? "selected" : ""}>Day ${s.day + i}${i === 0 ? " · Today" : i === 1 ? " · Tomorrow" : ""}</option>`).join("")}</select></label><div class="slots-grid">${html}</div><p class="desk-note">Current appointment: ${s.appointment ? `${label(s.appointment)} · ${esc(s.appointment.status)}` : "None"}. Sample occupied slots recur daily. No private patient details are shown.</p><button class="secondary-button" id="calendar-queue">Standby queue</button>`,
      [],
      "HOSPITAL SCHEDULE",
    );
    $("calendar-back").onclick = () => WorldDesk.open();
    $("calendar-day").onchange = (e) => slots(+e.target.value);
    $("calendar-queue").onclick = queue;
    document.querySelectorAll("[data-slot]").forEach(
      (b) =>
        (b.onclick = () => {
          const active =
            s.appointment && !closed.includes(s.appointment.status);
          draft(
            `${active ? "Please reschedule my appointment to" : "Please book an appointment at"} ${time(+b.dataset.slot)} on day ${day}.`,
          );
        }),
    );
  }
  function draft(text) {
    const who = WorldDesk.route("Emma");
    const apply = () => {
      $("modal").close();
      selectContact(who);
      s.drafts[activeDraftKey()] = text;
      save();
      render();
      $("command-input").focus();
    };
    if ((s.drafts[`npc:${who}`] || "").trim())
      showModal(
        "Replace the reception draft?",
        "<p>Your unsent words are preserved unless you choose to replace them.</p>",
        [
          { label: "Keep my draft", action: queue },
          { label: "Replace draft", primary: true, action: apply },
        ],
      );
    else apply();
  }
  function queue() {
    const q = s.standby;
    const offerKnown =
      q?.offerMessage &&
      (s.messages[WorldDesk.route("Emma")] || []).some(
        (m) => m.id === q.offerMessage && m.known,
      );
    showModal(
      "A place in line, a clear limit",
      `<button class="desk-back" id="queue-back">← Appointment slots</button><p>Standby is available at Reception with your ID. There are three places, two occupied by local sample requests. Joining holds the third place for at most 30 game minutes, up to closing. It does not reserve a doctor or cancel an appointment.</p><div class="notice-card">${q ? `Ticket ${esc(q.id.slice(0, 8))} · ${esc(q.status)}<br>Joined: ${label(q)}<br>Limit: ${label({ day: q.day, time: q.end })}${q.offer ? (offerKnown ? `<br>Offered slot: ${label(q.offer)} · Respond by ${time(q.offerUntil % 1440)}` : "<br>A reception update is waiting. Read or listen before deciding.") : ""}` : "No active standby ticket."}</div><p>When a supported slot becomes available, reception sends an offer. Accept it explicitly within five game minutes; choosing to wait is separate from joining the queue.</p><div class="desk-toolbar"><button class="primary-button" id="queue-join">Ask to join standby</button><button class="secondary-button" id="queue-leave">Ask to leave standby</button>${q?.status === "Offered" ? `<button class="primary-button" id="queue-accept">${offerKnown ? "Accept offer draft" : "Read reception offer"}</button>` : ""}</div>${s.queueHistory.length ? `<h3>Previous tickets</h3>${s.queueHistory.map((q) => `<p class="desk-note">${label(q)} · ${esc(q.status)}</p>`).join("")}` : ""}`,
      [],
      "HOSPITAL STANDBY",
    );
    $("queue-back").onclick = () => slots();
    $("queue-join").onclick = () => draft("Please join the standby queue.");
    $("queue-leave").onclick = () => draft("Please leave the standby queue.");
    if ($("queue-accept"))
      $("queue-accept").onclick = () => {
        if (offerKnown) draft("I accept the offered standby slot.");
        else {
          $("modal").close();
          const who = WorldDesk.route("Emma");
          const message = (s.messages[who] || []).find(
            (m) => m.id === q.offerMessage,
          );
          if (message) {
            message.opened = true;
            message.seen = true;
            if (message.type === "voice") message.transcript = true;
            learnMessage(message, who);
          }
          selectContact(who);
          save();
          render();
        }
      };
  }
  function finishQueue(status) {
    if (!s.standby || !["Waiting", "Offered"].includes(s.standby.status))
      return;
    s.standby.status = status;
    s.queueHistory.push(structuredClone(s.standby));
    log(
      `Standby ticket ${s.standby.id.slice(0, 8)}: ${status}. Queue place released.`,
    );
  }
  function tick() {
    const q = s.standby;
    if (!q || !["Waiting", "Offered"].includes(q.status)) return;
    const end = (q.day - 1) * 1440 + q.end;
    if (now() >= end || (q.status === "Offered" && now() >= q.offerUntil)) {
      finishQueue(
        q.status === "Offered" ? "Offer expired" : "Wait limit reached",
      );
      npc(
        "Emma",
        "Your standby window has ended. The queue place is released. You may ask for another time; your existing booking, if any, is unchanged.",
        { opened: false },
      );
      pausePlan(
        "The standby window ended. Review reception before continuing.",
      );
      return;
    }
    if (q.status !== "Waiting" || now() < q.ready) return;
    for (let t = s.settings.open; t + 30 <= s.settings.close; t += 30) {
      if (!valid(s.day, t, s.settings.simple)) continue;
      if (
        s.appointment &&
        !closed.includes(s.appointment.status) &&
        at(s.appointment) === (s.day - 1) * 1440 + t
      )
        continue;
      q.status = "Offered";
      q.offer = { day: s.day, time: t };
      q.offerUntil = Math.min(end, now() + 5);
      q.offerMessage = npc(
        "Emma",
        `A standby slot is available on Day ${s.day} at ${time(t)}. If you want it, say “I accept the offered standby slot” before ${time(q.offerUntil % 1440)}. ${s.appointment && !closed.includes(s.appointment.status) ? "Acceptance replaces your current booking." : "No booking has been made yet."}`,
        { opened: false },
      ).id;
      log(
        "Reception offered a supported standby slot. No booking made without acceptance.",
      );
      pausePlan(
        "A standby offer arrived. Read reception and decide before continuing.",
      );
      break;
    }
  }
  function reserve(day, minute, who) {
    const previous = s.appointment;
    const cost = s.pending || s.settings.simple;
    s.pending = 0;
    commit(cost, () => {
      if (previous) {
        s.bookingsHistory.push({
          ...structuredClone(previous),
          releasedDay: s.day,
          releasedTime: s.time,
        });
        log(
          `Previous booking ${label(previous)} · ${previous.status} preserved; unused slot released.`,
        );
      }
      s.appointment = {
        day,
        time: minute,
        duration: s.settings.consultation,
        status: "Booked",
        known: true,
        version: s.presetVersion,
      };
      s.tasks.hospital = "booked";
      s.registered = false;
      s.called = false;
      s.callRead = false;
      s.consulted = false;
      s.consultStart = null;
      s.symptoms = null;
      s.proposedSlot = null;
      finishQueue("Booked");
      npc(
        who,
        `Confirmed for Day ${day} at ${time(minute)}. Bring your ID to Reception on that day. Any previous unused booking has been released.`,
      );
      log(`Reception reserved one doctor slot: Day ${day} · ${time(minute)}.`);
    });
  }
  function input(text, who) {
    const t = text.toLowerCase();
    if (WorldDesk.behavior(who) !== "Emma") return false;
    if (/standby|queue/.test(t)) {
      if (/status|position|how long/.test(t)) {
        const q = s.standby;
        npc(
          who,
          q
            ? `Your standby ticket is ${q.status}. ${["Waiting", "Offered"].includes(q.status) ? `The window ends on Day ${q.day} at ${time(q.end)}.` : "No queue place is held."}`
            : "You have no standby ticket. Joining needs your ID at Reception.",
        );
        return true;
      }
      if (/leave|cancel|withdraw/.test(t)) {
        if (!["Waiting", "Offered"].includes(s.standby?.status)) {
          npc(who, "You have no active standby ticket.");
          return true;
        }
        commit(s.settings.simple, () => {
          finishQueue("Left by request");
          npc(
            who,
            "Your queue place is released. Your appointment is unchanged.",
          );
        });
        return true;
      }
      if (s.time < s.settings.open || s.time >= s.settings.close) {
        npc(who, "Standby is closed. Compare tomorrow’s appointment slots.");
        return true;
      }
      if (
        s.scene !== "Hospital" ||
        s.area !== "Reception" ||
        s.items.id !== "you"
      ) {
        npc(
          who,
          "Come to Reception with your ID before joining or accepting standby.",
        );
        return true;
      }
      if (/accept|take.*slot/.test(t)) {
        if (s.consultStart && !s.consulted) {
          npc(
            who,
            "Finish or explicitly leave your consultation first. No booking changed.",
          );
          return true;
        }
        const q = s.standby;
        if (
          !q ||
          q.status !== "Offered" ||
          now() + s.pending + s.settings.simple >= q.offerUntil
        ) {
          npc(
            who,
            "There is no offer with enough time left to confirm. Ask for another available slot.",
          );
          return true;
        }
        if (
          !(s.messages[WorldDesk.route("Emma")] || []).some(
            (m) => m.id === q.offerMessage && m.known,
          )
        ) {
          npc(
            who,
            "Read or listen to the reception offer before deciding. It has not been accepted.",
          );
          return true;
        }
        if (!valid(q.offer.day, q.offer.time, s.settings.simple)) {
          npc(who, "That offer is no longer available. No booking changed.");
          return true;
        }
        reserve(q.offer.day, q.offer.time, who);
        return true;
      }
      if (/join|add.*me/.test(t)) {
        if (["Waiting", "Offered"].includes(s.standby?.status)) {
          npc(
            who,
            "You already have a standby ticket. No duplicate was created.",
          );
          return true;
        }
        if ((s.sampleQueueCount ?? 2) >= 3) {
          npc(
            who,
            "All three standby places are taken. You can choose a later appointment instead.",
          );
          return true;
        }
        if (s.appointment?.status === "In consultation") {
          npc(who, "Finish or explicitly leave your consultation first.");
          return true;
        }
        if (s.time + s.pending + s.settings.simple + 5 >= s.settings.close) {
          npc(
            who,
            "There is not enough service time left for standby today. Please choose another day.",
          );
          return true;
        }
        commit(s.settings.simple, () => {
          s.standby = {
            id: crypto.randomUUID(),
            day: s.day,
            time: s.time,
            end: Math.min(s.time + 30, s.settings.close),
            ready: now() + 5,
            status: "Waiting",
          };
          npc(
            who,
            `You are third in a three-place standby queue. Your window ends at ${time(s.standby.end)}. No appointment is reserved; any offer needs your acceptance.`,
          );
          log("Joined bounded standby queue after physical ID verification.");
        });
        return true;
      }
      npc(
        who,
        "You may ask to join standby, check your queue status, accept an offered standby slot, or leave standby.",
      );
      return true;
    }
    if (/cancel/.test(t) && /appointment|booking/.test(t) && s.appointment) {
      if (closed.includes(s.appointment.status)) {
        npc(
          who,
          "That appointment is already closed. Its recorded outcome is preserved; no time or booking changed.",
        );
        return true;
      }
      if (s.consultStart && !s.consulted) {
        npc(
          who,
          "You are in a consultation. Finish it or explicitly leave it unfinished before changing the booking.",
        );
        return true;
      }
    }
    if (
      /\d{1,2}:\d{2}/.test(t) &&
      !/here|arrived|check in|\bid\b|delay|late/.test(t)
    ) {
      if (s.time < s.settings.open || s.time >= s.settings.close) {
        npc(
          who,
          `Reception is open ${time(s.settings.open)}–${time(s.settings.close)}. No booking changed.`,
        );
        return true;
      }
      if (s.consultStart && !s.consulted) {
        npc(
          who,
          "Finish or explicitly leave your consultation before arranging a different visit.",
        );
        return true;
      }
      const m = t.match(/(\d{1,2}):(\d{2})/),
        dayMatch = t.match(/(?:on )?day (\d+)/);
      const day = dayMatch
          ? +dayMatch[1]
          : s.day + (/tomorrow/.test(t) ? 1 : 0),
        minute = +m[1] * 60 + +m[2];
      if (+m[1] > 23 || +m[2] > 59) {
        npc(who, "Use a valid 24-hour time, such as 09:30. Nothing changed.");
        return true;
      }
      if (!/book|reschedule|change|move|reserve/.test(t)) {
        npc(
          who,
          "Is that a booking request? Say “Please book an appointment at HH:MM on day N” or ask to reschedule. Nothing changed.",
        );
        return true;
      }
      if (!valid(day, minute, s.settings.simple)) {
        npc(
          who,
          "That slot is unavailable. Please choose another time from the schedule. Bookings cover today and the next six days.",
        );
        return true;
      }
      const a = s.appointment;
      if (a && !closed.includes(a.status)) {
        if ((a.day ?? s.day) === day && a.time === minute) {
          npc(
            who,
            "That is already your appointment. No duplicate was created.",
          );
          return true;
        }
        if (!/reschedule|change|move/.test(t)) {
          npc(
            who,
            "You already have a booking. Ask explicitly to reschedule if you want to change it.",
          );
          return true;
        }
      }
      reserve(day, minute, who);
      return true;
    }
    if (
      /here|arrived|check in|\bid\b/.test(t) &&
      s.appointment &&
      !/need|bring|should/.test(t)
    ) {
      if (
        closed.includes(s.appointment.status) ||
        at(s.appointment) + 5 < now() + s.pending + s.settings.simple
      ) {
        npc(
          who,
          "That visit is no longer open for check-in. Request another available slot or join standby at Reception.",
        );
        return true;
      }
      if ((s.appointment.day ?? s.day) !== s.day) {
        npc(
          who,
          `Your booking is ${label(s.appointment)}. Check in on that day; no arrival has been registered.`,
        );
        return true;
      }
    }
    return false;
  }
  return {
    now,
    at,
    label,
    normalize,
    slots,
    queue,
    tick,
    input,
    valid,
    closed,
  };
})();
