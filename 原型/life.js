/* Deterministic local simulation: tasks, writing, everyday actions and recovery. */
const Life = (() => {
  const templates = {
    key: {
      title: "Hand over the house key",
      from: "Sarah",
      goal: "Agree on the handover, take the actual key and give it to Sarah at the entrance.",
      deadline: "This morning",
      result: "The key has changed owner through an action.",
    },
    documents: {
      title: "Prepare the appointment documents",
      from: "Sarah",
      goal: "Ask Sarah to prepare the existing folder, wait for her update and collect it.",
      deadline: "Start before 09:00",
      result: "The prepared folder is collected, not created from a chat.",
    },
    hospital: {
      title: "Arrange a hospital visit",
      from: "Emma",
      goal: "Book a valid slot, bring ID, check in and complete the consultation.",
      deadline: "Five-minute arrival grace",
      result: "Consultation completed in the reserved service slot.",
    },
    route: {
      title: "Find the right route",
      from: "Ben",
      goal: "Choose a supported route to the hospital, then actually arrive.",
      deadline: "Your chosen arrangement",
      result: "Arrival at the hospital, with actual travel time recorded.",
    },
    delay: {
      title: "Explain a delay",
      from: "Emma",
      goal: "Write your own message to reception about the known delay and decide whether to keep or change the booking.",
      deadline: "Before your appointment",
      result:
        "Your message was sent and an explicit schedule decision was made.",
    },
    summary: {
      title: "Summarize the next steps",
      from: "Daniel",
      goal: "Write the next steps, a time and a relevant caution, using only facts discussed in the consultation.",
      deadline: "No imposed deadline",
      result: "A submitted, reviewed version with all required information.",
    },
  };
  function normalize(st) {
    st.taskMeta ??= {};
    st.taskPresets ??= structuredClone(templates);
    st.taskPresets.key.deadlineTime ??= 720;
    st.taskDrafts ??= {};
    st.events ??= [];
    st.replyQueue ??= [];
    st.requests ??= [];
    st.bookingsHistory ??= [];
    st.completedActions ??= {};
    st.invitationDays ??= {};
    st.helpTrail ??= [];
    st.tasks.route ??= "none";
    st.tasks.delay ??= "none";
    st.tasks.summary ??= "none";
    return st;
  }
  function abs() {
    return s.day * 1440 + s.time;
  }
  function meta(k) {
    return (s.taskMeta[k] ??= {});
  }
  function rowStatus(k) {
    if (k === "hospital" && s.appointment)
      return s.appointment.status.toLowerCase();
    return s.tasks[k];
  }
  function available(k) {
    return (
      k === "key" ||
      k === "documents" ||
      k === "hospital" ||
      k === "route" ||
      (k === "delay" && s.roadEvent && s.appointment) ||
      (k === "summary" && s.consulted)
    );
  }
  function activeCount() {
    return (
      (Commitments.current()?.followup &&
      Commitments.current().status === "active"
        ? 1
        : 0) +
      Object.values(s.tasks).filter((v) =>
        [
          "accepted",
          "preparing",
          "booked",
          "registered",
          "in-progress",
          "submitted",
          "revision",
        ].includes(v),
      ).length
    );
  }
  function openTasks() {
    showModal(
      "The things you choose to take on",
      `<button class="desk-back" data-life-back>← World desk</button><p>Requests are not promises. Accept only what you choose; refusal does not create a missed commitment.</p>${Object.entries(
        s.taskPresets,
      )
        .filter(([k]) => available(k) || s.tasks[k] !== "none")
        .map(
          ([k, t]) =>
            `<div class="detail-row"><div><strong>${esc(t.title)}</strong><p>${esc(t.deadline)} · ${esc(personName(WorldDesk.route(t.from)))}</p></div><span class="status-chip">${esc(rowStatus(k))}</span><button class="text-button" data-task-detail="${k}">Details</button></div>`,
        )
        .join("")}`,
      [],
      "TASKS & WRITTEN WORK",
    );
    bind();
  }
  function bind() {
    document
      .querySelectorAll("[data-life-back]")
      .forEach((b) => (b.onclick = () => WorldDesk.open()));
    document
      .querySelectorAll("[data-task-detail]")
      .forEach((b) => (b.onclick = () => taskDetail(b.dataset.taskDetail)));
  }
  function taskDetail(k) {
    const t = s.taskPresets[k],
      state = rowStatus(k),
      m = meta(k);
    const accepted = [
      "accepted",
      "preparing",
      "booked",
      "registered",
      "in-progress",
      "revision",
      "submitted",
    ].includes(state);
    const actions = [{ label: "Back to tasks", action: openTasks }];
    if (k === "key")
      actions.push({
        label: "Commitment history & follow-up",
        action: () => Commitments.detail(),
      });
    if (["none", "invited", "deferred", "declined"].includes(state))
      actions.push({ label: "Edit request preset", action: () => editTask(k) });
    if (["none", "invited", "deferred", "declined"].includes(state))
      actions.push(
        { label: "Not now", action: () => changeTask(k, "deferred") },
        { label: "Decline request", action: () => changeTask(k, "declined") },
        {
          label: "Accept request",
          primary: true,
          action: () => changeTask(k, "accepted"),
        },
      );
    if (accepted && k !== "hospital" && k !== "documents")
      actions.push({
        label: "Cancel commitment",
        action: () => changeTask(k, "cancelled"),
      });
    if (
      k === "summary" &&
      ["accepted", "revision", "submitted", "completed"].includes(state)
    )
      actions.push({
        label:
          state === "completed" ? "View submitted work" : "Open writing desk",
        primary: true,
        action: () => artifact(),
      });
    else
      actions.push({
        label: "Prepare next step",
        primary: true,
        action: () => prepareTask(k),
      });
    showModal(
      t.title,
      `<p>${esc(t.goal)}</p><div class="notice-card">From: ${esc(personName(WorldDesk.route(t.from)))}<br>Status: ${esc(state)}<br>Deadline: ${k === "key" ? `Day ${s.day} · ${time(t.deadlineTime)} (on acceptance day)` : esc(t.deadline)}<br>Completion: ${esc(t.result)}${m.accepted ? `<br>Accepted: Day ${m.day} · ${time(m.accepted)}` : ""}</div><p class="desk-note">Alternative: ask the named contact to clarify or change the arrangement. Cancelling travel does not cancel a booking. Accepted service commitments must be changed through the service IM.</p>`,
      actions,
      "YOUR CHOICE",
    );
  }
  function editTask(k) {
    const p = s.taskPresets[k];
    showModal(
      "Shape the request, keep the rules",
      `<p>Edit the unaccepted request. Its supported action, responsible service and completion evidence are fixed. Accepted commitments must be renegotiated, not rewritten.</p><div class="form-grid"><label class="full">Request title<input id="task-title" value="${esc(p.title)}" maxlength="100"></label><label class="full">Goal wording<textarea id="task-goal" rows="3" maxlength="600">${esc(p.goal)}</textarea></label>${k === "key" ? `<label>Morning handover deadline<input id="task-deadline" type="time" value="${time(p.deadlineTime)}"></label>` : ""}</div><div class="notice-card">Contact: ${esc(personName(WorldDesk.route(p.from)))}<br>Deadline rule: ${esc(p.deadline)}<br>Required evidence: ${esc(p.result)}</div>`,
      [
        { label: "Back", action: () => taskDetail(k) },
        {
          label: "Review request wording",
          primary: true,
          action: () => {
            const title = $("task-title").value.trim(),
              goal = $("task-goal").value.trim();
            const deadlineTime =
              k === "key"
                ? $("task-deadline")
                    .value.split(":")
                    .reduce((h, m, i) => (i === 0 ? +m : h * 60 + +m), 0)
                : null;
            const owner = s.npcs[WorldDesk.route("Sarah")];
            if (
              k === "key" &&
              (!Number.isFinite(deadlineTime) ||
                deadlineTime <= owner.start ||
                deadlineTime >= Math.min(owner.end, 780))
            )
              return toast(
                "Choose a morning deadline after Sarah starts and before 13:00 or her shift end.",
              );
            if (!WorldDesk.english(title) || !WorldDesk.english(goal))
              return toast("Use English for the request title and goal.");
            showModal(
              "Save this unaccepted request?",
              `<div class="notice-card"><strong>${esc(title)}</strong><br>${esc(goal)}${k === "key" ? `<br>Morning handover deadline: ${time(deadlineTime)}` : ""}</div><p>Changing the wording does not expand the supported actions or alter completion rules.</p>`,
              [
                { label: "Keep editing", action: () => editTask(k) },
                {
                  label: "Save request preset",
                  primary: true,
                  action: () => {
                    if (
                      !["none", "invited", "deferred", "declined"].includes(
                        rowStatus(k),
                      )
                    )
                      return feedback(
                        "This request has already been accepted. Renegotiate it with the contact.",
                      );
                    s.taskPresets[k] = {
                      ...p,
                      title,
                      goal,
                      ...(k === "key" ? { deadlineTime } : {}),
                    };
                    s.presetVersion++;
                    log(`Unaccepted request preset updated: ${title}.`);
                    save();
                    taskDetail(k);
                  },
                },
              ],
            );
          },
        },
      ],
      "TASK PRESET",
    );
  }
  function changeTask(k, status) {
    const m = meta(k);
    if (status === "accepted") {
      if (
        k === "key" &&
        s.time + s.pending + s.settings.simple >= s.taskPresets.key.deadlineTime
      )
        return feedback(
          "The morning deadline has passed. Ask Sarah in IM to agree on a specific new handover time.",
          "A new arrangement is needed",
        );
      if (activeCount() >= s.settings.activeLimit)
        return feedback(
          "Your active task limit is reached. Finish or renegotiate a commitment before taking on another optional task.",
          "A little room first",
        );
      if (m.cooldownUntil > abs())
        return feedback(
          "You declined this same request recently. It stays in cooldown until a later game date or a genuinely new situation.",
          "Request cooling down",
        );
      s.tasks[k] = status;
      m.accepted = s.time;
      m.day = s.day;
      log(`You explicitly accepted: ${s.taskPresets[k].title}.`);
      if (k === "summary") {
        save();
        render();
        return artifact();
      }
    } else {
      s.tasks[k] = status;
      if (status === "declined")
        m.cooldownUntil = abs() + s.settings.cooldown * 60;
      log(`You ${status} the request: ${s.taskPresets[k].title}.`);
    }
    save();
    render();
    taskDetail(k);
  }
  function prepareTask(k) {
    const draft = {
      key: ["npc", "Sarah", "Do you need the house key this morning?"],
      documents: ["npc", "Sarah", "Please prepare the appointment documents."],
      hospital: ["npc", "Emma", "Which appointment slots are available today?"],
      route: ["world", null, "Walk to the hospital."],
      delay: [
        "npc",
        "Emma",
        `My bus is delayed. ${s.appointment ? `I have an appointment at ${time(s.appointment.time)}. ` : ""}What are my options?`,
      ],
      summary: [
        "npc",
        "Daniel",
        "What next steps should I include in my summary?",
      ],
    }[k];
    const apply = () => {
      $("modal").close();
      if (draft[1]) selectContact(WorldDesk.route(draft[1]));
      else setMode(draft[0]);
      s.drafts[activeDraftKey()] = draft[2];
      render();
      $("command-input").focus();
    };
    if (
      (
        s.drafts[draft[1] ? `npc:${WorldDesk.route(draft[1])}` : "world"] || ""
      ).trim()
    )
      showModal(
        "Replace the unfinished draft?",
        `<p>The suggested next step is only a draft. Nothing is sent and no time passes.</p>`,
        [
          { label: "Keep my draft", action: openTasks },
          { label: "Replace draft", primary: true, action: apply },
        ],
      );
    else apply();
  }
  function artifact() {
    s.artifacts.summary ??= { draft: "", versions: [], feedback: "" };
    const a = s.artifacts.summary;
    const last = a.versions.at(-1);
    const accepted = last?.status === "Accepted";
    showModal(
      "A note in your own words",
      `<button class="desk-back" id="writing-back">← Tasks & written work</button><p>Recipient: ${esc(personName(WorldDesk.route("Daniel")))} · Consultation follow-up</p><div class="notice-card">Use the actual conversation. Include a next step, when you will do it, and a relevant caution or question. Do not invent a prescription.</div>${a.feedback ? `<div class="preview ${last?.status === "Needs revision" ? "error" : ""}">${esc(a.feedback)}</div>` : ""}<label class="writing-label">Your editable draft<textarea id="artifact-draft" rows="7" maxlength="3000" ${accepted ? "readonly" : ""}>${esc(accepted ? last.text : a.draft)}</textarea></label><p class="desk-note">Only the draft is editable. Every submitted version below is permanent.</p>${a.versions.map((v) => `<article class="expression-entry"><strong>Version ${v.version} · ${v.status} · Day ${v.day} ${time(v.time)}</strong><p class="submitted-text">${esc(v.text)}</p></article>`).join("")}`,
      accepted
        ? [{ label: "Back to tasks", action: openTasks }]
        : [
            {
              label: "Save draft",
              action: () => {
                a.draft = $("artifact-draft").value;
                save();
                artifact();
              },
            },
            {
              label: "Review submission",
              primary: true,
              action: () => {
                a.draft = $("artifact-draft").value.trim();
                save();
                if (!WorldDesk.english(a.draft))
                  return feedback(
                    "Write your summary in English before submitting. The draft is still saved.",
                    "English text needed",
                  );
                showModal(
                  "Send this version for review?",
                  `<div class="notice-card submitted-text">${esc(a.draft)}</div><p>Once submitted this version cannot be edited. You can revise with a new version if information is missing.</p>`,
                  [
                    { label: "Keep editing", action: artifact },
                    {
                      label: "Submit to doctor",
                      primary: true,
                      action: submitArtifact,
                    },
                  ],
                  "REVIEW YOUR WORDS",
                );
              },
            },
          ],
      "WRITING DESK",
    );
    $("writing-back").onclick = () => {
      if (!accepted) {
        a.draft = $("artifact-draft").value;
        save();
      }
      openTasks();
    };
    $("artifact-draft").oninput = () => {
      a.draft = $("artifact-draft").value;
      save();
    };
  }
  function submitArtifact() {
    const a = s.artifacts.summary;
    const txt = a.draft.trim();
    const missing = [];
    if (!/next|will|plan|follow|ask|contact|check|rest|monitor/i.test(txt))
      missing.push("a clear next step");
    if (
      !/today|tomorrow|morning|evening|day|week|\d{1,2}:\d{2}|after|before/i.test(
        txt,
      )
    )
      missing.push("when you will do it");
    if (
      !/no prescription|not prescribed|question|ask|clarify|unsure|if |caution|confirm/i.test(
        txt,
      )
    )
      missing.push("a relevant caution or question");
    if (!s.consulted) missing.push("a completed consultation");
    if (
      /(take|prescribed|collect|medicine|medication).*(tablet|pill|dose|antibiotic)/i.test(
        txt,
      ) &&
      !s.prescription
    )
      missing.push("evidence for the claimed prescription");
    const version = {
      version: a.versions.length + 1,
      text: txt,
      day: s.day,
      time: s.time,
      status: missing.length ? "Needs revision" : "Accepted",
    };
    a.versions.push(version);
    a.feedback = missing.length
      ? `Please add or clarify ${missing.join(", ")}. Your submitted version remains saved.`
      : "Your summary includes a next step, a time and a caution. This local review checks the prototype’s required information; it is not a medical assessment.";
    s.tasks.summary = missing.length ? "revision" : "completed";
    addMessage(s, WorldDesk.route("Daniel"), txt, "you");
    npc("Daniel", a.feedback);
    log(`Summary version ${version.version} submitted: ${version.status}.`);
    save();
    render();
    artifact();
  }
  function slots(day) {
    return Calendar.slots(day);
  }
  function event(title, body, source, choices) {
    const recent = s.events.filter(
      (e) => e.day === s.day && s.time - e.time < 60,
    );
    const last = s.events.at(-1);
    if (
      (last &&
        last.day === s.day &&
        s.time - last.time < s.settings.interruptGap) ||
      recent.length >= s.settings.interruptLimit
    )
      return;
    s.events.push({
      id: crypto.randomUUID(),
      title,
      body,
      source,
      choices,
      day: s.day,
      time: s.time,
      status: "open",
    });
    if (s.plan) {
      clearTimeout(planTimer);
      s.plan.status = "paused";
    }
    log(`New event from ${source}: ${title}.`);
    s.feedback = `${title}. Review Events in World desk when you choose. The current plan is paused.`;
    s.feedbackTitle = "Something changed";
  }
  function openEvents() {
    showModal(
      "When life changes the plan",
      `<button class="desk-back" data-life-back>← World desk</button><p>Events follow the state of this world. They never make a choice or send your words for you.</p>${
        s.events.length
          ? s.events
              .slice()
              .reverse()
              .map(
                (e) =>
                  `<article class="event-entry"><span class="eyebrow">DAY ${e.day} · ${time(e.time)} · ${esc(e.source)}</span><h3>${esc(e.title)}</h3><p>${esc(e.source === "Ben · transport service" ? (s.busDelayRead ? "Ben reported a fifteen-minute service delay. You can keep waiting, walk, or discuss a new appointment. No message is sent for you." : "A route update is waiting in Ben’s IM. Open or listen to it before using its details.") : e.body)}</p><span class="status-chip">${esc(e.status)}</span>${["open", "deferred"].includes(e.status) ? `<div class="desk-toolbar"><button class="secondary-button" data-event="${e.id}" data-choice="deferred">Decide later</button><button class="secondary-button" data-event="${e.id}" data-choice="ignored">Leave it</button>${e.choices.map((c) => `<button class="primary-button" data-event="${e.id}" data-choice="${c.key}">${esc(c.label)}</button>`).join("")}</div>` : ""}</article>`,
              )
              .join("")
          : '<div class="notice-card">No event needs your attention. Try a household activity or continue your actual arrangements.</div>'
      }`,
      [],
      "WORLD EVENTS",
    );
    bind();
    document
      .querySelectorAll("[data-event]")
      .forEach(
        (b) =>
          (b.onclick = () => resolveEvent(b.dataset.event, b.dataset.choice)),
      );
  }
  function resolveEvent(id, choice) {
    const e = s.events.find((e) => e.id === id);
    if (!e || !["open", "deferred"].includes(e.status)) return;
    if (choice === "read-transport") {
      $("modal").close();
      selectContact(WorldDesk.route("Ben"));
      const m = (s.messages[contact] || []).find(
        (m) => m.from === "npc" && !m.known,
      );
      if (m) m.opened = true;
      save();
      render();
      return;
    }
    if (choice === "help-mia") {
      e.status = "accepted";
      log("You chose to help Mia find her notebook.");
      $("modal").close();
      selectContact("Mia");
      s.drafts[activeDraftKey()] = "Where did you last put your notebook?";
      render();
      return;
    }
    if (choice === "tidy") {
      e.status = "resolved";
      log("You chose to return the misplaced item to the shelf.");
      commit(s.settings.item, () => {
        s.completedActions.notebook = true;
        s.npcs.Mia.progress++;
        npc("Mia", "Thank you. I will put my notebook on the shelf next time.");
      });
    } else {
      e.status = choice;
      log(`Event decision: ${e.title} — ${choice}.`);
    }
    save();
    render();
    openEvents();
  }
  function tick(before) {
    Commitments.tick();
    Calendar.tick();
    const queued = s.replyQueue.filter(
      (q) =>
        (q.day < s.day || (q.day === s.day && q.due <= s.time)) &&
        Schedules.available(s.npcs[q.who]),
    );
    s.replyQueue = s.replyQueue.filter((q) => !queued.includes(q));
    for (const q of queued) {
      const previous = contact;
      contact = q.who;
      const p = s.npcs[q.who];
      if (p && !p.archived) {
        log(
          `${p.name} resumed a pending conversation after their shift began.`,
        );
        npcCommand(q.text, true);
        pausePlan(
          "A scheduled reply arrived. Read the person’s IM before continuing your remaining wait.",
        );
      }
      contact = previous;
    }
    if (
      s.completedActions.breakfast &&
      !s.completedActions.notebook &&
      !s.events.some((e) => e.title === "A notebook left behind") &&
      s.time >= s.completedActions.breakfast + 5 &&
      s.scene === "Home"
    )
      event(
        "A notebook left behind",
        "After breakfast, Mia noticed her notebook is not on its usual shelf. You can help, ask later or leave it to her.",
        "Mia · household activity",
        [
          { key: "help-mia", label: "Ask Mia about it" },
          { key: "tidy", label: "Return it to the shelf" },
        ],
      );
    for (const e of s.events)
      if (
        e.title === "A notebook left behind" &&
        ["ignored", "deferred"].includes(e.status) &&
        s.time - e.time >= 15 &&
        !s.completedActions.notebook
      ) {
        s.completedActions.notebook = true;
        e.status = "Resolved by Mia";
        s.npcs.Mia.progress++;
        npc(
          "Mia",
          "I found my notebook by the breakfast table and put it on the shelf myself.",
          { opened: false },
        );
        log(
          "Mia independently completed her notebook routine; a message update is waiting.",
        );
      }
    if (
      s.scene === "Hospital" &&
      ["accepted", "in-progress"].includes(s.tasks.route)
    ) {
      s.tasks.route = "completed";
      log("Route task completed through actual arrival.");
    }
    if (s.consulted && s.tasks.summary === "none") invite("summary");
    if (s.roadEvent && s.appointment && s.tasks.delay === "none")
      invite("delay");
    if (s.tasks.key === "completed" && !meta("key").growth) {
      meta("key").growth = true;
      const p = s.npcs[WorldDesk.route("Sarah")];
      p.trust = "Reliable follow-through";
      p.progress++;
      log(
        `${p.name} remembers the completed key handover; cooperation improved.`,
      );
    }
  }
  function invite(k) {
    const day = s.invitationDays[s.day] || 0;
    if (
      activeCount() >= s.settings.activeLimit ||
      day >= s.settings.inviteLimit ||
      meta(k).cooldownUntil > abs()
    )
      return;
    s.tasks[k] = "invited";
    s.invitationDays[s.day] = day + 1;
    log(
      `Optional invitation available: ${s.taskPresets[k].title}. No promise was made.`,
    );
  }
  function gate(text, who, replay) {
    const p = s.npcs[who];
    if (!p) return true;
    if (p.archived) {
      feedback(
        "This person is archived. Their history remains readable, but new messages cannot be sent.",
        "Past conversation",
      );
      return true;
    }
    if (
      !s.contactPermissions[who] &&
      !p.service?.match(/^(Emma|Daniel|Grace|Leo|Ben)$/) &&
      !Schedules.located(p)
    ) {
      feedback(
        who === "Nora"
          ? "Nora is a temporary nearby contact. Meet during a sidewalk routine or exchange contact details before remote IM."
          : "Meet this person in their current area before exchanging a private contact.",
        "Contact permission",
      );
      return true;
    }
    return false;
  }
  function npcInput(text, replay = false) {
    const t = text.toLowerCase();
    const who = contact,
      p = s.npcs[who],
      role = WorldDesk.behavior(who);
    if (
      !replay &&
      !Schedules.available(p) &&
      !["Emma", "Daniel", "Grace", "Leo"].includes(role)
    ) {
      if (s.replyQueue.some((q) => q.who === who && q.text === text)) {
        toast("That message is already waiting for a reply.");
        return true;
      }
      const replyAt = Schedules.next(p);
      if (!replyAt) {
        feedback(
          "Your message was delivered. No future reply time is promised in this routine; no unlimited wait will be started.",
          "Delivered · no reply time promised",
        );
        return true;
      }
      s.replyQueue.push({
        id: crypto.randomUUID(),
        who,
        text,
        due: replyAt.due,
        day: replyAt.day,
      });
      log(
        `Message delivered to ${p.name}; reply waits for their next active shift.`,
      );
      feedback(
        `${p.name} is unavailable to reply now. Your message is delivered; a reply waits until Day ${replyAt.day} · ${time(replyAt.due)} in game time.`,
        "Awaiting a reply",
      );
      return true;
    }
    if (Calendar.input(text, contact) || Commitments.input(text, contact))
      return true;
    if (
      (role === "Nora" || !p.service) &&
      /exchange|contact details|keep in touch|add you/.test(t)
    ) {
      pendingExchange();
      s.contactPermissions[who] = true;
      npc(
        who,
        "Of course. We have exchanged contact details. You can message me when you are away.",
      );
      log(
        `${p.name} and you exchanged private contact details by explicit agreement.`,
      );
      return true;
    }
    if (role === "Mia" && /notebook|tidy|shelf/.test(t)) {
      pendingExchange();
      npc(
        who,
        s.completedActions.notebook
          ? "It is on the shelf now. I am practicing putting it away after breakfast."
          : "I left it by the breakfast table. Could you return it to the shelf?",
      );
      return true;
    }
    if (/your goal|working on|progress|remember yesterday/.test(t)) {
      pendingExchange();
      npc(
        who,
        `${p.style.includes("Formal") ? "Thank you for asking. " : ""}I am working on this: ${p.goal}. ${p.progress ? "I have made progress through our recent arrangements." : "I am still working on the first step."}`,
      );
      return true;
    }
    if (role === "Emma") {
      if (s.time < s.settings.open || s.time >= s.settings.close) {
        npc(
          who,
          `Reception is open from ${time(s.settings.open)} to ${time(s.settings.close)}. No booking has been made.`,
        );
        return true;
      }
      if (
        /slots|reschedule|\d{1,2}:\d{2}/.test(t) &&
        !/here|arrived|check in|id/.test(t)
      ) {
        pendingExchange();
        npc(
          who,
          "Open appointment slots to compare today and the next six days. Select a time and send your own request.",
        );
        return true;
      }
      if (/delay|late|bus/.test(t) && s.roadEvent && s.busDelayRead) {
        pendingExchange();
        meta("delay").notified = true;
        npc(
          who,
          `Thank you for telling me. ${s.appointment ? `Your ${time(s.appointment.time)} booking is still active until you explicitly change it. Say “Keep my appointment” or request a new available time.` : "There is no active booking to change."}`,
        );
        return true;
      }
      if (/keep.*appointment/.test(t) && meta("delay").notified) {
        commit(s.settings.simple, () => {
          s.tasks.delay = "completed";
          log(
            "You notified reception of the delay and chose to keep the appointment.",
          );
          npc(
            who,
            "Your existing appointment remains booked. Please follow the arrival window.",
          );
        });
        return true;
      }
    }
    if (
      role === "Leo" &&
      /prescription|collect|dispense|pack|medicine/.test(t)
    ) {
      const rx = s.prescription;
      if (!rx) {
        npc(
          who,
          "There is no issued prescription on this visit. I cannot dispense an item from a request alone.",
        );
        return true;
      }
      if (s.scene !== "Hospital" || s.area !== "Pharmacy") {
        npc(
          who,
          "Please come to the Pharmacy for identity and prescription verification.",
        );
        return true;
      }
      if (s.items.id !== "you") {
        npc(
          who,
          "Please bring your ID for verification. Your prescription remains on record.",
        );
        return true;
      }
      if (rx.status === "Collected") {
        npc(
          who,
          "This prescription was already dispensed. The same item cannot be collected twice.",
        );
        return true;
      }
      commit(s.settings.item, () => {
        rx.status = "Collected";
        s.items.practicePack = "you";
        npc(
          who,
          `The prescription record and ID match. Here is the ${rx.item}. ${rx.instructions} This sample is fictional; no real medical instructions are provided.`,
        );
        log(
          "Pharmacy verified the recorded prescription and ID; the fictional practice pack was dispensed once.",
        );
      });
      return true;
    }
    if (
      role === "Daniel" &&
      s.consulted &&
      /summary|next step|follow.up/.test(t)
    ) {
      pendingExchange();
      npc(
        who,
        "Your consultation is complete. Summarize your questions and decide when to clarify any remaining concerns. No prescription was issued in this visit.",
      );
      meta("summary").factsKnown = true;
      return true;
    }
    return false;
  }
  const { world, afterStep, dayEnd, assist } = WorldActions.create({
    slots,
    taskDetail,
    artifact,
    tick,
  });
  return {
    normalize,
    openTasks,
    taskDetail,
    artifact,
    slots,
    openEvents,
    tick,
    gate,
    npcInput,
    world,
    afterStep,
    dayEnd,
    assist,
    bind,
    routeStarted: () => {
      if (s.tasks.route === "none" || s.tasks.route === "invited") {
        s.tasks.route = "in-progress";
        meta("route").accepted = s.time;
        meta("route").day = s.day;
      }
    },
  };
})();
