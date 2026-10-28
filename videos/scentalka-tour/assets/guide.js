const SetupGuide = (() => {
  const modal = () => document.getElementById("modal");
  const content = () => document.getElementById("modal-content");
  const escHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);
  const scenes = {
    Home: { title: "A day at home", place: "Living Room", time: 420, role: "Father" },
    Hospital: { title: "A hospital visit", place: "Reception", time: 480, role: "Patient" },
    Road: { title: "Out on the road", place: "Bus Stop", time: 480, role: "Passenger" },
  };
  const people = ["Sarah", "Mia", "Emma", "Daniel", "Grace", "Leo", "Ben", "Nora"];
  const chapters = [
    { title: "Your little world", place: "Home", detail: "Three connected places: Home, Hospital and Road. The clock advances when you take an action; reading and planning leave it still.", scene: "home", tags: ["07:00", "Home", "Living Room"] },
    { title: "Home is where stories start", place: "Home", detail: "Talk with Sarah and Mia, move between rooms, and handle real objects. A message does not move an item; you decide what to do next.", scene: "home", tags: ["Sarah", "Mia", "House key"] },
    { title: "A visit, step by step", place: "Hospital", detail: "Ask Emma about an appointment, bring your ID, check in at Reception, read the call from Grace, meet Dr. Patel and visit Leo at the pharmacy.", scene: "hospital", tags: ["Appointment", "ID check-in", "Consultation"] },
    { title: "Plans can change on the road", place: "Road", detail: "Take the bus or walk. If a delay arrives, read Ben's update before choosing a route. Nora is a neighbor you may meet along the way.", scene: "road", tags: ["Bus stop", "Ben's update", "Choose a route"] },
    { title: "Three ways to communicate", place: "Your words", detail: "World commands move your character, private IM sends only when you press Send, and Assistant gives private help using information you already know.", scene: "messages", tags: ["World", "Private IM", "Assistant"] },
    { title: "Longer actions stay under your control", place: "Your pace", detail: "Build an itinerary, run one step at a time or continue a supported route. Plans pause at interruptions and keep the remaining steps for you.", scene: "plan", tags: ["Review", "Run", "Pause"] },
    { title: "Keep what matters", place: "Your records", detail: "Tasks, your pocket, journal, world desk and timeline keep track of what actually happened. You can edit your profile and NPC descriptions later.", scene: "records", tags: ["Tasks", "Pocket", "World desk"] },
    { title: "Listen, speak, decide", place: "Voice", detail: "Record a message, review the transcript, and choose whether to send it. Listening can reveal only the part you have heard so far.", scene: "voice", tags: ["Record", "Review", "Send"] },
  ];
  let currentState;
  let setupPage = 0;
  let tourIndex = 0;
  let tourTimer = 0;
  let playing = false;

  function normalize(state) {
    currentState = state;
    if (typeof state.setupComplete !== "boolean")
      state.setupComplete = ["hospital", "road"].includes(state.fixture);
  }

  function launchIfNeeded() {
    if (new URLSearchParams(location.search).has("verify")) return;
    if (!currentState?.setupComplete) open();
  }

  function captureSetup() {
    if (setupPage === 2) {
      const name = document.getElementById("setup-name");
      currentState.settings.name = name.value.trim() || currentState.settings.name;
      currentState.profile = {
        ...(currentState.profile || {}),
        occupation: document.getElementById("setup-occupation").value.trim(),
        background: document.getElementById("setup-background").value.trim(),
        family: document.getElementById("setup-family").value.trim(),
        routine: document.getElementById("setup-routine").value.trim(),
        goal: document.getElementById("setup-goal").value.trim(),
      };
      for (const scene of Object.keys(scenes)) {
        currentState.settings[`${scene.toLowerCase()}Role`] = document.getElementById(`setup-role-${scene}`).value.trim();
      }
    }
    if (setupPage === 3) {
      for (const key of people) {
        const npc = currentState.npcs[key];
        npc.name = document.getElementById(`setup-npc-${key}-name`).value.trim() || npc.name;
        npc.title = document.getElementById(`setup-npc-${key}-title`).value.trim() || npc.title;
        npc.goal = document.getElementById(`setup-npc-${key}-goal`).value.trim() || npc.goal;
        npc.style = document.getElementById(`setup-npc-${key}-style`).value.trim() || npc.style;
        npc.appearance = document.getElementById(`setup-npc-${key}-appearance`).value.trim() || npc.appearance;
      }
      const sarah = currentState.npcs.Sarah;
      Object.assign(currentState.settings, {
        sarahName: sarah.name,
        sarahGoal: sarah.goal,
        sarahStyle: sarah.style,
        sarahAppearance: sarah.appearance,
      });
      currentState.roles = {
        Home: currentState.settings.homeRole,
        Hospital: currentState.settings.hospitalRole,
        Road: currentState.settings.roadRole,
      };
    }
    const selected = setupPage === 1 ? document.querySelector('[name="setup-scene"]:checked') : null;
    if (selected) {
      const scene = selected.value;
      const start = scenes[scene];
      currentState.scene = scene;
      currentState.area = start.place;
      currentState.time = start.time;
      currentState.roles[scene] = currentState.settings[`${scene.toLowerCase()}Role`] || start.role;
      if (scene === "Hospital") {
        for (const key of ["Emma", "Daniel", "Grace", "Leo"]) {
          if (!currentState.known.includes(key)) currentState.known.push(key);
          currentState.messages[key] ??= [];
        }
      } else if (scene === "Road") {
        for (const key of ["Ben", "Emma"]) {
          if (!currentState.known.includes(key)) currentState.known.push(key);
          currentState.messages[key] ??= [];
        }
      }
    }
    if (setupPage === 3) {
      save();
      render();
    }
  }

  function setupBody(page) {
    if (page === 0) return `<div class="setup-intro"><div class="setup-world-art"><span>HOME</span><span>HOSPITAL</span><span>ROAD</span><i></i></div><div><p class="eyebrow">A SMALL WORLD FOR EVERYDAY ENGLISH</p><h3>Life gives you something to say.</h3><p>Spend time in familiar situations, make your own choices, and talk with people who belong to this world.</p></div></div><div class="setup-facts"><span><b>3</b> connected places</span><span><b>8</b> people with their own lives</span><span><b>1</b> story shaped by you</span></div>`;
    if (page === 1) return `<p>Choose where this story opens. You can visit every place later. This only sets your starting scene and time; no appointment or task is added.</p><div class="setup-scenes">${Object.entries(scenes).map(([key, v]) => `<label class="setup-scene"><input type="radio" name="setup-scene" value="${key}" ${currentState.scene === key ? "checked" : ""}><span class="setup-scene-art ${key.toLowerCase()}"><i></i><i></i><i></i></span><strong>${v.title}</strong><small>${v.place} · ${String(Math.floor(v.time / 60)).padStart(2, "0")}:${String(v.time % 60).padStart(2, "0")}</small><em>${key === "Home" ? "Meet your family and begin with an ordinary morning." : key === "Hospital" ? "Begin at reception with a visit ahead." : "Begin at the bus stop with the neighborhood around you."}</em></label>`).join("")}</div>`;
    if (page === 2) {
      const profile = currentState.profile || {};
      return `<p>Set up the person you will play. These details shape your story context and can be changed later.</p><div class="form-grid setup-form"><label>Your name<input id="setup-name" value="${escHtml(currentState.settings.name)}" maxlength="40"></label><label>Occupation<input id="setup-occupation" value="${escHtml(profile.occupation)}" maxlength="100"></label><label class="full">Background<textarea id="setup-background" rows="2" maxlength="300">${escHtml(profile.background)}</textarea></label><label class="full">Family & relationships<textarea id="setup-family" rows="2" maxlength="300">${escHtml(profile.family)}</textarea></label><label class="full">Daily routine<textarea id="setup-routine" rows="2" maxlength="300">${escHtml(profile.routine)}</textarea></label><label class="full">Personal goal<textarea id="setup-goal" rows="2" maxlength="300">${escHtml(profile.goal)}</textarea></label>${Object.keys(scenes).map((scene) => `<label>Your role in ${scene}<input id="setup-role-${scene}" value="${escHtml(currentState.settings[`${scene.toLowerCase()}Role`] || scenes[scene].role)}" maxlength="40"></label>`).join("")}</div>`;
    }
    return `<p>Meet the people around you. Expand anyone to adjust their name, role, motivation, voice style, or appearance. Their scene and responsibilities remain part of this world.</p><div class="setup-npcs">${people.map((key) => {
      const npc = currentState.npcs[key];
      return `<details class="setup-npc"><summary><span class="setup-avatar">${escHtml((npc.name || key).slice(0, 1))}</span><span><strong>${escHtml(npc.name)}</strong><small>${escHtml(npc.title)} · ${escHtml(npc.scene)}</small></span><span class="setup-edit">Edit</span></summary><div class="form-grid setup-form"><label>Name<input id="setup-npc-${key}-name" value="${escHtml(npc.name)}" maxlength="50"></label><label>Role<input id="setup-npc-${key}-title" value="${escHtml(npc.title)}" maxlength="70"></label><label class="full">Current goal<input id="setup-npc-${key}-goal" value="${escHtml(npc.goal)}" maxlength="160"></label><label>Speaking style<input id="setup-npc-${key}-style" value="${escHtml(npc.style)}" maxlength="100"></label><label>Appearance<input id="setup-npc-${key}-appearance" value="${escHtml(npc.appearance)}" maxlength="140"></label></div></details>`;
    }).join("")}</div>`;
  }

  function open(page = 0) {
    clearTimeout(tourTimer);
    playing = false;
    setupPage = page;
    showSetup();
  }

  function showSetup() {
    const steps = ["The world", "Choose a beginning", "Your character", "People in your world"];
    content().innerHTML = `<div class="modal-heading"><div><div class="eyebrow">FIRST-TIME SETUP · ${setupPage + 1} / ${steps.length}</div><h2>${steps[setupPage]}</h2></div><button class="icon-button" data-guide-close aria-label="Close setup">×</button></div><div class="setup-progress">${steps.map((_, i) => `<i class="${i <= setupPage ? "active" : ""}"></i>`).join("")}</div><div class="setup-body">${setupBody(setupPage)}</div><div class="modal-footer"><button class="secondary-button" id="setup-back" ${setupPage === 0 ? "disabled" : ""}>Back</button><button class="secondary-button" id="setup-skip">Use current details</button><button class="primary-button" id="setup-next">${setupPage === steps.length - 1 ? "Save & see the tour" : "Continue"}</button></div>`;
    const dialog = modal();
    if (!dialog.open) dialog.showModal();
    document.getElementById("setup-back").onclick = () => {
      if (setupPage > 0) { captureSetup(); setupPage -= 1; showSetup(); }
    };
    document.getElementById("setup-next").onclick = () => {
      captureSetup();
      if (setupPage < steps.length - 1) { setupPage += 1; showSetup(); }
      else { currentState.setupComplete = true; save(); render(); modal().close(); launchTour(); }
    };
    document.getElementById("setup-skip").onclick = () => { captureSetup(); currentState.setupComplete = true; save(); render(); modal().close(); launchTour(); };
    dialog.querySelector("[data-guide-close]").onclick = () => { captureSetup(); currentState.setupComplete = true; save(); dialog.close(); };
    dialog.oncancel = () => { captureSetup(); currentState.setupComplete = true; save(); };
  }

  function launchTour(index = 0) {
    tourIndex = index;
    playing = false;
    clearTimeout(tourTimer);
    showTour();
  }

  function scheduleTour() {
    clearTimeout(tourTimer);
    if (!playing) return;
    tourTimer = setTimeout(() => {
      if (tourIndex < chapters.length - 1) {
        tourIndex += 1;
        showTour();
        scheduleTour();
      } else {
        playing = false;
        showTour();
      }
    }, 4200);
  }

  function animation(slide) {
    const peopleLine = slide.scene === "home" ? ["YOU", "SARAH", "MIA"] : slide.scene === "hospital" ? ["YOU", "EMMA", "DR PATEL"] : slide.scene === "road" ? ["YOU", "BEN", "NORA"] : slide.scene === "messages" ? ["WORLD", "IM", "HELP"] : slide.scene === "plan" ? ["STEP 1", "STEP 2", "PAUSE"] : slide.scene === "records" ? ["TASKS", "POCKET", "DESK"] : slide.scene === "voice" ? ["RECORD", "REVIEW", "SEND"] : ["YOU", "HOME", "ROAD"];
    return `<div class="tour-stage" data-scene="${slide.scene}"><div class="tour-stage-top"><span>${slide.place}</span><span>YOUR STORY · DAY 1</span></div><div class="tour-art tour-${slide.scene}"><div class="tour-ground"></div>${peopleLine.map((label, i) => `<span class="tour-token token-${i}"><i>${label.slice(0, 1)}</i><small>${label}</small></span>`).join("")}<div class="tour-route"><i></i></div><div class="tour-object">${slide.scene === "hospital" ? "ID" : slide.scene === "plan" ? "..." : slide.scene === "voice" ? "♪" : slide.scene === "records" ? "+" : "→"}</div></div><div class="tour-stage-bottom"><span>${slide.tags[0]}</span><span class="tour-progress-dots">${chapters.map((_, i) => `<i class="${i === tourIndex ? "active" : ""}"></i>`).join("")}</span><span>${slide.tags.at(-1)}</span></div></div>`;
  }

  function showTour() {
    const slide = chapters[tourIndex];
    content().innerHTML = `<div class="modal-heading"><div><div class="eyebrow">HOW TO PLAY · SCENE ${String(tourIndex + 1).padStart(2, "0")} / ${String(chapters.length).padStart(2, "0")}</div><h2>${slide.title}</h2></div><button class="icon-button" id="tour-close" aria-label="Close tour">×</button></div>${animation(slide)}<div class="tour-copy"><span class="eyebrow">${slide.place.toUpperCase()}</span><p>${slide.detail}</p></div><div class="modal-footer tour-controls"><button class="secondary-button" id="tour-prev" ${tourIndex === 0 ? "disabled" : ""}>Back</button><button class="secondary-button" id="tour-play" aria-pressed="${playing}">${playing ? "Pause" : "Play all"}</button><button class="secondary-button" id="tour-restart">Start over</button><button class="primary-button" id="tour-next">${tourIndex === chapters.length - 1 ? "Start playing" : "Next scene"}</button></div>`;
    const dialog = modal();
    if (!dialog.open) dialog.showModal();
    document.getElementById("tour-prev").onclick = () => { playing = false; launchTour(Math.max(0, tourIndex - 1)); };
    document.getElementById("tour-next").onclick = () => {
      if (tourIndex === chapters.length - 1) { clearTimeout(tourTimer); dialog.close(); return; }
      launchTour(tourIndex + 1);
    };
    document.getElementById("tour-restart").onclick = () => launchTour(0);
    document.getElementById("tour-play").onclick = () => {
      playing = !playing;
      showTour();
      scheduleTour();
    };
    document.getElementById("tour-close").onclick = () => { clearTimeout(tourTimer); dialog.close(); };
    dialog.oncancel = () => clearTimeout(tourTimer);
  }

  document.getElementById("guide-button").addEventListener("click", () => open());
  return { normalize, launchIfNeeded, open, launchTour };
})();
