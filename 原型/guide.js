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
  let currentState;
  let setupPage = 0;
  let inlineIndex = -1;
  let inlineTarget = null;
  let placementFrame = 0;
  let replayRequested = true;
  const inlineSteps = [
    { target: '[data-mode="world"]', title: "Start with your world", text: "Click World below. This is where you explore places and take action. No message goes to another person.", action: "world", next: "Next" },
    { target: "#command-input", title: "Try looking around", text: 'Type “Look around.” in the real input below. You can use your own words, too. Nothing happens until you press Do it.', action: "draft", next: "Draft ready" },
    { target: "#send-button", title: "You decide when to act", text: "Check that World is selected, then press Do it or Enter. Your draft will become a real action in this story.", action: "send", next: "Skip this step" },
    { target: ".world-feedback", title: "See what happened", text: "Your action’s result appears here. The map shows your actual location; the clock advances only when an action needs time.", next: "Meet the conversations" },
    { target: "#contact-list .contact-button", title: "Choose a person", text: "Click a contact to open their private conversation. A message stays a message: it does not move you or hand over an item.", action: "contact", next: "Next" },
    { target: '[data-mode="assistant"]', title: "Find the words, privately", text: "Click Assistant when you need help understanding or saying something. It keeps a separate draft and never sends a message to a person for you.", action: "assistant", next: "Next" },
    { target: "#try-flow", title: "Choose what happens next", text: "Open Try a flow for the family, hospital, or road story. Each example follows your progress and prepares a draft for you to check and send.", action: "flow", next: "Finish guide" },
  ];

  function normalize(state) {
    if (currentState !== state) clearInlineGuide();
    currentState = state;
    if (typeof state.setupComplete !== "boolean")
      state.setupComplete = ["hospital", "road"].includes(state.fixture);
  }

  function launchIfNeeded() {
    const params = new URLSearchParams(location.search);
    if (params.has("verify")) return;
    if (replayRequested && params.get("tour") === "1") {
      replayRequested = false;
      startInlineGuide();
    } else if (replayRequested && params.get("setup") === "1") {
      replayRequested = false;
      open();
    } else if (!currentState?.setupComplete) open();
  }

  function clearInlineGuide() {
    cancelAnimationFrame(placementFrame);
    inlineTarget?.classList.remove("inline-guide-target");
    document.getElementById("inline-guide")?.remove();
    inlineTarget = null;
    inlineIndex = -1;
  }

  function placeInlineGuide() {
    const card = document.getElementById("inline-guide");
    const step = inlineSteps[inlineIndex];
    if (!card || !step) return;
    const target = document.querySelector(step.target);
    if (inlineTarget !== target) inlineTarget?.classList.remove("inline-guide-target");
    inlineTarget = target;
    const hidden = modal().open || !target;
    card.hidden = hidden;
    target?.classList.toggle("inline-guide-target", !hidden);
    if (hidden) return;
    const viewport = window.visualViewport;
    const width = viewport?.width || innerWidth;
    const height = viewport?.height || innerHeight;
    const offsetTop = viewport?.offsetTop || 0;
    const offsetLeft = viewport?.offsetLeft || 0;
    card.style.maxHeight = `${height - 24}px`;
    card.style.width = `${Math.min(352, width - 32)}px`;
    const r = target.getBoundingClientRect();
    const box = card.getBoundingClientRect();
    // Prefer the side with room, then above/below. Never cover the control.
    const candidates = [
      { x: r.right + 18, y: r.top + r.height / 2 - box.height / 2 },
      { x: r.left - box.width - 18, y: r.top + r.height / 2 - box.height / 2 },
      { x: r.left + r.width / 2 - box.width / 2, y: r.top - box.height - 18 },
      { x: r.left + r.width / 2 - box.width / 2, y: r.bottom + 18 },
    ];
    const left = offsetLeft + 12, right = offsetLeft + width - 12;
    const top = offsetTop + 12, bottom = offsetTop + height - 12;
    let position = candidates.find((p) => p.x >= left && p.x + box.width <= right && p.y >= top && p.y + box.height <= bottom);
    if (!position) {
      position = { x: Math.max(left, Math.min(r.left, right - box.width)), y: r.top - box.height - 18 >= top ? r.top - box.height - 18 : Math.min(bottom - box.height, r.bottom + 18) };
    }
    card.style.left = `${position.x}px`;
    card.style.top = `${Math.max(top, Math.min(bottom - box.height, position.y))}px`;
  }

  function schedulePlacement() {
    cancelAnimationFrame(placementFrame);
    placementFrame = requestAnimationFrame(placeInlineGuide);
  }

  function viewportChanged() {
    if (inlineIndex >= 0 && !modal().open)
      document.querySelector(inlineSteps[inlineIndex].target)?.scrollIntoView({ block: "center", behavior: "instant" });
    schedulePlacement();
  }

  function advanceInlineGuide() {
    if (inlineIndex < 0) return;
    if (inlineIndex === inlineSteps.length - 1) {
      const button = document.getElementById("guide-button");
      clearInlineGuide();
      button.focus({ preventScroll: true });
      return;
    }
    inlineIndex += 1;
    showInlineGuide();
  }

  function updateDraftStep() {
    const next = document.querySelector(".inline-guide-next");
    if (inlineIndex === 1 && next)
      next.disabled = !document.getElementById("command-input").value.trim() || mode !== "world";
  }

  function showInlineGuide() {
    const step = inlineSteps[inlineIndex];
    if (!step) return;
    inlineTarget?.classList.remove("inline-guide-target");
    document.getElementById("inline-guide")?.remove();
    const card = document.createElement("aside");
    card.id = "inline-guide";
    card.setAttribute("aria-label", "Page guide");
    card.innerHTML = `<div class="inline-guide-heading"><h2>${step.title}</h2><button type="button" class="icon-button inline-guide-close" aria-label="Close page guide">×</button></div><p id="inline-guide-copy" role="status">${step.text}</p><div class="inline-guide-progress" aria-label="Step ${inlineIndex + 1} of ${inlineSteps.length}">${inlineSteps.map((_, i) => `<span class="${i <= inlineIndex ? "active" : ""}"></span>`).join("")}<small>${inlineIndex + 1} / ${inlineSteps.length}</small></div><div class="inline-guide-actions"><button type="button" class="text-button inline-guide-skip">Skip guide</button><button type="button" class="secondary-button inline-guide-back" ${inlineIndex === 0 ? "disabled" : ""}>Back</button><button type="button" class="primary-button inline-guide-next">${step.next}</button></div><button type="button" class="text-button inline-guide-setup">Edit story setup</button>`;
    document.body.append(card);
    card.querySelector(".inline-guide-close").onclick = clearInlineGuide;
    card.querySelector(".inline-guide-skip").onclick = clearInlineGuide;
    card.querySelector(".inline-guide-back").onclick = () => { inlineIndex -= 1; showInlineGuide(); };
    card.querySelector(".inline-guide-next").onclick = advanceInlineGuide;
    card.querySelector(".inline-guide-setup").onclick = () => open();
    updateDraftStep();
    const target = document.querySelector(step.target);
    target?.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
    placeInlineGuide();
    // A new step's card follows its target without stealing input focus.
    target?.focus({ preventScroll: true });
  }

  function startInlineGuide() {
    clearInlineGuide();
    modal().oncancel = null;
    modal().close();
    inlineIndex = 0;
    showInlineGuide();
  }

  function didSubmit(destination) {
    if ((inlineIndex === 1 || inlineIndex === 2) && destination === "world") {
      inlineIndex = 3;
      showInlineGuide();
    }
  }

  function refreshInlineGuide() {
    if (inlineIndex < 0) return;
    if ((inlineIndex === 0 && mode === "world") ||
        (inlineIndex === 4 && mode === "npc") ||
        (inlineIndex === 5 && mode === "assistant")) {
      advanceInlineGuide();
      return;
    }
    updateDraftStep();
    schedulePlacement();
  }

  function finishSetup() {
    currentState.setupComplete = true;
    save();
    render();
    modal().close();
    startInlineGuide();
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
    if (page === 1) return `<p>${uiLocale === "zh" ? "选择故事从哪里开始。之后仍可访问每个地点。这只会设置起始场景和时间，不会新增预约或任务。" : "Choose where this story opens. You can visit every place later. This only sets your starting scene and time; no appointment or task is added."}</p><div class="setup-scenes">${Object.entries(scenes).map(([key, v]) => `<label class="setup-scene"><input type="radio" name="setup-scene" value="${key}" ${currentState.scene === key ? "checked" : ""}><span class="setup-scene-art ${key.toLowerCase()}"><i></i><i></i><i></i></span><strong>${v.title}</strong><small>${v.place} · ${String(Math.floor(v.time / 60)).padStart(2, "0")}:${String(v.time % 60).padStart(2, "0")}</small><em>${key === "Home" ? "Meet your family and begin with an ordinary morning." : key === "Hospital" ? "Begin at reception with a visit ahead." : "Begin at the bus stop with the neighborhood around you."}</em></label>`).join("")}</div>`;
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
    clearInlineGuide();
    setupPage = page;
    showSetup();
  }

  function showSetup() {
    const steps = [ui("setup.world"), ui("setup.beginning"), ui("setup.character"), ui("setup.people")];
    content().innerHTML = `<div class="modal-heading"><div><div class="eyebrow">${ui("setup.eyebrow")} · ${setupPage + 1} / ${steps.length}</div><h2>${steps[setupPage]}</h2></div><div class="setup-heading-actions"><button class="language-toggle" id="setup-language-toggle" type="button">${ui("setup.language")}</button><button class="icon-button" data-guide-close aria-label="${ui("setup.close")}">×</button></div></div><div class="setup-progress">${steps.map((_, i) => `<i class="${i <= setupPage ? "active" : ""}"></i>`).join("")}</div><div class="setup-body">${setupBody(setupPage)}</div><div class="modal-footer"><button class="secondary-button" id="setup-back" ${setupPage === 0 ? "disabled" : ""}>${ui("setup.back")}</button><button class="secondary-button" id="setup-skip">${ui("setup.skip")}</button><button class="primary-button" id="setup-next">${setupPage === steps.length - 1 ? ui("setup.save") : ui("setup.continue")}</button></div>`;
    const dialog = modal();
    if (!dialog.open) dialog.showModal();
    document.getElementById("setup-language-toggle").onclick = () => {
      setUiLocale(uiLocale === "zh" ? "en" : "zh");
      showSetup();
    };
    document.getElementById("setup-back").onclick = () => {
      if (setupPage > 0) { captureSetup(); setupPage -= 1; showSetup(); }
    };
    document.getElementById("setup-next").onclick = () => {
      captureSetup();
      if (setupPage < steps.length - 1) { setupPage += 1; showSetup(); }
      else finishSetup();
    };
    document.getElementById("setup-skip").onclick = () => { captureSetup(); finishSetup(); };
    dialog.querySelector("[data-guide-close]").onclick = () => { captureSetup(); currentState.setupComplete = true; save(); dialog.oncancel = null; dialog.close(); };
    dialog.oncancel = () => { captureSetup(); currentState.setupComplete = true; save(); dialog.oncancel = null; };
  }

  // Install after the app's delegated click handler so rendered context is current.
  window.addEventListener("load", () => document.addEventListener("click", (event) => {
    if (inlineSteps[inlineIndex]?.action === "flow" && event.target.closest?.("#try-flow")) clearInlineGuide();
  }));
  document.addEventListener("input", updateDraftStep);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && inlineIndex >= 0 && !modal().open) clearInlineGuide();
  });
  document.addEventListener("scroll", schedulePlacement, true);
  window.addEventListener("resize", viewportChanged);
  window.visualViewport?.addEventListener("resize", viewportChanged);
  window.visualViewport?.addEventListener("scroll", schedulePlacement);
  new MutationObserver(schedulePlacement).observe(modal(), { attributes: true, attributeFilter: ["open"] });
  document.getElementById("guide-button").addEventListener("click", () => currentState?.setupComplete ? startInlineGuide() : open());
  return { normalize, launchIfNeeded, open, startInlineGuide, refreshInlineGuide, didSubmit };
})();
