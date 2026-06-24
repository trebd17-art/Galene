# SteadyMind v40

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
- Add ?reset=true to the app URL to clear SteadyMind data and reload as a new user.
- Add ?dev=true to show a floating Reset Test Data button.
- Syntax check: Passed.
