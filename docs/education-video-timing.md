# Education video timing update

All 15 exports run at 1.15× the preceding versions’ tempo. Audio uses Rubber Band time stretching with pitch factor 1.0. Visual frames, existing burned-in captions, transitions, and source-slide holds follow the same 1/1.15 timeline. Optional WebVTT cue times use the same ratio, rounded to milliseconds. Scripts, source text, illustrations, and posters are unchanged.

The change is baked into the MP4s; playback remains at 1.0× in the app. Updated asset URLs prevent the previous video or subtitle files being reused from browser cache.

| Video | Previous duration | Updated duration |
| --- | ---: | ---: |
| [A more supportive inner voice](../media/a-more-supportive-inner-voice.mp4) | 1:38 | 1:26 |
| [Avoidance and getting support](../media/avoidance-and-getting-support.mp4) | 1:53 | 1:38 |
| [Building a gentle wind down](../media/building-a-gentle-wind-down.mp4) | 1:39 | 1:26 |
| [Facts predictions and uncertainty](../media/facts-predictions-and-uncertainty.mp4) | 1:33 | 1:21 |
| [Making room for uncertainty](../media/making-room-for-uncertainty.mp4) | 1:42 | 1:29 |
| [Making sense of physical sensations](../media/making-sense-of-physical-sensations.mp4) | 1:46 | 1:33 |
| [Noticing your stress signals](../media/noticing-your-stress-signals.mp4) | 1:38 | 1:26 |
| [Planning or a worry loop](../media/planning-or-a-worry-loop.mp4) | 1:42 | 1:29 |
| [Protecting a little space](../media/protecting-a-little-space.mp4) | 1:41 | 1:28 |
| [Recovering from a setback](../media/recovering-from-a-setback.mp4) | 1:35 | 1:22 |
| [Rest and connection belong in the plan](../media/rest-and-connection-belong-in-the-plan.mp4) | 1:40 | 1:27 |
| [Rest without chasing perfect sleep](../media/rest-without-chasing-perfect-sleep.mp4) | 1:41 | 1:28 |
| [Start smaller than you think](../media/start-smaller-than-you-think.mp4) | 1:36 | 1:23 |
| [Understanding anxiety alarm response](../media/understanding-anxiety-alarm-response.mp4) | 1:42 | 1:29 |
| [When thoughts follow you to bed](../media/when-thoughts-follow-you-to-bed.mp4) | 1:40 | 1:27 |

Source revision: `f43d0bb148157051dc83698868b69dddfd0c4d52`.

Reproduction: `python scripts/retime-education-videos.py --source-ref f43d0bb148157051dc83698868b69dddfd0c4d52 --work-dir /tmp/steadiermind-retime`. Keep this explicit source revision to avoid compounding the speed change. The script produces exports, captions, and a timing manifest; app duration labels and the twelve-video catalog must also match the resulting durations. Verification: `python tests/education_retiming_smoke.py` and `python tests/education_smoke.py`.
