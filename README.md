# Reelhouse

A web app that looks like a **cutaway cartoon office building**. Each room has a little AI worker who does one real step of making a **short vertical animated story video** (1080×1920, 30 fps) for TikTok, Reels and Shorts, in a **2.5D look**: 2D cartoon characters in scenes with depth, lighting and moving cameras.

Click any room to see what its worker is doing. Make videos by hand, or switch on **autopilot** and the studio makes stories by itself every day from a short channel brief.

Everything runs **free on your own computer**: stories by Ollama, voices by Piper, music composed in code. Claude is an optional upgrade for better stories.

**New here? Read [SETUP.md](SETUP.md).** It's written for non-technical people.

## The rooms

A story moves through the building in this order.

| Room | Worker | What it does |
| --- | --- | --- |
| **Trend Lookout** (rooftop) | Juno | Reads the week's top posts from r/aivideo, r/animation, r/WritingPrompts and r/shortstories plus Google Trends (no accounts or keys), and the AI groups them into story themes with a "why it's trending" note. Checks at most every 12 hours; keeps the last report when offline. |
| **Producer's Office** | Bea | The boss. Autopilot switch, channel brief, stories per day, story style (Twist Tale, Hook or Cozy), look (2.5D or Flat 2D), story writer, a Studio setup checklist and the activity log. Picks the strongest waiting pitch. |
| **Research Desk** | Pip | Turns a theme plus trends into 3 to 5 pitches (title, logline, genre, twist) on the idea board. Skips titles already used. Each pitch has a Produce button. |
| **Script Room** | Quill | Writes the story as checked JSON: up to 3 characters (name, color, accessory) and beats with setting, time of day, narration, who's on screen with mood and action, and an optional spoken line. |
| **QA Lab** | Vera | Rule checks always (beat count, lengths, valid characters, no real brands or people), then an AI edit pass. Verdict: approved, fixed or rejected. |
| **Sound Booth** | Echo | Records the narrator and each character with Piper (a different voice per character), then picks a mood and composes the music. Music gets quieter whenever someone speaks. |
| **Art Studio** | Dot | Stages each scene: length from the recorded audio, camera move (push, pan, close-up, still), who stands where, and the depth layers. |
| **Edit Bay** | Splice | Animates everything with Remotion and renders the MP4, with a live progress bar. |
| **Shipping Dock** | Hatch | Saves `output/<date>_<id>_<title>/` with `video.mp4`, `caption.txt` and `story.json`, offers a download, and can optionally post to TikTok ([TIKTOK.md](TIKTOK.md)) and upload YouTube Shorts ([YOUTUBE.md](YOUTUBE.md)). |

Stories go through one at a time: script, QA, voice, art, edit, ship. A failed story is retried once, then marked **Skipped**.

## Story styles

- **Twist Tale** (default): about 60 seconds, 18 to 24 fast beats. A hero does something that looks foolish, everyone laughs, the sensible choice fails, and a real, checkable trick or fact explains why the hero was right. One-word captions, close-ups of gears, levers and jars when explaining, sound effects on the payoff, and no outro so it loops. Ideas come from Wikipedia's "Did you know", r/todayilearned, r/explainlikeimfive and r/AskHistorians. The story is original; only the trick is real, and Vera rejects any story whose fact she isn't sure of.
- **Hook**: 60 to 90 seconds, 12 to 18 quick beats, told in first person by an overlooked underdog. The first line states the world's rule; the big day; a reveal far beyond everyone; shocked reactions; a cliffhanger and a **Part 2?** card. Big Anton captions a few words at a time with one key word in yellow. Epic music.
- **Cozy**: 30 to 45 seconds, 5 to 8 beats, narrator box, speech bubbles, a title card and **The End**.

## The 2.5D look

All drawn in code (SVG and React), no image AI or 3D models, so it renders on a normal processor:

- **Depth layers**: far background, characters, close foreground, moving at different speeds when the camera moves (parallax).
- **Camera**: push-ins, pans and close-ups with a slight 3D tilt and a soft haze on far layers.
- **Lighting**: color grade for day, sunset or night, light rays, floating dust and a vignette.
- **Characters**: rounded shading, rim light and soft ground shadows. 8 colors, 6 accessories, 7 expressions, 5 actions.
- 10 backgrounds (forest, city, bedroom, space, beach, castle, cafe, classroom, palace, arena), each in day, sunset or night.

**Flat 2D** is a switch in the Producer's Office (and renders faster).

## Music

Echo composes an original tune per story in one of six moods (playful, tender, mystery, adventure, dreamy, epic) with chords, bass, melody and light drums. Or drop your own MP3s in `music/` or `music/<mood>/`. `REELHOUSE_MUSIC=0` turns music off.

## For developers

| Part | Tool |
| --- | --- |
| Web app | Next.js 16 (App Router), React 19, TypeScript |
| Database | SQLite via better-sqlite3 (`data/reelhouse.db`) |
| Story writer | Ollama (`qwen2.5:7b`, JSON `format` + one correction retry), Claude structured outputs (optional), demo templates as fallback. All answers checked with Zod. |
| Voices | Piper TTS in `.venv`, voices in `voices/` |
| Music | Composed to WAV in TypeScript (`src/lib/audio/compose.ts`) |
| Video | Remotion 4 (`src/remotion`), fonts Anton and Fredoka bundled from Fontsource |
| Scheduler | Starts with the server from `src/instrumentation.ts` |
| Password | HTTP Basic auth in `src/proxy.ts` when `REELHOUSE_PASSWORD` is set |

```bash
npm install
npm run setup:voice     # Piper + voices (needs Python 3)
npm run setup:ollama    # ollama pull qwen2.5:7b
npm run dev             # http://localhost:3000
npm run typecheck
npm run render:sample   # renders a demo story without the app: npm run render:sample -- cozy flat
npm run studio          # Remotion Studio to preview the video component
```

Settings live in `.env.local`; see `.env.example` for every option.

Layout: `src/lib/agents/` has one file per room's job, `src/lib/writers/` the three story writers, `src/lib/pipeline.ts` the production line and autopilot, `src/components/` the building and room panels, `src/remotion/` the video.

**Licenses:** Remotion is free for individuals and companies of up to three people; larger companies need a [Remotion license](https://www.remotion.dev/license). Everything else used here is open source.

## Not built yet

- Posting to Instagram Reels (TikTok and YouTube Shorts are supported, see [TIKTOK.md](TIKTOK.md) and [YOUTUBE.md](YOUTUBE.md)).
