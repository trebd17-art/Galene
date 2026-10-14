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

Settings provides a printable HTML journal, formula-safe UTF-8 mood CSV, and a JSON backup of entries, plan, preferences, routine draft, points, and progress. Import is local only, limited to 16 MB, validated against known field shapes, and previewed before any change. Merge retains current progress and uses stable IDs (or identical legacy content) to skip duplicates; current entries win when IDs match. Full replacement requires confirmation. A saving guard prevents unload handlers from overwriting the imported snapshot. Downloaded files remain the user’s responsibility and are not encrypted by the app. Printable HTML and CSV are reports, not backup-import formats. Provider/source verification and launch approvals remain separate.

## Journal archive update: October 14, 2026

Journals now use an IndexedDB archive with an original-date index. Legacy entries migrate before application startup; points and other preferences are preserved. Synchronous saves first write a compact browser-local recovery log, which remains until the IndexedDB transaction succeeds. Interrupted saves replay on startup; failed archive writes retain a recoverable copy and offer retry/export. Clearing saved data clears both storage layers; full JSON restoration is explicitly authoritative, while missing local metadata does not erase an existing archive. Browsers without IndexedDB can continue with local storage before migration. If an existing archive cannot be read, startup stops rather than replacing it with an empty history.

Past reflections includes date lookup, calendar-year and 365-day shortcuts, and incremental display. New entries retain original timestamps and local calendar dates independently of last-edited time. Ambiguous older date strings are left unassigned until a user confirms their original date. No browser-local storage guarantees 365 days of retention; keep JSON backups. These features do not enable cloud accounts, encryption, or cross-device synchronization.
