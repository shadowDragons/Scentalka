/* Daily routines use the same locations and availability rules as the map and IM. */
const Schedules = (() => {
  const hospitalAreas = {
    Emma: "Reception",
    Daniel: "Consultation Room",
    Grace: "Waiting Area",
    Leo: "Pharmacy",
  };
  function rows(p) {
    return (
      p.schedule || [
        {
          start: p.start,
          end: p.end,
          scene: p.scene,
          area: p.area,
          activity: "Daily responsibilities",
          reply: true,
        },
      ]
    );
  }
  function normalize(st) {
    for (const [id, p] of Object.entries(st.npcs)) {
      p.schedule ??=
        id === "Nora"
          ? [
              {
                start: 480,
                end: 600,
                scene: "Road",
                area: "Sidewalk",
                activity: "Neighborhood errands",
                reply: true,
              },
              {
                start: 960,
                end: 1080,
                scene: "Road",
                area: "Sidewalk",
                activity: "Evening walk",
                reply: true,
              },
            ]
          : rows(p);
    }
    st.observedRoutines ??= {};
    return st;
  }
  function slot(p, st = s) {
    return p && !p.archived
      ? rows(p).find((r) => st.time >= r.start && st.time < r.end)
      : null;
  }
  function available(p, st = s) {
    return !!slot(p, st)?.reply;
  }
  function located(p, st = s) {
    const r = slot(p, st);
    return !!r && r.scene === st.scene && r.area === st.area;
  }
  function next(p, st = s) {
    if (!p || p.archived) return null;
    const now = (st.day - 1) * 1440 + st.time;
    for (let day = st.day; day <= st.day + 1; day++)
      for (const r of rows(p)
        .filter((r) => r.reply)
        .sort((a, b) => a.start - b.start)) {
        const start = (day - 1) * 1440 + r.start,
          end = (day - 1) * 1440 + r.end;
        if (end > now)
          return { day, due: Math.max(now, start) - (day - 1) * 1440 };
      }
    return null;
  }
  function travel(a, b) {
    if (a.scene === b.scene) return a.area === b.area ? 0 : s.settings.move;
    if ([a.scene, b.scene].includes("Road"))
      return [a.scene, b.scene].includes("Home")
        ? s.settings.trip / 3
        : (s.settings.trip * 2) / 3;
    return s.settings.trip;
  }
  function covers(
    p,
    start = s.settings.open,
    end = s.settings.close,
    role = p.service,
  ) {
    let cursor = start;
    for (const r of rows(p)
      .filter(
        (r) =>
          r.scene === "Hospital" &&
          r.reply &&
          (!hospitalAreas[role] || r.area === hospitalAreas[role]),
      )
      .sort((a, b) => a.start - b.start)) {
      if (r.start > cursor) break;
      if (r.end > cursor) cursor = r.end;
    }
    return cursor >= end;
  }
  function validate(list, p) {
    if (!list.length || list.length > 8)
      return "Use one to eight daily time blocks.";
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      if (
        !Number.isFinite(r.start) ||
        !Number.isFinite(r.end) ||
        r.start < 0 ||
        r.end > 1439 ||
        r.end <= r.start ||
        !WorldDesk.areas[r.scene]?.includes(r.area) ||
        !WorldDesk.english(r.activity)
      )
        return "Use valid same-day times, supported areas and English activities. Split overnight routines across midnight.";
      if (i && list[i - 1].end > r.start)
        return "Time blocks must not overlap.";
      if (i && r.start - list[i - 1].end < travel(list[i - 1], r))
        return "Leave enough game time between different locations for the actual route.";
    }
    if (travel(list.at(-1), list[0]) > 1440 - list.at(-1).end + list[0].start)
      return "Leave enough travel time between the last block and the next morning.";
    if (hospitalAreas[p.service] && !covers({ ...p, schedule: list }))
      return "This required hospital duty must cover its service area and full opening window without a gap. Change service hours or arrange a successor first.";
    if (p.service === "Sarah" && s.docDue)
      return "Finish the accepted document work before changing this routine.";
    if (p.service === "Sarah" && Commitments.current()?.status === "active") {
      const due = Commitments.current().due;
      if (
        !list.some(
          (r) =>
            r.reply &&
            r.scene === p.scene &&
            r.area === p.area &&
            r.start <= due.time &&
            r.end > due.time,
        )
      )
        return "The agreed key deadline needs an available handover at the existing meeting place. Renegotiate that commitment first.";
    }
    return null;
  }
  function editor(id, draft) {
    const p = s.npcs[id];
    if (!p || p.archived) return;
    let list = structuredClone(draft || rows(p));
    const read = () =>
      Array.from(document.querySelectorAll("[data-routine]")).map((el, i) => {
        const minutes = (x) => {
          const bits = x.split(":");
          return bits.length === 2 ? +bits[0] * 60 + +bits[1] : NaN;
        };
        return {
          start: minutes($("routine-start-" + i).value),
          end: minutes($("routine-end-" + i).value),
          scene: $("routine-scene-" + i).value,
          area: $("routine-area-" + i).value,
          activity: $("routine-activity-" + i).value.trim(),
          reply: $("routine-reply-" + i).checked,
        };
      });
    showModal(
      `${p.name} · a day in their life`,
      `<p>This is the creator’s schedule view. Gaps mean no observed location or promised reply. Activities marked unavailable can appear on the map but do not offer IM replies. Travel gaps are required between different places.</p>${list
        .map(
          (r, i) =>
            `<fieldset class="routine-block" data-routine="${i}"><legend>Time block ${i + 1}</legend><div class="form-grid"><label>From<input id="routine-start-${i}" type="time" value="${time(r.start)}"></label><label>Until<input id="routine-end-${i}" type="time" value="${time(r.end)}"></label><label>Scene<select id="routine-scene-${i}">${Object.keys(
              WorldDesk.areas,
            )
              .map(
                (x) =>
                  `<option ${x === r.scene ? "selected" : ""}>${x}</option>`,
              )
              .join(
                "",
              )}</select></label><label>Area<select id="routine-area-${i}">${WorldDesk.areas[r.scene].map((x) => `<option ${x === r.area ? "selected" : ""}>${x}</option>`).join("")}</select></label><label class="full">Activity<input id="routine-activity-${i}" value="${esc(r.activity)}" maxlength="100"></label><label class="check-label"><input id="routine-reply-${i}" type="checkbox" ${r.reply ? "checked" : ""}>Available to reply</label></div><button class="text-button" data-remove-routine="${i}">Remove block</button></fieldset>`,
        )
        .join(
          "",
        )}<button class="secondary-button" id="routine-add">Add time block</button>`,
      [
        { label: "Back to people", action: () => WorldDesk.open("people") },
        {
          label: "Preview routine",
          primary: true,
          action: () => {
            list = read().sort((a, b) => a.start - b.start);
            const error = validate(list, p);
            if (error)
              return showModal(
                "This routine needs a change",
                `<div class="notice-card">${esc(error)}</div>`,
                [
                  {
                    label: "Keep editing",
                    primary: true,
                    action: () => editor(id, list),
                  },
                ],
                "ROUTINE CHECK",
              );
            showModal(
              "A routine the world can follow",
              `<p>Future map locations and reply times will follow these blocks. Past messages, ownership and commitments remain.</p>${list.map((r) => `<div class="detail-row"><div><strong>${time(r.start)}–${time(r.end)}</strong><p>${esc(r.scene)} · ${esc(r.area)}<br>${esc(r.activity)} · ${r.reply ? "Available" : "No IM reply"}</p></div></div>`).join("")}`,
              [
                { label: "Keep editing", action: () => editor(id, list) },
                {
                  label: "Save routine",
                  primary: true,
                  action: () => {
                    p.schedule = list;
                    for (const q of s.replyQueue.filter((q) => q.who === id)) {
                      const replyAt = next(p);
                      if (replyAt) {
                        q.day = replyAt.day;
                        q.due = replyAt.due;
                      }
                    }
                    p.start = list[0].start;
                    p.end = list.at(-1).end;
                    s.presetVersion++;
                    log(
                      `Updated ${p.name}’s future daily routine. Existing commitments and past records were preserved.`,
                    );
                    save();
                    render();
                    WorldDesk.open("people");
                  },
                },
              ],
              "ROUTINE PREVIEW",
            );
          },
        },
      ],
      "DAILY ROUTINES",
    );
    $("routine-add").onclick = () => {
      list = read();
      if (list.length >= 8) return toast("Use at most eight daily blocks.");
      const last = list.at(-1);
      list.push({
        start: Math.min((last?.end ?? 480) + 30, 1320),
        end: Math.min((last?.end ?? 480) + 90, 1439),
        scene: last?.scene || p.scene,
        area: last?.area || p.area,
        activity: "Personal time",
        reply: true,
      });
      editor(id, list);
    };
    document.querySelectorAll("[data-remove-routine]").forEach(
      (b) =>
        (b.onclick = () => {
          list = read();
          list.splice(+b.dataset.removeRoutine, 1);
          editor(id, list);
        }),
    );
    list.forEach(
      (r, i) =>
        ($("routine-scene-" + i).onchange = () => {
          $("routine-area-" + i).innerHTML = WorldDesk.areas[
            $("routine-scene-" + i).value
          ]
            .map((x) => `<option>${esc(x)}</option>`)
            .join("");
        }),
    );
  }
  function tick() {
    for (const [id, p] of Object.entries(s.npcs)) {
      const r = slot(p),
        stamp = r ? `${s.day}:${r.start}:${r.scene}:${r.area}` : "";
      if (stamp && stamp !== s.observedRoutines[id] && r.scene === s.scene) {
        s.observedRoutines[id] = stamp;
        log(
          `Observed ${p.name} at ${r.scene} · ${r.area} during their routine.`,
        );
      }
    }
  }
  function split(steps) {
    let cursor = Calendar.now();
    const result = [];
    for (const step of steps) {
      const end = cursor + step.minutes;
      const points = new Set(Timeline.points(cursor, end));
      for (const q of s.replyQueue) {
        const at = (q.day - 1) * 1440 + q.due;
        if (at > cursor && at < end) points.add(at);
      }
      const sorted = [...points].sort((a, b) => a - b);
      let partStart = cursor;
      for (const at of [...sorted, end]) {
        const finalPart = at === end;
        result.push({
          ...step,
          minutes: at - partStart,
          scene: finalPart ? step.scene : undefined,
          area: finalPart ? step.area : undefined,
          effect: finalPart ? step.effect : undefined,
          event: finalPart ? step.event : undefined,
          log: finalPart ? step.log : "Reached a scheduled world checkpoint.",
        });
        partStart = at;
      }
      cursor = end;
    }
    return result;
  }
  function world(text) {
    if (/^(open|show) daily routines[.!]?$/i.test(text)) {
      WorldDesk.open("people");
      return true;
    }
    if (!/^wait\b.*reply/i.test(text)) return false;
    const matches = Object.entries(s.npcs).filter(
      ([id, p]) =>
        text.toLowerCase().includes(p.name.toLowerCase()) ||
        text.toLowerCase().includes(id.toLowerCase()),
    );
    if (matches.length !== 1) {
      feedback(
        "Name the person whose reply you want to wait for. No time passed.",
      );
      return true;
    }
    const [id, p] = matches[0],
      queued = s.replyQueue.find((q) => q.who === id);
    if (!queued) {
      feedback(
        "There is no confirmed reply arrangement for that person. You can use a bounded wait or continue with your day.",
      );
      return true;
    }
    const next = nextReply(queued, p);
    if (!next) {
      feedback(
        "There is no future reply block in this person’s routine. The delivered message remains saved; no unlimited wait was started.",
      );
      return true;
    }
    queued.day = next.day;
    queued.due = next.due;
    const n = Math.min(
      s.settings.wait,
      Math.max(
        0,
        (next.day - 1) * 1440 + next.due - Calendar.now() - s.pending,
      ),
    );
    if (!n) {
      Life.tick();
      save();
      render();
      return true;
    }
    planStart(
      `Wait for ${p.name}’s reply, up to ${n} minutes`,
      [
        {
          minutes: n,
          done: "Your bounded reply wait ended. Check the person’s IM for any new update.",
        },
      ],
      "wait",
    );
    return true;
  }
  function nextReply(q, p) {
    return next(p);
  }
  return {
    normalize,
    validate,
    rows,
    slot,
    available,
    located,
    next,
    covers,
    editor,
    tick,
    split,
    world,
    hospitalAreas,
  };
})();
