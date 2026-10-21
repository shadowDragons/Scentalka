/* Personal expression bookmarks and privacy controls share the current world snapshot. */
const WorldRecords = {
  create({ nav, area, english, editError, open }) {
    function learning() {
      nav(
        "Words worth keeping",
        `<p>Keep expressions with the moment they belong to. No scores or language levels.</p><div class="form-grid">${area("expression", "Expression", "")}${area("context", "When I would use it", `${s.scene} · ${s.area} · conversation with ${personName(contact)}`)}</div><button class="primary-button" id="save-expression">Save expression</button><h3 class="desk-section">Your expression book</h3>${s.expressions.length ? s.expressions.map((x, i) => `<article class="expression-entry"><blockquote>${esc(x.text)}</blockquote><p>${esc(x.context)} · Day ${x.day}</p><button class="text-button" data-reuse="${i}">Prepare a draft</button><button class="text-button" data-remove-expression="${i}">Remove bookmark</button></article>`).join("") : "<p>No expressions saved yet. You can also save a line directly from a conversation.</p>"}<h3 class="desk-section">Daily reflections</h3>${s.reflections.length ? s.reflections.map((r) => `<div class="notice-card">Day ${r.day} · ${r.messages} messages you chose to send · ${r.completed} commitments completed<br>${esc(r.note)}</div>`).join("") : "<p>Your day-end reflection will be kept here.</p>"}`,
      );
      $("save-expression").onclick = () => {
        const text = $("desk-expression").value.trim(),
          context = $("desk-context").value.trim();
        if (!english(text) || !english(context))
          return toast("Save an English expression with a short context.");
        if (s.expressions.some((x) => x.text === text))
          return toast("This expression is already in your book.");
        s.expressions.push({
          id: crypto.randomUUID(),
          text,
          context,
          day: s.day,
          time: s.time,
        });
        save();
        learning();
      };
      document.querySelectorAll("[data-reuse]").forEach(
        (b) =>
          (b.onclick = () => {
            const text = s.expressions[+b.dataset.reuse].text;
            const prep = () => {
              s.drafts[activeDraftKey()] = text;
              $("modal").close();
              render();
              $("command-input").focus();
            };
            if ((s.drafts[activeDraftKey()] || "").trim())
              showModal(
                "Keep your unfinished thought?",
                `<p>Your current draft will be replaced only if you choose to.</p>`,
                [
                  { label: "Keep my draft", action: learning },
                  { label: "Replace draft", primary: true, action: prep },
                ],
              );
            else prep();
          }),
      );
      document.querySelectorAll("[data-remove-expression]").forEach(
        (b) =>
          (b.onclick = () => {
            s.expressions.splice(+b.dataset.removeExpression, 1);
            save();
            learning();
          }),
      );
    }
    function bookmark(text) {
      if (s.expressions.some((x) => x.text === text))
        return toast("Already saved.");
      s.expressions.push({
        id: crypto.randomUUID(),
        text,
        context: `${s.scene} · IM with ${personName(contact)}`,
        day: s.day,
        time: s.time,
      });
      save();
      toast("Expression and context saved in your book.");
    }
    function data() {
      const count = Object.values(s.messages).flat().length;
      nav(
        "Your story belongs to you",
        `<p>${count} messages · ${s.logs.length} world records · ${s.expressions.length} expressions<br>Stored in this browser on this device. Export includes an uneditable snapshot of the story and configuration.</p><label class="desk-select">Export scope<select id="export-scope"><option value="world">Complete world, including available audio</option><option value="conversations">Conversations & transcripts</option><option value="records">World event records</option><option value="audio">Available audio recordings</option></select></label><div class="desk-toolbar"><button class="primary-button" id="desk-export">Export JSON</button><button class="secondary-button" id="desk-hide">Hide this conversation</button><button class="secondary-button" id="desk-unhide">Show hidden conversations</button><button class="secondary-button" id="desk-remove-audio">Remove saved audio</button></div><div class="notice-card">Hiding changes the display only. Removing audio keeps transcripts and established memories. Sent messages and world history cannot be edited.</div><h3 class="desk-section">Permanently delete this story</h3><p>This removes the active world from this browser, including its configuration, recordings and local records. Other stories remain available.</p><button class="danger-button" id="desk-delete">Delete this story…</button>`,
      );
      $("desk-export").onclick = () => {
        save();
        const scope = $("export-scope").value;
        const payload =
          scope === "world"
            ? s
            : scope === "records"
              ? { logs: s.logs }
              : scope === "audio"
                ? {
                    recordings: Object.entries(s.messages).flatMap(
                      ([who, list]) =>
                        list
                          .filter((m) => m.audioData)
                          .map((m) => ({
                            who,
                            id: m.id,
                            audioData: m.audioData,
                            transcript: m.text,
                          })),
                    ),
                  }
                : { messages: s.messages, assistant: s.assistantHistory };
        const blob = new Blob(
          [
            JSON.stringify(
              {
                format: "Scentalka local prototype",
                version: 2,
                scope,
                world: store.active,
                data: payload,
              },
              null,
              2,
            ),
          ],
          { type: "application/json" },
        );
        const url = URL.createObjectURL(blob),
          a = document.createElement("a");
        a.href = url;
        a.download = `scentalka-${scope}-day-${s.day}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast("Snapshot exported. Your story is still saved.");
      };
      $("desk-hide").onclick = () => {
        s.hiddenChats[contact] = true;
        save();
        render();
        $("modal").close();
        toast("Conversation hidden from display. Records and memories remain.");
      };
      $("desk-unhide").onclick = () => {
        s.hiddenChats = {};
        save();
        render();
        data();
      };
      $("desk-remove-audio").onclick = () =>
        showModal(
          "Remove the saved recordings?",
          `<p>Original audio and voice drafts in this story will be removed. Text transcripts, message types and memories remain. Browser-generated NPC voices can still be synthesized from their text.</p>`,
          [
            { label: "Keep recordings", action: data },
            {
              label: "Remove audio",
              primary: true,
              action: () => {
                stopMedia();
                Object.values(s.messages)
                  .flat()
                  .forEach((m) => {
                    if (m.audioData) {
                      delete m.audioData;
                      m.audioRemoved = true;
                    }
                  });
                s.voiceDrafts = {};
                s.voiceReviews = {};
                save();
                render();
                data();
              },
            },
          ],
        );
      $("desk-delete").onclick = () =>
        showModal(
          "Say goodbye to this story?",
          `<p>Type <strong>DELETE</strong> to permanently remove the active story. Export first if you want to keep a copy.</p><label class="desk-select">Confirmation<input id="delete-confirm" autocomplete="off"></label>`,
          [
            { label: "Keep my story", action: data },
            {
              label: "Permanently delete",
              primary: true,
              action: () => {
                if ($("delete-confirm").value !== "DELETE")
                  return editError("The confirmation must be DELETE.", data);
                stopMedia();
                clearTimeout(planTimer);
                const id = store.active;
                delete store.worlds[id];
                s = null;
                const next = Object.keys(store.worlds)[0];
                if (next) {
                  store.active = next;
                  localStorage.setItem(STORAGE, JSON.stringify(store));
                  load(next);
                } else {
                  store.active = "home";
                  localStorage.setItem(STORAGE, JSON.stringify(store));
                  load("home");
                }
                toast(
                  "Previous story permanently deleted. A different story is now open.",
                );
              },
            },
          ],
        );
    }
    return { learning, bookmark, data };
  },
};
