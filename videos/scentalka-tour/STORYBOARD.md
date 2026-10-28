---
format: 1920x1080
duration: 75s
message: "Scentalka turns everyday English into real-life actions in a living world."
arc: Demo Loop
audience: product and design reviewers
mode: autonomous
music: none
---

## Video direction

Use the prototype's warm paper, forest green, clay accent, and serif-led editorial voice. The real prototype screenshots are the visual source of truth and stay legible as UI evidence. Motion is a calm guided tour: smooth long-tail arrivals, cursor-led focus, short camera pushes into important states, and sequential reveals paced to the written cue phrases. Hold the final state of each screen long enough to read; use stillness after each reveal instead of decorative breathing. Keep the lower caption band clear and leave generous paper margins around the captured UI.

## Frame 1 — Start with a world

- scene: An English practice world begins with a short setup instead of a lesson screen.
- voiceover: "English practice starts with a world you can enter."
- duration: 6s
- transition_in: cut
- status: animated
- src: compositions/frames/01-start-world.html
- type: hook
- persuasion: Future pacing
- beat: curiosity → relief
- blueprint: zoom-out-workspace-reveal
- asset_candidates: assets/screens/onboarding-intro-modal.png — cropped real first-time setup introduction; assets/screens/onboarding-scene-choice.png — real first-time scene choice
- focal: assets/screens/onboarding-intro-modal.png
- roles: assets/screens/onboarding-intro-modal.png — focal setup surface; assets/screens/onboarding-scene-choice.png — supporting scene choice

narrativeRole: Make the problem and promise legible immediately: the learner enters a place where English has a reason to happen.
keyMessage: Start with a life, not a vocabulary list.

Scene 1 (0.0–1.5s): Warm paper field with the Scentalka wordmark and the line “A little more life, in English.” in a sparse centered editorial layout; the typewriter-reveal move (`discrete-text-sequence`) reveals the promise one phrase at a time.
Scene 2 (1.5–3.4s): The setup screenshot arrives as the first evidence in an asymmetric 70/30 layout; a smooth push / focus (`multi-phase-camera`) moves from the page title to the scene choice while the cursor click + ripple (`cursor-click-ripple`) marks “Choose where you begin.”
Scene 3 (3.4–6.0s): The two source screens sit as a compact two-step strip, with “your profile” and “your first scene” labels arriving sequentially; hold the complete setup path still for reading.

## Frame 2 — Make it yours

- scene: The learner edits their identity, routine, goal, and the people in their world.
- voiceover: "Choose your role. Shape your routine. Edit the people you will meet."
- duration: 8s
- transition_in: crossfade
- status: animated
- src: compositions/frames/02-make-it-yours.html
- type: feature_showcase
- persuasion: Personalization
- beat: agency → belonging
- blueprint: panel-edit-live-sync
- asset_candidates: assets/screens/onboarding-profile-modal.png — cropped real profile editor; assets/screens/onboarding-npcs-modal.png — cropped real NPC editor; assets/screens/home.png — verified Home scene with Sarah and Mia
- focal: assets/screens/onboarding-profile-modal.png
- roles: assets/screens/onboarding-profile-modal.png — focal learner profile; assets/screens/onboarding-npcs-modal.png — editable NPC roster; assets/screens/home.png — supporting result

narrativeRole: Prove that setup is editable authorship, not a fixed quiz profile.
keyMessage: The learner authors the context that makes each line meaningful.

Scene 1 (0.0–2.1s): Place the setup editor in a split-screen layout with the profile fields as the only visible content; “Choose your role” enters via per-word staggered reveal (`dynamic-content-sequencing`).
Scene 2 (2.1–4.7s): The routine and goal fields reveal one after another in a panel-edit-live-sync treatment; the cursor click + ripple (`cursor-click-ripple`) lands on the save action as the labels update.
Scene 3 (4.7–6.5s): The NPC editor cards assemble in a 2-column editorial grid (`center-outward-expansion`), revealing Sarah, Mia, Emma, Daniel, Grace, Leo, Ben, and Nora as an eight-person ring.
Scene 4 (6.5–8.0s): Crossfade to the Home screenshot; “Your little world” settles above Sarah and Mia, with a still hold and one small cursor focus on the conversation panel.

## Frame 3 — Home has a reason to speak

- scene: At home, rooms, objects, and a familiar person create the first actionable conversation.
- voiceover: "At home, a key, a message, and a familiar person give you something real to say."
- duration: 10s
- transition_in: push-slide RIGHT
- status: animated
- src: compositions/frames/03-home.html
- type: feature_showcase
- persuasion: Feature-to-benefit translation
- beat: recognition → confidence
- blueprint: cursor-ui-demo
- asset_candidates: assets/screens/home.png — verified Home map and Sarah conversation; assets/screens/pocket.png — verified pocket and object state
- focal: assets/screens/home.png
- roles: assets/screens/home.png — focal map; assets/screens/pocket.png — supporting object record

narrativeRole: Turn the first environment into a legible, low-stakes speaking loop.
keyMessage: Everyday objects create concrete language practice.

Scene 1 (0.0–2.4s): Open on the Home map in a layered-depth 60/40 layout; the camera cursor tracking move (`camera-cursor-tracking`) starts on the living room and locks to the character.
Scene 2 (2.4–5.0s): The bedroom, living room, kitchen, and entrance labels reveal as a short spatial-pan-stations move (`viewport-change`), while the phrase “a key, a message” lands as two sequential highlights.
Scene 3 (5.0–7.6s): A cursor click + ripple (`cursor-click-ripple`) moves to Sarah's conversation panel; the message card opens and the private IM label appears only when the narration reaches “someone familiar.”
Scene 4 (7.6–10.0s): Crossfade to the pocket state; the key and phone stay in the record while the map holds. No extra motion after the evidence becomes readable.

## Frame 4 — A visit, step by step

- scene: Hospital English unfolds as appointment, ID, reception, call, consultation, and pharmacy.
- voiceover: "Then the same world carries you through an appointment — check in, listen, ask, continue."
- duration: 12s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/04-hospital.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: complexity → control
- blueprint: grid-card-assemble
- asset_candidates: assets/screens/hospital.png — verified Hospital map and completed consultation; assets/screens/itinerary.png — verified multi-step itinerary state
- focal: assets/screens/hospital.png
- roles: assets/screens/hospital.png — focal hospital evidence; assets/screens/itinerary.png — supporting action chain

narrativeRole: Demonstrate that the product supports a real multi-step service encounter, not isolated flashcards.
keyMessage: A practical visit becomes a sequence the learner can understand and control.

Scene 1 (0.0–2.8s): The hospital screenshot enters as a wide 70/30 split with the map dominant; a zoom-to-target (`coordinate-target-zoom`) lands on Reception while “check in” appears.
Scene 2 (2.8–5.5s): Appointment, ID, Reception, and Waiting Area cards assemble one at a time (`center-outward-expansion`) in the lower strip; each card reveals on its spoken cue.
Scene 3 (5.5–8.5s): The camera focuses the Consultation room; the doctor conversation panel arrives with an in-place token cycle (`discrete-text-sequence`) from “listen” to “ask” to “continue.”
Scene 4 (8.5–10.5s): The Pharmacy panel slides in from the right using a cut-the-curve seam, preserving the hospital map as a dim background.
Scene 5 (10.5–12.0s): Itinerary screenshot holds as a quiet summary: six steps, one completed visit, one learner in control.

## Frame 5 — Plans can change

- scene: Road delay, Ben's update, and a route choice turn interruption into useful English.
- voiceover: "When the road changes, read the update, pause the plan, and choose your next move."
- duration: 10s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/05-road-choice.html
- type: benefit_highlight
- persuasion: Friction reduction
- beat: tension → control
- blueprint: comparison-split
- asset_candidates: assets/screens/road.png — verified Road scene; assets/screens/road-interruption.png — verified delay and notification state
- focal: assets/screens/road-interruption.png
- roles: assets/screens/road-interruption.png — focal interruption; assets/screens/road.png — supporting route choice

narrativeRole: Show the distinctive learning moment: a real interruption requires reading and choosing.
keyMessage: The learner practices recovery, not just perfect scripts.

Scene 1 (0.0–2.2s): The Road screenshot holds in a rule-of-thirds layout with the bus stop as focal; “the road changes” arrives via flash word-swap (`discrete-text-sequence`).
Scene 2 (2.2–4.8s): The delay notice slides over the map with a cursor click + ripple (`cursor-click-ripple`) on Ben's update; the notification is the only bright accent.
Scene 3 (4.8–7.5s): Split the frame into “wait” and “walk” choices; each enters from its side using split-tilt cards (`split-tilt-cards`) while the active plan pauses visibly.
Scene 4 (7.5–10.0s): Resolve on the selected route and Nora's nearby presence; hold the road screenshot with “your choice” as the final label.

## Frame 6 — Three ways to communicate

- scene: World command, private message, and Assistant help are separate, understandable actions.
- voiceover: "Move in the world. Message one person. Ask the Assistant for help."
- duration: 8s
- transition_in: crossfade
- status: animated
- src: compositions/frames/06-three-voices.html
- type: feature_showcase
- persuasion: Clarity through separation
- beat: clarity → confidence
- blueprint: constellation-hub
- asset_candidates: assets/screens/home.png — verified world and private conversation; assets/screens/world-desk.png — verified world desk; assets/screens/voice-review.png — verified voice review
- focal: assets/screens/home.png
- roles: assets/screens/home.png — focal world/IM evidence; assets/screens/world-desk.png — supporting assistant and desk; assets/screens/voice-review.png — supporting voice route

narrativeRole: Remove the fear that speaking, sending, and asking are one ambiguous channel.
keyMessage: Each kind of English has a clear place and consequence.

Scene 1 (0.0–1.8s): Three labels orbit a centered “Your words” hub (`avatar-cloud-network`): World, Private IM, Assistant; only the hub and first label appear at t=0.
Scene 2 (1.8–3.4s): World and Private IM nodes reveal in sequence with logo/avatar ring + connectors (`avatar-cloud-network`); a cursor focus marks the input mode.
Scene 3 (3.4–5.8s): Assistant arrives as the third node with a scale-swap (`scale-swap-transition`) from the message panel, keeping the same center anchor.
Scene 4 (6.0–8.0s): The three-node diagram holds over a subtle home screenshot crop; the line “Only you choose what to say” settles and remains still.

## Frame 7 — Keep what happened

- scene: Tasks, Pocket, Journal, World desk, and Timeline make the learner's progress visible.
- voiceover: "Tasks remember the work. Pocket remembers the objects. Timeline remembers the moments."
- duration: 10s
- transition_in: cut
- status: animated
- src: compositions/frames/07-keep-records.html
- type: benefit_highlight
- persuasion: Trust through traceability
- beat: continuity → trust
- blueprint: grid-card-assemble
- asset_candidates: assets/screens/plans.png — verified plan and desk; assets/screens/pocket.png — verified pocket state; assets/screens/world-desk.png — verified desk state; assets/screens/timeline.png — verified timeline checkpoint
- focal: assets/screens/timeline.png
- roles: assets/screens/plans.png — supporting task record; assets/screens/pocket.png — supporting object record; assets/screens/world-desk.png — supporting world record; assets/screens/timeline.png — focal timeline

Scene 1 (0.0–2.0s): Empty paper ground with five editorial index labels; the first task card arrives through grid-card-assemble's item stagger (`center-outward-expansion`).
Scene 2 (2.0–5.3s): Pocket, Journal, and World desk cards assemble into a 2-column brick grid; each appears on the corresponding phrase via sequential reveal.
Scene 3 (5.3–7.8s): Timeline screenshot zooms into the center as a short camera journey (`viewport-change`), revealing the checkpoint and the paused plan.
Scene 4 (7.8–10.0s): The four records remain co-resident in a clean summary; subtle jitter only on the index marker (`sine-wave-loop`), then stillness.

## Frame 8 — Listen, speak, decide

- scene: A recorded message is reviewed before the learner decides to send it.
- voiceover: "Record your words. Review the transcript. Decide when they are ready to send."
- duration: 11s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/08-voice-review.html
- type: cta
- persuasion: Risk reversal
- beat: vulnerability → agency
- blueprint: compose
- asset_candidates: assets/screens/voice-review-modal.png — cropped real voice transcript review; assets/screens/voice-actions.png — verified review actions; assets/screens/home.png — verified underlying world state
- focal: assets/screens/voice-review-modal.png
- roles: assets/screens/voice-review-modal.png — focal transcript; assets/screens/voice-actions.png — supporting decision controls; assets/screens/home.png — background world context

narrativeRole: End on the product's clearest promise of learner control: speaking is real, reviewable, and never sent without consent.
keyMessage: Scentalka gives the learner a voice and a pause before action.

Scene 1 (0.0–2.6s): Home screenshot sits behind a centered voice-review card; “Your voice, your words” appears as the single spoken cue through per-word staggered reveal (`dynamic-content-sequencing`).
Scene 2 (2.6–5.6s): The transcript scrolls into focus (`viewport-change`) while “Record your words” and “Review the transcript” arrive as two distinct lines.
Scene 3 (5.6–8.2s): The recognition warning and listen controls reveal in a calm vertical list, then hold for reading.
Scene 4 (8.2–11.0s): Use the voice-actions screenshot for a final decision row; the cursor clicks “Keep voice draft” with press-release-spring (`press-release-spring`), then the Scentalka mark and “Choose what happens next” hold on the final paper field.
