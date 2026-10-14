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
