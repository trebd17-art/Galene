# SteadierMind: app-store preparation review

Prepared October 12, 2026. Scope: current repository, Apple App Store and Google Play preparation, and the companion website.

## Verification status

The official Apple and Google policy pages could not be retrieved: the execution environment returned a network-proxy 403 error. The guidance below identifies requirements to verify and concrete preparation gaps; it is not confirmation of current policy text, legal compliance, or store approval. No submission or deployment was performed.

Official pages to verify before submission:

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/ (health/medical claims 1.4.1, minimum functionality 4.2, privacy 5.1, payments/subscriptions 3.1).
- Google Play Health Content and Services: https://support.google.com/googleplay/android-developer/answer/14738291
- Google Play Data safety: https://support.google.com/googleplay/android-developer/answer/10787469
- Check the live Apple developer and Play Console guidance for privacy labels, billing, account deletion if accounts are added, and account-specific testing requirements.

## Current findings and actions

| Area | Current evidence | Action before submission |
|---|---|---|
| Native distribution | The repository is a static HTML/CSS/JavaScript app. No package.json, native project, Capacitor configuration, or app manifest was found in the repository search. | Choose and build an iOS/Android distribution approach, signing, identifiers, icons, and release artifacts. Assess the complete mobile experience against Apple minimum-functionality guidance; a wrapper alone does not ensure approval. |
| Privacy policy | index.html contains a short in-app privacy paragraph. It does not explain retention, browser-local storage, deletion/export, operator contact, or third-party requests. | Publish a stable public privacy-policy URL and make it accessible in the app and store listings. Write it from actual final data flows; do not invent an operator identity or contact address. |
| Sensitive entries | Mood, reflection, routine, and learning/game data use the existing localStorage snapshot. Settings include export/reset controls. | Verify which fields are saved, what deletion clears, device access risks, retention, and the effect of uninstall/browser clearing in the final mobile package. Explain that local storage is not account-based cloud backup. Do not describe it as encrypted unless implemented and verified. |
| External traffic | index.html loads fonts from fonts.googleapis.com/fonts.gstatic.com. Lessons link to external health websites. No application backend or analytics was identified in this review. | Audit the final package and website, including hosting logs and added SDKs. Consider bundling fonts to reduce third-party requests. Determine what external providers receive and what must be disclosed. Local journal storage alone does not establish that the entire product collects no data. |
| Store privacy declarations | No completed Apple App Privacy or Google Data safety declaration is present in the repository. | Complete the forms based on the final app, SDKs, and data flows. Verify the platform definitions of collection/sharing rather than assuming every local field must be declared as collected, or that no collection occurs. |
| Health declaration/disclaimer | Terms and privacy mention wellness and no diagnosis/treatment. The application includes anxiety education and mental-health-related tools. | Complete Google's applicable Health apps declaration accurately. Confirm the live health policy's disclaimer and professional-advice requirements and implement the required wording and placement. Review Apple health/medical guidance as well. |
| Benefit claims | The games menu says games “train” calm, focus, confidence, or emotional balance; Grounding says it “trains your attention.” | Prefer concrete descriptions of activities: matching, attention practice, sensory exploration, and reflection. Review all app/store/website claims for implied treatment or measured improvement. Avoid unsupported clinical efficacy or endorsement claims. |
| Education evidence | Fifteen original lessons include broad path-level references. docs/education-source-map.md provides more specific suggested references, still awaiting live verification. | Check each cited page and map significant claims to source sections. Replace broad references where necessary. Keep original examples distinct from research conclusions. A qualified review is recommended, not established here as a universal publication requirement. |
| Paid features | Calm Focus and Grounding show premium-locked difficulty controls. Current handlers display upgrade messages; working subscription checkout and entitlement verification were not identified. | Before promising paid features, either implement and test actual subscription access or remove premature upgrade promises. Configure platform billing as applicable, product prices, renewal/cancellation terms, purchase restoration, and entitlement handling. Website checkout and store purchases need a deliberate plan; linking to outside payment depends on platform, region, and current rules. |
| Accounts | No account backend or sign-in system was identified. | Do not add an account-deletion flow solely for nonexistent accounts. If accounts are introduced, verify and implement Apple's and Google's account-deletion requirements. Local-data deletion is a separate feature. |
| App testing | Browser smoke tests cover multiple tools, saving, games, and education. These are not native-device or store-submission tests. | Test signed builds on target devices, accessibility, offline/relaunch behavior, interruptions, saving/export/deletion, links, and purchases if present. Check Play Console's testing requirements for the developer account. |
| Submission details | Store listing, public support URL, release assets, age/content questionnaires, and final review materials have not been verified. | Prepare accurate screenshots, descriptions, contact/support details, questionnaires, and reviewer instructions. Supply a working review account only if sign-in is required. |

## Suggested positioning

“SteadierMind offers short educational lessons and self-guided activities for everyday stress management, relaxation, reflection, and emotional well-being.”

Describe what users do, rather than guaranteeing outcomes. Review the completed app, website, screenshots, videos, and advertising together. A disclaimer does not cancel a contradictory treatment claim.

## Suggested sequence

1. Verify the official policies in a browser that can access them.
2. Finalize lesson references and modest, accurate product wording.
3. Choose the mobile packaging approach and decide whether launch includes subscriptions.
4. Audit actual data flows; complete the public privacy policy and platform declarations.
5. Build and test the mobile releases and any subscription system.
6. Complete store materials and submit for review.

## Missing business details for a final privacy/submission draft

Operator/legal business name, public contact email, intended launch countries, intended audience/age range, website host, chosen mobile packaging approach, and whether initial release includes accounts, analytics, advertising, or subscriptions. These facts are needed for accurate final documents; they have not been assumed.

## Implementation update: October 13, 2026

SteadierMind is the user-provided operator name; the public privacy contact is steadiermind@gmail.com. The in-app and standalone privacy policies now explain local storage, export, deletion, and security limits. External Google Fonts requests were removed. A deletion guard prevents unload autosaves from restoring cleared entries and preserves unrelated storage. Per-lesson references and a central Educational Sources page were added. Live source verification remains blocked; final hosting practices and mobile/store setup remain pending.
