const $ = (id) => document.getElementById(id);
const icons = {
  world:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/>',
  tasks: '<path d="M9 4h10v17H5V4h4M9 3h6v4H9Z M8 12h8M8 16h5"/>',
  bag: '<path d="M5 8h14l2 13H3L5 8ZM8 8V6a4 4 0 0 1 8 0v2"/>',
  journal: '<path d="M5 3h14v18H5zM8 3v18M11 8h5M11 12h5"/>',
  sliders: '<path d="M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6"/>',
  moon: '<path d="M20 15a9 9 0 0 1-11-11A9 9 0 1 0 20 15Z"/>',
  chevron: '<path d="m7 10 5 5 5-5"/>',
  directory:
    '<path d="M5 4h13v17H5zM9 3v18M12 8h3M12 12h3M12 16h3M3 7h3M3 12h3M3 17h3"/>',
  mic: '<rect x="8" y="3" width="8" height="12" rx="4"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M9 22h6"/>',
  arrow: '<path d="M4 12h16m-5-5 5 5-5 5"/>',
  leaf: '<path d="M19 4C5 2 3 9 7 14s12 0 12-10ZM5 20 15 9"/>',
  play: '<path d="m8 5 11 7-11 7Z"/>',
  pause: '<path d="M7 5h3v14H7zM14 5h3v14h-3z"/>',
};
function icon(k) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[k] || icons.world}</svg>`;
}
function iconify(root = document) {
  root
    .querySelectorAll("[data-icon]")
    .forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
}
function esc(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function time(t) {
  return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
const defaults = {
  name: "Chris",
  homeRole: "Father",
  hospitalRole: "Patient",
  roadRole: "Passenger",
  simple: 1,
  discussion: 5,
  move: 1,
  item: 1,
  trip: 30,
  documents: 10,
  consultation: 15,
  wait: 30,
  voice: 50,
  sarahName: "Sarah",
  sarahStyle: "Friendly and practical",
  sarahGoal: "Coordinate our family plans",
  sarahAppearance: "Auburn hair, comfortable everyday clothes",
  theme: "paper",
};
const people = {
  Sarah: {
    name: "Sarah",
    relation: "Your partner",
    location: "Home · Entrance",
    source: "Family contact",
    public: false,
  },
  Mia: {
    name: "Mia",
    relation: "Your daughter",
    location: "Home · Mia’s room",
    source: "Family contact",
    public: false,
  },
  Emma: {
    name: "Emma",
    relation: "Receptionist",
    location: "Hospital · Reception",
    source: "Public hospital directory",
    public: true,
  },
  Daniel: {
    name: "Dr. Daniel Patel",
    relation: "Doctor",
    location: "Hospital · Consultation Room",
    source: "Public hospital directory",
    public: true,
  },
  Grace: {
    name: "Grace",
    relation: "Nurse",
    location: "Hospital · Waiting Area",
    source: "Hospital check-in",
    public: false,
  },
  Leo: {
    name: "Leo",
    relation: "Pharmacist",
    location: "Hospital · Pharmacy",
    source: "Public hospital directory",
    public: true,
  },
  Ben: {
    name: "Ben",
    relation: "Bus driver",
    location: "Road · Route service",
    source: "Public transport directory",
    public: true,
  },
  Nora: {
    name: "Nora",
    relation: "Neighbor",
    location: "Road · Sidewalk",
    source: "Observed nearby",
    public: false,
  },
};
const STORAGE = "scentalka-prototype-v1";
let store;
try {
  store = JSON.parse(localStorage.getItem(STORAGE));
} catch {}
if (!store?.worlds) store = { active: "home", worlds: {} };
let s,
  mode = "npc",
  contact = "Sarah",
  drawer = null,
  toastTimer,
  planTimer,
  audio,
  playingId,
  recognition,
  recorder,
  recordingStream,
  recordingContext,
  recordingKey,
  recordingData,
  recordingText = "",
  assistantMessages = [],
  persistTimer;
function fresh(key) {
  const state = {
    fixture: key,
    time: key === "home" ? 420 : 480,
    day: 1,
    scene: key === "road" ? "Road" : "Home",
    area:
      key === "home" ? "Living Room" : key === "road" ? "Bus Stop" : "Entrance",
    roles: { Home: "Father", Hospital: "Patient", Road: "Passenger" },
    settings: { ...defaults },
    items: { phone: "you", key: "tray", id: "tray", folder: "cabinet" },
    known: ["Sarah", "Mia"],
    messages: { Sarah: [], Mia: [] },
    drafts: {},
    tasks: {
      key: "none",
      documents: "none",
      hospital: key === "road" ? "booked" : "none",
    },
    appointment:
      key === "road"
        ? { time: 540, duration: 15, status: "Booked", known: true }
        : null,
    pending: 0,
    logs: [],
    plan: null,
    roadEvent: false,
    busDelayRead: false,
    registered: false,
    called: false,
    callRead: false,
    consulted: false,
    consultStart: null,
    docDue: null,
    feedback:
      "The house is quiet. Sarah is by the entrance, and your phone is with you.",
    feedbackTitle: "A moment to yourself",
  };
  state.logs.push({
    time: state.time,
    day: 1,
    text:
      key === "road"
        ? "Test save: a 09:00 appointment already exists."
        : "Your world began. Phone in your pocket; house key and ID on the entrance tray.",
  });
  if (key === "home")
    addMessage(
      state,
      "Sarah",
      "Morning, Chris. Could you bring me the house key? I’m by the entrance.",
      "npc",
      { seen: false },
    );
  if (key === "road") {
    state.known.push("Ben", "Emma");
    state.messages.Ben = [];
    state.messages.Emma = [];
    state.feedback =
      "You are at the bus stop. Your hospital appointment is at 09:00.";
    state.feedbackTitle = "A journey ahead";
  }
  return state;
}
function addMessage(state, who, text, from = "npc", options = {}) {
  if (!state.messages[who]) state.messages[who] = [];
  const voice =
    options.voice ??
    (from === "npc" && Math.random() * 100 < state.settings.voice);
  const msg = {
    id: crypto.randomUUID(),
    text,
    from,
    type: voice ? "voice" : "text",
    time: state.time,
    day: state.day,
    seen: options.seen ?? false,
    known: from === "you",
    opened: options.opened ?? true,
    ...options,
  };
  state.messages[who].push(msg);
  return msg;
}
function save() {
  if (!s) return;
  s.assistantHistory = assistantMessages;
  store.worlds[store.active] = s;
  try {
    localStorage.setItem(STORAGE, JSON.stringify(store));
    document.querySelector(".saved").innerHTML = "<i></i> Saved on this device";
  } catch {
    document.querySelector(".saved").textContent =
      "Storage full · Session only";
    toast("Device storage is full. Your current session still works.");
  }
}
function load(key) {
  $("toast").classList.remove("visible");
  clearTimeout(toastTimer);
  stopMedia();
  clearTimeout(planTimer);
  if (s) save();
  store.active = key;
  s = Presets.normalize(
    Controls.normalize(
      Life.normalize(WorldDesk.normalize(store.worlds[key] || fresh(key))),
    ),
  );
  SetupGuide.normalize(s);
  Calendar.normalize(s);
  Schedules.normalize(s);
  Objects.normalize(s);
  Voices.normalize(s);
  Commitments.normalize(s);
  Plans.normalize(s);
  Timeline.normalize(s);
  WorldDesk.hydrate();
  if (s.plan?.status === "running") s.plan.status = "paused";
  mode = s.fixture === "road" ? "world" : "npc";
  contact = s.fixture === "road" ? "Ben" : "Sarah";
  assistantMessages = s.assistantHistory;
  drawer = null;
  applyTheme(s.settings.theme);
  save();
  render();
  SetupGuide.launchIfNeeded();
}
function log(text) {
  s.logs.push({ time: s.time, day: s.day, text });
}
function feedback(text, title = "World update") {
  s.feedback = text;
  s.feedbackTitle = title;
  save();
  render();
}
function toast(t) {
  $("toast").textContent = t;
  $("toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("visible"), 3800);
}
function personName(k) {
  return (
    s.npcs?.[k]?.name ||
    (k === "Sarah" ? s.settings.sarahName : people[k]?.name || k)
  );
}
function avatar(k, cls = "") {
  return `<span class="avatar ${cls}"><canvas width="32" height="32" data-avatar="${k}" aria-hidden="true"></canvas></span>`;
}
function makeKnown(k) {
  k = WorldDesk.route(k);
  if (!s.known.includes(k)) {
    s.known.push(k);
    s.messages[k] ??= [];
    log(`Contact added: ${personName(k)}. Source: ${people[k].source}.`);
  }
}
function activeDraftKey() {
  return mode === "npc" ? `npc:${contact}` : mode;
}
function captureDraft() {
  s.drafts[activeDraftKey()] = $("command-input").value;
}
function setMode(next) {
  if (Voices.busy())
    return toast("Stop or cancel recording before switching input context.");
  captureDraft();
  if (next === "assistant")
    pausePlan(
      "Your plan is paused while you ask for help. Continue it in World when ready.",
    );
  mode = next;
  render();
  $("command-input").focus();
}
function selectContact(k) {
  if (Voices.busy())
    return toast("Stop or cancel recording before switching conversations.");
  k = WorldDesk.route(k);
  captureDraft();
  makeKnown(k);
  contact = k;
  mode = "npc";
  render();
  $("command-input").focus();
  save();
}
function npc(k, text, options = {}) {
  k = WorldDesk.route(k);
  s.messages[k] ??= [];
  const msg = addMessage(s, k, text, "npc", options);
  save();
  return msg;
}
function unread(k) {
  return (s.messages[k] || []).filter((m) => m.from === "npc" && !m.known)
    .length;
}
function render() {
  Plans.observe();
  recordingData = s.voiceDrafts?.[activeDraftKey()] || null;
  if (
    s.scene === "Home" &&
    s.area === "Entrance" &&
    s.tasks.documents === "ready"
  )
    s.docUpdateKnown = true;
  $("clock").textContent = time(s.time);
  $("settings").textContent = s.settings.name.slice(0, 1).toUpperCase();
  $("day-label").textContent =
    new Date(Date.UTC(2026, 9, 18 + s.day))
      .toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      })
      .toUpperCase() + ` · DAY ${s.day}`;
  $("scene-title").innerHTML =
    {
      Home: "A morning at home",
      Hospital: "A little care, a little courage",
      Road: "Life along the way",
    }[s.scene] + `<span>.</span>`;
  $("location-label").innerHTML = `${s.scene} <span>/</span> ${esc(s.area)}`;
  $("role").textContent = s.roles[s.scene];
  $("map-you").textContent = `You · ${s.area}`;
  $("clock-status").innerHTML =
    `<i></i> ${s.plan?.status === "running" || s.itinerary?.autoRun ? "Action in progress" : "Time is paused"}`;
  $("feedback").textContent = s.feedback;
  $("feedback-label").textContent = s.feedbackTitle.toUpperCase();
  $("stop-plan").hidden = s.plan?.status !== "running" && !s.itinerary?.autoRun;
  $("scene-note").textContent =
    s.plan?.status === "interrupted"
      ? "Your route is paused · A new message is waiting"
      : s.plan?.status === "paused"
        ? "Plan paused · Continue or cancel in World"
        : "";
  $("task-count").textContent =
    Object.values(s.tasks).filter((v) =>
      ["accepted", "preparing", "booked", "registered", "in-progress"].includes(
        v,
      ),
    ).length || "";
  $("contact-list").innerHTML = s.known
    .map(
      (k) =>
        `<button class="contact-button ${contact === k ? "active" : ""}" data-contact="${k}" aria-label="Chat with ${esc(personName(k))}${unread(k) ? ", unread messages" : ""}">${avatar(k)}<small>${esc(k === "Daniel" ? "Dr. Patel" : personName(k))}</small>${unread(k) ? '<i class="unread-dot"></i>' : ""}</button>`,
    )
    .join("");
  const info = people[contact] || {
    relation: "Former contact",
    location: "",
    source: "World record",
  };
  $("chat-heading").innerHTML =
    mode === "assistant"
      ? `<span class="avatar" style="background:#e5ebde">${icon("leaf")}</span><div><strong>Your assistant</strong><small>Private help · Current world context</small></div>`
      : `${avatar(contact)}<div><strong>${esc(personName(contact))}</strong><small>${esc(info.relation)} <span>·</span> ${esc(WorldDesk.status(contact))}</small></div><span class="presence" title="Available in game time"></span>`;
  renderMessages();
  $("chat-footnote").textContent =
    mode === "assistant"
      ? "Your assistant sees only what you know."
      : "Only you choose what to say.";
  $("npc-tab-name").textContent =
    contact === "Daniel" ? "Dr. Patel" : personName(contact).split(" ")[0];
  document.querySelectorAll("[data-mode]").forEach((b) => {
    b.classList.toggle("active", b.dataset.mode === mode);
    b.setAttribute("aria-selected", b.dataset.mode === mode);
  });
  const targets = {
    world: "WORLD COMMAND · NO MESSAGE SENT",
    npc: `MESSAGE TO ${personName(contact).toUpperCase()} · PRIVATE IM`,
    assistant: "ASSISTANT · ONLY YOU CAN SEE THIS",
  };
  $("composer-target").textContent = targets[mode];
  $("command-input").value = s.drafts[activeDraftKey()] || "";
  $("command-input").placeholder =
    mode === "world"
      ? "What would you like to do?"
      : mode === "assistant"
        ? "Ask for a little help, in English…"
        : `Write to ${personName(contact)}…`;
  $("command-input").setAttribute(
    "aria-label",
    mode === "npc" ? `Message to ${personName(contact)}` : `${mode} input`,
  );
  $("input-hint").textContent = recordingData
    ? "Voice ready · Review the English transcript, then send."
    : mode === "world"
      ? "Try “Go to the entrance.” · Reading and thinking take no game time."
      : mode === "assistant"
        ? "Get help with the moment. Nothing is sent to an NPC."
        : "Your words are sent exactly as written.";
  $("send-button").innerHTML =
    `${mode === "world" ? "Do it" : mode === "assistant" ? "Ask" : "Send"} ${icon("arrow")}`;
  updatePreview();
  renderDrawer();
  FlowDemo.render();
  Voices.renderButton();
  document
    .querySelectorAll("[data-avatar]")
    .forEach((c) => Art.avatar(c.dataset.avatar, c));
  Art.draw($("world-canvas"), s);
  const deskStatus = $("world-desk-status");
  if (deskStatus)
    deskStatus.textContent = `${s.events.filter((e) => e.status === "open").length} events · ${s.replyQueue.length} replies pending`;
  iconify();
}
let messageObserver;
function renderMessages() {
  const chat = $("chat-scroll");
  const messageContact = contact;
  const list =
    mode === "assistant"
      ? assistantMessages
      : s.hiddenChats[contact]
        ? []
        : s.messages[contact] || [];
  let html = `<div class="chat-date">${mode === "assistant" ? "YOUR CONTEXTUAL ASSISTANT" : `TODAY · ${people[contact].source.toUpperCase()}`}</div>`;
  if (!list.length)
    html += `<div class="chat-empty"><h3>${mode === "assistant" ? "A little help, when you need it." : `Say hello to ${esc(personName(contact).split(" ")[0])}.`}</h3><p>${mode === "assistant" ? "Ask about your current surroundings, a message you have read, or how to express your own idea. Time stays still." : `This is a private IM conversation. ${esc(people[contact].source)}. Messages stay here, even when you go somewhere else.`}</p>${mode === "assistant" ? '<button class="helper-command" data-draft="What can I do here?">What can I do here?</button><button class="helper-command" data-draft="Help me ask Sarah for the key.">Help me find the words.</button>' : ""}</div>`;
  for (const m of list) {
    const own = m.from === "you";
    html += `<div class="message ${own ? "own" : ""}" data-message="${m.id}">`;
    if (m.opened === false) {
      html += `<button class="message-unopened" data-open-message="${m.id}">New message · Open to read or listen ${icon("arrow")}</button>`;
    } else {
      html += '<div class="bubble">';
      if (m.type === "voice") {
        const bars = [7, 13, 19, 10, 21, 15, 8, 17, 23, 11, 18, 9, 13, 20, 9];
        html += `<div class="voice-bubble"><button class="play-button" data-play="${m.id}" aria-label="${playingId === m.id ? "Pause" : "Play"} voice message from ${own ? "you" : esc(personName(contact))}">${icon(playingId === m.id ? "pause" : "play")}</button><span class="waveform" aria-hidden="true">${bars.map((h) => `<i style="height:${h}px"></i>`).join("")}</span><span class="voice-duration">${Math.max(3, Math.ceil(m.text.split(" ").length / 2.5))}″</span></div><button class="transcript-toggle" data-transcript="${m.id}">${m.transcript ? "Hide transcript" : "Show transcript"}</button>${m.transcript ? `<div class="transcript">${esc(m.text)}</div>` : ""}`;
      } else html += esc(m.text).replace(/\n/g, "<br>");
      if (m.type === "text" || m.transcript)
        html += `<div class="message-tools"><button data-bookmark="${m.id}" aria-label="Save this expression">Save expression</button>${mode === "assistant" && !own ? `<button data-assistant-play="${m.id}">Listen</button>` : ""}</div>`;
      html += "</div>";
    }
    const voiceStatus = m.known
      ? "Listened / transcript viewed"
      : m.heardText
        ? "Partially heard"
        : "Voice · Tap to listen";
    html += `<div class="message-meta"><span>${time(m.time)}</span><span>·</span><span>${own ? "Delivered" : m.type === "voice" ? voiceStatus : m.opened === false ? "Delivered" : "Viewed"}</span></div></div>`;
  }
  chat.innerHTML = html;
  chat.scrollTop = chat.scrollHeight;
  messageObserver?.disconnect();
  if (mode !== "assistant") {
    messageObserver = new IntersectionObserver(
      (entries) => {
        let changed = false;
        for (const entry of entries)
          if (entry.isIntersecting) {
            const m = list.find((x) => x.id === entry.target.dataset.message);
            if (
              m &&
              m.from === "npc" &&
              m.type === "text" &&
              m.opened !== false &&
              !m.known
            ) {
              learnMessage(m, messageContact);
              changed = true;
            }
          }
        if (changed) save();
      },
      { root: chat, threshold: 0.3 },
    );
    chat
      .querySelectorAll("[data-message]")
      .forEach((el) => messageObserver.observe(el));
  }
  if (s.hiddenChats[contact] && mode === "npc")
    chat.innerHTML =
      '<div class="chat-empty"><h3>Conversation hidden</h3><p>The records and established memories remain. Show hidden conversations in World desk → Your data.</p></div>';
}
function updatePreview() {
  const t = $("command-input").value.toLowerCase();
  let cost = "";
  if (mode === "world") {
    if (/go |walk |take .*bus/.test(t))
      cost = /hospital/.test(t)
        ? `Route · ${s.scene === "Road" ? (s.settings.trip * 2) / 3 : s.settings.trip} game min`
        : `Move · ${s.settings.move} game min`;
    if (
      /(go|walk|head|step|move).*(outside|road|bus stop)/.test(t) &&
      s.scene !== "Road"
    )
      cost = `Route · ${s.scene === "Home" ? s.settings.trip / 3 : (s.settings.trip * 2) / 3} game min`;
    if (/(go|return|head|walk).*home/.test(t) && s.scene !== "Home")
      cost = `Route · ${s.scene === "Hospital" ? s.settings.trip : s.settings.trip / 3} game min`;
    if (/take .*key|take .*id|give .*key/.test(t))
      cost = `Action · ${s.settings.item} game min`;
    if (/take .*id.*hospital/.test(t))
      cost = `Pick up + route · ${s.settings.item + s.settings.trip} game min`;
    if (/wait/.test(t)) cost = "Bounded wait · Stops at events";
  }
  if (mode === "npc" && t.trim())
    cost = s.pending
      ? `${s.pending} game min pending`
      : `Simple exchange · ${s.settings.simple} game min`;
  if (mode === "assistant") cost = "No game time";
  $("pending-time").textContent =
    cost || (s.pending ? `${s.pending} game min pending` : "");
}
function settle() {
  if (s.pending) {
    advance(s.pending);
    s.pending = 0;
  }
}
function advance(n) {
  const before = s.time;
  const absoluteEnd = Calendar.now() + Math.max(0, n);
  s.day = Math.floor(absoluteEnd / 1440) + 1;
  s.time = absoluteEnd % 1440;
  if (
    s.docDue &&
    Calendar.now() >= Calendar.at({ day: s.docDay ?? s.day, time: s.docDue }) &&
    s.tasks.documents === "preparing"
  ) {
    s.items.folder = "tray";
    s.tasks.documents = "ready";
    npc(
      "Sarah",
      "The appointment documents are ready. I put the folder on the entrance tray.",
      { opened: false },
    );
    log(
      "Sarah delivered a task update. Open her message to learn its contents.",
    );
    s.docDue = null;
  }
  if (
    s.appointment &&
    Calendar.now() > Calendar.at(s.appointment) + 5 &&
    !s.consultStart &&
    !Calendar.closed.includes(s.appointment.status)
  ) {
    s.appointment.status = "Missed";
    s.tasks.hospital = "missed";
    log(
      "The five-minute arrival grace ended. The appointment needs to be rescheduled.",
    );
  }
  if (n)
    log(
      `${n} game minute${n === 1 ? "" : "s"} elapsed (${time(before)} → ${time(s.time)}).`,
    );
}
function commit(cost, fn, reason) {
  const total = cost + s.pending;
  const end = Calendar.now() + total;
  if (
    s.appointment &&
    !Calendar.closed.includes(s.appointment.status) &&
    Calendar.now() <= Calendar.at(s.appointment) + 5 &&
    end > Calendar.at(s.appointment) + 5 &&
    !s.consultStart
  ) {
    showModal(
      "Check your next step",
      `<p>This action takes ${total} game minutes and reaches ${time(end % 1440)}. Your appointment’s arrival grace ends at ${time(s.appointment.time + 5)}.</p><div class="notice-card">Your appointment is still booked. Continuing may mean you need to reschedule.</div>`,
      [
        { label: "Keep thinking", close: true },
        {
          label: "Continue anyway",
          primary: true,
          action: () => {
            settle();
            advance(cost);
            fn();
            Life.tick();
            save();
            render();
          },
        },
      ],
    );
    return;
  }
  settle();
  advance(cost);
  fn();
  Life.tick();
  save();
  render();
}
function taskRows() {
  return `<p class="muted">Requests become your responsibility only after you accept. Words alone do not transfer an item.</p>${s.tasks.key !== "none" ? `<div class="detail-row"><div><strong>Hand over the house key</strong><p>${s.tasks.key === "completed" ? "You handed the actual key to Sarah. She still has it." : s.tasks.key === "accepted" ? "Meet Sarah at the entrance, take the key, then hand it over." : s.tasks.key === "overdue" ? `The original handover was missed. ${Commitments.current()?.followup ? `Follow-up: ${Commitments.current().status} · ${Calendar.label(Commitments.current().due)}.` : "Discuss a new arrangement in Sarah’s IM."} See commitment history in World desk.` : s.tasks.key === "declined" ? "You declined this request. No promise was made." : "Sarah has asked. You have not accepted yet."}</p></div><span class="status-chip">${s.tasks.key}</span></div>` : ""}${s.tasks.documents !== "none" ? `<div class="detail-row"><div><strong>Prepare appointment documents</strong><p>${s.tasks.documents === "ready" && !s.docUpdateKnown ? "A new update is waiting in Sarah’s IM. Open it to learn the result." : s.tasks.documents === "preparing" ? `Sarah accepted this at ${time(s.docStarted ?? s.docDue - s.settings.documents)}. Work finishes at ${time(s.docDue)}.` : "Sarah placed the folder on the entrance tray. Picking it up is a separate action."}</p></div><span class="status-chip">${s.tasks.documents === "ready" && !s.docUpdateKnown ? "Update waiting" : s.tasks.documents}</span></div>` : ""}${s.appointment ? `<div class="detail-row"><div><strong>Hospital visit · Day ${s.appointment.day ?? s.day} · ${time(s.appointment.time)}</strong><p>Dr. Daniel Patel · ${s.appointment.duration} min consultation.<br>${s.registered ? "Checked in." : "Bring your ID and check in at Reception."} ${s.appointment.status === "Completed" ? "Consultation complete. No prescription was issued." : ""}</p></div><span class="status-chip">${s.appointment.status}</span></div>` : ""}${Object.values(s.tasks).every((x) => x === "none") ? '<div class="notice-card">Nothing accepted yet. You can talk to your family, check the directory, or take a quiet moment.</div>' : ""}${s.plan ? `<div class="detail-row"><div><strong>Current plan</strong><p>${esc(s.plan.label)} · ${s.plan.status}<br>Stopping this plan does not cancel an appointment.</p></div></div>` : ""}`;
}
function inventoryRows() {
  const names = {
    phone: "Phone",
    key: "House Key",
    id: "ID Card",
    folder: "Document Folder",
  };
  return `<p class="muted">One object, one owner. Items change hands through real actions.</p>${Object.entries(
    s.items,
  )
    .map(
      ([k, v]) =>
        `<div class="detail-row"><div><strong>${esc(s.itemPresets[k]?.name || names[k] || k)}</strong><p>${["ground", "consumed", "kitchen shelf"].includes(v) || ["bottle", "snack"].includes(k) ? esc(Objects.describe(k)) : v === "you" ? "With you" : k === "folder" && s.tasks.documents === "ready" && !s.docUpdateKnown ? "Last known: Home · Storage cabinet" : v === "tray" ? "Home · Entrance tray" : v === "cabinet" ? "Home · Storage cabinet" : `With ${esc(personName(v))}`}</p></div><span class="status-chip ${v === "you" ? "" : "clay"}">${v === "you" ? "In pocket" : "Not carried"}</span></div>`,
    )
    .join("")}`;
}
function renderDrawer() {
  const el = $("drawer");
  el.hidden = !drawer;
  document
    .querySelectorAll("[data-panel]")
    .forEach((b) =>
      b.classList.toggle("selected", b.dataset.panel === (drawer || "world")),
    );
  if (!drawer) return;
  const title = {
    tasks: "Things to take care of",
    pocket: "In your pocket",
    journal: "The story so far",
  };
  el.innerHTML =
    `<div class="drawer-top"><h2>${title[drawer]}</h2><button class="icon-button" data-close-drawer aria-label="Close panel">×</button></div>` +
    (drawer === "tasks"
      ? taskRows()
      : drawer === "pocket"
        ? inventoryRows()
        : `<p class="muted">An append-only record of what actually happened. History cannot be edited.</p>${[
            ...s.logs,
          ]
            .reverse()
            .map(
              (e) =>
                `<div class="timeline-row"><time>D${e.day}<br>${time(e.time)}</time><span>${esc(e.text)}</span></div>`,
            )
            .join("")}`);
  if (drawer === "pocket") {
    const b = document.createElement("button");
    b.className = "primary-button";
    b.textContent = "Everyday objects";
    b.onclick = () => Objects.open();
    el.append(b);
  }
  if (drawer === "tasks") {
    const b = document.createElement("button");
    b.className = "primary-button";
    b.textContent = "Open full task board";
    b.onclick = () => Life.openTasks();
    el.append(b);
  }
}
function openDrawer(key) {
  captureDraft();
  pausePlan(
    "Your plan is paused while you review the world. Continue it in World when ready.",
  );
  drawer = drawer === key ? null : key;
  render();
}
function planStart(label, steps, kind = "travel") {
  if (s.plan && ["paused", "interrupted", "running"].includes(s.plan.status)) {
    feedback(
      "A plan is already in progress. Say “Continue the plan” or “Cancel the remaining plan” before starting another.",
      "One plan at a time",
    );
    return;
  }
  settle();
  if (kind === "travel" && /hospital/i.test(label)) Life.routeStarted();
  s.plan = {
    label,
    steps,
    kind,
    status: "running",
    started: s.time,
    trip: s.settings.trip,
  };
  log(`Started plan: ${label}.`);
  feedback(
    `Plan started: ${label}. You can press Escape to stop at the next committed checkpoint.`,
    "Action in progress",
  );
  planNext();
}
function planNext() {
  clearTimeout(planTimer);
  if (s.plan?.status !== "running") return;
  planTimer = setTimeout(
    () => {
      if (document.hidden) {
        pausePlan("The page is in the background. Your plan is paused.");
        return;
      }
      const p = s.plan;
      if (!p || p.status !== "running") return;
      const step = p.steps.shift();
      if (!step) {
        s.plan = null;
        feedback("You have reached the end of the plan.", "Plan finished");
        return;
      }
      const part = Timeline.slice(step);
      const current = part.current;
      if (part.remaining) p.steps.unshift(part.remaining);
      advance(current.minutes);
      if (current.scene) {
        s.scene = current.scene;
        s.area = current.area;
        s.roles[s.scene] = s.settings[s.scene.toLowerCase() + "Role"];
      }
      Life.afterStep(current);
      Timeline.arrived(part.events);
      if (p.status !== "running") {
        if (!p.steps.length) s.plan = null;
        save();
        render();
        return;
      }
      if (current.event) {
        s.roadEvent = true;
        makeKnown("Ben");
        npc(
          "Ben",
          "The bus has a service delay. We expect it in fifteen minutes. You can wait here or walk to the hospital.",
          { opened: false },
        );
        p.status = "interrupted";
        Plans.pauseAuto("A route event needs your decision.");
        if (!s.events.some((e) => e.source === "Ben · transport service"))
          s.events.push({
            id: crypto.randomUUID(),
            title: "Your route needs a decision",
            body: "A route update is waiting in Ben’s IM.",
            source: "Ben · transport service",
            choices: [{ key: "read-transport", label: "Open Ben’s update" }],
            day: s.day,
            time: s.time,
            status: "open",
          });
        log(
          "Route service reported a delay at the bus stop. You have not boarded.",
        );
        feedback(
          "Your journey stopped at 08:05. Ben sent an update; open his message to learn more.",
          "Journey interrupted",
        );
        return;
      }
      log(current.log || `${p.label}: checkpoint at ${time(s.time)}.`);
      if (!p.steps.length) {
        s.plan = null;
        feedback(
          current.done || `Arrived at ${s.scene} · ${s.area}.`,
          "Action complete",
        );
        Plans.afterAction();
      } else {
        feedback(
          `Checkpoint reached at ${time(s.time)}. The plan is still running. Press Escape to stop.`,
          "Action in progress",
        );
        planNext();
      }
    },
    s.plan.kind === "wait" ? 3200 : 1100,
  );
}
function pausePlan(reason) {
  Plans.pauseAuto(reason);
  if (s.plan?.status === "running") {
    clearTimeout(planTimer);
    s.plan.status = "paused";
    log(`Plan paused at the committed ${time(s.time)} checkpoint.`);
    feedback(
      reason ||
        "Stopped at the last committed checkpoint. Say “Continue the plan” or “Cancel the remaining plan”.",
      "You are in control",
    );
  }
}
function cancelPlan() {
  Plans.pauseAuto("Remaining action cancelled.");
  if (!s.plan) {
    feedback("There is no remaining plan to cancel.");
    return;
  }
  clearTimeout(planTimer);
  log(
    `Cancelled remaining steps of ${s.plan.label}. Existing appointments and promises were kept.`,
  );
  s.plan = null;
  feedback(
    "The remaining plan is cancelled. Your appointment and any messages already sent are unchanged.",
    "Plan cancelled",
  );
}
function travel(walk = false) {
  if (s.scene === "Hospital") {
    feedback(
      "You are already at the hospital. Say “Go to the consultation room” or choose another area.",
    );
    return;
  }
  if (s.time < s.settings.open) {
    feedback(
      `Hospital service opens at ${time(s.settings.open)}. You can wait or continue at home.`,
      "Hospital is closed",
    );
    return;
  }
  const trip = s.settings.trip;
  const steps = [];
  if (s.scene === "Home")
    steps.push({
      minutes: trip / 3,
      scene: "Road",
      area: "Bus Stop",
      log: "Walked from Home to the bus stop.",
    });
  if (s.fixture === "road" && !s.roadEvent && !walk) {
    steps.push(
      { minutes: 5, event: true },
      {
        minutes: 20,
        scene: "Hospital",
        area: "Reception",
        done: "You arrived at Reception. Your appointment is still booked.",
      },
    );
  } else
    steps.push({
      minutes: (trip * 2) / 3,
      scene: "Hospital",
      area: "Reception",
      done: "You arrived at Reception. Use IM to check in with Emma.",
    });
  if (
    s.appointment &&
    !Calendar.closed.includes(s.appointment.status) &&
    Calendar.now() + s.pending + steps.reduce((v, x) => v + x.minutes, 0) >
      Calendar.at(s.appointment) + 5
  ) {
    showModal(
      "You may miss your appointment",
      `<p>The planned route arrives after ${time(s.appointment.time + 5)}. Travel still has consequences; it will not silently move your appointment.</p>`,
      [
        { label: "Stay here", close: true },
        {
          label: "Travel anyway",
          primary: true,
          action: () =>
            planStart(
              walk ? "Walk to the hospital" : "Travel to the hospital",
              steps,
            ),
        },
      ],
    );
    return;
  }
  planStart(walk ? "Walk to the hospital" : "Travel to the hospital", steps);
}
function waitFor(t) {
  const numberWords = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    ten: 10,
    fifteen: 15,
    twenty: 20,
    thirty: 30,
  };
  t = t.replace(
    /\b(one|two|three|four|five|ten|fifteen|twenty|thirty)\s+(minutes?)\b/g,
    (_, n, unit) => `${numberWords[n]} ${unit}`,
  );
  if (s.plan?.status === "running") {
    feedback("You are already following a plan. Stop or cancel it first.");
    return;
  }
  if (/bus/.test(t)) {
    if (!s.busDelayRead && s.roadEvent) {
      feedback(
        "Ben has an unread update. Open it before deciding how long to wait.",
      );
      return;
    }
    if (s.plan?.status === "interrupted") s.plan = null;
    const ten = /ten|10/.test(t);
    const n = ten ? 10 : s.settings.wait;
    const steps = [];
    for (let left = n; left > 0; left -= 5)
      steps.push({
        minutes: Math.min(5, left),
        done: "Your bounded wait has ended. Decide whether to continue or change your route.",
      });
    planStart(`Wait for the bus, up to ${n} minutes`, steps, "wait");
    return;
  }
  if (/called|appointment|doctor/.test(t)) {
    if (!s.registered) {
      feedback(
        "Check in with Emma first. A booked appointment alone is not a check-in.",
      );
      return;
    }
    const remain = Calendar.at(s.appointment) - Calendar.now() - s.pending;
    if (remain <= 0) {
      callPatient();
      return;
    }
    const n = Math.min(remain, s.settings.wait);
    planStart(
      "Wait for your appointment",
      [
        {
          minutes: n,
          scene: "Hospital",
          area: "Waiting Area",
          done:
            n === remain
              ? "A hospital update arrived. Open Grace’s message to see what is next."
              : "Your waiting limit was reached. You can wait again.",
        },
      ],
      "appointment",
    );
    return;
  }
  if (/sarah|document|reply/.test(t) && s.docDue) {
    planStart(
      "Wait for Sarah’s documents",
      [
        {
          minutes: Math.min(
            s.settings.wait,
            Math.max(
              0,
              Calendar.at({ day: s.docDay ?? s.day, time: s.docDue }) -
                Calendar.now(),
            ),
          ),
          done: "Your bounded wait ended. Check Sarah’s messages for any update.",
        },
      ],
      "wait",
    );
    return;
  }
  const match = t.match(/(\d+)\s*(?:min|minute)/);
  if (/eight|8:00|08:00/.test(t) && s.time < 480) {
    planStart(
      "Wait until 08:00",
      [
        {
          minutes: Math.min(480 - s.time - s.pending, s.settings.wait),
          done: "Your bounded wait ended. You may need to wait again until 08:00.",
        },
      ],
      "wait",
    );
    return;
  }
  if (match) {
    const n = Math.min(Number(match[1]), s.settings.wait);
    if (n < 1) {
      feedback("Choose a waiting limit of at least one minute.");
      return;
    }
    planStart(
      `Wait up to ${n} minutes`,
      [{ minutes: n, done: "Your bounded wait has ended." }],
      "wait",
    );
    return;
  }
  feedback(
    "What are you waiting for? Name a person, an appointment, or a limit, such as “Wait for ten minutes”.",
    "A little more detail",
  );
}
function callPatient() {
  if (
    s.called ||
    !s.registered ||
    !s.appointment ||
    Calendar.closed.includes(s.appointment.status) ||
    Calendar.now() < Calendar.at(s.appointment) ||
    Calendar.now() > Calendar.at(s.appointment) + 5
  )
    return;
  makeKnown("Grace");
  npc(
    "Grace",
    `${s.settings.name}, ${personName(WorldDesk.route("Daniel"))} is ready for you. Please go to the consultation room now.`,
    { opened: false },
  );
  s.called = true;
  log(
    "A hospital notification was delivered. Its contents have not been viewed.",
  );
  save();
  render();
}
// Runs after actual clock checkpoints, never based on real elapsed time.
const originalAdvance = advance;
advance = function (n) {
  originalAdvance(n);
  callPatient();
  Schedules.tick();
  Life.tick();
};
function worldCommand(text) {
  const t = text.toLowerCase().replace(/[’]/g, "'");
  if (Life.world(text)) return;
  if (FlowDemo.handleCommand(t)) return;
  if (/^(stop|pause)[.!]?$/.test(t)) {
    pausePlan();
    if (!s.plan) feedback("Nothing is moving. Time is already paused.");
    return;
  }
  if (/cancel.*(plan|remaining|wait|route)/.test(t)) {
    cancelPlan();
    return;
  }
  if (/continu(e|ing)|resume/.test(t)) {
    if (!s.plan) {
      feedback("There is no paused plan. What would you like to do next?");
      return;
    }
    if (s.plan.status === "running") {
      feedback("Your plan is already running.");
      return;
    }
    if (s.plan.status === "interrupted" && !s.busDelayRead) {
      feedback("Read or listen to Ben’s message before continuing.");
      return;
    }
    s.plan.status = "running";
    feedback(
      "Continuing the remaining plan. Press Escape to stop.",
      "Action in progress",
    );
    planNext();
    return;
  }
  if (/open.*(emma|hospital directory)|hospital directory.*emma/.test(t)) {
    makeKnown("Emma");
    selectContact("Emma");
    feedback(
      "Emma’s public IM is open. No appointment has been made.",
      "Public hospital directory",
    );
    return;
  }
  if (/director(y|ies)|public contact/.test(t)) {
    openDirectory();
    return;
  }
  if (
    /(?:open|talk|chat|message).*(sarah|mia|emma|ben|grace|patel|daniel|leo|nora)/.test(
      t,
    )
  ) {
    const key = Object.keys(people).find(
      (k) =>
        t.includes(k.toLowerCase()) || (k === "Daniel" && t.includes("patel")),
    );
    if (s.known.includes(key) || people[key].public) {
      selectContact(key);
      return;
    }
    if (key === "Nora" && Schedules.located(s.npcs[key])) {
      selectContact("Nora");
      return;
    }
    feedback(
      "You do not have this private contact yet. Meet them or get an introduction first.",
    );
    return;
  }
  if (
    /task|schedule|appointment status/.test(t) &&
    !/(take|go|wait|book|cancel)/.test(t)
  ) {
    drawer = "tasks";
    render();
    return;
  }
  if (/pocket|inventory|where.*(key|id|folder)|what.*carry/.test(t)) {
    drawer = "pocket";
    render();
    return;
  }
  if (/journal|history|world record/.test(t)) {
    drawer = "journal";
    render();
    return;
  }
  if (/setting|preset|edit.*(npc|sarah|name|role|pace)/.test(t)) {
    openSettings();
    return;
  }
  if (/end.*day|sleep.*tomorrow/.test(t)) {
    endDay();
    return;
  }
  if (/role|i'm here as|i am here as|i'm here with my child/.test(t)) {
    openRole();
    return;
  }
  if (s.plan?.status === "running") {
    feedback(
      "A plan is running. Use Stop before changing the action.",
      "Action in progress",
    );
    return;
  }
  if (/take.*(id|identification).*hospital/.test(t)) {
    if (s.scene !== "Home" || s.area !== "Entrance") {
      feedback("Go to the home entrance first. The ID is on the tray.");
      return;
    }
    if (s.items.id === "tray")
      commit(s.settings.item, () => {
        s.items.id = "you";
        log("Picked up ID Card from the entrance tray.");
        travel(/walk/.test(t));
      });
    else if (s.items.id === "you") travel(/walk/.test(t));
    else feedback("The ID is not available on the tray.");
    return;
  }
  if (/(go|walk|travel|head|bus).*hospital/.test(t)) {
    travel(/walk/.test(t));
    return;
  }
  if (/^(please )?wait\b/.test(t)) {
    waitFor(t);
    return;
  }
  if (/(give|hand|deliver).*key/.test(t)) {
    const recipient = s.npcs[WorldDesk.route("Sarah")];
    const recipientPlace = Schedules.slot(recipient);
    if (
      !recipientPlace ||
      !recipientPlace.reply ||
      s.scene !== recipientPlace.scene ||
      s.area !== recipientPlace.area
    ) {
      feedback(
        `${recipient.name} must be available with you at ${recipientPlace ? `${recipientPlace.scene} · ${recipientPlace.area}` : "the agreed meeting place during an available block"} to receive the key.`,
        "Not within reach",
      );
      return;
    }
    if (s.items.key !== "you") {
      feedback(
        s.items.key === WorldDesk.route("Sarah")
          ? "Sarah already has the key. It cannot be delivered twice."
          : "You do not have the key. Take it from the entrance tray first.",
        "Check your pocket",
      );
      return;
    }
    commit(s.settings.item, () => {
      s.items.key = WorldDesk.route("Sarah");
      s.tasks.key = "completed";
      Commitments.handover();
      log(
        `House Key transferred from ${s.settings.name} to ${recipient.name} at ${s.scene} · ${s.area}.`,
      );
      npc(
        "Sarah",
        "Thanks, I have the key now. That’s one thing taken care of.",
      );
      s.feedback =
        "You handed Sarah the key. It is now in her possession, and the task is complete.";
      s.feedbackTitle = "A small promise, kept";
    });
    return;
  }
  if (/(take|pick up|get).*(key|id|identification|folder|document)/.test(t)) {
    const k = /key/.test(t)
      ? "key"
      : /id|identification/.test(t)
        ? "id"
        : "folder";
    const name = { key: "House Key", id: "ID Card", folder: "Document Folder" }[
      k
    ];
    if (s.items[k] === "you") {
      feedback(`${name} is already with you. Nothing changed.`);
      return;
    }
    if (s.scene !== "Home" || s.area !== "Entrance" || s.items[k] !== "tray") {
      feedback(
        `${name} is ${s.items[k] === "Sarah" ? "with Sarah" : s.items[k] === "cabinet" ? "in the home storage cabinet" : "on the home entrance tray"}. You need to be at the object’s actual location.`,
        "Not within reach",
      );
      return;
    }
    commit(s.settings.item, () => {
      s.items[k] = "you";
      log(`Picked up ${name} from the entrance tray.`);
      s.feedback = `${name} is now in your pocket.`;
      s.feedbackTitle = "Picked up";
    });
    return;
  }
  if (/go|move|enter|head|return/.test(t)) {
    let target;
    if (s.scene === "Home") {
      if (/entrance|tray/.test(t)) target = "Entrance";
      else if (/kitchen/.test(t)) target = "Kitchen";
      else if (/living/.test(t)) target = "Living Room";
      else if (/child|mia/.test(t)) target = "Child's Room";
      else if (/bedroom/.test(t)) target = "Bedroom";
    }
    if (s.scene === "Hospital") {
      if (/consultation|doctor/.test(t)) target = "Consultation Room";
      else if (/waiting/.test(t)) target = "Waiting Area";
      else if (/reception/.test(t)) target = "Reception";
      else if (/pharmacy/.test(t)) target = "Pharmacy";
    }
    if (target) {
      if (target === s.area) {
        feedback(`You are already in ${target}.`);
        return;
      }
      if (target === "Consultation Room" && (!s.callRead || !s.registered)) {
        feedback(
          "You need to check in and read your call notification before entering the consultation room.",
        );
        return;
      }
      if (
        target === "Consultation Room" &&
        Calendar.now() + s.settings.move > Calendar.at(s.appointment) + 5
      ) {
        feedback("The arrival grace has ended. Ask Emma about rescheduling.");
        return;
      }
      commit(s.settings.move, () => {
        s.area = target;
        log(`Moved to ${s.scene} · ${target}.`);
        s.feedback = `You are now in ${target}.`;
        s.feedbackTitle = "A change of place";
        if (target === "Consultation Room") {
          s.consultStart = s.time;
          s.appointment.status = "In consultation";
          s.tasks.hospital = "in-progress";
          makeKnown("Daniel");
          npc(
            "Daniel",
            "Hello, Chris. What would you like to discuss today? We have fifteen minutes for this visit.",
          );
          s.feedback =
            "You entered the consultation room within the arrival grace. Open Dr. Patel’s IM to describe your symptoms.";
        }
      });
      return;
    }
    if (/home/.test(t) && s.scene !== "Home") {
      const steps =
        s.scene === "Hospital"
          ? [
              {
                minutes: (s.settings.trip * 2) / 3,
                scene: "Road",
                area: "Bus Stop",
                log: "Returned along the road toward Home.",
              },
            ]
          : [];
      steps.push({
        minutes: s.settings.trip / 3,
        scene: "Home",
        area: "Entrance",
        done: "You are back at the home entrance.",
      });
      planStart("Return home", steps);
      return;
    }
  }
  if (/look|where am i|what can i do|help/.test(t)) {
    feedback(
      s.scene === "Home"
        ? "You can move between the living room, entrance, kitchen, bedroom and Mia’s room; take items from the tray; chat with family; or open the public directory."
        : s.scene === "Hospital"
          ? "Use IM to arrange or check in with Emma. Once called, go to the consultation room and speak with Dr. Patel."
          : "You can take the bus, walk to the hospital, open Ben’s IM, or return home.",
      "Around you",
    );
    return;
  }
  feedback(
    "Try one specific action, or open World desk for people, tasks, events and your saved expressions. Household actions include breakfast, tidying and rest. Ask the Assistant for wording without sending an NPC message.",
    "Could you be more specific?",
  );
}
function pendingExchange() {
  if (!s.pending) s.pending = s.settings.simple;
}
function learnMessage(m, k) {
  m.known = true;
  m.seen = true;
  if (m.type === "voice") m.heardText = m.text;
  if (WorldDesk.behavior(k) === "Ben" && s.roadEvent && /delay/.test(m.text))
    s.busDelayRead = true;
  if (WorldDesk.behavior(k) === "Grace" && s.called) s.callRead = true;
  if (
    WorldDesk.behavior(k) === "Sarah" &&
    /documents are ready|folder on the entrance tray/.test(m.text)
  )
    s.docUpdateKnown = true;
  if (
    WorldDesk.behavior(k) === "Sarah" &&
    s.tasks.key === "none" &&
    /house key/.test(m.text)
  )
    Life.invite("key");
}
function npcCommand(text, replay = false) {
  if (Life.gate(text, contact, replay)) return;
  const t = text.toLowerCase().replace(/[’]/g, "'");
  const actualWho = contact;
  const who = WorldDesk.behavior(contact);
  if (!replay)
    addMessage(s, contact, text, "you", {
      voice: !!recordingData,
      audioData: recordingData,
      transcript: false,
      seen: true,
      known: true,
    });
  recordingData = null;
  if (!replay) {
    delete s.voiceDrafts[`npc:${actualWho}`];
    delete s.voiceReviews[`npc:${actualWho}`];
  }
  if (
    !replay &&
    /^(end|finish|close) (this )?(conversation|exchange|discussion|topic)[.!]?$/i.test(
      text.trim(),
    )
  ) {
    const cost = s.pending;
    s.pending = 0;
    if (!cost) {
      feedback(
        "There is no uncommitted conversation time. Your clock did not move.",
        "Nothing to settle",
      );
      return;
    }
    commit(cost, () => {
      feedback(
        `This conversation segment is complete. ${cost} game minute${cost === 1 ? "" : "s"} settled once.`,
        "Conversation complete",
      );
      log(
        `Conversation segment with ${personName(actualWho)} settled for ${cost} game minute${cost === 1 ? "" : "s"}.`,
      );
    });
    return;
  }
  if (Life.npcInput(text, replay)) return;
  if (s.voiceDrafts) delete s.voiceDrafts[`npc:${who}`];
  if (
    /^(hi|hello|hey|good morning|good afternoon|good evening)(?:[,.! ]+(?:sarah|mia|emma|ben|grace|doctor|dr\.? patel))?[.!]?$/.test(
      t,
    )
  ) {
    pendingExchange();
    const greeting = {
      Sarah: `Good morning, ${s.settings.name}. What would you like to take care of today?`,
      Mia: `Hi, ${s.settings.name}! What are we doing today?`,
      Emma: "Hello. I can help with an appointment or check-in. What do you need?",
      Daniel:
        "Hello. Tell me in your own words what you would like to discuss.",
      Grace: "Hello! Please check in at Reception if you have an appointment.",
      Leo: "Hello. Do you have a prescription from your consultation?",
      Ben: "Hello. Are you heading to the hospital?",
      Nora: "Hello! Do you live nearby?",
    };
    npc(
      actualWho,
      greeting[who] ||
        `Hello. I am ${personName(actualWho)}. What would you like to talk about?`,
    );
    return;
  }
  if (
    /^(please )?(repeat|say that again)|what did you say|could you repeat/.test(
      t,
    )
  ) {
    const previous = (s.messages[actualWho] || [])
      .filter((m) => m.from === "npc")
      .at(-1);
    if (previous) npc(who, previous.text, { voice: previous.type === "voice" });
    else
      npc(
        who,
        "We haven’t discussed anything yet. What would you like to ask?",
      );
    return;
  }
  if (/where are you|what are you doing/.test(t)) {
    const p = s.npcs[actualWho],
      routine = Schedules.slot(p);
    pendingExchange();
    npc(
      actualWho,
      routine
        ? `I’m at ${routine.scene} · ${routine.area}. My current activity is ${routine.activity.toLowerCase()}.${who === "Sarah" && s.docDue ? ` I am also preparing your documents; I expect to finish at ${time(s.docDue)}.` : ""}`
        : "I don’t have a current location update to share. Please ask again during my next available routine.",
    );
    return;
  }
  if (who === "Sarah") {
    if (
      /can't|cannot|won't|not now|no,|sorry.*(?:key|bring)/.test(t) &&
      /key|bring|now/.test(t)
    ) {
      s.tasks.key = "declined";
      const n = s.pending || s.settings.simple;
      s.pending = 0;
      commit(n, () => {
        npc(
          who,
          "All right. I’ll make another arrangement. Thanks for letting me know.",
        );
        log("Declined Sarah’s key request; no promise was created.");
      });
      return;
    }
    if (
      /(i'll|i will|let me|sure|yes|bring).*(key|bring|you|now)|^(sure|yes|okay)[.!]?$/.test(
        t,
      ) &&
      s.items.key !== WorldDesk.route("Sarah")
    ) {
      const n = s.pending || s.settings.simple;
      s.pending = 0;
      commit(n, () => {
        s.tasks.key = "accepted";
        npc(
          who,
          "Thank you. I’ll be at the entrance. Please hand it to me there.",
        );
        log("You promised Sarah you would bring the house key.");
        s.feedback =
          "You promised to bring the key. It has not changed hands. Go to the entrance, take it, then give it to Sarah.";
        s.feedbackTitle = "A promise made";
      });
      return;
    }
    if (
      /prepare|organize|organise|get.*ready/.test(t) &&
      /document|folder|paper/.test(t)
    ) {
      if (s.tasks.documents === "preparing") {
        pendingExchange();
        npc(
          who,
          `I’m still working on them. They’ll be ready around ${time(s.docDue)}.`,
        );
        return;
      }
      if (s.tasks.documents === "ready") {
        npc(
          who,
          "I already prepared them. The folder is on the entrance tray.",
        );
        return;
      }
      if (!["cabinet", "tray"].includes(s.items.folder)) {
        npc(
          who,
          "I need access to the existing folder. Please put it on the tray or in the cabinet first.",
        );
        return;
      }
      if (s.time >= 540) {
        npc(
          who,
          "I can’t start that now; I’m only available for this task before nine.",
        );
        return;
      }
      const n = s.pending || s.settings.simple;
      s.pending = 0;
      commit(n, () => {
        s.tasks.documents = "preparing";
        s.docStarted = s.time;
        s.docCost = s.settings.documents;
        s.docDue = (s.time + s.docCost) % 1440;
        s.docDay = s.day + Math.floor((s.time + s.docCost) / 1440);
        npc(
          who,
          `Yes, I can prepare the existing folder. I’ll need ${s.settings.documents} minutes and leave it on the entrance tray.`,
        );
        log(`Sarah accepted document preparation. Due at ${time(s.docDue)}.`);
        s.feedback = `Sarah has started preparing the documents. They should be ready at ${time(s.docDue)}.`;
        s.feedbackTitle = "Someone is working on it";
      });
      return;
    }
    if (/document|folder|finish|done/.test(t) && s.tasks.documents !== "none") {
      pendingExchange();
      npc(
        who,
        s.tasks.documents === "preparing"
          ? `Not yet. I should be finished at ${time(s.docDue)}.`
          : "Yes. I finished preparing the folder and left it on the entrance tray.",
      );
      return;
    }
    if (/key/.test(t)) {
      pendingExchange();
      if (s.items.key === WorldDesk.route("Sarah"))
        npc(who, "Yes, you gave it to me at the entrance. I still have it.");
      else {
        if (s.tasks.key === "none") Life.invite("key");
        npc(
          who,
          "Yes, I need it this morning. Could you hand it to me at the entrance? It’s on the tray.",
        );
      }
      return;
    }
    if (/^stop[.!]?$/.test(t)) {
      pendingExchange();
      npc(who, "What would you like me to stop doing?");
      return;
    }
    pendingExchange();
    npc(
      who,
      `I’m here, ${s.settings.name}. We can sort out the key or prepare the appointment documents. What do you have in mind?`,
    );
    return;
  }
  if (who === "Emma") {
    if (s.time < s.settings.open || s.time >= s.settings.close) {
      npc(
        who,
        "Hospital reception is open from 08:00 to 18:00. Please contact us during those hours.",
      );
      return;
    }
    if (/cancel/.test(t) && /appointment|booking/.test(t)) {
      if (!s.appointment) {
        npc(who, "There is no appointment to cancel.");
        return;
      }
      const n = s.pending || s.settings.simple;
      s.pending = 0;
      commit(n, () => {
        s.appointment.status = "Cancelled";
        s.tasks.hospital = "cancelled";
        npc(
          who,
          "Your appointment has been cancelled. You can ask for another available slot.",
        );
        log("Explicitly cancelled the appointment through Emma.");
      });
      return;
    }
    if (
      /(here|arrived|check in|id)/.test(t) &&
      s.appointment &&
      !/need|bring|should/.test(t)
    ) {
      if (s.scene !== "Hospital" || s.area !== "Reception") {
        npc(
          who,
          "I can see your booking, but please come to Reception to check in. A message alone cannot confirm your arrival.",
        );
        return;
      }
      if (s.items.id !== "you") {
        npc(
          who,
          "Please bring your ID Card to Reception before we can check you in.",
        );
        return;
      }
      if (s.registered) {
        npc(who, "You are already checked in. Please wait for your call.");
        return;
      }
      const n = s.pending || s.settings.simple;
      s.pending = 0;
      commit(n, () => {
        s.registered = true;
        s.tasks.hospital = "registered";
        s.appointment.status = "Checked in";
        makeKnown("Grace");
        npc(
          who,
          `You’re checked in for ${time(s.appointment.time)}. Please wait in the waiting area. Grace will send you a message when the doctor is ready.`,
        );
        log(
          "Reception verified your physical arrival and ID. Check-in completed.",
        );
        s.feedback =
          "Check-in is complete. You can now wait until you are called.";
        s.feedbackTitle = "One step closer";
      });
      return;
    }
    if (/(yes|please book|confirm|book that)/.test(t) && s.proposedSlot) {
      const slot = s.proposedSlot;
      if (!Calendar.valid(s.day, slot, s.settings.simple)) {
        s.proposedSlot = null;
        npc(
          who,
          "That offered time is no longer available. Open appointment slots to choose a new one.",
        );
        return;
      }
      if (s.appointment && !Calendar.closed.includes(s.appointment.status)) {
        npc(
          who,
          `You already have an appointment at ${time(s.appointment.time)}. I won’t create a duplicate.`,
        );
        return;
      }
      const n = s.pending || s.settings.simple;
      s.pending = 0;
      commit(n, () => {
        if (s.time > slot) {
          npc(who, "That time has passed. Let’s find a later slot.");
          s.proposedSlot = null;
          return;
        }
        s.registered = false;
        s.called = false;
        s.callRead = false;
        s.consulted = false;
        s.consultStart = null;
        s.symptoms = null;
        s.appointment = {
          day: s.day,
          time: slot,
          duration: s.settings.consultation,
          status: "Booked",
          known: true,
        };
        s.tasks.hospital = "booked";
        s.proposedSlot = null;
        npc(
          who,
          `Your appointment with Dr. Patel is confirmed for ${time(slot)}. Bring your ID and check in at Reception. Please enter the consultation room within five minutes of your slot.`,
        );
        log(
          `Booked one slot with Dr. Patel at ${time(slot)}; consultation budget ${s.settings.consultation} min.`,
        );
        s.feedback = `Appointment confirmed for ${time(slot)}. Your ID Card is still ${s.items.id === "you" ? "with you" : "on the entrance tray"}.`;
        s.feedbackTitle = "A plan for today";
      });
      return;
    }
    if (/appointment|nine|9[: ]|09|slot|book|reschedule/.test(t)) {
      if (s.appointment && !Calendar.closed.includes(s.appointment.status)) {
        pendingExchange();
        npc(
          who,
          `Your appointment is at ${time(s.appointment.time)}. Please bring your ID and check in at Reception.`,
        );
        return;
      }
      pendingExchange();
      s.proposedSlot =
        s.time < 540
          ? 540
          : Math.ceil((s.time + s.settings.simple + 1) / 30) * 30;
      if (s.proposedSlot > 1050) {
        s.proposedSlot = null;
        npc(
          who,
          "There are no remaining slots today. We can discuss another day.",
        );
        return;
      }
      npc(
        who,
        `We have a ${time(s.proposedSlot)} slot with Dr. Patel. Would you like me to book it for you?`,
      );
      return;
    }
    pendingExchange();
    npc(
      who,
      "Hello. I can help you find a consultation slot or check in for an existing appointment. How can I help?",
    );
    return;
  }
  if (who === "Daniel") {
    if (
      s.scene !== "Hospital" ||
      s.area !== "Consultation Room" ||
      !s.consultStart
    ) {
      npc(
        who,
        "Please arrange a visit with Reception and come to the consultation room when called.",
      );
      return;
    }
    if (s.consulted) {
      npc(
        who,
        "Our consultation is complete. The summary records only what we discussed; no prescription was issued.",
      );
      return;
    }
    if (
      /finish|thank|understand|next step|that's all|that is all/.test(t) &&
      s.symptoms
    ) {
      const remaining = Math.max(
        0,
        s.appointment.duration - (s.time - s.consultStart),
      );
      s.pending = 0;
      commit(remaining, () => {
        s.consulted = true;
        s.appointment.status = "Completed";
        s.tasks.hospital = "completed";
        npc(
          who,
          "Thank you for explaining. We’ve completed our conversation. Please summarize your questions and the next steps we discussed. No prescription has been issued.",
        );
        log(
          "Consultation completed within its single fifteen-minute task budget. No prescription issued.",
        );
        s.feedback =
          "You completed the consultation. The conversation, arrival and check-in remain in your world history.";
        s.feedbackTitle = "A conversation completed";
      });
      return;
    }
    s.symptoms = text;
    npc(
      who,
      "Thank you for describing that in your own words. How long has this been happening, and what would you like to ask about it? When you are ready, tell me if you have any other questions.",
    );
    return;
  }
  if (who === "Ben") {
    pendingExchange();
    if (s.roadEvent) {
      npc(
        who,
        s.busDelayRead
          ? "The service delay is fifteen minutes from the update. You can keep waiting or take the walking route."
          : "There is an update in this conversation. Open it before deciding your route.",
      );
    } else
      npc(
        who,
        "The route connects Home and Hospital. From this bus stop, the remaining journey takes twenty minutes. You can also use the walking route.",
      );
    return;
  }
  if (who === "Grace") {
    pendingExchange();
    npc(
      who,
      s.called
        ? "Please check your call notification and go to the consultation room."
        : s.registered
          ? "You’re checked in. We’ll message you at your appointment time."
          : "Please check in with Emma at Reception first.",
    );
    return;
  }
  if (who === "Leo") {
    pendingExchange();
    npc(
      who,
      "I can dispense medicine only after a valid prescription has been issued. There is no prescription on your record right now.",
    );
    return;
  }
  if (who === "Nora") {
    pendingExchange();
    npc(
      who,
      "Hello! The hospital is along this road, past the crossing. I’m happy to point you in the right direction.",
    );
    return;
  }
  pendingExchange();
  const p = s.npcs[actualWho];
  npc(
    actualWho,
    `Hello. I am at ${p.area}. My current goal is to ${p.goal.charAt(0).toLowerCase() + p.goal.slice(1)}. ${p.style.toLowerCase().includes("formal") ? "How may I help you?" : "What would you like to talk about?"}`,
  );
}
function assistantCommand(text) {
  if (Life.assist(text)) return;
  assistantMessages.push({
    id: crypto.randomUUID(),
    text,
    from: "you",
    type: "text",
    time: s.time,
  });
  const t = text.toLowerCase();
  let reply;
  if (/unread|new message|delay/.test(t) && s.roadEvent && !s.busDelayRead)
    reply =
      "Ben has sent a message you haven’t opened. I can’t use its contents yet. Open or play that message first; then I can help you compare your options.";
  else if (/how.*(say|ask)|help.*(ask|say|key)|phrase|expression/.test(t))
    reply =
      "You could say: “Do you need the house key this morning?”\nIf you choose to make a promise: “I’ll bring it to you now.”\nThese are suggestions. Switch to Sarah’s IM and write your own message to send it.";
  else if (
    /repeat|explain|mean|message|what.*(hear|listen|say)|heard/.test(t)
  ) {
    const known = (s.messages[contact] || []).filter(
      (m) => m.from === "npc" && (m.known || m.heardText),
    );
    const last = known.at(-1);
    reply = last
      ? last.known
        ? `The last message you viewed from ${personName(contact)} says: “${last.text}”\nYou can ask the NPC for clarification in your own words. A viewed message does not mean you have agreed to it.`
        : `You heard this part of ${personName(contact)}’s voice message: “${last.heardText}”\nThe rest has not played yet, so I don’t know what it says. Resume the message or show its transcript to hear the full message.`
      : "You have not read or listened to a message in this conversation yet. Open it or show its transcript first.";
  } else if (
    /yesterday|remember|record|key/.test(t) &&
    s.items.key === WorldDesk.route("Sarah")
  )
    reply =
      "Your history shows you handed the House Key to Sarah at the entrance. She still has it. This fact persists across days; opening a new day does not create a second key.";
  else if (s.scene === "Home")
    reply = `You are ${s.settings.name}, at Home · ${s.area}, visiting as ${s.roles.Home.toLowerCase()}. ${s.items.key === WorldDesk.route("Sarah") ? "Sarah has the key you delivered." : "The House Key and ID Card started on the entrance tray."}\nUse World for actions such as “Go to the entrance.” Use a named IM for your own dialogue. ${s.docDue ? "Sarah is working on the documents you requested." : "You can also ask Sarah to prepare the appointment documents."} I won’t send a message or make a promise for you.`;
  else if (s.scene === "Hospital")
    reply = `You are at Hospital · ${s.area}. ${s.registered ? "You are checked in." : "Use Emma’s IM to check in with your ID."} ${s.called && !s.callRead ? "There is an unread hospital update. Open it to learn what is next." : s.callRead ? "Grace has asked you to enter the consultation room." : "Reading and asking for help do not move the clock."}`;
  else
    reply = `You are at Road · ${s.area}. ${s.busDelayRead ? "Ben reported a fifteen-minute delay. You may wait with a clear limit, stop a running plan, or walk the remaining twenty-minute route." : "You can open Ben’s public IM to ask about the route."} ${s.appointment ? `Your ${Calendar.label(s.appointment)} appointment stays booked unless you explicitly change it.` : ""}`;
  assistantMessages.push({
    id: crypto.randomUUID(),
    text: reply,
    from: "assistant",
    type: "text",
    time: s.time,
  });
  render();
}
function submit(event) {
  event?.preventDefault();
  const input = $("command-input");
  const text = input.value.trim();
  if (!text) {
    toast(
      recordingData
        ? "Add an English transcript before sending this recording."
        : "Write or dictate an English message first.",
    );
    return;
  }
  if (/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(text)) {
    toast("Please use English. No action was taken and no game time passed.");
    return;
  }
  if (Voices.busy()) {
    toast("Stop recording and review your draft before sending.");
    return;
  }
  if (mode === "npc" && Life.gate(text, contact, false)) return;
  pausePlan("Your new input paused the remaining itinerary.");
  const submittedKey = activeDraftKey();
  Voices.release(submittedKey);
  s.drafts[submittedKey] = "";
  input.value = "";
  if (mode === "world") {
    recordingData = null;
    const request = Controls.before(text);
    if (request !== false) {
      worldCommand(text);
      Controls.after(request);
    }
  } else if (mode === "assistant") {
    recordingData = null;
    assistantCommand(text);
  } else npcCommand(text);
  delete s.voiceDrafts[submittedKey];
  delete s.voiceReviews[submittedKey];
  save();
  render();
  input.focus();
}
function showModal(title, body, buttons = [], eyebrow = "YOUR WORLD") {
  pausePlan(
    "Your plan is paused while a dialog is open. Continue it in World when ready.",
  );
  $("modal-content").innerHTML =
    `<div class="modal-heading"><div><div class="eyebrow">${eyebrow}</div><h2>${title}</h2></div><button class="icon-button" data-close-modal aria-label="Close dialog">×</button></div>${body}<div class="modal-footer">${buttons.map((b, i) => `<button class="${b.primary ? "primary" : "secondary"}-button" data-modal-action="${i}">${esc(b.label)}</button>`).join("")}</div>`;
  const modal = $("modal");
  if (!modal.open) modal.showModal();
  modal.querySelectorAll("[data-modal-action]").forEach(
    (b) =>
      (b.onclick = () => {
        const action = buttons[Number(b.dataset.modalAction)];
        modal.close();
        action.action?.();
      }),
  );
  iconify(modal);
  modal
    .querySelectorAll("[data-avatar]")
    .forEach((c) => Art.avatar(c.dataset.avatar, c));
}
function openDirectory() {
  showModal(
    "People who can help",
    `<p>Public service contacts are available here. Family and private contacts come from your relationships or an introduction.</p>${[
      "Emma",
      "Daniel",
      "Leo",
      "Ben",
    ]
      .map((k) => WorldDesk.route(k))
      .filter((k) => !s.npcs[k].archived)
      .map(
        (k) =>
          `<div class="directory-row">${avatar(k)}<div><strong>${people[k].name}</strong><p>${people[k].relation} · ${esc(WorldDesk.status(k))}<br>${people[k].source}</p></div><button data-directory-contact="${k}">Open IM</button></div>`,
      )
      .join(
        "",
      )}${Schedules.located(s.npcs.Nora) ? `<div class="directory-row">${avatar("Nora")}<div><strong>Nora</strong><p>Observed nearby · This is not a private remote contact yet.</p></div><button data-directory-contact="Nora">Greet in IM</button></div>` : ""}`,
    [],
    "PUBLIC DIRECTORY",
  );
  const nearby = Object.entries(s.npcs).filter(
    ([k, p]) => !p.archived && !p.service && Schedules.located(p),
  );
  const extra = document.createElement("div");
  extra.innerHTML = nearby
    .map(
      ([k, p]) =>
        `<div class="directory-row">${avatar(k)}<div><strong>${esc(p.name)}</strong><p>Observed nearby · ${esc(Schedules.slot(p)?.area || p.area)}</p></div><button data-directory-contact="${k}">Greet in IM</button></div>`,
    )
    .join("");
  $("modal-content").append(extra);
  $("modal")
    .querySelectorAll("[data-directory-contact]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          $("modal").close();
          selectContact(b.dataset.directoryContact);
        }),
    );
}
function openRole() {
  showModal(
    "Who are you here as?",
    `<p>Your visit role gives this scene context. You remain the same person, with the same relationships and history. A role does not grant new permissions.</p><div class="form-grid"><label class="full">This visit · ${s.scene}<select id="visit-role">${[...new Set([s.settings[s.scene.toLowerCase() + "Role"], s.roles[s.scene], ...(s.scene === "Home" ? ["Father", "Parent", "Partner", "Resident"] : s.scene === "Hospital" ? ["Patient", "Accompanying parent", "Family member", "Maintenance engineer"] : ["Passenger", "Pedestrian", "Driver"])])].map((v) => `<option ${s.roles[s.scene] === v ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label></div><div class="notice-card">The map, service capacity and item ownership stay grounded in what has actually happened.</div>`,
    [
      { label: "Keep current role", close: true },
      {
        label: "Confirm visit role",
        primary: true,
        action: () => {
          const v = $("visit-role").value;
          s.roles[s.scene] = v;
          log(
            `Visit role changed to ${v} at ${s.scene}. No permissions changed.`,
          );
          feedback(
            `Your visit role is now ${v}. Your existing relationships and records remain.`,
            "Visit context updated",
          );
        },
      },
    ],
  );
}
let settingsDraft,
  settingsTab = "world";
function openSettings() {
  captureDraft();
  settingsDraft = { ...s.settings };
  settingsTab = "world";
  renderSettings();
}
function settingsFields() {
  if (settingsTab === "people")
    return `<label>NPC name <input id="set-sarahName" value="${esc(settingsDraft.sarahName)}" maxlength="40"></label><label>Speaking style <input id="set-sarahStyle" value="${esc(settingsDraft.sarahStyle)}" maxlength="100"></label><label class="full">Current goal <input id="set-sarahGoal" value="${esc(settingsDraft.sarahGoal)}" maxlength="150"></label><label class="full">Appearance description <input id="set-sarahAppearance" value="${esc(settingsDraft.sarahAppearance)}" maxlength="150"></label><div class="full notice-card">Sarah · Partner · Home / Entrance<br>Available for household tasks: 07:00–09:00. Existing memories and messages are read-only. This edit changes future descriptions; it does not replace her identity or rewrite a promise.</div>`;
  if (settingsTab === "pace")
    return [
      "simple",
      "move",
      "item",
      "trip",
      "documents",
      "consultation",
      "wait",
      "voice",
    ]
      .map((k) => {
        const info = {
          simple: ["Simple dialogue node", 1, 3, 1, "min"],
          move: ["Same-scene movement", 1, 5, 1, "min"],
          item: ["Pick up / hand over", 1, 3, 1, "min"],
          trip: ["Home–Hospital route", 15, 60, 3, "min"],
          documents: ["Prepare documents", 5, 30, 1, "min"],
          consultation: ["Consultation", 10, 20, 1, "min"],
          wait: ["Maximum single wait", 5, 120, 1, "min"],
          voice: ["New NPC voice messages", 10, 90, 10, "%"],
        }[k];
        return `<label>${info[0]} · ${info[4]}<input id="set-${k}" type="number" min="${info[1]}" max="${info[2]}" step="${info[3]}" value="${settingsDraft[k]}" data-min="${info[1]}" data-max="${info[2]}" data-step="${info[3]}"><span class="setting-note">${info[1]}–${info[2]}${info[4]}${info[3] > 1 ? ` · steps of ${info[3]}` : ""}</span></label>`;
      })
      .join("");
  return `<label class="full">Your name<input id="set-name" value="${esc(settingsDraft.name)}" maxlength="40"></label><label>Home default role<input id="set-homeRole" value="${esc(settingsDraft.homeRole)}" maxlength="40"></label><label>Hospital default role<input id="set-hospitalRole" value="${esc(settingsDraft.hospitalRole)}" maxlength="40"></label><label>Road default role<input id="set-roadRole" value="${esc(settingsDraft.roadRole)}" maxlength="40"></label><div class="full notice-card">Engineer · Mia’s father · Sarah’s partner<br>Home, Hospital and Road are fixed single-floor scenes. Their rooms and services cannot be edited. Changing defaults affects future visits; confirm your current visit role separately.</div>`;
}
function collectSettings() {
  document
    .querySelectorAll('[id^="set-"]')
    .forEach(
      (el) =>
        (settingsDraft[el.id.slice(4)] =
          el.type === "number" ? Number(el.value) : el.value.trim()),
    );
}
function renderSettings() {
  showModal(
    "Make this world yours",
    `<p>Start with a complete preset. Edit what matters to you; preview every change before saving.</p><div class="theme-buttons">${["world", "people", "pace"].map((k) => `<button data-settings-tab="${k}" class="${k === settingsTab ? "active" : ""}">${{ world: "You & your roles", people: "Sarah · NPC", pace: "World pace" }[k]}</button>`).join("")}</div><div class="desk-toolbar"><button data-desk-link="profile" class="text-button">Full profile</button><button data-desk-link="people" class="text-button">All NPCs</button><button data-desk-link="pace" class="text-button">All pace settings</button></div><div class="form-grid" id="settings-fields">${settingsFields()}</div><div id="settings-preview"></div>`,
    [
      { label: "Cancel", close: true },
      {
        label: "Preview changes",
        primary: true,
        action: () => {
          collectSettings();
          renderSettings();
          previewSettings();
        },
      },
    ],
    "WORLD PRESETS",
  );
  document
    .querySelectorAll("[data-desk-link]")
    .forEach((b) => (b.onclick = () => WorldDesk.open(b.dataset.deskLink)));
  document.querySelectorAll("[data-settings-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        collectSettings();
        settingsTab = b.dataset.settingsTab;
        renderSettings();
      }),
  );
}
function previewSettings() {
  const errs = [];
  for (const k of [
    "name",
    "homeRole",
    "hospitalRole",
    "roadRole",
    "sarahName",
    "sarahStyle",
    "sarahGoal",
    "sarahAppearance",
  ])
    if (
      !settingsDraft[k] ||
      /[\u3400-\u9fff\u3040-\u30ff]/.test(settingsDraft[k])
    )
      errs.push(`${k}: enter an English value.`);
  const ranges = {
    simple: [1, 3, 1],
    move: [1, 5, 1],
    item: [1, 3, 1],
    trip: [15, 60, 3],
    documents: [5, 30, 1],
    consultation: [10, 20, 1],
    wait: [5, 120, 1],
    voice: [10, 90, 10],
  };
  for (const [k, [min, max, step]] of Object.entries(ranges)) {
    const v = settingsDraft[k];
    if (!Number.isInteger(v) || v < min || v > max || (v - min) % step)
      errs.push(`${k}: choose ${min}–${max} in steps of ${step}.`);
  }
  if (settingsDraft.simple > settingsDraft.discussion)
    errs.push("Simple dialogue must not exceed discussion time.");
  const diff = Object.keys(settingsDraft).filter(
    (k) => settingsDraft[k] !== s.settings[k],
  );
  $("settings-preview").innerHTML =
    `<div class="preview ${errs.length ? "error" : ""}"><strong>${errs.length ? "Please check these values" : diff.length ? "Preview · validation passed" : "No changes yet"}</strong><br>${errs.length ? errs.map(esc).join("<br>") : diff.length ? diff.map((k) => `${esc(k)}: ${esc(s.settings[k])} → ${esc(settingsDraft[k])}`).join("<br>") : "Your current preset is unchanged."}${!errs.length && diff.length ? "<br>New actions and future visits use these values. Current plans, accepted tasks, appointments and history retain their saved values." : ""}</div>${!errs.length && diff.length ? '<div class="modal-footer"><button id="save-settings" class="primary-button">Save validated changes</button></div>' : ""}`;
  if ($("save-settings"))
    $("save-settings").onclick = () => {
      s.settings = { ...settingsDraft };
      Object.assign(s.npcs.Sarah, {
        name: s.settings.sarahName,
        style: s.settings.sarahStyle,
        goal: s.settings.sarahGoal,
        appearance: s.settings.sarahAppearance,
      });
      WorldDesk.hydrate();
      log(`Preset updated for future actions: ${diff.join(", ")}.`);
      $("modal").close();
      save();
      render();
      toast(
        "Changes saved. Existing records and confirmed plans are preserved.",
      );
    };
  $("modal-content").scrollTop = $("modal-content").scrollHeight;
}
function applyTheme(theme) {
  const palettes = {
    paper: ["#f6f3ec", "#fcfbf7", "#e8ebdd", "#3e6250"],
    sage: ["#edf1e8", "#f8faf3", "#dfe9d9", "#45614a"],
    linen: ["#f5eee2", "#fffaf0", "#e8e4cf", "#655c41"],
  };
  const p = palettes[theme] || palettes.paper;
  ["--paper", "--surface", "--map", "--green"].forEach((k, i) =>
    document.documentElement.style.setProperty(k, p[i]),
  );
}
function openStudio() {
  showModal(
    "Prototype studio",
    `<p>A / Everyday Story · Temporary Scentalka wordmark. This is a local interaction prototype with scripted world rules, browser voice and device storage. No AI service or backend is connected.</p><h3 style="font-size:12px;margin-top:24px">A quieter shade of everyday</h3><div class="theme-buttons">${["paper", "sage", "linen"].map((k) => `<button class="${s.settings.theme === k ? "active" : ""}" data-theme="${k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join("")}</div><h3 style="font-size:12px;margin-top:27px">Independent demo saves</h3><p>Each story keeps its own progress. Switching saves never inserts an appointment or replays a task in your current world.</p>${[
      [
        "home",
        "01 / A morning at home",
        "07:00 · Key handover, family IM and real item ownership.",
      ],
      [
        "hospital",
        "02 / A hospital visit",
        "08:00 · Find Emma, book 09:00, bring your ID and check in.",
      ],
      [
        "road",
        "03 / A change of plans",
        "08:00 · Existing 09:00 appointment, bus delay, stop and walk.",
      ],
    ]
      .map(
        ([k, title, desc]) =>
          `<button class="scenario-card" data-fixture="${k}"><strong>${title}${store.active === k ? ' <span style="font-size:11px">· Current</span>' : ""}</strong><small>${desc} ${store.worlds[k] ? "Continue saved progress." : "Open a fresh preset."}</small></button>`,
      )
      .join("")}${
      Object.keys(store.worlds).some(
        (k) => !["home", "hospital", "road"].includes(k),
      )
        ? `<h3 style="font-size:12px;margin-top:24px">Saved stories</h3>${Object.entries(
            store.worlds,
          )
            .filter(([k]) => !["home", "hospital", "road"].includes(k))
            .map(
              ([k, v]) =>
                `<button class="helper-command" data-fixture="${k}">${v.fixture} · Day ${v.day} · ${time(v.time)}</button>`,
            )
            .join("")}`
        : ""
    }<div class="modal-footer"><button id="reset-fixture" class="secondary-button">New copy of current preset</button></div>`,
    [],
    "DESIGN REVIEW",
  );
  document.querySelectorAll("[data-theme]").forEach(
    (b) =>
      (b.onclick = () => {
        s.settings.theme = b.dataset.theme;
        applyTheme(s.settings.theme);
        Art.draw($("world-canvas"), s);
        save();
        openStudio();
      }),
  );
  document.querySelectorAll("[data-fixture]").forEach(
    (b) =>
      (b.onclick = () => {
        $("modal").close();
        load(b.dataset.fixture);
      }),
  );
  $("reset-fixture").onclick = () => {
    const key = s.fixture;
    showModal(
      "Start a separate story?",
      `<p>Your current story stays saved, with all of its progress. A fresh copy of the ${key} preset starts with the system defaults.</p>`,
      [
        { label: "Keep playing", close: true },
        {
          label: "Create a new copy",
          primary: true,
          action: () => {
            const copyKey = `${key}-copy-${Date.now()}`;
            store.worlds[copyKey] = fresh(key);
            load(copyKey);
            toast(
              "A fresh copy is open. Your previous story is still saved on this device.",
            );
          },
        },
      ],
    );
  };
}
function endDay() {
  Life.dayEnd();
}
function showShortcuts() {
  showModal(
    "A world at your fingertips",
    `<p>Every game action can be controlled with English text or voice. Use Tab and Enter to operate panels. Clicking the map never moves your character.</p><div class="key-list"><span>Optional flow examples</span><kbd>Alt + F</kbd><span>World / selected NPC / Assistant</span><kbd>Alt + 1 / 2 / 3</kbd><span>Focus the input</span><kbd>/</kbd><span>Tasks / Pocket / Journal</span><kbd>Alt + T / I / J</kbd><span>Stop the current world plan</span><kbd>Esc</kbd><span>Start / stop a voice recording</span><kbd>Alt + M</kbd><span>Play / pause the latest NPC voice</span><kbd>Alt + P</kbd><span>Show / hide its transcript</span><kbd>Alt + R</kbd><span>Public directory</span><kbd>Alt + D</kbd><span>World presets</span><kbd>Alt + S</kbd></div><div class="notice-card">In an NPC chat, typing “Stop” sends that word to the NPC. Escape always stops the world plan. Stop never retracts a delivered message.</div>`,
    [
      { label: "Customize keys", action: () => Controls.open() },
      { label: "Back to life", primary: true, close: true },
    ],
    "KEYBOARD CONTROLS",
  );
}
function findMessage(id) {
  for (const [k, list] of Object.entries(s.messages)) {
    const m = list.find((v) => v.id === id);
    if (m) return { m, k };
  }
  return null;
}
function stopPlayback() {
  const found = playingId && findMessage(playingId);
  if (audio && found) found.m.playbackSeconds = audio.currentTime;
  playingId = null;
  if (window.speechSynthesis) speechSynthesis.cancel();
  if (audio) {
    audio.pause();
    audio = null;
  }
}
function stopMedia() {
  Voices.cancel(true);
  Voices.release();
  stopPlayback();
  if (recorder?.state === "recording") {
    recordingCancelled = true;
    recorder.stop();
  }
  recognition?.stop();
  recordingStream?.getTracks().forEach((t) => t.stop());
  recordingData = null;
}
function playMessage(id) {
  const found = findMessage(id);
  if (!found) return;
  const { m, k } = found;
  if (playingId === id) {
    stopPlayback();
    save();
    renderMessages();
    return;
  }
  if (Voices.busy()) return toast("Stop or cancel recording before playback.");
  if (m.audioRemoved && m.from === "you")
    return toast("This recording was deleted. Its transcript is preserved.");
  stopPlayback();
  playingId = id;
  const finish = () => {
    if (playingId !== id) return;
    m.playbackSeconds = 0;
    m.playbackChar = 0;
    m.listened = true;
    m.heardText = m.text;
    learnMessage(m, k);
    playingId = null;
    save();
    renderMessages();
  };
  const failed = () => {
    if (playingId !== id) return;
    playingId = null;
    toast("Audio unavailable. Your transcript and playback position remain.");
    renderMessages();
  };
  if (m.audioData) {
    audio = new Audio(m.audioData);
    audio.onloadedmetadata = () => {
      if (m.playbackSeconds && m.playbackSeconds < audio.duration)
        audio.currentTime = m.playbackSeconds;
    };
    audio.ontimeupdate = () => {
      m.playbackSeconds = audio.currentTime;
    };
    audio.onended = finish;
    audio.onerror = failed;
    audio
      .play()
      .then(() => renderMessages())
      .catch(failed);
    return;
  }
  if (!window.speechSynthesis) return failed();
  const offset = m.playbackChar || 0;
  const u = new SpeechSynthesisUtterance(m.text.slice(offset));
  u.lang = "en-US";
  u.rate = 0.93;
  const voices = speechSynthesis
    .getVoices()
    .filter((v) => v.lang.startsWith("en"));
  const p = s.npcs[k];
  if (!p.voice && voices.length) {
    p.voice =
      voices[
        Math.max(0, Object.keys(s.npcs).indexOf(k)) % voices.length
      ].voiceURI;
    save();
  }
  u.voice = voices.find((v) => v.voiceURI === p.voice) || voices[0] || null;
  u.onboundary = (e) => {
    if (playingId === id) {
      const boundary = Number.isFinite(e.charIndex)
        ? Math.max(0, Math.min(u.text.length, e.charIndex))
        : 0;
      m.playbackChar = offset + boundary;
      m.heardText = m.text.slice(0, m.playbackChar).trimEnd();
      save();
      renderMessages();
    }
  };
  u.onstart = () => renderMessages();
  u.onend = finish;
  u.onerror = (e) => {
    if (!["canceled", "interrupted"].includes(e.error)) failed();
  };
  speechSynthesis.speak(u);
  renderMessages();
}
function toggleTranscript(id) {
  const found = findMessage(id);
  if (!found) return;
  const { m, k } = found;
  m.transcript = !m.transcript;
  if (m.transcript) learnMessage(m, k);
  save();
  renderMessages();
}
let recordingCancelled = false,
  recordingWorld,
  recordingOriginalDraft = "";
function cancelRecording() {
  Voices.cancel();
}
async function recordVoice() {
  return Voices.record();
}
document.addEventListener("click", (e) => {
  const el = e.target.closest("button");
  if (!el) return;
  if (el.dataset.bookmark) {
    const m = [...Object.values(s.messages).flat(), ...assistantMessages].find(
      (m) => m.id === el.dataset.bookmark,
    );
    if (m) WorldDesk.bookmark(m.text);
    return;
  }
  if (el.dataset.assistantPlay) {
    if (Voices.busy())
      return toast("Stop or cancel recording before playback.");
    const m = assistantMessages.find((m) => m.id === el.dataset.assistantPlay);
    if (m && window.speechSynthesis) {
      stopPlayback();
      const u = new SpeechSynthesisUtterance(m.text);
      u.lang = "en-US";
      speechSynthesis.speak(u);
    }
    return;
  }
  if (el.dataset.mode) {
    if (recorder?.state === "recording") {
      toast("Stop recording before switching context.");
      return;
    }
    recordingData = null;
    setMode(el.dataset.mode);
  } else if (el.dataset.contact) {
    if (recorder?.state === "recording") {
      toast("Stop recording before switching conversations.");
      return;
    }
    recordingData = null;
    selectContact(el.dataset.contact);
  } else if (el.dataset.panel) {
    el.dataset.panel === "world"
      ? ((drawer = null), render(), setMode("world"))
      : openDrawer(el.dataset.panel);
  } else if (el.hasAttribute("data-close-drawer")) {
    drawer = null;
    render();
  } else if (el.hasAttribute("data-close-modal")) $("modal").close();
  else if (el.dataset.play) playMessage(el.dataset.play);
  else if (el.dataset.transcript) toggleTranscript(el.dataset.transcript);
  else if (el.dataset.openMessage) {
    const f = findMessage(el.dataset.openMessage);
    f.m.opened = true;
    f.m.seen = true;
    if (f.m.type === "text") learnMessage(f.m, f.k);
    save();
    render();
  } else if (el.dataset.draft) {
    $("command-input").value = el.dataset.draft;
    captureDraft();
    updatePreview();
    $("command-input").focus();
  }
});
$("input-form").addEventListener("submit", submit);
$("command-input").addEventListener("input", () => {
  captureDraft();
  updatePreview();
  clearTimeout(persistTimer);
  persistTimer = setTimeout(save, 350);
});
$("settings").onclick = openSettings;
$("world-desk").onclick = () => WorldDesk.open();
$("directory").onclick = openDirectory;
$("role-button").onclick = openRole;
$("open-review").onclick = openStudio;
$("end-day").onclick = endDay;
$("shortcuts").onclick = showShortcuts;
$("stop-plan").onclick = () => pausePlan();
$("mic-button").onclick = recordVoice;
$("voice-review").onclick = () => Voices.review();
$("modal").addEventListener("close", () => {
  if (!playingId) stopPlayback();
});
document.addEventListener("keydown", (e) => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
  if (e.key === "Escape") {
    if ($("modal").open) return;
    if (s.plan?.status === "running" || s.itinerary?.autoRun) {
      e.preventDefault();
      pausePlan();
      return;
    }
    if (drawer) {
      drawer = null;
      render();
      return;
    }
  }
  if ($("modal").open) return;
  if (e.altKey) {
    const k = e.key.toLowerCase();
    const modes = { 1: "world", 2: "npc", 3: "assistant" };
    if (modes[k]) {
      e.preventDefault();
      if (recorder?.state === "recording") {
        toast("Stop recording before changing input context.");
        return;
      }
      recordingData = null;
      setMode(modes[k]);
      return;
    }
    const actions = {
      f: () => FlowDemo.open(),
      w: () => {
        drawer = null;
        setMode("world");
      },
      t: () => openDrawer("tasks"),
      i: () => openDrawer("pocket"),
      j: () => openDrawer("journal"),
      d: openDirectory,
      s: openSettings,
      m: recordVoice,
      p: () => {
        const v = (s.messages[contact] || [])
          .filter((m) => m.type === "voice" && m.opened !== false)
          .at(-1);
        if (v) playMessage(v.id);
        else toast("No voice message is available in this conversation.");
      },
      r: () => {
        const v = (s.messages[contact] || [])
          .filter((m) => m.type === "voice" && m.opened !== false)
          .at(-1);
        if (v) toggleTranscript(v.id);
      },
    };
    if (actions[k]) {
      e.preventDefault();
      actions[k]();
      return;
    }
  }
  if (e.key === "/" && !typing) {
    e.preventDefault();
    $("command-input").focus();
  }
  if (e.key === "?" && !typing) showShortcuts();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pausePlan(
      "The page is in the background. Your plan is paused at its last checkpoint.",
    );
    if (Voices.busy()) Voices.cancel(true);
    stopPlayback();
    save();
  }
});
window.addEventListener("pagehide", () => {
  pausePlan();
  captureDraft();
  save();
});
Art.load().then(() => {
  load(store.active || "home");
  iconify();
});
// Introspection is intentionally limited to this throwaway prototype's local review tools.
window.Prototype = {
  state: () => structuredClone(s),
  load,
  reset: (key) => {
    if (s) save();
    store.worlds[key] = fresh(key);
    s = null;
    load(key);
  },
  command: (text, context = "world", who) => {
    if (who) selectContact(who);
    setMode(context);
    $("command-input").value = text;
    submit();
  },
  pause: pausePlan,
};
