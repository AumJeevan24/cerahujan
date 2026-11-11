# Cerahujan — project brief for Claude

You are helping build **Cerahujan** ("cerah" + "hujan", sunshine + rain): a free, phone-first, 3D web app showing everyday weather, heat, storms and haze for Malaysia, with a flying hornbill avatar. Read this whole file before writing code. When something here conflicts with what you find in installed library types or official docs, trust the types/docs and tell me.

## How to work with me
- I'm building this as a non-commercial public project. Explain decisions briefly in plain English.
- Work in small, testable steps. After each step: run typecheck + tests, and tell me how to see the result.
- Ask before adding any paid service, any dependency that needs an account/API key, or anything that collects user data.
- Never put API keys in client code or commit them. Secrets go in the single local `.env` file (see "Environment variables") and Cloudflare Pages environment variables (production).
- Keep everything RM0 to run (see "Cost rules").
- **I don't read code.** Report results in plain English: what changed, what to click, what I should see. Keep code explanations out of chat unless I ask.
- **I test on desktop for now** (`npm run dev` locally; PR preview links once Cloudflare is set up at v0.1.0). Still build phone-first and budget-Android-friendly.
- **You open PRs, I click Merge.** You can't merge or create public things yourself (my Claude Code safety settings block it). When a PR is ready and CI is green, give me the PR link and a 2–3 line "what to check" note.
- **No Claude attribution anywhere.** Commits, PRs, releases and issues must read as if I wrote them: no `Co-Authored-By: Claude` trailer, no "Generated with Claude Code" line. This overrides any default attribution setting.

## Decisions (agreed 2026-11-11)
- **Town list**: use MET Malaysia's own forecast locations (data.gov.my), so every searchable town has an official forecast.
- **Location outside Malaysia**: don't land. Show "You seem to be outside Malaysia" / "Anda nampaknya berada di luar Malaysia" and open the town search.
- **Hornbill name**: **Kenyalang**, e.g. "Kenyalang terbang ke Ipoh…" / "Kenyalang is flying to Ipoh…".
- **Time format**: 24-hour (`16:00`) in both languages, Malaysia time (`Asia/Kuala_Lumpur`).
- **Activity planner**: jog, cycle, hike, beach only for Phase 1.
- **Privacy contact**: link to the repo's GitHub Issues page; no personal email anywhere.
- **Look**: before UI work, publish a small preview page with 2–3 colour/font options; I pick one. Mockup colours are placeholders.
- **Hosting**: set up Cloudflare (free account, Pages project, GitHub secrets) at v0.1.0, with step-by-step instructions for me. I have no accounts or keys yet; walk me through each signup when first needed (Cloudflare at v0.1.0, NASA FIRMS at v0.5.0, WAQI optional).

## You own the whole lifecycle
You run this project end to end: repository setup, branches, commits, pull requests, CI, releases and deployment. Work like a careful professional engineer on a public open-source project. See "Git, PRs and releases" below — follow it exactly.

## Product summary
- **One open page, no login, no accounts, no database.**
- Bilingual: Bahasa Malaysia (default if browser language starts with `ms`) and English, toggle in header.
- Phone-first (budget Android must work), also good on desktop.
- 3D only — no 2D fallback mode. Instead provide a **"lite 3D"** mode for weak devices, and a clear message if WebGL2 is unavailable.
- Everything labelled as estimates, with links to official sources (MET Malaysia, DOE/APIMS, JPS).

## Phase 1 scope (build this now)
1. **3D map of Malaysia** (incl. Sumatra and Borneo, since haze comes from there): terrain + 3D OSM buildings.
2. **Hornbill avatar (3D)** that flies between places, camera follows, zooms out mid-flight and swoops in on landing — **autopilot controls** only (see "Bird controls").
3. **Location**: "Show weather at my location" button (ask after a tap, not on page load). If allowed, the hornbill swoops down and lands at the user's position. If denied, or the position is outside Malaysia, user picks a town from a search list (MET forecast locations). Remember the choice in `localStorage`.
4. **Today's weather**: MET official daily forecast + hourly detail (temp, rain chance, wind, conditions).
5. **Heat & UV**: "feels like" temperature, UV index, heat level.
6. **Storm risk**: e.g. "Thunderstorm likely around 4pm".
7. **Boleh jemur kain?**: laundry-drying score (0–100%) + best time window today.
8. **Activity planner**: best time today to jog, cycle, hike, go to the beach.
9. **Haze tracker**: fire hotspots, wind arrows, PM2.5 haze overlay, station readings, and **"When will haze reach me?"** estimate.
10. **Time slider**: −24h to +48h for haze/wind layers.
11. **Credits & privacy page** (BM + EN).

### Not in Phase 1 (later phases — don't build yet)
Floods (JPS river levels, Copernicus GFM flood maps, estimated depth), Google Photorealistic 3D Tiles, history replays (2015/2019 haze), push notifications, earthquakes, sea conditions, landslide risk, user accounts.

## Tech stack
- **Vite + React + TypeScript**, **Tailwind CSS v4** (`@tailwindcss/vite`).
- **MapLibre GL JS** for the 3D map (terrain, buildings, data layers).
- **three.js** as a MapLibre **custom layer** for the hornbill.
- **vite-plugin-pwa** (Add to Home Screen; manifest with 192/512 PNG icons).
- **Vitest** for unit tests of all scoring/trajectory logic.
- **Cloudflare Pages** hosting + **Pages Functions** (`/functions/api/*`) as the small backend/cache. Use `wrangler pages dev` for local full-stack testing.

### Repo layout — keep it simple
The owner wants a **flat, simple layout with as few folders as possible**. Don't add new folders without asking. Only these exist:
```
.github/                   # required by GitHub (CI, PR/issue templates) — owner doesn't need to touch it
functions/api/             # required by Cloudflare Pages Functions routing: grid.ts, fires.ts, met.ts
public/                    # static files (icons) — required by Vite
src/                       # ALL app code, flat — no subfolders
  main.tsx, App.tsx, index.css
  scores.ts, trajectory.ts, geo.ts, wmo.ts, towns.ts, i18n.ts, api.ts   # pure logic
  MapView.tsx, hornbill.ts, hazeLayer.ts, windLayer.ts, fireLayer.ts    # 3D map
  Sheet.tsx, Cards.tsx, TownSearch.tsx, TimeSlider.tsx, Credits.tsx    # UI
  scores.test.ts, trajectory.test.ts, ...   # tests sit next to the file they test
```
- `functions/api/grid.ts`: wind (925 hPa) + PM2.5 grid for region, cached. `fires.ts`: NASA FIRMS hotspots → GeoJSON, cached (uses secret `FIRMS_MAP_KEY`). `met.ts`: MET forecast + warnings via data.gov.my, cached.
- Prefer fewer, well-named files over many tiny ones. Config files (package.json, vite.config.ts, tsconfig.json, wrangler.toml) live in the root.

Keep data fetching behind small functions in `src/api.ts` so sources can be swapped later. In `vite dev` (no Pages Functions), fall back to calling Open-Meteo directly from the browser so the UI still works.

## Map details
- Base style: OpenFreeMap (free, no key), e.g. `https://tiles.openfreemap.org/styles/liberty`. Use its building data for `fill-extrusion` 3D buildings if the style doesn't already include them.
- Terrain: free AWS Terrain Tiles, `raster-dem` source, `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`, `encoding: "terrarium"`. Exaggeration ~1.3 (lower in lite mode).
- Default camera: pitched (~55–60°), centred on Malaysia; region of interest roughly lon 94–120, lat −6–8.
- Check the installed MapLibre version's types for the custom layer API. In recent versions the render callback receives `args.defaultProjectionData.mainMatrix`; use `MercatorCoordinate.fromLngLat(lngLat, altitudeMeters)` and `map.queryTerrainElevation(lngLat)` to place the bird above terrain.

## Hornbill avatar
- Phase 1: a **procedural low-poly hornbill built from three.js primitives** (no external model needed): black body, white belly and tail band, big orange/yellow beak with red-orange casque, wings that flap via code. Friendly, original design (not based on any existing mascot or brand).
- Later: replace with a proper GLB model (Blender or a commissioned artist) with flap/glide/land animations. Keep the model behind an interface so the swap is easy.
- Flight: animate along a path between two points, altitude arcs up mid-flight; camera follows behind with matching bearing, zooms out mid-flight and back in on landing. Run the camera in a `requestAnimationFrame` loop, not inside the layer's render.
- Size stays readable at any zoom (scale with metres-per-pixel).
- **Moods** (accessories as simple 3D shapes), priority order: haze (PM2.5 high) → face mask; rain now/likely → umbrella; heat (feels like ≥ 38°C) → sunglasses; good drying day → tiny laundry line.
- Toggle to hide the avatar; respect `prefers-reduced-motion` (no long flights, just reposition).

## Bird controls
Two modes. Nobody should ever *have* to steer to get the weather.

### Autopilot (default — Phase 1)
- **Phone**: search a town or tap "Lokasi saya" → bird flies there and lands. Long-press anywhere on the map → confirm chip "Terbang ke sini?" / "Fly here?" → flies there. Tap during a flight → skip to landing.
- **Desktop**: search or click a spot on the map → flies there. Click during a flight → skip to landing.
- **Camera** (around the bird): phone — one-finger drag orbits, pinch zooms, two-finger drag tilts; desktop — drag orbits, scroll zooms, right-drag (or Ctrl+drag) tilts. Clamp pitch (≈ 20°–75°) and distance so the bird stays in view.
- **Home** button flies back to the user's location (or saved town).
- The weather panel always shows conditions where the bird is (debounced: only refetch after it lands or stops for ~1s).

### Free-fly (Phase 2 — behind a ✈ button)
- **Phone**: virtual joystick bottom-left (steer/turn), climb and dive buttons on the right, hold-to-boost button. Optional **tilt-to-steer** via `DeviceOrientationEvent` — off by default; on iOS request permission only after the user taps to enable it.
- **Desktop**: WASD / arrow keys steer, Space = climb, C = descend, Shift = boost, Esc = exit free-fly. Show a small key-hint overlay the first time. Listen for keys **only while the map canvas has focus** (never global listeners), so typing in search is unaffected.
- Stop input for ~3s → bird glides down and lands; the panel updates to the landing spot.
- Keep the bird within the region of interest (lon 94–120, lat −6–8) and a safe altitude band above terrain (`queryTerrainElevation`).

### Accessibility and performance
- Every feature must be reachable without free-fly; all controls are real buttons with BM/EN `aria-label`s and ≥ 44px targets; keyboard users can operate autopilot via search + buttons.
- `prefers-reduced-motion` → no flight animation, the bird jumps to the destination and the camera cuts.
- Lite mode → shorter flights, lower frame budget, no tilt-to-steer.

## Data sources (all free; respect terms)
| Data | Source | Notes |
|---|---|---|
| Hourly weather, UV, CAPE, apparent temp | Open-Meteo Forecast API (no key) | Free for **non-commercial** use, < 10,000 calls/day; CC-BY 4.0 attribution required |
| PM2.5 / AQI forecast grid | Open-Meteo Air Quality API (CAMS) | Same terms; ~45 km global model over SE Asia; credit CAMS + Open-Meteo |
| Wind grid for haze | Open-Meteo Forecast, `wind_speed_925hPa`, `wind_direction_925hPa`, `past_days=1` | Fetch region grid (~2° spacing) in Pages Function, cache ~1h |
| Fire hotspots | NASA FIRMS area API (VIIRS NRT), free MAP_KEY | Key is a **secret** → only in Pages Function; credit NASA FIRMS |
| Official forecast & warnings | MET Malaysia via `api.data.gov.my/weather/forecast` and `/weather/warning` (no key) | Gov open data terms, attribution "MET Malaysia via data.gov.my"; some fields BM only → translate for EN |
| Air quality stations | WAQI API (relays DOE data), free token | **Never cache/archive this data; not for paid apps**; attribute WAQI + DOE Malaysia; notify WAQI before public launch. Values are US-AQI scale, **not** Malaysia's official API — label clearly and link to APIMS |

Caching: Pages Functions use the Cache API with TTLs (wind 1h, PM2.5 3h, fires 1h, MET 1h). WAQI is fetched live in the browser only.

## Feature logic (implement in `src/lib`, unit-test all of it)
- **Heat level** from max apparent temperature today: < 32 normal; 32–40 "hot, drink water"; 41–53 "very hot"; ≥ 54 "danger". Do not use official MET alert words (Waspada/Amaran/Bahaya) for our own labels.
- **UV**: 0–2 low, 3–5 moderate, 6–7 high, 8–10 very high, 11+ extreme.
- **Storm risk** (next 24h): hours with WMO code 95–99, or CAPE > 1500 J/kg and rain probability ≥ 50% → "Thunderstorm likely around <time>".
- **Jemur kain score** (9am–5pm): per hour combine (1 − rain probability), sunshine/low cloud, lower humidity, light wind; output daily % + best 3-hour window. ≥ 70 "Yes, dry it!", 40–69 "Morning/window only", < 40 "Not today".
- **Activity planner**: score each remaining daytime hour (6am–7pm) per activity — jog/cycle penalise heat, UV, PM2.5, rain; hike penalises rain/storm most; beach penalises rain, storm and extreme UV. Return best 2-hour window + short reason.
- **Haze arrival**: cluster fires on a ~0.5° grid (≥ 3 hotspots), forward-trace each cluster through the wind grid hourly for up to 48h; if a path passes within ~40 km of the user's town, report the earliest ETA and approximate source region (Sumatra / Kalimantan / Peninsular / Sarawak-Sabah). Otherwise "No smoke heading your way in the next 48h". Always label as an estimate.
- Weather codes: map WMO codes to BM/EN text + icons.

## UI
- Layout F (see "Chosen layout"): desktop = left sidebar + 3D cockpit view; phone = 3D cockpit view + swipe-up bottom sheet.
- Layer chips: Fires, Wind, Haze, Stations. Language toggle and location button always reachable.
- Cards: Weather now/today, Heat & UV, Storm risk, Boleh jemur kain?, Activity planner, Haze (worst nearby reading, hotspot count, arrival estimate, API-vs-AQI explainer).
- Tap targets ≥ 44px, text ≥ 14px, no hover-only info. Show "last updated" times on data.

## Performance (budget phones)
- Detect weak devices (e.g. `navigator.deviceMemory <= 4` or `hardwareConcurrency <= 4`) → lite 3D: lower `pixelRatio`, lower terrain exaggeration, fewer buildings/arrows, simpler bird.
- First useful info (weather card) within ~2s; load 3D layers after. Pause continuous rendering when idle.

## Privacy & legal
- No login, no cookies for tracking. Analytics: **Cloudflare Web Analytics** (cookieless) via env token `VITE_CF_BEACON_TOKEN` (optional).
- Location stays on the device; send only rounded coordinates (~0.05°) or nearest town to APIs; never log or store locations server-side.
- Privacy notice in BM and EN (PDPA expects both languages): what's collected (cookieless analytics only), location use, third-party data sources.
- Credits page listing every source with required attribution.
- Not an official warning service — say so, and link to MET, DOE/APIMS, JPS/InfoBanjir, NADMA.

## Cost rules (must stay RM0)
- Cloudflare Pages free plan; app address `cerahujan.pages.dev`.
- No Google Maps Platform, no paid APIs, no credit-card-required services.
- Stay non-commercial (no ads, no paid features) — free data terms depend on it.

## Environment variables — one `.env` file
The owner wants **a single local `.env` file** (git-ignored) holding every local value. Don't create `.dev.vars` or `.env.local`.
- `FIRMS_MAP_KEY` — server only (Pages Functions). **No `VITE_` prefix**, so Vite never puts it in the browser bundle. `wrangler pages dev` must read it from `.env` (verify the installed wrangler supports `.env` for local dev; if it doesn't, tell the owner and propose the simplest fix).
- `VITE_WAQI_TOKEN` (optional), `VITE_CF_BEACON_TOKEN` (optional) — public client values; the `VITE_` prefix means they ship to the browser, so never put a real secret behind `VITE_`.
- Provide `.env.example` with placeholder values only, and comments saying where to get each value.
- Production values are **not** in a file: `FIRMS_MAP_KEY` goes in Cloudflare Pages environment variables; `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` go in GitHub Actions secrets.
- The owner fills `.env` in their editor — never ask them to paste key values into chat, and never print `.env` contents.

## Commands (set these up)
- `npm run dev` — Vite dev server (UI + direct Open-Meteo fallback)
- `npm run preview` — `wrangler pages dev dist` (full stack incl. functions)
- `npm test` — Vitest
- `npm run typecheck`
- `npm run deploy` — build + `wrangler pages deploy dist --project-name cerahujan`

## Git, PRs and releases

### One-time setup (do this first, before any feature work)
1. Check tools: `git`, `node`, `gh` (GitHub CLI). If `gh` isn't logged in, ask me to run `gh auth login` myself — never ask for, type or store tokens/passwords.
2. Create the **public** GitHub repo `cerahujan` with `gh repo create`, description: "Weather, heat, storms and haze for Malaysia on a 3D map. Free, bilingual (BM/EN)."
3. Initial commit on `main` containing only: `README.md` (what it is, screenshot placeholder, how to run, data credits), `LICENSE` (MIT for code; note that data belongs to its providers), `CLAUDE.md`, `.gitignore`, `.editorconfig`, `CHANGELOG.md` (Keep a Changelog format, with an `Unreleased` section).
4. Add `.github/`: `pull_request_template.md`, issue templates (bug, feature), `CODEOWNERS` (me), and a CI workflow (`.github/workflows/ci.yml`) running install → typecheck → test → build on every PR and push to `main`.
5. Protect `main` (via `gh api`): require PRs, require CI to pass, no force pushes, linear history.
6. Create GitHub labels: `feat`, `fix`, `docs`, `chore`, `refactor`, `perf`, `test`, `ci`, `release`.

### Branches
- `main` is always releasable. **Never commit directly to `main`** after the initial commit.
- One branch per piece of work, named `<type>/<short-kebab-description>`, e.g. `feat/3d-terrain-map`, `feat/hornbill-flight`, `fix/uv-index-rounding`, `docs/privacy-notice`.
- Keep branches short-lived and focused on one feature or fix. Rebase on `main` before opening/merging a PR.

### Commits — professional, never spammy
- Follow **Conventional Commits**: `type(scope): imperative summary` (≤ 72 chars), e.g. `feat(map): add terrain and 3D buildings`, `fix(scores): clamp humidity factor to 0–1`.
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Each commit is **one coherent, working change** (builds and passes tests). Add a body explaining *why* when it isn't obvious.
- **No** "wip", "fix typo again", "update", "asdf", or dozens of tiny commits. Before pushing, tidy local history (`git rebase -i` is not available to you — instead commit thoughtfully, and use `git commit --amend` / `git reset --soft` to combine local, unpushed commits).
- Never rewrite history that has been pushed to a shared branch; never force-push `main`.
- Never commit secrets, `.env` (only `.env.example`), build output or `node_modules`.

### Pull requests
- Open with `gh pr create` once the branch is complete and CI passes locally. I merge it myself (see "How to work with me"). If `main` moved meanwhile, rebase the branch and push (force-with-lease is fine on your own unmerged branch).
- Title = Conventional Commit style (it becomes the squash-merge commit).
- Body uses the template: **Summary** (what & why), **Changes** (bullets), **Screenshots/GIF** for UI changes (phone + desktop), **How to test**, **Checklist** (typecheck, tests, build, BM/EN text, a11y, no secrets, credits updated if data source added), **Related issues**.
- Apply the matching label. Link an issue if one exists (create issues for planned features so PRs can close them).
- Merge with **squash merge** only after CI is green, then delete the branch.
- Keep PRs reviewable: aim for < 400 changed lines excluding lockfiles; split large features into stacked, sequential PRs.

### Releases — every ready milestone is an official release
- **Semantic Versioning**. `0.x.y` during Phase 1 development; **`v1.0.0`** when Phase 1's definition of done is met.
  - `MINOR` bump for new features, `PATCH` for fixes, `MAJOR` for breaking changes after 1.0.
- Release process (on a `release/vX.Y.Z` branch → PR → squash merge):
  1. Bump `version` in `package.json`.
  2. Move `Unreleased` entries in `CHANGELOG.md` under `## [X.Y.Z] - YYYY-MM-DD` (Added / Changed / Fixed / Removed).
  3. After merge: create an **annotated tag** `vX.Y.Z` on `main` and a **GitHub Release** with `gh release create vX.Y.Z --title "vX.Y.Z — <short name>" --notes-file <notes>`: highlights in plain language, screenshots, full changelog section, and data credits.
- Suggested milestones: `v0.1.0` 3D map + town search; `v0.2.0` hornbill flight + location landing; `v0.3.0` weather, heat/UV, storm cards; `v0.4.0` jemur kain + activity planner; `v0.5.0` haze tracker + arrival estimate; `v1.0.0` polish, PWA, credits/privacy, lite mode, launch.

### Deployment
- Production deploys to Cloudflare Pages **only from published releases** (GitHub Action on `release: published` running `wrangler pages deploy`).
- Each PR gets a **preview deployment** (GitHub Action deploying to a preview branch alias) and the preview URL is posted on the PR.
- The Cloudflare API token and account ID live in **GitHub Actions secrets** (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) and `FIRMS_MAP_KEY` in Cloudflare Pages environment variables. I add these myself — tell me exactly where and with which permissions; never ask me to paste them into chat.

## Chosen layout: F — sidebar + flight cockpit
Decided. Reference mockups ("F · Phone" and "F · Desktop"): https://claude.ai/artifact/VepSrbGMV71guAPG6mDYbs — follow their structure; colours and fonts there are placeholders, not final branding.

- **Desktop (≥ 768px)**: two parts side by side.
  - **Left sidebar** (~340–420px, scrolls independently): app name + BM|EN toggle; town search ("Terbang ke bandar" / "Fly to a town"); weather hero (big temperature, town, condition, feels-like); 2×2 card grid — UV, storm risk, jemur kain, haze; "Best time today" activity planner list.
  - **Right: 3D cockpit view** filling the rest: chase camera behind the hornbill over terrain. Minimal HUD only: top-left "Terbang ke · <town> · <distance>" chip (shown during flights), top-right layer chips (Api/Fires, Angin/Wind, Jerebu/Haze) + "Lokasi saya" button, bottom time slider (−24h to +48h).
- **Phone (< 768px)**: the 3D cockpit view fills the screen; the sidebar becomes a **swipe-up bottom sheet** with the same content. Collapsed state (~320px) shows the weather hero + the 2×2 cards; expanded shows the activity planner and time slider. HUD on top: "Terbang ke" chip + location button, then layer chips (with BM|EN) below it.
- Detailed numbers live in the sidebar/sheet, **not** floating over the 3D scene — keep the HUD minimal so it stays readable on budget phones.
- The sidebar/sheet always reflects where the bird is (see "Bird controls").

## Definition of done for Phase 1
- Typecheck and tests pass; production build succeeds.
- Works on a mid/low-end Android phone and desktop Chrome/Safari.
- Location → hornbill lands at user; town search fallback works.
- All cards show real data with "last updated"; haze layers + time slider work.
- Credits + privacy pages complete in BM and EN.
- Deployed to `cerahujan.pages.dev` with secrets set in Cloudflare (not in the repo).

## Roadmap after Phase 1
2. Polish 3D (GLB hornbill with real animations), **free-fly controls** (see "Bird controls"), optional Google photoreal city view with spending cap.
3. History replays (archived fire/PM2.5/wind data in Cloudflare R2).
4. Floods: JPS river levels, MET warnings, Copernicus GFM flood extents, estimated depth (partner with hydrology experts before showing depth publicly).
5. Notifications (web push; needs a small D1 database for anonymous device tokens + town).
