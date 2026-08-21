# Guardian guide audio

Layout: `public/audio/guardian/{gender}/{locale}/`

- `gender`: `female` (Iris) | `male` (Argos)
- `locale`: `en` | `fr`
- Steps 1–4: before quiz → after quiz → daily log → decision log

Captions (`.srt`) are optional for now; wire later.

Filenames must match `src/features/guardian/guardianAudio.ts`.

**Production (Lovable):** static deploy does not serve `.mp3` from `public/`. The app falls back to GitHub raw URLs in production builds. For a dedicated CDN, run `node scripts/upload-guardian-audio.mjs` and set `VITE_GUARDIAN_AUDIO_BASE_URL` to the Supabase public bucket URL.
