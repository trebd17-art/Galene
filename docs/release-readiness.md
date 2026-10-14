# SteadierMind release readiness

Updated October 14, 2026. Preparation record, not a certification of store approval or deployment.

## Prepared

- Browser-local entries and progress, readable JSON export, and deletion protected against unload autosaves.
- In-app and standalone privacy policy with steadiermind@gmail.com contact.
- Five education paths with 15 lessons and per-lesson reference links.
- Central Educational Sources page; live reference verification explicitly pending.
- In-app and standalone Help & Support pages with app contact and data-management instructions.
- Welcome wording accurately explains that no server account exists in this version.
- Removed development-only reset/raw-data controls from the customer Settings screen; ordinary export/delete controls remain.
- Six games available; accessible achievement dialogs and reduced-motion support.

## Decisions before release implementation

- Confirmed: website first; mobile stores later.
- Confirmed: free initial release; subscriptions later.
- Audience confirmed: adults and teenagers; documents specify ages 13+, with parent/guardian permission under 18. Confirm intended launch countries.
- Domain: steadiermind.com through GoDaddy; hosting: Netlify. Automatic publishing disabled and no public deployment reported. Verify actual hosting logs/retention before launch.

## Release gates still open

- Check all 13 educational sources against live pages before recording final narration; retain source sections and review dates.
- Confirm hosting practices and finalize privacy wording for the real deployed service.
- Confirm final terms and applicable legal/business details; current general-wellness statements are not a comprehensive legal review.
- If paid launch: define free/trial/premium entitlements, implement purchases and restoration as applicable, and test renewals/cancellations/refunds and entitlement changes.
- Premium-locked difficulty controls removed from the two available legacy games for this free release. Retired game screens remain inaccessible from the menu.
- If mobile launch: implement iOS/Android packaging, signing, app identifiers, icons, and native-device testing.
- Verify current Apple and Google requirements, including applicable health declaration and privacy forms, from accessible official pages.
- Prepare store/website descriptions and real screenshots without unsupported clinical or endorsement claims.
- Test with a small group of intended users and resolve critical issues.

## Practical acceptance checks

- New user can reach home without an account or misleading login promise.
- Settings exposes help, privacy, sources, terms, export, and deletion with keyboard-accessible buttons.
- App support mail link contains no personal entries or automatic export.
- Public support and privacy pages load without requiring the app or a login.
- Save, export, delete, reload, games, lessons, and tool navigation pass browser tests.
- Verify on real target devices, including reduced motion, narrow screens, accessibility, and interrupted sessions.

Public URLs will be the chosen website origin followed by /support.html and /privacy.html; no domain or deployment is assumed here.

## Rewards update: October 14, 2026

Existing points are preserved. Rewards now use participation badges, neutral 100-point milestones, and dated activity records for the last seven days. Historical dates are not invented. Check-in/mood: 5; reflection: 10; first lesson completion: 5; completed routine: 10; game completion: 10; completed breathing/grounding/worry session: 5. Sleep stays free of point incentives, while tool completion can contribute to the variety badge. Badges remain earned when individual entries are deleted; Clear Saved Data removes the local reward history as well. No promised theme unlocks, performance-dependent Calm Focus points, or resettable streak remain in the active rewards flow.

## Export and restore update: October 14, 2026

Settings provides a printable HTML journal, formula-safe UTF-8 mood CSV, and a JSON backup of entries, plan, preferences, routine draft, points, and progress. Import is local only, limited to 2 MB, validated against known field shapes, and previewed before any change. Merge retains current progress and uses stable IDs (or identical legacy content) to skip duplicates; current entries win when IDs match. Full replacement requires confirmation. A saving guard prevents unload handlers from overwriting the imported snapshot. Downloaded files remain the user’s responsibility and are not encrypted by the app. Printable HTML and CSV are reports, not backup-import formats. Provider/source verification and launch approvals remain separate.
