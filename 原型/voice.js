/* Browser microphone sessions are cancellable while permission is pending. Drafts never send themselves. */
const Voices = (() => {
  let session = null;
  const busy = () =>
    !!session &&
    ["permission", "recording", "processing"].includes(session.phase);
  const pending = () => session?.phase === "permission";
  function normalize(st) {
    st.voiceReviews ??= {};
    st.voiceDrafts ??= {};
    return st;
  }
  function button(active = false) {
    $("mic-button").classList.toggle("recording", active);
    $("mic-button").setAttribute(
      "aria-label",
      pending()
        ? "Cancel microphone request"
        : active
          ? "Stop recording"
          : "Record an English message or command",
    );
  }
  function restore(ticket) {
    if (!s || ticket.world !== store.active) return;
    s.drafts[ticket.key] = ticket.original;
    if (ticket.previousAudio) s.voiceDrafts[ticket.key] = ticket.previousAudio;
    else delete s.voiceDrafts[ticket.key];
    if (ticket.previousReview)
      s.voiceReviews[ticket.key] = ticket.previousReview;
    else delete s.voiceReviews[ticket.key];
    recordingData = s.voiceDrafts[activeDraftKey()] || null;
    save();
    render();
  }
  function cancel(quiet = false) {
    const ticket = session;
    if (
      !ticket ||
      !["permission", "recording", "processing"].includes(ticket.phase)
    )
      return;
    ticket.cancelled = true;
    ticket.phase = "cancelled";
    clearTimeout(ticket.timer);
    try {
      ticket.recognition?.abort();
    } catch {}
    if (ticket.recorder?.state === "recording") ticket.recorder.stop();
    ticket.stream?.getTracks().forEach((t) => t.stop());
    recordingCancelled = true;
    restore(ticket);
    session = null;
    button();
    if (!quiet)
      toast(
        "Recording cancelled. Your previous text and recording drafts are preserved.",
      );
  }
  function release(key) {
    if (!session || (key && session.key !== key)) return;
    const ticket = session;
    ticket.cancelled = true;
    ticket.phase = "finished";
    clearTimeout(ticket.timer);
    try {
      ticket.recognition?.abort();
    } catch {}
    session = null;
  }
  function stop() {
    const ticket = session;
    if (ticket?.phase !== "recording") return;
    ticket.phase = "processing";
    clearTimeout(ticket.timer);
    try {
      ticket.recognition?.stop();
    } catch {}
    if (ticket.recorder.state === "recording") ticket.recorder.stop();
    button();
    $("input-hint").textContent =
      "Preparing your recording. Nothing has been sent.";
  }
  function status(ticket, text) {
    if (session !== ticket || ticket.world !== store.active || ticket.cancelled)
      return;
    s.voiceReviews[ticket.key] ??= {};
    s.voiceReviews[ticket.key].recognition = text;
    save();
  }
  async function record() {
    if (pending()) {
      cancel();
      return;
    }
    if (session?.phase === "recording") {
      stop();
      return;
    }
    if (busy()) {
      toast("Your recording is still being prepared. Escape cancels it.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast("Recording is not supported here. Continue with English text.");
      return;
    }
    captureDraft();
    stopPlayback();
    pausePlan(
      "Your plan is paused while recording. Continue it in World when ready.",
    );
    const ticket = {
      id: crypto.randomUUID(),
      phase: "permission",
      world: store.active,
      key: activeDraftKey(),
      context: mode,
      original: s.drafts[activeDraftKey()] || "",
      previousAudio: s.voiceDrafts[activeDraftKey()],
      previousReview: s.voiceReviews[activeDraftKey()]
        ? structuredClone(s.voiceReviews[activeDraftKey()])
        : null,
      lastAuto: s.drafts[activeDraftKey()] || "",
      transcript: "",
      candidates: [],
      cancelled: false,
    };
    session = ticket;
    recordingWorld = ticket.world;
    recordingKey = ticket.key;
    recordingContext = ticket.context;
    recordingOriginalDraft = ticket.original;
    recordingCancelled = false;
    recordingText = "";
    button(true);
    $("input-hint").textContent =
      "Waiting for microphone permission · Escape cancels this attempt.";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (
        session !== ticket ||
        ticket.cancelled ||
        ticket.world !== store.active
      ) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      ticket.stream = stream;
      recordingStream = stream;
      const rec = new MediaRecorder(stream);
      ticket.recorder = rec;
      recorder = rec;
      const chunks = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onerror = () => {
        ticket.failed = true;
        status(ticket, "Audio capture failed. Type or record again.");
        stop();
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearTimeout(ticket.timer);
        try {
          ticket.recognition?.stop();
        } catch {}
        if (
          session !== ticket ||
          ticket.cancelled ||
          ticket.world !== store.active
        )
          return;
        ticket.phase = "processing";
        button();
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        if (!blob.size || ticket.failed) {
          ticket.phase = "failed";
          restore(ticket);
          toast(
            "No usable recording was captured. Your earlier drafts remain.",
          );
          return;
        }
        const reader = new FileReader();
        reader.onerror = () => {
          if (session === ticket) {
            ticket.phase = "failed";
            restore(ticket);
            button();
            toast("Recording could not be saved. Your earlier drafts remain.");
          }
        };
        reader.onload = () => {
          if (
            session !== ticket ||
            ticket.cancelled ||
            ticket.world !== store.active
          )
            return;
          s.voiceDrafts[ticket.key] = reader.result;
          const review = (s.voiceReviews[ticket.key] ??= {});
          Object.assign(review, {
            day: s.day,
            time: s.time,
            context: ticket.context,
            transcript: ticket.transcript,
            candidates: ticket.candidates,
            recognition:
              ticket.recognitionStatus ||
              "No automatic transcript. Type the English words you intended.",
          });
          ticket.phase = "ready";
          recordingData = s.voiceDrafts[activeDraftKey()] || null;
          save();
          render();
          button();
          toast(
            "Voice draft ready. Review the recording and English words before sending.",
          );
          if (ticket.key === activeDraftKey()) $("command-input").focus();
        };
        reader.readAsDataURL(blob);
      };
      rec.start();
      ticket.phase = "recording";
      button(true);
      $("input-hint").textContent =
        "Recording · Release the talk key to review. Escape cancels.";
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        try {
          const sr = new SR();
          ticket.recognition = sr;
          recognition = sr;
          sr.lang = "en-US";
          sr.continuous = true;
          sr.interimResults = false;
          sr.maxAlternatives = 3;
          sr.onresult = (e) => {
            if (
              session !== ticket ||
              ticket.cancelled ||
              ticket.world !== store.active ||
              !["recording", "processing", "ready"].includes(ticket.phase)
            )
              return;
            const results = Array.from(e.results);
            ticket.transcript = results.map((r) => r[0].transcript).join(" ");
            recordingText = ticket.transcript;
            ticket.candidates = results.flatMap((r) =>
              Array.from(r)
                .slice(0, 3)
                .map((a) => ({
                  text: a.transcript,
                  confidence:
                    Number.isFinite(a.confidence) && a.confidence > 0
                      ? a.confidence
                      : null,
                })),
            );
            ticket.recognitionStatus = ticket.candidates.some(
              (a) => a.confidence !== null && a.confidence < 0.7,
            )
              ? "Needs careful review · the browser reported uncertain words."
              : "Automatic transcript · check names, times and intent.";
            const combined = [ticket.original, ticket.transcript]
              .filter(Boolean)
              .join(" ");
            if (
              s.drafts[ticket.key] === ticket.lastAuto ||
              s.drafts[ticket.key] === ticket.original
            ) {
              s.drafts[ticket.key] = combined;
              ticket.lastAuto = combined;
            }
            s.voiceReviews[ticket.key] = {
              ...(s.voiceReviews[ticket.key] || {}),
              transcript: ticket.transcript,
              candidates: ticket.candidates,
              recognition: ticket.recognitionStatus,
            };
            save();
            if (ticket.key === activeDraftKey()) {
              $("command-input").value = s.drafts[ticket.key];
              updatePreview();
            }
          };
          sr.onerror = () => {
            ticket.recognitionStatus =
              "Automatic transcript unavailable. Keep the audio and type your English transcript, or record again.";
            status(ticket, ticket.recognitionStatus);
          };
          sr.start();
        } catch {
          ticket.recognitionStatus =
            "Live recognition could not start. Audio recording continues; type your English transcript after stopping.";
        }
      } else
        ticket.recognitionStatus =
          "This browser has no live speech recognition. Type your English transcript after recording.";
      ticket.timer = setTimeout(() => {
        if (session === ticket && ticket.phase === "recording") stop();
      }, 60000);
    } catch {
      if (session !== ticket || ticket.cancelled) return;
      ticket.phase = "failed";
      ticket.stream?.getTracks().forEach((t) => t.stop());
      restore(ticket);
      button();
      toast(
        "Microphone unavailable or permission denied. Your earlier drafts remain; no game time passed.",
      );
    }
  }
  function renderButton() {
    if (!$("voice-review")) return;
    $("voice-review").hidden = !s.voiceDrafts?.[activeDraftKey()];
  }
  function review() {
    if (busy()) {
      toast("Stop recording before reviewing a voice draft.");
      return;
    }
    captureDraft();
    const key = activeDraftKey(),
      meta = s.voiceReviews[key] || {},
      clip = s.voiceDrafts[key];
    if (!clip) return queue();
    showModal(
      "Your voice, your words",
      `<p>Destination: ${key.startsWith("npc:") ? esc(personName(key.slice(4))) : esc(key)}. This draft has not been sent. Editing the transcript changes the words used to understand your intent; your recorded sound stays unchanged.</p><div class="notice-card">${esc(meta.recognition || "Review the English words before sending.")}</div><div class="desk-toolbar"><button class="secondary-button" id="voice-preview">Listen to my recording</button><button class="secondary-button" id="voice-preview-stop">Pause preview</button></div><label class="writing-label">English transcript / existing text draft<textarea id="voice-transcript" rows="5" maxlength="1500">${esc(s.drafts[key] || "")}</textarea></label>${meta.candidates?.length ? `<details><summary>Browser recognition candidates</summary>${meta.candidates.map((a) => `<p class="desk-note">${esc(a.text)} · ${a.confidence === null ? "Confidence not supplied" : `${Math.round(a.confidence * 100)}% browser confidence`}</p>`).join("")}</details>` : ""}<p class="desk-note">Listen and correct the English words, or record again for a new take. Record again replaces this recording after you finish the new one.</p>`,
      [
        {
          label: "Use text only",
          action: () => {
            stopPlayback();
            release(key);
            delete s.voiceDrafts[key];
            delete s.voiceReviews[key];
            recordingData = null;
            save();
            render();
            $("command-input").focus();
          },
        },
        {
          label: "Discard recording",
          action: () => {
            stopPlayback();
            release(key);
            delete s.voiceDrafts[key];
            delete s.voiceReviews[key];
            recordingData = null;
            save();
            render();
            toast("The recording was removed; your text draft is preserved.");
          },
        },
        {
          label: "Record again",
          action: () => {
            stopPlayback();
            record();
          },
        },
        {
          label: "Keep voice draft",
          primary: true,
          action: () => {
            stopPlayback();
            save();
            render();
            $("command-input").focus();
          },
        },
      ],
      "VOICE REVIEW",
    );
    $("voice-transcript").oninput = () => {
      s.drafts[key] = $("voice-transcript").value;
      $("command-input").value = s.drafts[key];
      updatePreview();
      save();
    };
    $("voice-preview").onclick = () => {
      stopPlayback();
      audio = new Audio(clip);
      audio.onerror = () =>
        toast(
          "Recording preview unavailable. Its English transcript is preserved.",
        );
      audio
        .play()
        .catch(() =>
          toast(
            "Audio preview could not start. You can keep editing the transcript.",
          ),
        );
    };
    $("voice-preview-stop").onclick = stopPlayback;
  }
  function queue() {
    const list = Object.entries(s.messages).flatMap(([who, messages]) =>
      messages
        .filter((m) => m.from === "npc" && m.type === "voice" && !m.listened)
        .map((m) => ({ who, m })),
    );
    showModal(
      "A little time to listen",
      `<button class="desk-back" id="voice-back">← World desk</button><p>Unplayed NPC voice messages stay with their sender. Choosing Play never changes your input recipient. Opening a conversation is a separate choice. Recording pauses playback; no voice starts automatically.</p>${list.length ? list.map(({ who, m }) => `<div class="detail-row"><div><strong>${esc(personName(who))} · Day ${m.day} ${time(m.time)}</strong><p>${m.known ? "Transcript viewed / content known" : m.heardText ? "Partially heard · transcript still hidden" : "Voice update · content not yet viewed"}${m.playbackChar || m.playbackSeconds ? " · Paused partway" : ""}</p></div><button class="secondary-button" data-queue-play="${m.id}">Play / pause</button><button class="text-button" data-queue-open="${m.id}">Open IM</button></div>`).join("") : '<div class="notice-card">No unplayed NPC voice messages. Your next updates will appear here.</div>'}<button class="secondary-button" id="voice-draft-open" ${s.voiceDrafts[activeDraftKey()] ? "" : "disabled"}>Review current voice draft</button>`,
      [],
      "VOICE & LISTENING",
    );
    $("voice-back").onclick = () => WorldDesk.open();
    $("voice-draft-open").onclick = review;
    document.querySelectorAll("[data-queue-play]").forEach(
      (b) =>
        (b.onclick = () => {
          const f = findMessage(b.dataset.queuePlay);
          if (f) f.m.opened = true;
          playMessage(b.dataset.queuePlay);
          save();
        }),
    );
    document.querySelectorAll("[data-queue-open]").forEach(
      (b) =>
        (b.onclick = () => {
          const f = findMessage(b.dataset.queueOpen);
          if (!f) return;
          f.m.opened = true;
          $("modal").close();
          selectContact(f.k);
          save();
        }),
    );
  }
  return {
    normalize,
    busy,
    pending,
    cancel,
    release,
    record,
    stop,
    review,
    queue,
    renderButton,
  };
})();
