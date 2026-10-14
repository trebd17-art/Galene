# SteadierMind v40

## Educational video

In Education → Understanding anxiety → Understanding the alarm response, play
“Understanding Anxiety’s Alarm Response” (1 minute 40 seconds). The video starts
only on request, includes visible captions, and pauses when you leave the lesson
or hide the browser tab. MP4 download and full narration transcript links appear
under the player. The video, poster, English WebVTT captions, and transcript are
self-hosted in `media/`; no video service or credentials are required.

Serve the checkout with `python3 -m http.server 8000` and open the app through
that server. Include the `media/` directory when deploying the static app.

Updates:
- Added Local Storage saving.
- Saves XP, completed activities, personalized plan, selected profile options, journal entries, mood history, game progress, achievements, and game levels.
- Auto-loads saved data when the app opens.
- Auto-saves after XP updates, plan building, completing activities, journal/mood changes, and before closing the page.
- Added Export My Data and Clear Saved Data controls to Settings when available.
- Syntax check: Passed.


v42:
- After the user builds their plan, the app now saves the plan and automatically redirects to the Profile/Plan page.
- The home page CTA refreshes so it changes from Build My Plan to Continue My Plan.
- Syntax check: Passed.


v43:
- Corrected the recommended next step card behavior.
- Before assessment/profile generation:
  - Heading: Build Plan
  - Button: Build My Plan →
  - Button opens Assessment page.
- After plan/profile exists:
  - Heading: Continue My Plan
  - Button: Continue My Plan →
  - Button opens Profile page.
- Syntax check: Passed.


v44:
- Replaced the fragile Build/Continue Plan patches with one clean DOM-based patch.
- Before a plan exists: card displays Build Plan and button says Build My Plan →, opening Assessment.
- After a plan exists: card displays Continue My Plan and button says Continue My Plan →, opening Profile.
- Removed older conflicting v41/v42/v43 plan-card scripts.
- Syntax check: Passed.


v46:
- Added stronger reset tools.
- Add ?reset=true to the app URL to clear SteadierMind data and reload as a new user.
- Add ?dev=true to show a floating Reset Test Data button.
- Syntax check: Passed.


v47:
- Fixed the real issue: the app was still treating default JavaScript plan values as a completed plan after Local Storage was cleared.
- Added a separate plan-built flag: steadyMind.planBuilt.
- Before assessment is actually completed, Home now forces:
  - No plan built yet
  - Build Plan
  - Build My Plan → Assessment
- After assessment Build button runs, the app marks the plan as built and shows:
  - Continue My Plan → Profile
- Hard reset now clears all Local Storage and Session Storage.
- Syntax check: Passed.


v48:
- Fixed the real visible Home card click behavior.
- The home card itself and its button now route through handleHomePlanCTA.
- Before the assessment is completed:
  - Status: No plan built yet
  - Heading: Build Plan
  - Button: Build My Plan → opens Assessment
- After pressing the assessment Build My Plan button:
  - steadyMind.planBuilt becomes true
  - Heading: Continue My Plan
  - Button: Continue My Plan → opens Dashboard/Profile
- Reset now clears data and sets force-new-user mode so default JS plan values cannot return.
- Syntax check: Passed.


v49:
- Changed first-time home card title from “Build Plan” to “Build My Plan.”
- Removed the bottom “Build / Edit Plan” button from the home page.
- Centered the welcome/login page title and intro text.
- No other intentional code changes.
- Syntax check: Passed.


v50:
- First-time home card title is now “Build My Plan.”
- Removed the bottom “Build / Edit Plan” button from the home page.
- Welcome/login page title and intro are centered.
- Returning users still see “Continue My Plan.”
- Syntax check: Passed.

The app is now named SteadierMind. Existing `steadyMind` browser storage keys are retained to preserve saved user progress.


## Guided setup and starter routine

Setup now asks for up to two support areas, an optional current feeling, and a 2-, 5-, or 10-minute time preference. The optional profile question can be skipped. Answers personalize a starting routine with arrival, an existing breathing/grounding tool, a reflection, and a manageable action. A closing check-in accepts neutral or less-settled outcomes. Activities can be skipped, and incomplete routines can resume from Home.

`starter.js` integrates this flow with the existing `app.js` snapshot and tools. Setup drafts and routine state are stored inside the existing browser-local snapshot; completed reflections are added to the existing journal. This is local browser storage, not cloud account synchronization. Saved profiles are rendered when restored or opened.

To verify the workflow in an environment with Python Playwright and Chromium installed:

```sh
node --check starter.js
node --check app.js
python3 tests/starter_smoke.py
```

The smoke test serves the checkout on an ephemeral local port and uses an isolated browser context. It checks setup limits, draft reload, personalization, tool switching, routine resume, reflection saving, skips, profile reload, and mobile widths.


## Gentle breathing

The focused breathing screen uses a gentle 4-second inhale and 6-second exhale, without breath holds. Sessions require an explicit start, support pause/resume and finishing early, and offer grounding instead. Optional sound is off when a session opens. Starter routines use 30, 60, or 120 seconds for the 2-, 5-, or 10-minute preferences; standalone sessions use 60 seconds. Leaving the screen stops the clock and sound. Natural completion awards XP once when the user continues; finishing early does not award XP. Browser tab hiding automatically pauses the session.

Run `python3 tests/breathing_smoke.py` to check timing and integration with the same prerequisites as the starter smoke test.


## Flexible grounding

Grounding now displays one sense at a time, with a large number, short prompt, and progress indicator. Users can name observations silently or aloud, skip any step, or use an available sense instead. Smell and taste never require eating, drinking, or finding a particular sensation. The ending offers a neutral check-in message and returns to the starter routine when launched there. Completion rewards occur once; skipping every step does not earn XP.

Run `python3 tests/grounding_smoke.py` with Python Playwright and Chromium to verify the flow.


## Worry Release

Worry Release now offers four guided steps: optionally name a worry, choose what is in your control, select a manageable response, and close without pressure to resolve the feeling. All steps can be skipped. Users can identify a small action, write for later, return attention to the present, or visit grounding and return. The starter integration supports returning to the routine.

Written worries stay in session memory and are excluded from snapshots and autosave. Saving to the existing browser-local journal requires an explicit checkbox on the final screen. Unchecked writing is discarded on finishing, leaving, or reload. Saved entries are included in existing data export; save failures allow retry or finishing without saving. No new analytics or remote transmission is introduced.

Run `python3 tests/worry_smoke.py` and `python3 tests/worry_save_smoke.py` with Python Playwright and Chromium to check the guided flow, privacy, and save-failure recovery.


## Sleep Wind-Down

Sleep Wind-Down uses a dim, readable navy-and-teal screen with four stages: settle in, optionally put something aside, relax the jaw/shoulders/hands one at a time, and finish quietly. Every instruction can be skipped. Sound is optional and off when the session opens. Finishing stops sound and stays on the dim screen without XP, bright animations, or an automatic return home. A user can deliberately return to their routine or calming tools.

Tomorrow notes remain in session memory unless the user explicitly opts into saving them to the existing browser-local journal on completion. Save failures support retry or finishing without saving; exported data includes saved journal notes. Sleep-focused starter plans suggest this tool unless the current feeling calls for grounding instead.

Run `python3 tests/sleep_smoke.py` with Python Playwright and Chromium to validate the flow.


## Daily Reflection

Daily Reflection now has a short core: an optional feeling, one main reflection, and an optional supportive next step. A goal-based prompt is available without relabeling answers already written. Balanced uncertainty and gratitude prompts are tucked into an optional section. No positive response is required.

Entries save explicitly with their mood and question labels. An unchanged repeated save creates no duplicate or additional XP. Editing a saved draft updates the same entry; Start a new reflection creates a separate entry. Failed saves roll back the entry and rewards while preserving editor text for retry. Past reflections is collapsed by default and safely displays existing legacy, starter, worry, and sleep entries. Unsaved editor text is not included in autosave and is lost on reload; saved entries remain browser-local and available in data export.

Run `python3 tests/reflection_smoke.py` with Python Playwright and Chromium to check these behaviors.
