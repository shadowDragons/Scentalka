/* Preset editing never changes current item ownership or rewrites accepted tasks. */
const Presets = (() => {
  const itemDefaults = {
    phone: {
      name: "Phone",
      description: "Your IM and world control device.",
      location: "you",
    },
    key: {
      name: "House Key",
      description: "The single existing house key.",
      location: "tray",
    },
    id: {
      name: "ID Card",
      description: "Your identity card for reception verification.",
      location: "tray",
    },
    folder: {
      name: "Document Folder",
      description: "An existing folder for appointment documents.",
      location: "cabinet",
    },
  };
  Object.assign(itemDefaults, Objects.defaults);
  function normalize(st) {
    st.itemPresets ??= structuredClone(itemDefaults);
    return st;
  }
  function newStory() {
    showModal(
      "An ordinary life, yours to begin",
      `<p>A complete preset is ready. Start directly or edit the details you care about. Your current world stays saved.</p><div class="form-grid"><label>Your name<input id="new-name" value="Chris" maxlength="40"></label><label>Occupation<input id="new-occupation" value="Engineer" maxlength="100"></label><label class="full">Background<textarea id="new-background" rows="2">An engineer balancing work and family life.</textarea></label><label class="full">Household context<textarea id="new-family" rows="2">Sarah is my partner. Mia is my daughter.</textarea></label><label>Home default role<input id="new-home-role" value="Father" maxlength="40"></label><label>Hospital default role<input id="new-hospital-role" value="Patient" maxlength="40"></label><label>Road default role<input id="new-road-role" value="Passenger" maxlength="40"></label></div><h3 class="desk-section">Where the story starts its objects</h3><div class="form-grid">${Object.entries(
        itemDefaults,
      )
        .map(
          ([k, p]) =>
            `<label>${esc(p.name)} · quantity 1<select id="new-location-${k}">${["you", "tray", "cabinet", "kitchen shelf"].map((v) => `<option value="${v}" ${p.location === v ? "selected" : ""}>${{ you: "With you", tray: "Entrance tray", cabinet: "Living Room cabinet", "kitchen shelf": "Kitchen shelf" }[v]}</option>`).join("")}</select></label>`,
        )
        .join(
          "",
        )}</div><p class="desk-note">All three fixed, single-floor scenes are included. NPCs and future settings can be edited in World desk after creation.</p>`,
      [
        { label: "Back", action: () => WorldDesk.open() },
        {
          label: "Start with these details",
          primary: true,
          action: () => {
            const ids = [
              "name",
              "occupation",
              "background",
              "family",
              "home-role",
              "hospital-role",
              "road-role",
            ];
            const v = Object.fromEntries(
              ids.map((k) => [k, $("new-" + k).value.trim()]),
            );
            if (Object.values(v).some((x) => !WorldDesk.english(x)))
              return toast(
                "Complete these details in English before starting.",
              );
            const next = fresh("home");
            Object.keys(itemDefaults).forEach(
              (k) => (next.items[k] = $("new-location-" + k).value),
            );
            next.logs[0].text = `Your world began with the configured objects: ${Object.entries(
              next.items,
            )
              .map(([k, location]) => `${k} at ${location}`)
              .join(", ")}.`;
            next.settings.name = v.name;
            next.settings.homeRole = v["home-role"];
            next.settings.hospitalRole = v["hospital-role"];
            next.settings.roadRole = v["road-role"];
            next.roles = {
              Home: v["home-role"],
              Hospital: v["hospital-role"],
              Road: v["road-role"],
            };
            next.profile = {
              background: v.background,
              occupation: v.occupation,
              family: v.family,
              routine: "Morning household arrangements, then personal errands.",
              goal: "Manage everyday responsibilities through my own conversations.",
            };
            next.messages.Sarah.forEach(
              (m) => (m.text = m.text.replace("Chris", v.name)),
            );
            const id = "story-" + crypto.randomUUID();
            store.worlds[id] = next;
            load(id);
            toast("Your new story is ready. The previous one is still saved.");
          },
        },
      ],
      "CREATE A WORLD",
    );
  }
  function items() {
    showModal(
      "The objects already in this world",
      `<button class="desk-back" id="preset-back">← World desk</button><p>Names and descriptions can change for future display. Current ownership is a fact established through actions. Unique functional items remain one object each.</p>${Object.entries(
        s.itemPresets,
      )
        .map(
          ([k, p]) =>
            `<div class="form-grid item-preset"><label>${k} · display name<input id="item-name-${k}" value="${esc(p.name)}" maxlength="80"></label><label>Description<input id="item-desc-${k}" value="${esc(p.description)}" maxlength="250"></label><div class="full notice-card">Quantity: ${s.items[k] === "consumed" ? 0 : 1} · ${esc(Objects.describe(k))}<br>Initial location in new default stories: ${esc(itemDefaults[k].location)}</div></div>`,
        )
        .join("")}`,
      [
        { label: "Cancel", action: () => WorldDesk.open() },
        {
          label: "Review descriptions",
          primary: true,
          action: () => {
            const next = {};
            for (const k of Object.keys(itemDefaults)) {
              const name = $("item-name-" + k).value.trim(),
                description = $("item-desc-" + k).value.trim();
              if (!WorldDesk.english(name) || !WorldDesk.english(description))
                return toast("Use English for item names and descriptions.");
              next[k] = { ...s.itemPresets[k], name, description };
            }
            showModal(
              "Keep the same objects",
              `<p>Save the new display names and descriptions. No objects are duplicated or transferred.</p><div class="review-diff">${Object.values(
                next,
              )
                .map((p) => `<p>${esc(p.name)} · ${esc(p.description)}</p>`)
                .join("")}</div>`,
              [
                { label: "Back", action: items },
                {
                  label: "Save item descriptions",
                  primary: true,
                  action: () => {
                    s.itemPresets = next;
                    s.presetVersion++;
                    log(
                      "Item display preset changed. All ownership and quantities were preserved.",
                    );
                    save();
                    render();
                    WorldDesk.open();
                  },
                },
              ],
            );
          },
        },
      ],
      "ITEM PRESETS",
    );
    $("preset-back").onclick = () => WorldDesk.open();
  }
  function pharmacyFixture() {
    showModal(
      "A separate pharmacy sample",
      `<p>This creates an independent story with an explicitly recorded fictional prescription issued during a completed sample consultation. It does not add a prescription to your current story.</p><div class="notice-card">The sample uses a fictional demonstration item. It provides no real medicine, dose or treatment recommendation.</div>`,
      [
        { label: "Stay here", action: () => WorldDesk.open() },
        {
          label: "Open sample story",
          primary: true,
          action: () => {
            const next = fresh("hospital");
            next.scene = "Hospital";
            next.area = "Pharmacy";
            next.time = 556;
            next.items.id = "you";
            next.known.push("Daniel", "Leo", "Emma");
            next.messages.Daniel = [];
            next.messages.Leo = [];
            next.messages.Emma = [];
            next.appointment = {
              time: 540,
              duration: 15,
              status: "Completed",
              known: true,
            };
            next.consulted = true;
            next.tasks.hospital = "completed";
            next.prescription = {
              id: crypto.randomUUID(),
              issuer: "Daniel",
              day: 1,
              item: "Fictional practice pack",
              status: "Issued",
              instructions:
                "Confirm the label and ask the pharmacist to repeat anything unclear.",
            };
            next.logs.push({
              day: 1,
              time: 555,
              text: "Independent sample: Dr. Patel issued a fictional practice-pack prescription after the recorded consultation. It is not a real medical instruction.",
            });
            addMessage(
              next,
              "Daniel",
              "For this fictional sample visit, a practice-pack prescription is on your record. Ask Leo to verify the label; no real treatment is prescribed.",
              "npc",
              { type: "text", voice: false, known: true },
            );
            const id = "pharmacy-" + crypto.randomUUID();
            store.worlds[id] = next;
            load(id);
            selectContact("Leo");
            feedback(
              "Ask Leo to collect the prescribed practice pack. Your ID and the recorded prescription will be verified.",
              "Independent pharmacy sample",
            );
          },
        },
      ],
      "PROTOTYPE SAMPLE",
    );
  }
  return { normalize, newStory, items, pharmacyFixture };
})();
