/* Physical possession, finite supplies and recoverable dropped items. */
const Objects = (() => {
  const defaults = {
    bottle: {
      name: "Water bottle",
      description:
        "One refillable bottle with three servings of drinking water.",
      location: "kitchen shelf",
    },
    snack: {
      name: "Packaged snack",
      description: "One snack that is consumed once.",
      location: "cabinet",
    },
  };
  const aliases = {
    key: "(?:house )?key",
    id: "id(?: card)?",
    phone: "phone",
    folder: "(?:document )?folder",
    bottle: "(?:water )?bottle",
    snack: "(?:packaged )?snack",
  };
  function normalize(st) {
    st.objectState ??= {};
    st.groundItems ??= {};
    for (const [id, p] of Object.entries(defaults)) {
      st.items[id] ??= p.location;
      st.itemPresets[id] ??= structuredClone(p);
      st.objectState[id] ??= {
        remaining: id === "bottle" ? 3 : 1,
        capacity: id === "bottle" ? 3 : 1,
      };
    }
    return st;
  }
  function place(id) {
    const owner = s.items[id];
    return owner === "you"
      ? "With you"
      : owner === "consumed"
        ? "Consumed · no remaining item"
        : owner === "ground"
          ? `${s.groundItems[id]?.scene} · ${s.groundItems[id]?.area} · on the ground`
          : owner === "kitchen shelf"
            ? "Home · Kitchen shelf"
            : owner === "tray"
              ? "Home · Entrance tray"
              : owner === "cabinet"
                ? "Home · Living Room cabinet"
                : `With ${personName(owner)}`;
  }
  function describe(id) {
    return `${place(id)}${s.objectState[id] ? ` · ${s.objectState[id].remaining} / ${s.objectState[id].capacity} ${id === "bottle" ? "servings" : "remaining"}` : ""}`;
  }
  function open() {
    showModal(
      "Small things, real consequences",
      `<button class="desk-back" id="objects-back">← World desk</button><p>Use or recover an actual object. Consumed items stay consumed; dropped things stay where you left them. These controls prepare World commands for you to submit.</p>${Object.keys(
        s.items,
      )
        .map(
          (id) =>
            `<div class="detail-row"><div><strong>${esc(s.itemPresets[id]?.name || id)}</strong><p>${esc(describe(id))}</p></div>${id === "bottle" ? '<button class="text-button" data-object-command="Drink some water.">Drink draft</button><button class="text-button" data-object-command="Refill the water bottle.">Refill draft</button>' : id === "snack" ? '<button class="text-button" data-object-command="Eat the snack.">Eat draft</button>' : ""}</div>`,
        )
        .join(
          "",
        )}<div class="notice-card">Try: Go to the kitchen. → Take the water bottle. → Drink some water.<br>Drop my ID card. → Take my ID card. (Only at its actual location.)</div>`,
      [],
      "EVERYDAY OBJECTS",
    );
    $("objects-back").onclick = () => WorldDesk.open();
    document
      .querySelectorAll("[data-object-command]")
      .forEach((b) => (b.onclick = () => draft(b.dataset.objectCommand)));
  }
  function draft(text) {
    const apply = () => {
      $("modal").close();
      setMode("world");
      s.drafts.world = text;
      save();
      render();
      $("command-input").focus();
    };
    if (s.drafts.world?.trim())
      showModal(
        "Replace the World draft?",
        "<p>Your unsent command stays until you decide.</p>",
        [
          { label: "Keep my draft", action: open },
          { label: "Use object command", primary: true, action: apply },
        ],
      );
    else apply();
  }
  function match(text) {
    for (const [id, alias] of Object.entries(aliases))
      if (new RegExp(`\\b${alias}\\b`, "i").test(text)) return id;
    return null;
  }
  function world(text) {
    const t = text.toLowerCase().replace(/[.!]+$/, "");
    if (/^(open|show) (everyday objects|object states)[.!]?$/.test(t)) {
      open();
      return true;
    }
    if (
      /^(drink (?:some )?water|use (?:the |my )?(?:water )?bottle)$/.test(t)
    ) {
      const b = s.objectState.bottle;
      if (s.items.bottle !== "you") {
        feedback(
          "Carry the water bottle before drinking. It has not moved or been used.",
        );
        return true;
      }
      if (!b.remaining) {
        feedback(
          "The bottle is empty. Refill it at the kitchen tap before drinking again.",
        );
        return true;
      }
      commit(s.settings.item, () => {
        b.remaining--;
        log(`Drank one serving from the water bottle. ${b.remaining} remain.`);
        s.feedback = `You drank some water. ${b.remaining} of ${b.capacity} servings remain.`;
        s.feedbackTitle = "A small everyday action";
      });
      return true;
    }
    if (/^refill (?:the |my )?(?:water )?bottle$/.test(t)) {
      if (
        s.items.bottle !== "you" ||
        s.scene !== "Home" ||
        s.area !== "Kitchen"
      ) {
        feedback(
          "Bring the bottle to Home · Kitchen to use the tap. It cannot be refilled remotely.",
        );
        return true;
      }
      const b = s.objectState.bottle;
      if (b.remaining === b.capacity) {
        feedback("The bottle is already full. No time or quantity changed.");
        return true;
      }
      commit(s.settings.item, () => {
        b.remaining = b.capacity;
        log("Refilled the same water bottle at the kitchen tap.");
        s.feedback =
          "Your existing bottle is full again. No second bottle was created.";
        s.feedbackTitle = "Refilled";
      });
      return true;
    }
    if (/^eat (?:the |my )?(?:packaged )?snack$/.test(t)) {
      if (s.items.snack !== "you" || s.objectState.snack.remaining === 0) {
        feedback(
          s.objectState.snack.remaining
            ? "Take the existing snack before eating it."
            : "That snack has already been eaten. It cannot be consumed twice.",
        );
        return true;
      }
      commit(s.settings.item, () => {
        s.objectState.snack.remaining = 0;
        s.items.snack = "consumed";
        log("Ate the single packaged snack. Its remaining quantity is zero.");
        s.feedback =
          "You ate the snack. The record stays; no replacement appears automatically.";
        s.feedbackTitle = "One everyday moment";
      });
      return true;
    }
    const id = match(t);
    if (!id) return false;
    if (
      /^(drop|leave) (?:the |my )?/.test(t) &&
      !/\b(on|in|with)\b/.test(t) &&
      id !== "phone"
    ) {
      if (s.items[id] !== "you") {
        feedback("You cannot drop an item you do not carry.");
        return true;
      }
      commit(s.settings.item, () => {
        s.items[id] = "ground";
        s.groundItems[id] = {
          scene: s.scene,
          area: s.area,
          day: s.day,
          time: s.time,
        };
        log(
          `You left ${s.itemPresets[id]?.name || id} on the ground at ${s.scene} · ${s.area}.`,
        );
        s.feedback =
          "The object stays at this exact place. Return here to recover it.";
        s.feedbackTitle = "Left behind";
      });
      return true;
    }
    if (/^find\b|^where.*\b(bottle|snack|key|id|folder)\b/.test(t)) {
      feedback(`Last established location: ${describe(id)}. No item moved.`);
      return true;
    }
    if (/^(take|pick up|get)\b/.test(t)) {
      const owner = s.items[id];
      if (
        !["ground", "kitchen shelf"].includes(owner) &&
        !["bottle", "snack"].includes(id)
      )
        return false;
      if (owner === "consumed") {
        feedback(
          "That item has been consumed. No replacement or copy was created.",
        );
        return true;
      }
      if (owner === "you") {
        feedback("You already carry the same object. Nothing changed.");
        return true;
      }
      const pos =
        owner === "ground"
          ? s.groundItems[id]
          : owner === "kitchen shelf"
            ? { scene: "Home", area: "Kitchen" }
            : owner === "cabinet"
              ? { scene: "Home", area: "Living Room" }
              : owner === "tray"
                ? { scene: "Home", area: "Entrance" }
                : null;
      if (!pos || pos.scene !== s.scene || pos.area !== s.area) {
        feedback(
          `That item is ${place(id)}. Reach its actual location before taking it.`,
        );
        return true;
      }
      commit(s.settings.item, () => {
        s.items[id] = "you";
        delete s.groundItems[id];
        log(
          `Picked up the existing ${s.itemPresets[id]?.name || id} from ${pos.scene} · ${pos.area}.`,
        );
        s.feedback = `You now carry ${s.itemPresets[id]?.name || id}.`;
        s.feedbackTitle = "Picked up";
      });
      return true;
    }
    if (/^(put|place)\b/.test(t) && ["bottle", "snack"].includes(id)) {
      const destination = /kitchen shelf/.test(t)
        ? { owner: "kitchen shelf", area: "Kitchen" }
        : /tray/.test(t)
          ? { owner: "tray", area: "Entrance" }
          : /cabinet/.test(t)
            ? { owner: "cabinet", area: "Living Room" }
            : null;
      if (
        !destination ||
        s.items[id] !== "you" ||
        s.scene !== "Home" ||
        s.area !== destination.area
      ) {
        feedback(
          "Carry the object and stand beside its named shelf, tray or cabinet before putting it down.",
        );
        return true;
      }
      commit(s.settings.item, () => {
        s.items[id] = destination.owner;
        log(
          `Put ${s.itemPresets[id]?.name || id} at Home · ${destination.area}.`,
        );
        s.feedback = "The same object is now at the chosen place.";
        s.feedbackTitle = "Put down";
      });
      return true;
    }
    return false;
  }
  return { normalize, open, world, describe, place, defaults };
})();
