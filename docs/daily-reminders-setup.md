# Daily push reminders

Optional reminders are implemented for Netlify hosting. They are off by default. Without server configuration, Settings truthfully says they are unavailable and does not request permission.

## Activate on the production site

1. Connect the Netlify site to this GitHub repository, deploy `main`, and allow dependency installation from `package-lock.json`. The repository's `netlify.toml` defines the functions and a 15-minute scheduler. Scheduled functions run on published production deploys, not deploy previews.
2. In a trusted checkout, run `npm ci` and `npm run push:keys`. This creates `../steadiermind-notification-keys.env` with restrictive permissions; it refuses to overwrite existing keys. It stays outside the Git checkout and the website publish directory. Do not share this file, paste the private key in chat, or commit it.
3. Copy its `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` into Netlify's environment variables for **Functions**, using the production context. The subject defaults to `mailto:steadiermind@gmail.com`. Keep these keys stable; replacing them requires browsers to unsubscribe and opt in again.
4. Redeploy. Verify `/.netlify/functions/reminders` returns `ready: true` and only the public key. Confirm the `daily-reminders` Blobs store and scheduled function are available on the site's current Netlify plan and review hosting usage limits.
5. On a real phone, choose Settings → A gentle daily reminder. On iPhone/iPad (16.4+), use Safari → Share → Add to Home Screen, then open from the icon. Choose a time/timezone, choose discreet or encouraging wording, and explicitly enable. Notification permission is requested only from this action.
6. Preview on the device, then choose a nearby quarter-hour reminder and verify a scheduled notification arrives with the app closed. Tap it to open/focus the app. Verify only one reminder per local day, quiet hours, time updates, opt-out, and Clear Saved Data. On Android test with an updated browser; test on the actual supported iOS versions too. OS focus settings can suppress notifications; delivery timing is not guaranteed.

## Data and operation

- No account is required. Only push endpoint/keys, time, timezone, message preference, last send day, and update time are stored in Netlify Blobs. Local deletion tokens are not included in journal backups.
- Choices are quarter hours between 08:00 and 20:45. The sender uses the saved IANA timezone; users can update it when traveling. Quiet hours are 21:00–08:00. A missed window is skipped. DST skipped/repeated hours are outside selectable hours; an atomic daily claim prevents duplicates on retries or overlaps.
- Notifications expire after 15 minutes, use low urgency, and request silent delivery. The OS controls final presentation. No private entries appear. Discreet notifications still show the app name.
- There is no fetch/cache handler in the service worker: adding this feature does not promise offline app access or cache private entries.
- Active records are deleted on successful opt-out. Failed opt-outs retain the local deletion token for retry; 404/410 delivery responses remove expired records. Browser storage deletion alone may leave a record until the provider rejects it. Clear Saved Data tries opt-out before deleting local app data.
- API mutations require a same-origin JSON request and an unguessable device token. The API is rate limited; push URLs are restricted to known browser providers. Scheduled delivery cannot be triggered through the public subscription API.
- Do not log subscription endpoints, tokens, or keys. Do not add private entry fields to this store. Review functions usage/failure metrics through Netlify; no client analytics was added.

## Verification

`npm run test:push` covers payloads, scheduling/timezones, validation, subscription updates/deletion, atomic duplicate protection, and expired-subscription cleanup using an in-memory store and fake transport. `python tests/reminders_smoke.py` covers permission, opt-in/settings, preview, opt-out, unsupported/unconfigured states, and mobile layout with a mocked device transport. These checks do not prove production push delivery. Real production/device checks above remain necessary.
