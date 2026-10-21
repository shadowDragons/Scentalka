/* World configuration and personal records. All mutations preserve the event log. */
const WorldDesk = (() => {
  const basePeople = structuredClone(peopleSeed());
  function peopleSeed() {
    return {
      Sarah: ["Sarah", "Partner", "Home", "Entrance", 7, 22],
      Mia: ["Mia", "Daughter", "Home", "Child's Room", 7, 20],
      Emma: ["Emma", "Receptionist", "Hospital", "Reception", 8, 18],
      Daniel: [
        "Dr. Daniel Patel",
        "Doctor",
        "Hospital",
        "Consultation Room",
        8,
        18,
      ],
      Grace: ["Grace", "Nurse", "Hospital", "Waiting Area", 8, 18],
      Leo: ["Leo", "Pharmacist", "Hospital", "Pharmacy", 8, 18],
      Ben: ["Ben", "Bus driver", "Road", "Bus Stop", 7, 19],
      Nora: ["Nora", "Neighbor", "Road", "Sidewalk", 8, 18],
    };
  }
  const pace = {
    simple: ["Simple exchange · minutes", 1, 3, 1, 1],
    discussion: ["Discussion · minutes", 3, 10, 1, 5],
    move: ["Local movement · minutes", 1, 5, 1, 1],
    item: ["Item action · minutes", 1, 3, 1, 1],
    trip: ["Home–Hospital route · minutes", 15, 60, 3, 30],
    documents: ["Document preparation · minutes", 5, 30, 1, 10],
    consultation: ["Consultation · minutes", 10, 20, 1, 15],
    wait: ["Single wait limit · minutes", 5, 120, 1, 30],
    activeLimit: ["Active optional tasks", 1, 8, 1, 3],
    inviteLimit: ["New invitations / day", 1, 12, 1, 5],
    cooldown: ["Declined request cooldown · hours", 6, 72, 1, 24],
    interruptGap: ["Optional interruption gap · minutes", 15, 120, 1, 30],
    interruptLimit: ["Optional interruptions / hour", 1, 4, 1, 2],
    voice: ["New NPC voice messages · %", 10, 90, 10, 50],
    nextMorning: ["Next morning · hour", 5, 10, 1, 7],
  };
  const areas = {
    Home: ["Entrance", "Living Room", "Kitchen", "Bedroom", "Child's Room"],
    Hospital: ["Reception", "Waiting Area", "Consultation Room", "Pharmacy"],
    Road: [
      "Bus Stop",
      "Sidewalk",
      "Crossing",
      "Home Entrance",
      "Hospital Entrance",
    ],
  };
  const defaultProfile = {
    background: "An engineer balancing work and family life.",
    occupation: "Engineer",
    family: "Sarah is my partner. Mia is my daughter.",
    routine: "Family time in the morning; personal errands during the day.",
    goal: "Take care of everyday responsibilities through my own conversations.",
  };
  function profile(k, row) {
    return {
      id: k,
      name: row[0],
      title: row[1],
      age: k === "Mia" ? 8 : 34,
      scene: row[2],
      area: row[3],
      start: row[4] * 60,
      end: row[5] * 60,
      appearance:
        k === "Sarah"
          ? "Auburn hair, comfortable everyday clothes."
          : "Everyday clothes suited to their role.",
      background: `Lives and works in this neighborhood as a ${row[1].toLowerCase()}.`,
      relation:
        k === "Sarah"
          ? "Partner"
          : k === "Mia"
            ? "Daughter"
            : k === "Nora"
              ? "Stranger"
              : "Service contact",
      personality: "Friendly and practical",
      preferences: "Clear plans and respectful conversation",
      habits: "Checks messages between activities",
      style: "Clear and conversational",
      goal:
        k === "Mia"
          ? "Organize my belongings"
          : "Coordinate my daily responsibilities",
      longGoal: "Become more reliable at helping people",
      pressure: "Limited time between responsibilities",
      connections: "Knows the people they work or live with",
      memory:
        k === "Sarah" || k === "Mia"
          ? "We live in the same household."
          : "No private shared history with the protagonist.",
      privateInfo: "No private information configured",
      resources: "Only the supported resources for this role",
      voice: "",
      sprite: k,
      archived: false,
      service: k,
      progress: 0,
      trust: "Unestablished",
    };
  }
  function normalize(st) {
    st.schemaVersion = 2;
    st.profile ??= { ...defaultProfile };
    st.npcs ??= {};
    Object.entries(basePeople).forEach(
      ([k, v]) => (st.npcs[k] ??= profile(k, v)),
    );
    Object.entries(st.npcs).forEach(
      ([k, p]) => (p.sprite ??= basePeople[k] ? k : "Chris"),
    );
    st.serviceAssignments ??= {};
    st.contactPermissions ??= { Sarah: true, Mia: true };
    st.assistantHistory ??= [];
    st.expressions ??= [];
    st.artifacts ??= {};
    st.reflections ??= [];
    st.hiddenChats ??= {};
    st.settings.open ??= 480;
    st.settings.close ??= 1080;
    Object.entries(pace).forEach(([k, v]) => (st.settings[k] ??= v[4]));
    st.presetVersion ??= 1;
    st.npcs.Sarah.name = st.settings.sarahName;
    st.npcs.Sarah.style = st.settings.sarahStyle;
    return st;
  }
  function hydrate() {
    for (const k of Object.keys(people)) if (!basePeople[k]) delete people[k];
    for (const [k, p] of Object.entries(s.npcs))
      people[k] = {
        name: p.name,
        relation: p.relation,
        location: `${p.scene} · ${p.area}`,
        source:
          p.service && ["Emma", "Daniel", "Leo", "Ben"].includes(p.service)
            ? "Public service directory"
            : basePeople[k]
              ? k === "Nora"
                ? "Observed nearby"
                : "Existing relationship"
              : "World configuration · introduction required",
        public:
          ["Emma", "Daniel", "Leo", "Ben"].includes(p.service) && !p.archived,
      };
  }
  function route(k) {
    return s.serviceAssignments[k] || k;
  }
  function behavior(k) {
    return s.npcs[k]?.service || k;
  }
  function status(k) {
    const p = s.npcs[k];
    if (!p) return "Unknown";
    if (p.archived) return "Archived";
    if (!Schedules.available(p))
      return Schedules.next(p)
        ? "Resting · reply next shift"
        : "Unavailable · no reply time promised";
    if (behavior(k) === "Sarah" && s.docDue)
      return `Preparing documents until ${time(s.docDue)}`;
    if (behavior(k) === "Daniel" && s.consultStart && !s.consulted)
      return "Consultation in progress";
    return "Available";
  }
  function nav(title, body, buttons = []) {
    showModal(
      title,
      `<button class="desk-back" data-desk="home">← World desk</button>${body}`,
      buttons,
      "YOUR WORLD",
    );
    bind();
  }
  function bind() {
    document
      .querySelectorAll("[data-desk]")
      .forEach((b) => (b.onclick = () => open(b.dataset.desk)));
    document
      .querySelectorAll("[data-edit-person]")
      .forEach((b) => (b.onclick = () => editPerson(b.dataset.editPerson)));
  }
  function open(section = "home") {
    captureDraft();
    normalize(s);
    if (section === "voice") return Voices.queue();
    if (section === "objects") return Objects.open();
    if (section === "plans") return Plans.open();
    if (section === "queue") return Calendar.queue();
    if (section === "commitments") return Commitments.detail();
    if (section === "new") return Presets.newStory();
    if (section === "items") return Presets.items();
    if (section === "pharmacy") return Presets.pharmacyFixture();
    if (section === "profile") return editProfile();
    if (section === "keys") return Controls.open();
    if (section === "people") return listPeople();
    if (section === "learning") return learning();
    if (section === "data") return data();
    if (section === "schedule") return schedule();
    if (section === "pace") return editPace();
    if (section === "recovery") return Controls.recovery();
    if (section === "tasks") return Life.openTasks();
    if (section === "events") return Life.openEvents();
    const cards = [
      [
        "voice",
        "17",
        "Voice & listening",
        "Review your own recording and choose which update to hear next.",
      ],
      [
        "objects",
        "16",
        "Everyday objects",
        "Drink, refill, eat and recover things left behind.",
      ],
      [
        "plans",
        "13",
        "Your itinerary",
        "Preview, edit and run supported steps without giving away your choices.",
      ],
      [
        "queue",
        "14",
        "Hospital standby",
        "Join with ID, wait with a limit, and decide on any offered slot.",
      ],
      [
        "commitments",
        "15",
        "Promises & follow-ups",
        "Deadlines, agreed changes and new arrangements after a missed promise.",
      ],
      [
        "profile",
        "01",
        "You & your roles",
        "Background, family, routines and personal goals.",
      ],
      [
        "people",
        "02",
        "People in your world",
        "Profiles, schedules, relationships and service dependencies.",
      ],
      [
        "tasks",
        "03",
        "Tasks & written work",
        "Requests, commitments, drafts and submitted versions.",
      ],
      [
        "schedule",
        "04",
        "Today’s arrangements",
        "Appointments, opening hours and people’s availability.",
      ],
      [
        "events",
        "05",
        "Things that changed",
        "State-related events, choices and outstanding decisions.",
      ],
      [
        "learning",
        "06",
        "Words to keep",
        "Expressions, their context and daily reflection.",
      ],
      [
        "pace",
        "07",
        "World pace",
        "Time costs, invitation limits and future settings.",
      ],
      [
        "recovery",
        "08",
        "When something fails",
        "Inspect request status, retry replies and preserve committed actions.",
      ],
      [
        "data",
        "09",
        "Your data",
        "Export, hide conversations, remove recordings or delete a story.",
      ],
      [
        "items",
        "10",
        "Item presets",
        "Rename existing objects without moving or duplicating them.",
      ],
      [
        "new",
        "11",
        "Begin a new story",
        "A complete preset, with optional personal details.",
      ],
      [
        "pharmacy",
        "12",
        "A pharmacy sample",
        "Try a separate, fictional prescription verification flow.",
      ],
    ];
    showModal(
      "Your world, thoughtfully kept.",
      `<p class="desk-intro">Day ${s.day} · ${time(s.time)} · ${s.scene}<br>Keep living, or take a moment to look after your world.</p><div class="desk-grid">${cards.map(([k, n, t, d]) => `<button class="desk-card" data-desk="${k}"><span>${n}</span><strong>${t}</strong><small>${d}</small><b aria-hidden="true">↗</b></button>`).join("")}</div>`,
      [],
      "WORLD DESK",
    );
    bind();
  }
  function field(k, label, value, type = "text") {
    return `<label>${label}<input id="desk-${k}" type="${type}" value="${esc(value)}" ${type === "text" ? 'maxlength="300"' : ""}></label>`;
  }
  function area(k, label, value) {
    return `<label class="full">${label}<textarea id="desk-${k}" rows="2" maxlength="800">${esc(value)}</textarea></label>`;
  }
  function values(keys) {
    return Object.fromEntries(
      keys.map((k) => [k, $(`desk-${k}`).value.trim()]),
    );
  }
  function english(v) {
    return (
      v &&
      /[A-Za-z]/.test(v) &&
      !/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(v)
    );
  }
  function preview(title, diffs, action) {
    showModal(
      title,
      `<p>These changes apply to future interactions. Existing events, messages, ownership and accepted commitments retain their records.</p><div class="review-diff">${diffs.length ? diffs.map((d) => `<p>${esc(d)}</p>`).join("") : "No changes."}</div>`,
      [
        { label: "Back", action: () => open() },
        {
          label: "Save changes",
          primary: true,
          action: () => {
            action();
            s.presetVersion++;
            hydrate();
            log(`Configuration version ${s.presetVersion} saved: ${title}.`);
            save();
            render();
            open();
          },
        },
      ],
      "REVIEW CHANGES",
    );
  }
  function editProfile() {
    const keys = Object.keys(defaultProfile);
    nav(
      "The person you bring here",
      `<p>You decide what to do and what to say. These details provide context for future interactions.</p><div class="form-grid">${field("name", "Your name", s.settings.name)}${field("occupation", "Occupation", s.profile.occupation)}${keys
        .filter((k) => k !== "occupation")
        .map((k) =>
          area(
            k,
            {
              background: "Background",
              family: "Family & relationships",
              routine: "Daily routine",
              goal: "Personal goal",
            }[k],
            s.profile[k],
          ),
        )
        .join(
          "",
        )}${["home", "hospital", "road"].map((k) => field(k + "Role", k[0].toUpperCase() + k.slice(1) + " default role", s.settings[k + "Role"])).join("")}</div>`,
      [
        { label: "Cancel", action: () => open() },
        {
          label: "Preview profile",
          primary: true,
          action: () => {
            const v = values([
              "name",
              ...keys,
              "homeRole",
              "hospitalRole",
              "roadRole",
            ]);
            if (Object.values(v).some((x) => !english(x)))
              return editError(
                "Please complete the profile in English.",
                editProfile,
              );
            preview(
              "Your profile",
              Object.entries(v)
                .filter(([k, v]) => v !== (s.profile[k] ?? s.settings[k]))
                .map(([k, v]) => `${k}: ${v}`),
              () => {
                keys.forEach((k) => (s.profile[k] = v[k]));
                ["name", "homeRole", "hospitalRole", "roadRole"].forEach(
                  (k) => (s.settings[k] = v[k]),
                );
              },
            );
          },
        },
      ],
    );
  }
  function editError(message, back) {
    showModal(
      "Please check this first",
      `<div class="notice-card">${esc(message)}</div>`,
      [{ label: "Back to form", primary: true, action: back }],
      "VALIDATION",
    );
  }
  function listPeople() {
    nav(
      "A neighborhood of people",
      `<p>Configuration is a creator’s view. A private detail here does not become knowledge in your conversations.</p><div class="people-records">${Object.entries(
        s.npcs,
      )
        .map(
          ([k, p]) =>
            `<div class="person-record">${avatar(k)}<div><strong>${esc(p.name)}</strong><p>${esc(p.title)} · ${esc(p.scene)}<br>${esc(status(k))}</p></div><button class="secondary-button" data-edit-person="${k}">${p.archived ? "View record" : "Manage"}</button></div>`,
        )
        .join("")}</div>`,
      [
        {
          label: "Add a person",
          primary: true,
          action: () => editPerson(null),
        },
      ],
    );
  }
  function editPerson(k) {
    const original = k
      ? s.npcs[k]
      : profile("new", ["Alex", "Neighbor", s.scene, areas[s.scene][0], 8, 18]);
    const p = structuredClone(original);
    if (p.archived)
      return nav(
        `${esc(p.name)} · archived`,
        `<p>This person is no longer active. Their conversations and events remain in the story.</p>${memoryRows(k)}`,
      );
    const textKeys = [
      "name",
      "title",
      "relation",
      "appearance",
      "background",
      "personality",
      "preferences",
      "habits",
      "style",
      "goal",
      "longGoal",
      "pressure",
      "connections",
      "memory",
      "privateInfo",
      "resources",
    ];
    const labels = {
      title: "Identity / occupation",
      relation: "Relationship to you",
      appearance: "Appearance description",
      background: "Background",
      personality: "Personality",
      preferences: "Preferences & boundaries",
      habits: "Habits",
      style: "Speaking style",
      goal: "Current goal",
      longGoal: "Long-term goal",
      pressure: "Life pressures",
      connections: "Relationships with other NPCs",
      memory: "Initial facts / memories",
      privateInfo: "Private information",
      resources: "Resource context · grants no new permissions",
    };
    const voices =
      window.speechSynthesis
        ?.getVoices()
        .filter((v) => v.lang.startsWith("en")) || [];
    nav(
      k ? `Looking after ${esc(p.name)}` : "Someone new in the neighborhood",
      `<p>Descriptions shape scripted responses and context. Available services and map capabilities stay within the fixed world.</p><div class="form-grid">${textKeys.map((key) => (["name", "title", "relation", "style"].includes(key) ? field(key, labels[key] || "Name", p[key]) : area(key, labels[key], p[key]))).join("")}${field("age", "Age", p.age, "number")}<label>Scene<select id="desk-scene">${Object.keys(
        areas,
      )
        .map((v) => `<option ${p.scene === v ? "selected" : ""}>${v}</option>`)
        .join(
          "",
        )}</select></label><label>Area<select id="desk-area">${areas[p.scene].map((v) => `<option ${p.area === v ? "selected" : ""}>${v}</option>`).join("")}</select></label>${field("start", "Available from", time(p.start), "time")}${field("end", "Available until", time(p.end), "time")}<label>Sprite appearance<select id="desk-sprite">${["Chris", "Sarah", "Mia", "Emma", "Daniel", "Grace", "Leo", "Ben", "Nora"].map((v) => `<option ${p.sprite === v ? "selected" : ""}>${v}</option>`).join("")}</select></label><label class="full">Stable English voice<select id="desk-voice"><option value="">System-assigned English voice</option>${voices.map((v) => `<option value="${esc(v.voiceURI)}" ${p.voice === v.voiceURI ? "selected" : ""}>${esc(v.name)}</option>`).join("")}</select></label></div><h3 class="desk-section">Experiences, kept as they happened</h3>${k ? memoryRows(k) : "<p>No shared experiences yet. Creation does not introduce a private contact.</p>"}`,
      [
        { label: "Back to people", action: listPeople },
        ...(k
          ? [
              { label: "Daily routine", action: () => Schedules.editor(k) },
              { label: "Archive / replace", action: () => archivePerson(k) },
            ]
          : []),
        {
          label: "Preview person",
          primary: true,
          action: () => {
            const v = values(textKeys);
            const age = Number($("desk-age").value);
            const mins = (id) => {
              const [h, m] = $(id).value.split(":").map(Number);
              return h * 60 + m;
            };
            const start = mins("desk-start"),
              end = mins("desk-end");
            if (
              Object.values(v).some((x) => !english(x)) ||
              age < 1 ||
              age > 110 ||
              !Number.isFinite(start) ||
              end <= start
            )
              return editError(
                "Use English descriptions, an age of 1–110, and an end time after the start.",
                () => editPerson(k),
              );
            const scene = $("desk-scene").value,
              place = $("desk-area").value;
            if (
              p.service &&
              ["Emma", "Daniel", "Grace", "Leo"].includes(p.service) &&
              (scene !== "Hospital" ||
                start > s.settings.open ||
                end < s.settings.close)
            )
              return editError(
                "Hospital service staff must cover the service window in the Hospital. Change the service hours first if needed.",
                () => editPerson(k),
              );
            const routineChanged =
              scene !== p.scene ||
              place !== p.area ||
              start !== p.start ||
              end !== p.end;
            if (routineChanged && (p.schedule?.length ?? 0) > 1)
              return editError(
                "This person has multiple daily blocks. Edit their Daily routine to change times and places without losing those blocks.",
                () => editPerson(k),
              );
            const next = {
              ...p,
              ...v,
              age,
              scene,
              area: place,
              start,
              end,
              voice: $("desk-voice").value,
              sprite: $("desk-sprite").value,
              schedule:
                routineChanged || !p.schedule
                  ? [
                      {
                        start,
                        end,
                        scene,
                        area: place,
                        activity: "Daily responsibilities",
                        reply: true,
                      },
                    ]
                  : p.schedule,
            };
            const routineError = Schedules.validate(next.schedule, next);
            if (routineError)
              return editError(routineError, () => editPerson(k));
            const id = k || `person-${crypto.randomUUID()}`;
            preview(
              k ? "NPC profile updated" : "New NPC added",
              Object.entries(next)
                .filter(
                  ([key, v]) =>
                    JSON.stringify(v) !== JSON.stringify(original[key]),
                )
                .map(([key, v]) => `${key}: ${v}`),
              () => {
                next.id = id;
                if (!k) next.service = null;
                s.npcs[id] = next;
                if (id === "Sarah") {
                  s.settings.sarahName = next.name;
                  s.settings.sarahStyle = next.style;
                  s.settings.sarahGoal = next.goal;
                  s.settings.sarahAppearance = next.appearance;
                }
                s.messages[id] ??= [];
              },
            );
          },
        },
      ],
    );
    $("desk-scene").onchange = () => {
      $("desk-area").innerHTML = areas[$("desk-scene").value]
        .map((v) => `<option>${v}</option>`)
        .join("");
    };
  }
  function memoryRows(k) {
    const p = s.npcs[k];
    return `<div class="notice-card">Current goal: ${esc(p.goal)}<br>Progress: ${p.progress} recorded steps · Relationship: ${esc(p.trust)}<br>Source: configuration and observed world events; no invented private knowledge.</div>${s.logs
      .filter((e) => e.text.includes(p.name) || e.text.includes(k))
      .slice(-6)
      .map(
        (e) =>
          `<div class="timeline-row"><time>D${e.day}<br>${time(e.time)}</time><span>${esc(e.text)}</span></div>`,
      )
      .join("")}`;
  }
  function archivePerson(k) {
    const p = s.npcs[k];
    const held = Object.entries(s.items)
      .filter(([, v]) => v === k)
      .map(([key]) => key);
    const essential = ["Sarah", "Emma", "Daniel", "Grace", "Leo"].includes(
      p.service,
    );
    const choices = Object.entries(s.npcs).filter(
      ([id, v]) => id !== k && !v.archived && v.scene === p.scene,
    );
    nav(
      "A careful handover",
      `<p>Archive ${esc(p.name)} for future activity. Old IM and private memories remain attached to this person.</p><div class="notice-card">Service: ${esc(p.service || "None")}<br>Items held: ${esc(held.join(", ") || "None")}<br>${essential ? "This duty needs a successor in the same scene." : "No required service depends on this person."}<br>${(p.service === "Sarah" && s.docDue) || (p.service === "Daniel" && s.consultStart && !s.consulted) ? "Active work must finish before archiving." : ""}</div><label class="desk-select">Successor<select id="desk-successor"><option value="">No successor</option>${choices.map(([id, v]) => `<option value="${id}">${esc(v.name)} · ${esc(v.title)}</option>`).join("")}</select></label>`,
      [
        { label: "Keep person", action: () => editPerson(k) },
        {
          label: "Preview handover",
          primary: true,
          action: () => {
            const to = $("desk-successor").value;
            if (
              ((essential || held.length) && !to) ||
              (p.service === "Sarah" && s.docDue) ||
              (p.service === "Daniel" && s.consultStart && !s.consulted)
            )
              return editError(
                "A valid successor is required for duties and held items; active work must finish first.",
                () => archivePerson(k),
              );
            if (
              to &&
              p.service &&
              s.npcs[to].service &&
              s.npcs[to].service !== p.service
            )
              return editError(
                "Choose a person without another assigned duty. One person cannot silently take two services.",
                () => archivePerson(k),
              );
            if (
              to &&
              ["Emma", "Daniel", "Grace", "Leo"].includes(p.service) &&
              !Schedules.covers(
                s.npcs[to],
                s.settings.open,
                s.settings.close,
                p.service,
              )
            )
              return editError(
                "The successor must cover the full hospital service window.",
                () => archivePerson(k),
              );
            preview(
              "Archive and hand over",
              [
                `${p.name} leaves future activity.`,
                to
                  ? `${personName(to)} receives the duty and ${held.length} held item(s). No private memories or old IM are copied.`
                  : "No duties or items to transfer.",
              ],
              () => {
                p.archived = true;
                if (to) {
                  s.npcs[to].service = p.service;
                  if (p.service) s.serviceAssignments[p.service] = to;
                  held.forEach((item) => (s.items[item] = to));
                  log(
                    `${p.name} handed their duty and held objects to ${personName(to)}.`,
                  );
                }
              },
            );
          },
        },
      ],
    );
  }
  function editPace(useDefaults = false) {
    nav(
      "The rhythm of your day",
      `<p>Future actions use the new version. Existing plans and confirmed appointments keep their saved costs.</p><div class="form-grid">${Object.entries(
        pace,
      )
        .map(
          ([k, [label, min, max, step]]) =>
            `<label>${label}<input id="pace-${k}" type="number" min="${min}" max="${max}" step="${step}" value="${useDefaults ? pace[k][4] : s.settings[k]}"><small>${min}–${max}${step > 1 ? ` · steps of ${step}` : ""}</small></label>`,
        )
        .join("")}</div>`,
      [
        { label: "Restore future defaults", action: () => editPace(true) },
        {
          label: "Preview pace",
          primary: true,
          action: () => {
            const next = {};
            for (const [k, [, min, max, step]] of Object.entries(pace)) {
              const v = Number($("pace-" + k).value);
              if (
                !Number.isInteger(v) ||
                v < min ||
                v > max ||
                (v - min) % step
              )
                return editError(
                  `Check the range and step for ${k}.`,
                  editPace,
                );
              next[k] = v;
            }
            if (next.simple > next.discussion)
              return editError(
                "A simple exchange cannot exceed a discussion node.",
                editPace,
              );
            preview(
              "World pace",
              Object.entries(next)
                .filter(([k, v]) => v !== s.settings[k])
                .map(([k, v]) => `${pace[k][0]}: ${s.settings[k]} → ${v}`),
              () => Object.assign(s.settings, next),
            );
          },
        },
      ],
    );
  }
  function schedule() {
    const a = s.appointment;
    nav(
      "A day with room to move",
      `<div class="notice-card">${a ? `Hospital · Day ${a.day ?? s.day} · ${time(a.time)} · ${esc(a.status)}<br>Single doctor, one patient per 30-minute slot · Arrival grace: 5 minutes` : "No hospital appointment yet."}</div><div class="desk-toolbar"><button class="secondary-button" id="desk-slots">View appointment slots</button><button class="secondary-button" id="desk-hours">Service hours</button></div>${Object.entries(
        s.npcs,
      )
        .filter(([, p]) => !p.archived)
        .map(
          ([k, p]) =>
            `<div class="detail-row"><div><strong>${esc(p.name)}</strong><p>${esc(p.scene)} · ${esc(p.area)}<br>${Schedules.rows(
              p,
            )
              .map(
                (r) =>
                  `${time(r.start)}–${time(r.end)} · ${esc(r.area)}${r.reply ? "" : " · No reply"}`,
              )
              .join(
                "<br>",
              )} · ${esc(status(k))}</p></div><button data-edit-person="${k}" class="text-button">Details</button></div>`,
        )
        .join("")}`,
    );
    $("desk-slots").onclick = () => Life.slots();
    $("desk-hours").onclick = serviceHours;
  }
  function serviceHours() {
    nav(
      "Keep the service coordinated",
      `<p>Opening hours and the four hospital staff shifts are changed together. Existing bookings must fit.</p><div class="form-grid">${field("open", "Open", time(s.settings.open), "time")}${field("close", "Close", time(s.settings.close), "time")}</div>`,
      [
        { label: "Back", action: schedule },
        {
          label: "Preview hours",
          primary: true,
          action: () => {
            const minutes = (id) => {
              const [h, m] = $(id).value.split(":").map(Number);
              return h * 60 + m;
            };
            const start = minutes("desk-open"),
              end = minutes("desk-close"),
              a = s.appointment;
            if (
              !Number.isFinite(start) ||
              !Number.isFinite(end) ||
              start < 360 ||
              end > 1320 ||
              end - start < 240 ||
              start % 30 ||
              end % 30
            )
              return editError(
                "Use half-hour boundaries between 06:00 and 22:00, with at least four hours of service.",
                serviceHours,
              );
            if (
              a &&
              !Calendar.closed.includes(a.status) &&
              (a.time < start || a.time + 30 > end)
            )
              return editError(
                "The current appointment conflicts with these hours. Reschedule or cancel it in Emma’s IM first.",
                serviceHours,
              );
            preview(
              "Hospital service hours",
              [
                `${time(start)}–${time(end)}`,
                "Reception, doctor, nurse and pharmacy shifts will cover this window.",
              ],
              () => {
                s.settings.open = start;
                s.settings.close = end;
                ["Emma", "Daniel", "Grace", "Leo"].forEach((k) => {
                  const p = s.npcs[route(k)];
                  p.start = start;
                  p.end = end;
                  p.schedule = [
                    {
                      start,
                      end,
                      scene: "Hospital",
                      area: Schedules.hospitalAreas[k],
                      activity: "Hospital service",
                      reply: true,
                    },
                  ];
                });
              },
            );
          },
        },
      ],
    );
  }
  const { learning, bookmark, data } = WorldRecords.create({
    nav,
    area,
    english,
    editError,
    open,
  });
  function handle(text) {
    if (
      /^(open |show )?(world desk|manage world|world management)[.!]?$/.test(
        text,
      )
    ) {
      open();
      return true;
    }
    const map = {
      itinerary: "plans",
      "hospital standby": "queue",
      "commitment history": "commitments",
      "npc management": "people",
      "people settings": "people",
      "my profile": "profile",
      "learning records": "learning",
      "expression book": "learning",
      "data management": "data",
      privacy: "data",
      schedule: "schedule",
      "world pace": "pace",
      events: "events",
      "task board": "tasks",
      "recovery demo": "recovery",
      "keyboard settings": "keys",
    };
    for (const [term, section] of Object.entries(map))
      if (
        text.replace(/^(open|show|view) /, "").replace(/[.!]$/, "") === term
      ) {
        open(section);
        return true;
      }
    return false;
  }
  return {
    normalize,
    hydrate,
    open,
    route,
    behavior,
    status,
    bookmark,
    handle,
    english,
    areas,
  };
})();
