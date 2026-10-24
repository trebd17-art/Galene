# SteadierMind landing page and demonstration clips

## Public entry

- `https://steadiermind.com/` serves `landing.html` through a Netlify rewrite.
- `https://steadiermind.com/app` serves the existing application. `/index.html` redirects to `/app`; local development can still open `index.html` directly.
- App storage stays on the same origin and is not migrated, cleared, or read by the marketing page. Routine, grounding, and worry links pass a whitelisted entry intent, show the existing account-free terms/privacy notice, then enter the selected flow after Continue.
- The installed app keeps manifest ID `/`, but launches `/app`. Older standalone installations opening the homepage are sent to `/app`. Notification clicks open the app rather than the landing page.
- The page contains no analytics, ad pixels, tracking cookies, signup form, or external font service. No advertisements or social posts are submitted by this change.

## Clips

All three are vertical 1080 × 1920 H.264 MP4s with silent stereo AAC, visible captions, optional WebVTT captions, posters, gentle fades, and an end card. They use real app screens captured in an isolated browser with invented preferences and unsaved example writing. They are edited walkthroughs, not real-time sessions or user testimonials.

| Clip | Length | File |
| --- | ---: | --- |
| A small pause | 20 sec | `media/marketing/a-small-pause.mp4` |
| One manageable step | 24 sec | `media/marketing/one-manageable-step.mp4` |
| Your own pace | 24 sec | `media/marketing/your-own-pace.mp4` |

Suggested post copy and complete visible captions are in `media/marketing/captions-and-posts.txt`; the page provides direct downloads. A public social share image is `media/marketing/share-card.png`.

## Reproduce

1. Run `python scripts/capture-marketing-demos.py --output /tmp/steadiermind-marketing-captures` with Playwright and Chromium installed.
2. Run the Pillow-enabled Python environment with `scripts/render-marketing-demos.py --captures /tmp/steadiermind-marketing-captures`. FFmpeg is required. This rebuilds the three MP4s, posters, captions, catalog, and share image. These source scripts do not read any real user's app storage.
3. Run `python tests/landing_smoke.py`, `python tests/first_impressions_smoke.py`, and `npm run test:push`.

The landing test simulates the configured root and app rewrites and verifies mobile layouts, actual clip playback/downloads, consent-preserving entry routes, and storage preservation. All three clips are also fully decoded and checked for resolution, timing, and H.264/AAC compatibility during production. Live Netlify routing and device playback still need checking after deployment; direct access to steadiermind.com is blocked by this workspace's network.
