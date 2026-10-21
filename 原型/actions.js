/* Player actions, day boundaries and contextual assistant. No autonomous player choices. */
const WorldActions = {
  create({ slots, taskDetail, artifact, tick }) {
    function world(text) {
      const t = text.toLowerCase();
      if (
        /^(open|show) (voice review|voice drafts|voice queue|listening queue)[.!]?$/i.test(
          text,
        )
      ) {
        /review|draft/.test(text.toLowerCase())
          ? Voices.review()
          : Voices.queue();
        return true;
      }
      if (Plans.world(text) || Schedules.world(text) || Objects.world(text))
        return true;
      if (/^(open|show) (world )?timeline[.!]?$/i.test(text)) {
        Timeline.open();
        return true;
      }
      if (/^(open|show) (standby queue|hospital queue)[.!]?$/.test(t)) {
        Calendar.queue();
        return true;
      }
      if (/^(open|show) commitment history[.!]?$/.test(t)) {
        Commitments.detail();
        return true;
      }
      if (WorldDesk.handle(t)) return true;
      if (/^(open|chat with|talk to|message) /.test(t)) {
        const matches = Object.entries(s.npcs).filter(
          ([k, p]) =>
            !p.archived &&
            (t.includes(p.name.toLowerCase()) || t.includes(k.toLowerCase())),
        );
        if (matches.length > 1) {
          showModal(
            "Who did you mean?",
            `<p>Choose the person before opening an IM. No message has been sent.</p>${matches.map(([k, p]) => `<button class="scenario-card" data-pick-contact="${k}">${esc(p.name)} · ${esc(p.title)} · ${esc(p.scene)}</button>`).join("")}`,
            [],
            "CLARIFY THE PERSON",
          );
          document.querySelectorAll("[data-pick-contact]").forEach(
            (b) =>
              (b.onclick = () => {
                $("modal").close();
                selectContact(b.dataset.pickContact);
              }),
          );
          return true;
        }
        if (
          matches.length === 1 &&
          ![
            "Sarah",
            "Mia",
            "Emma",
            "Ben",
            "Grace",
            "Daniel",
            "Leo",
            "Nora",
          ].includes(matches[0][0])
        ) {
          const [id, p] = matches[0];
          if (s.known.includes(id) || people[id].public || Schedules.located(p))
            selectContact(id);
          else
            feedback(
              "Meet this person or get a public introduction before opening a private IM.",
              "Contact permission",
            );
          return true;
        }
      }
      if (
        s.scene === "Road" &&
        /^(go|move|walk|head) /.test(t) &&
        !/(to the hospital|to hospital|home$)/.test(t)
      ) {
        const target = WorldDesk.areas.Road.find((area) =>
          t.includes(area.toLowerCase()),
        );
        if (target) {
          if (target === s.area) feedback(`You are already at ${target}.`);
          else
            commit(s.settings.move, () => {
              s.area = target;
              log(`Moved to Road · ${target}.`);
              s.feedback = `You are at ${target}.`;
              s.feedbackTitle = "A change of place";
            });
          return true;
        }
      }
      if (
        /^(show |open )?(appointment slots|hospital schedule)[.!]?$/.test(t)
      ) {
        slots();
        return true;
      }
      if (
        /writing desk|write.*summary|summarize.*next|summarise.*next/.test(t)
      ) {
        if (!s.consulted)
          return !!feedback(
            "Complete a consultation first. A summary must refer to an actual conversation.",
            "No visit to summarize",
          );
        if (
          !["completed", "revision", "submitted", "accepted"].includes(
            s.tasks.summary,
          )
        )
          return (taskDetail("summary"), true);
        artifact();
        return true;
      }
      if (/^(i (do not|don't) want to|do not|don't|never|no,) /.test(t)) {
        feedback(
          "Understood. No action was taken. Tell me the action you do want, when you are ready.",
          "Nothing committed",
        );
        return true;
      }
      if (
        /^(prepare|make|cook).*breakfast|^tidy|^rest( for.*)?[.!]?$/.test(t)
      ) {
        if (s.plan)
          return (
            feedback(
              "Finish or cancel the current plan first.",
              "One plan at a time",
            ),
            true
          );
        if (s.scene !== "Home")
          return (
            feedback(
              "These household activities need a place at Home.",
              "Location matters",
            ),
            true
          );
        const breakfast = /breakfast/.test(t),
          rest = /^rest/.test(t),
          action = breakfast ? "breakfast" : rest ? "rest" : "tidy";
        if (breakfast && s.area !== "Kitchen")
          return (
            feedback(
              "Go to the kitchen before preparing breakfast.",
              "A place to begin",
            ),
            true
          );
        const duration = breakfast ? 10 : rest ? 15 : 10;
        showModal(
          "A little time for everyday life",
          `<p>${action === "breakfast" ? "Prepare a simple breakfast" : action === "rest" ? "Rest" : "Tidy the room"} · ${duration} game minutes in 5-minute checkpoints.<br>Stop at any checkpoint. Completion requires finishing the remaining steps.</p>`,
          [
            { label: "Not now" },
            {
              label: "Start activity",
              primary: true,
              action: () =>
                planStart(
                  `Household activity: ${action}`,
                  Array.from({ length: duration / 5 }, (_, i) => ({
                    minutes: 5,
                    effect: i === duration / 5 - 1 ? action : null,
                    done: `${action} completed.`,
                    log: `${action}: ${Math.min(duration, (i + 1) * 5)} of ${duration} minutes completed.`,
                  })),
                  "household",
                ),
            },
          ],
        );
        return true;
      }
      const portable = t.match(
        /^(?:take|pick up|get) (?:the |my )?(house key|key|id card|id|phone|document folder|folder)(?: from (?:the )?(tray|cabinet))?[.!]?$/,
      );
      if (portable) {
        const key = /key/.test(portable[1])
          ? "key"
          : /id/.test(portable[1])
            ? "id"
            : /phone/.test(portable[1])
              ? "phone"
              : "folder";
        const location = s.items[key];
        if (location === "you") {
          feedback("You already carry that item. Nothing changed.");
          return true;
        }
        if (!["tray", "cabinet"].includes(location))
          return (
            feedback(
              `That item is held by ${personName(location)}. Ask for an actual handover.`,
            ),
            true
          );
        const place = location === "tray" ? "Entrance" : "Living Room";
        if (s.scene !== "Home" || s.area !== place)
          return (
            feedback(`Go to Home · ${place} to reach the ${location}.`),
            true
          );
        commit(s.settings.item, () => {
          s.items[key] = "you";
          if (key === "folder" && s.tasks.documents === "ready") {
            s.tasks.documents = "completed";
            log(
              "Prepared appointment folder collected; document task completed.",
            );
          }
          log(`You took ${key} from the ${location}.`);
          s.feedback = `You now carry ${key}.`;
          s.feedbackTitle = "Picked up";
        });
        return true;
      }
      const take = t.match(
        /^(?:take|pick up|find) (?:the )?(document folder|folder).*cabinet/,
      );
      if (take) {
        if (s.scene !== "Home" || s.area !== "Living Room")
          return (
            feedback("The cabinet is in the living room. Go there first."),
            true
          );
        if (s.items.folder !== "cabinet")
          return (
            feedback(
              "The folder is no longer in the cabinet. Check your pocket or ask Sarah.",
            ),
            true
          );
        commit(s.settings.item, () => {
          s.items.folder = "you";
          log("You took the existing folder from the cabinet.");
        });
        return true;
      }
      const put = t.match(
        /^(?:put|leave|place) (?:the |my )?(house key|key|id card|id|document folder|folder|phone) (?:on|in) (?:the )?(tray|cabinet)/,
      );
      if (put) {
        const key = /key/.test(put[1])
          ? "key"
          : /id/.test(put[1])
            ? "id"
            : /folder/.test(put[1])
              ? "folder"
              : "phone";
        const target = put[2];
        if (
          s.scene !== "Home" ||
          s.area !== (target === "tray" ? "Entrance" : "Living Room") ||
          s.items[key] !== "you"
        )
          return (
            feedback(
              "You need to carry the item and stand by its destination. No ownership changed.",
              "Check place and possession",
            ),
            true
          );
        commit(s.settings.item, () => {
          s.items[key] = target;
          log(`You placed ${key} on the ${target}.`);
        });
        return true;
      }
      if (/^find.*(key|id|folder)/.test(t)) {
        const key = /key/.test(t) ? "key" : /id/.test(t) ? "id" : "folder";
        feedback(
          `Last established location of ${key}: ${s.items[key]}. No object was moved.`,
          "Look before acting",
        );
        return true;
      }
      if (/correct.*(action|mistake)|report.*misunderstanding/.test(t)) {
        correction();
        return true;
      }
      return false;
    }
    function afterStep(step) {
      if (step.effect) {
        s.completedActions[step.effect] = s.time;
        s.completedActions[step.effect + "At"] = Calendar.now();
        log(`You completed the household activity: ${step.effect}.`);
      }
      tick();
    }
    function correction() {
      const latest = s.logs.slice(-8);
      showModal(
        "Keep the record honest",
        `<p>Describe what was misunderstood. The existing history will remain; a correction is appended. This prototype does not reverse dependent actions automatically.</p><div class="form-grid"><label class="full">What should be corrected?<textarea id="correction-text" rows="3"></textarea></label></div>${latest.map((e) => `<p class="desk-note">D${e.day} ${time(e.time)} · ${esc(e.text)}</p>`).join("")}`,
        [
          { label: "Cancel" },
          {
            label: "Record correction & pause",
            primary: true,
            action: () => {
              const text = $("correction-text").value.trim();
              if (!WorldDesk.english(text))
                return toast("Describe the correction in English.");
              pausePlan();
              s.corrections ??= [];
              s.corrections.push({
                text,
                day: s.day,
                time: s.time,
                status: "Needs dependency review",
              });
              log(
                `User correction appended: ${text}. Dependent actions need review; no automatic reversal claimed.`,
              );
              feedback(
                "Your correction is recorded. Related work remains paused for dependency review. Existing history is preserved.",
                "Correction recorded",
              );
            },
          },
        ],
        "SYSTEM MISUNDERSTANDING",
      );
    }
    function dayEnd() {
      if (s.consultStart && !s.consulted) {
        showModal(
          "A conversation is still in progress",
          `<p>Return to the consultation or explicitly leave it unfinished before ending today. Leaving releases the service and keeps the unfinished visit in the record.</p>`,
          [
            { label: "Return to consultation" },
            {
              label: "Leave unfinished consultation",
              primary: true,
              action: () => {
                s.bookingsHistory.push({
                  ...s.appointment,
                  status: "Interrupted",
                });
                s.appointment.status = "Interrupted";
                s.tasks.hospital = "interrupted";
                s.consultStart = null;
                log(
                  "You explicitly left the consultation unfinished; doctor occupancy released.",
                );
                save();
                dayEnd();
              },
            },
          ],
          "A NECESSARY DECISION",
        );
        return;
      }
      const count = Object.values(s.tasks).filter((v) =>
        [
          "accepted",
          "preparing",
          "booked",
          "registered",
          "in-progress",
          "revision",
        ].includes(v),
      ).length;
      const currentAbs = Calendar.now();
      const nextMorningAbs = s.day * 1440 + s.settings.nextMorning * 60;
      const due = s.docDue
        ? Calendar.at({ day: s.docDay ?? s.day, time: s.docDue })
        : Infinity;
      const grace =
        s.appointment &&
        !Calendar.closed.includes(s.appointment.status) &&
        !s.consulted
          ? Calendar.at(s.appointment) + 6
          : Infinity;
      const deadline = Commitments.checkpoint();
      const queueEnd = ["Waiting", "Offered"].includes(s.standby?.status)
        ? Math.min(
            Calendar.at({ day: s.standby.day, time: s.standby.end }),
            s.standby.offerUntil ?? Infinity,
          )
        : Infinity;
      const point = Math.min(
        ...[due, grace, deadline, queueEnd].filter(
          (v) => v > currentAbs && v < nextMorningAbs,
        ),
        Infinity,
      );
      showModal(
        "Let today become a memory",
        `<div class="summary-hero">The small things count.</div><p>${count} open commitments stay in this world. Ending the day does not complete or cancel them.</p><div class="notice-card">${Number.isFinite(point) ? `Next necessary checkpoint: ${Calendar.label({ day: Math.floor(point / 1440) + 1, time: point % 1440 })}. ${point === grace ? "Your appointment arrival window will have ended unless you change your arrangement." : point === deadline ? "An agreed commitment deadline needs review." : point === queueEnd ? "Your standby window will end." : "An accepted task will report a result."} Review this checkpoint before proceeding to tomorrow.` : `Continue to ${String(s.settings.nextMorning).padStart(2, "0")}:00 tomorrow. Unfinished work, items, private contacts and past conversations persist.`}</div>`,
        [
          { label: "Stay in today" },
          {
            label: Number.isFinite(point)
              ? "Review next checkpoint"
              : "Begin tomorrow",
            primary: true,
            action: () => {
              if (Number.isFinite(point)) {
                settle();
                advance(Math.max(0, point - Calendar.now()));
                log("Day-end progression stopped at a necessary checkpoint.");
                save();
                render();
                dayEnd();
                return;
              }
              settle();
              const oldDay = s.day;
              advance(Math.max(0, nextMorningAbs - Calendar.now()));
              s.reflections.push({
                day: oldDay,
                messages: Object.values(s.messages)
                  .flat()
                  .filter((m) => m.from === "you" && m.day === oldDay).length,
                completed: Object.values(s.tasks).filter(
                  (v) => v === "completed",
                ).length,
                note: "Your choices, questions and follow-through are recorded without a score.",
              });
              s.scene = "Home";
              s.area = "Living Room";
              s.roles.Home = s.settings.homeRole;
              s.plan = null;
              tick();
              log(
                `Day ${s.day} began. Ongoing arrangements and ownership persisted.`,
              );
              npc(
                "Sarah",
                s.items.key === WorldDesk.route("Sarah")
                  ? "Good morning. I still have the key you gave me. Thank you for following through."
                  : "Good morning. Our unfinished arrangements are still here. What would you like to take care of?",
              );
              feedback(
                "A new morning in the same world. Your expression book and reflection are in World desk.",
                "Tomorrow is here",
              );
            },
          },
        ],
        "YOUR DAILY REFLECTION",
      );
    }
    function assist(text) {
      const t = text.toLowerCase();
      let reply = null;
      if (/politely.*decline|polite.*refus|help.*decline/.test(t))
        reply =
          "You could say: “I’m sorry, I can’t commit to that today. Could we agree on another time?” This is a suggestion. Choose your own words and send them in the person’s IM.";
      else if (/rephrase|more polite/.test(t))
        reply =
          "Try a clear request with a reason: “Could you help me with this when you have a moment?” Add only details you actually want to share. Nothing has been sent.";
      else if (/what if|consequence|happen if/.test(t))
        reply = `Only a confirmed choice changes your world. ${s.appointment ? `Your appointment is ${time(s.appointment.time)}; arriving after ${time(s.appointment.time + 5)} requires a new arrangement.` : "You have no active appointment to miss."} Stopping travel does not notify anyone. Declining an invitation does not break a promise.`;
      else if (
        /explain.*\b(grace|slot|commitment|reschedule|handover)\b/.test(t)
      ) {
        const word = t.match(
          /\b(grace|slot|commitment|reschedule|handover)\b/,
        )[0];
        reply = {
          grace:
            "“Grace” here means the short allowance after a scheduled time. The hospital gives five game minutes to enter the consultation room.",
          slot: "A “slot” is a reserved time period. The hospital starts a new appointment slot every thirty game minutes.",
          commitment:
            "A “commitment” is something you explicitly agreed to do. An unanswered request is not a commitment.",
          reschedule:
            "To “reschedule” means to agree on a different time. The old booking changes only after the new arrangement is confirmed.",
          handover:
            "A “handover” is a real transfer of an item or responsibility. Saying “I gave it” does not move the object.",
        }[word];
      } else if (/^read.*unread.*(ben|sarah|grace|emma)/.test(t)) {
        const who = Object.keys(people).find((k) =>
          t.includes(k.toLowerCase()),
        );
        const m = (s.messages[who] || []).find(
          (m) => m.from === "npc" && !m.known,
        );
        if (m) {
          m.opened = true;
          m.transcript = true;
          learnMessage(m, who);
          reply = `You asked me to read this update from ${personName(who)}: “${m.text}” This establishes that you have viewed it. It does not accept a request.`;
        } else reply = "There is no unread message from that person.";
      }
      if (!reply) return false;
      assistantMessages.push(
        {
          id: crypto.randomUUID(),
          text,
          from: "you",
          type: "text",
          day: s.day,
          time: s.time,
        },
        {
          id: crypto.randomUUID(),
          text: reply,
          from: "assistant",
          type: "text",
          day: s.day,
          time: s.time,
        },
      );
      s.helpTrail.push({ text, day: s.day, time: s.time });
      save();
      render();
      return true;
    }
    return { world, afterStep, dayEnd, assist };
  },
};
