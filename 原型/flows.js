/* Optional prototype flow examples. Choosing an example only prepares a draft. */
const FlowDemo = (() => {
  let examples = [];
  const labels = {
    home: "Family & the key",
    hospital: "A hospital visit",
    road: "A change of plans",
  };
  const w = (text, label) => ({ text, label: label || text, mode: "world" });
  const im = (who, text, label) => ({
    text,
    label: label || text,
    mode: "npc",
    who,
  });
  function latest(k) {
    return (s.messages[k] || []).filter((m) => m.from === "npc").at(-1);
  }
  function read(k) {
    return w(
      `Read ${personName(k)}'s latest message.`,
      `Read ${personName(k)}’s message`,
    );
  }
  function keyStep() {
    if (s.tasks.key === "overdue")
      return [
        w(
          "Open commitment history.",
          "Review the missed arrangement and follow-up",
        ),
      ];
    if (s.tasks.key === "declined")
      return [
        w(
          "Open the hospital directory and Emma's chat.",
          "Explore hospital reception",
        ),
      ];
    if (s.items.key === "Sarah")
      return [
        im(
          "Sarah",
          "Please prepare the appointment documents.",
          "Ask Sarah to prepare documents",
        ),
      ];
    if (s.tasks.key !== "accepted") {
      const msg = latest("Sarah");
      if (msg && !msg.known) return [read("Sarah")];
      if (s.pending)
        return [
          im("Sarah", "I'll bring it to you now.", "Draft a promise to Sarah"),
        ];
      return [
        im(
          "Sarah",
          "Do you need the house key this morning?",
          "Ask Sarah about the key",
        ),
      ];
    }
    if (s.scene !== "Home") return [w("Go home.", "Return home to the key")];
    if (s.area !== "Entrance") return [w("Go to the entrance.")];
    if (s.items.key === "tray") return [w("Take the house key from the tray.")];
    return [w("Give the house key to Sarah.")];
  }
  function hospitalStep() {
    if (s.plan?.status === "running")
      return [w("Stop", "Stop at this checkpoint")];
    if (s.plan)
      return [w("Continue the plan."), w("Cancel the remaining plan.")];
    if (s.time < 480)
      return [
        w(
          "Wait until 08:00.",
          `Wait toward 08:00 · up to ${s.settings.wait} min`,
        ),
      ];
    if (
      !s.appointment ||
      ["Cancelled", "Missed", "Interrupted"].includes(s.appointment.status)
    ) {
      if (!s.known.includes("Emma"))
        return [
          w(
            "Open the hospital directory and Emma's chat.",
            "Find Emma in the public directory",
          ),
        ];
      const msg = latest("Emma");
      if (msg && !msg.known) return [read("Emma")];
      if (s.proposedSlot)
        return [
          im(
            "Emma",
            "Yes, please book that time for me.",
            "Confirm the offered appointment",
          ),
        ];
      return [
        im(
          "Emma",
          "Do you have an appointment available today?",
          "Ask Emma for an appointment",
        ),
      ];
    }
    if ((s.appointment.day ?? s.day) > s.day)
      return [
        w("Show hospital schedule.", "Review your future booking"),
        w("End the day.", "Choose when to begin tomorrow"),
      ];
    if (s.appointment.status === "Completed")
      return [
        w("Go home.", "Return home through the road"),
        w("Show my journal.", "Review what happened"),
      ];
    if (s.scene !== "Hospital") {
      if (s.items.id !== "you") {
        if (s.scene !== "Home") return [w("Go home.", "Return for your ID")];
        if (s.area !== "Entrance") return [w("Go to the entrance.")];
        return [w("Take my ID card.")];
      }
      return [w("Go to the hospital.")];
    }
    if (!s.registered) {
      if (s.area !== "Reception") return [w("Go to reception.")];
      return [
        im(
          "Emma",
          "I'm here for my appointment. Here is my ID.",
          "Check in with Emma",
        ),
      ];
    }
    if (!s.called)
      return [w("Wait until I'm called.", "Wait for a hospital update")];
    if (!s.callRead) return [read("Grace")];
    if (!s.consultStart) return [w("Go to the consultation room.")];
    const doctor = latest("Daniel");
    if (doctor && !doctor.known) return [read("Daniel")];
    if (!s.symptoms)
      return [
        im(
          "Daniel",
          "I have been feeling uncomfortable since yesterday.",
          "Draft a symptom description",
        ),
      ];
    return [
      im(
        "Daniel",
        "Thank you, that's all for now.",
        "Finish this consultation",
      ),
    ];
  }
  function roadStep() {
    if (s.scene === "Hospital")
      return [
        im(
          "Emma",
          "I'm here for my appointment. Here is my ID.",
          "Continue with hospital check-in",
        ),
        w("Go home."),
      ];
    if (s.scene === "Home")
      return [w("Go outside.", "Go from Home to the road")];
    if (s.plan?.status === "running")
      return [w("Stop", "Stop at this checkpoint")];
    if (s.roadEvent && !s.busDelayRead) return [read("Ben")];
    if (s.plan?.status === "interrupted")
      return [
        w(
          "Wait for the bus, but stop after ten minutes.",
          "Try a bounded ten-minute wait",
        ),
        w("Cancel the remaining plan."),
      ];
    if (s.plan?.status === "paused")
      return [
        w(
          "Cancel the remaining plan.",
          "Cancel the route, keep the appointment",
        ),
        w("Continue the plan."),
      ];
    if (s.roadEvent)
      return [w("Walk to the hospital instead.", "Walk the alternative route")];
    return [w("Take the bus to the hospital.")];
  }
  function next() {
    if (s.plan?.status === "running")
      return [w("Stop", "Stop at the current checkpoint")];
    const track = s.demoFlow || s.fixture;
    if (track === "hospital") return hospitalStep();
    if (track === "road") return roadStep();
    if (s.items.key === "Sarah") {
      if (s.tasks.documents === "preparing")
        return [w("Wait for Sarah's documents.")];
      if (s.tasks.documents === "ready" && !s.docUpdateKnown)
        return [read("Sarah")];
      if (s.tasks.documents === "ready" && s.items.folder !== "you")
        return s.scene === "Home" && s.area === "Entrance"
          ? [w("Take the document folder from the tray.")]
          : [w("Go to the entrance.")];
      if (s.tasks.documents === "ready") return hospitalStep();
    }
    return keyStep();
  }
  function renderExamples() {
    examples = next();
    $("flow-examples").innerHTML =
      `<button id="try-flow" class="flow-picker" title="Flow examples (Alt+F)">Try a flow <kbd>Alt F</kbd></button><span class="flow-next">NEXT EXAMPLE</span>${examples.map((x, i) => `<button class="flow-draft" data-flow-example="${i}" title="Prepare a draft only">${esc(x.label)} <span>↗</span></button>`).join("")}<span class="flow-only-draft">Draft only · you send</span>`;
    $("try-flow").onclick = open;
    document
      .querySelectorAll("[data-flow-example]")
      .forEach(
        (b) =>
          (b.onclick = () => prepare(examples[Number(b.dataset.flowExample)])),
      );
  }
  function prepare(example) {
    if (recorder?.state === "recording") {
      toast("Stop recording before preparing another draft.");
      return;
    }
    captureDraft();
    const key = example.mode === "npc" ? `npc:${example.who}` : example.mode;
    const put = () => {
      if ($("modal").open) $("modal").close();
      drawer = null;
      if (example.mode === "npc") selectContact(example.who);
      else setMode(example.mode);
      s.drafts[key] = example.text;
      if (s.voiceDrafts) delete s.voiceDrafts[key];
      recordingData = null;
      save();
      render();
      $("command-input").focus();
      $("command-input").select();
      toast("Draft prepared. Edit it or press Enter to submit.");
    };
    if (s.drafts[key]?.trim() && s.drafts[key] !== example.text) {
      showModal(
        "Keep your current draft?",
        `<p>You have an unsent draft for ${example.mode === "npc" ? esc(personName(example.who)) : "World"}. An example never sends a message for you.</p><div class="notice-card">${esc(s.drafts[key])}</div>`,
        [
          { label: "Keep my draft", close: true },
          { label: "Replace with example", primary: true, action: put },
        ],
      );
      return;
    }
    put();
  }
  function open() {
    showModal(
      "Try life, one action at a time",
      `<p>Choose a flow to see a useful next example above the input. Preparing a draft takes no game time. You decide whether to edit and send it.</p><div class="flow-map"><span class="${s.scene === "Home" ? "here" : ""}">Home</span><span>↔</span><span class="${s.scene === "Road" ? "here" : ""}">Road</span><span>↔</span><span class="${s.scene === "Hospital" ? "here" : ""}">Hospital</span></div><p>These places are connected by travel. Opening a flow does not move you or reset your story.</p>${Object.entries(
        labels,
      )
        .map(
          ([k, label]) =>
            `<button class="scenario-card" data-choose-flow="${k}"><strong>${label}</strong><small>${{ home: "Ask Sarah → promise → entrance → take the key → hand it over.", hospital: "Find Emma → confirm a slot → bring ID → travel → check in → wait → speak to the doctor.", road: "Travel → read an update → bounded wait → stop → cancel → choose another route." }[k]}</small></button>`,
        )
        .join(
          "",
        )}<div class="notice-card">Want an independent starting point? Studio keeps separate 07:00 Home, 08:00 hospital-visit and 08:00 bus-stop saves.</div>`,
      [{ label: "Open demo saves", action: openStudio }],
      "OPTIONAL PROTOTYPE EXAMPLES",
    );
    document.querySelectorAll("[data-choose-flow]").forEach(
      (b) =>
        (b.onclick = () => {
          s.demoFlow = b.dataset.chooseFlow;
          $("modal").close();
          save();
          render();
          $("try-flow").focus();
          toast(
            `${labels[s.demoFlow]} examples selected. Your story is unchanged.`,
          );
        }),
    );
  }
  function handleCommand(t) {
    if (/^(try a flow|show (?:flow|examples)|flow examples)[.!]?$/.test(t)) {
      open();
      return true;
    }
    if (
      /^(read|show|play|listen to)\b/.test(t) &&
      /message|reply|update/.test(t)
    ) {
      const k =
        Object.keys(people).find(
          (k) =>
            t.includes(k.toLowerCase()) ||
            t.includes(personName(k).toLowerCase()) ||
            (k === "Daniel" && t.includes("patel")),
        ) || contact;
      if (!s.known.includes(k)) {
        feedback("This private contact is not known to you yet.");
        return true;
      }
      const m = latest(k);
      if (!m) {
        feedback(`There is no message from ${personName(k)} yet.`);
        return true;
      }
      pausePlan(
        "Your plan is paused while you read a message. Continue it in World when ready.",
      );
      selectContact(k);
      m.opened = true;
      m.seen = true;
      if (/^play|^listen/.test(t) && m.type === "voice") {
        save();
        render();
        playMessage(m.id);
      } else {
        if (m.type === "voice") m.transcript = true;
        learnMessage(m, k);
        save();
        render();
      }
      return true;
    }
    if (/^(hi|hello|hey)[.!]?$/.test(t)) {
      feedback(
        "Hello. Use a named IM for a conversation, or describe an action in World.",
        "Your next move",
      );
      return true;
    }
    if (
      /(go|walk|head|step|move).*(outside|road|bus stop|sidewalk|crossing)/.test(
        t,
      ) &&
      !/hospital/.test(t)
    ) {
      if (s.plan) {
        feedback(
          "Continue or cancel your existing plan before starting a different route.",
        );
        return true;
      }
      if (s.scene === "Home")
        planStart("Go from Home to the road", [
          {
            minutes: s.settings.trip / 3,
            scene: "Road",
            area: "Bus Stop",
            done: "You are now on the road, by the bus stop. You can head home or continue to the hospital.",
          },
        ]);
      else if (s.scene === "Hospital")
        planStart("Leave the hospital for the road", [
          {
            minutes: (s.settings.trip * 2) / 3,
            scene: "Road",
            area: "Bus Stop",
            done: "You are back at the bus stop on the road.",
          },
        ]);
      else {
        const area = /crossing/.test(t)
          ? "Crossing"
          : /sidewalk/.test(t)
            ? "Sidewalk"
            : "Bus Stop";
        if (s.area === area) feedback(`You are already at ${area}.`);
        else
          commit(s.settings.move, () => {
            s.area = area;
            log(`Moved to Road · ${area}.`);
            s.feedback = `You are now at ${area}.`;
            s.feedbackTitle = "A change of place";
          });
      }
      return true;
    }
    return false;
  }
  return { render: renderExamples, open, handleCommand };
})();
