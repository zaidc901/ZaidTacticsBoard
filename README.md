# Tactical Studio

Tactical Studio is a polished React + TypeScript web application for creating, presenting, saving, and exporting football tactical-board analysis. It is designed around vertical 9:16 content while also supporting landscape, square, and custom board workflows.

## Highlights

- **Interactive tactical canvas** powered by React Konva.
- **Professional portrait pitch** with goals, penalty areas, six-yard boxes, centre circle, halfway line, penalty spots, corner geometry, grass bands, configurable colors, line thickness, and tactical grids.
- **Two editable teams** with squad lists, shirt numbers, player names, colors, starters/substitutes, and formation presets.
- **Drag-and-drop players and ball** directly on the board.
- **Drawing tools** for passes, runs, dashed arrows, zones, text notes, and tactical storytelling.
- **Scene timeline** for capturing tactical states, duplicating scenes, replay planning, and future keyframe animation.
- **Project persistence** through Zustand localStorage autosave.
- **Canvas-only exports** for PNG, JSON project files, and a WebM MediaRecorder export architecture.
- **Light-first studio home** with the tactics board as the main workspace and three WIP projects below it. The home page, board, and video editor share a light/dark switch; the choice is saved with the board for the current tab session.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Konva / React Konva
- Framer Motion
- Lucide React
- LocalStorage persistence
- Browser MediaRecorder for video export

## Project Structure

```txt
src/
  components/
    PitchCanvas.tsx   # Konva pitch, players, ball, drawings, canvas interaction
    Sidebar.tsx       # Team, squad, formation, styling, layer/export panels
    Timeline.tsx      # Scene capture and scene controls
    Toolbar.tsx       # Selection and drawing tool controls
  data/
    formations.ts     # Formation preset coordinates
  store/
    tacticsStore.ts   # Zustand project state and actions
  types/
    domain.ts         # TypeScript domain model
  utils/
    exporters.ts      # Image, JSON, and MediaRecorder export helpers
  App.tsx             # Workspace shell
  main.tsx            # React entry
  styles.css          # Tailwind and global styles
```

## Setup

```bash
npm install
npm run dev
```

Open the printed Vite URL in your browser.

## Build

```bash
npm run build
```

## Stretford Gauntlet

The home screen links to the standalone game in `public/stretfordgauntlet/`. Vite copies that folder into `dist/stretfordgauntlet/`, so GitHub Pages serves it at `https://zaidtacticsboard.com/stretfordgauntlet/`. Both the slash and no-slash URLs resolve to the game. Its own styles and scripts are isolated from the tactics board, and its header links back to the home screen.

## Usage Guide

1. Use the right inspector to edit the pitch, squads, preset teams, selected players, scenes, and exports. You can also switch to a bottom menu or hide it.
2. Drag markers and the ball on the central pitch. Shift-click (or Ctrl/Cmd-click) to select multiple items; group moves preserve their spacing at the pitch boundaries.
3. Pick a tool from the left rail, or the horizontal tools row on mobile:
   - Select
   - Pass arrow
   - Long pass
   - Run / curved dashed arrow
   - Straight dashed line
   - Rectangle or circle area
   - Big or small goals and cones
   - Text
4. Upload a custom badge from the Edit tab, or hide preset flags from Page or Preset teams.
5. Select three or more players and use Style to create an area that follows them or stays fixed.
6. Use Scenes to capture, duplicate, delete, restore, preview, and export tactical states.

Portrait 100% is a close working view, 1.5 times the full-board overview; **Fit** shows the whole portrait board at about 67%. Portrait zoom ranges from 50% to 300%. Landscape keeps its full-board view at 100%, with an 80% to 300% range. Display transforms keep zoom responsive, then the canvas redraws at the displayed resolution after zooming settles, within a bounded memory budget. Undo, redo, selection actions, and zoom stay below the canvas while inspector settings scroll independently.

## Local verification

Run `npm test` for movement constraints, locked objects, group movement, undo/redo, linked areas, scene restoration, and transient-state persistence checks. Run `npm run build` for TypeScript and production-build validation. Before deploying UI changes, also verify dragging, drawing, bench transfers, zoom, export, and responsive layouts in the local preview. The deployment workflow runs the interaction tests before building.

## Video studio

The video preview fits landscape and portrait clips, with independent scroll and zoom. Each clip keeps its own overlays, freezes, trim range, undo history, and playhead while switching clips or returning from the board. Uploaded files remain in memory for the current tab session; reloading the page clears them.

Use Space to play/pause, Left/Right to step frames, Ctrl/Cmd+Z to undo, Shift+Ctrl/Cmd+Z to redo, Delete to remove selected overlays, and Escape to cancel the current tool or export. Text fields keep their usual keyboard behavior.

Video exports include source audio by default, with silence during freeze frames. Uncheck **Include source audio** for a silent export. Recording runs in real time: keep the editor visible until it finishes, or use **Cancel export**. The downloaded container follows the browser's supported recording formats (MP4 or WebM).

## Export Notes

- PNG export downloads the Konva stage only, excluding the editor UI.
- JSON export saves the full project model for re-use or import architecture.
- WebM export records the canvas stream with `MediaRecorder`.
- MP4 and GIF can be added by piping scene playback frames through FFmpeg.wasm; the current code keeps this as a clean browser-export extension point.

## Roadmap

The application is structured for staged delivery:

1. Pitch, player markers, formations, dragging, ball, and drawing tools.
2. Scene capture, duplication, timeline controls, local project saving, and exports.
3. Advanced animation interpolation, curved movement paths, camera crops, drawing reveals, and FFmpeg.wasm MP4/GIF rendering.
4. CSV/JSON squad import, advanced layer grouping, and collaborative template libraries.

## Stats Analysis / Data Hub

Open `#stats` from the home page. This light-first workspace has a shared dark-mode toggle, independently selectable scatter axes, quick views, player pins and spotlight, club/lineup-role/minutes/search filters, per-90 or total values, a sortable table with optional columns, CSV exports, SVG chart exports, and match-level action heatmaps.

**Bring your own key:** each visitor enters their own [PitchAPI key](https://pitchapi.dev/get-api-key) in **Connect your data**. The key and imported data live in the current tab's JavaScript memory only. Navigation within this application preserves that session; reload or **Disconnect** clears it. Keys are never stored in localStorage, sessionStorage, URLs, project files, exports, source code or a shared server secret. Do not configure `PITCHAPI_API_KEY` or any `VITE_*` key. The demo is explicitly fictional. CSV files are processed locally in the browser; column mapping supports totals and per-90 values, with minutes required to normalize comparisons.

Imports cover the chosen season's completed Premier League fixtures, optionally limited to the latest 10 or 30 league matches. Player totals are aggregated across those matches, not presented as a complete season when a limited sample is chosen. There are four requests per match (player stats, advanced stats, lineups, shot records), plus league/match discovery; heatmaps load on demand. Requests are limited to three concurrent matches, cancellable and cached only in memory for that connection. Provider errors preserve the previous dataset.

Missing metrics are never blindly zero-filled. Shooting metrics omitted from player summaries are cross-checked against complete first/second-half shot records; zero attempts establish a genuine zero, while unavailable shot-model values remain missing. A metric is unavailable if any of a player's appearances lacks it. Per-90 counts use the same sample's minutes; pass completion is weighted by attempted passes. Lineup roles are broad categories inferred from formation coordinates or substitute roles, weighted by minutes; they are not a definitive scouting position. Heatmaps show 16 × 12 match-level recorded ball-action density, not tracking positions or distance covered. Metric descriptions reflect PitchAPI definitions, which can differ from other providers.

### Private relay and production setup

PitchAPI currently allows browser CORS requests only from its own website. `server/pitchapi-proxy.mjs` therefore provides a narrow, stateless relay: it accepts a visitor's key in a POST header, forwards it only to `https://api.pitchapi.dev`, disables redirects and caching, permits only the endpoints needed by the hub, and sanitizes upstream errors. The relay never logs or persists the key or payload. The same handler is mounted at `/api/pitchapi` during `npm run dev`.

**GitHub Pages serves the website; Cloudflare Workers runs the API relay.** The production relay is `https://zaid-pitchapi-relay.zaidtacticsboard.workers.dev`. The Pages workflow uses that public address by default; no visitor API key is configured on either host.

1. To update the relay, deploy `server/wrangler.toml` with the project's Cloudflare account (`npx wrangler deploy --config server/wrangler.toml`). A deployment token can be scoped to this Worker only. Do not add a PitchAPI key as a Worker secret.
2. To change the relay address, set the public URL as the GitHub repository variable `VITE_PITCHAPI_PROXY_URL`, overriding the workflow's default. For a manual build, use the same frontend environment variable (see `.env.example`). Rebuild after changing it. For a Worker routed at the site's `/api/pitchapi` path, set the variable explicitly to `/api/pitchapi`.
3. The allowed production origins are `https://zaidtacticsboard.com` and its `www` alias. Local origins are enabled only by the development plugin. Keep production request/trace logging disabled, including at any additional proxy layer.
4. Test a visitor's own key on the deployed site before announcing API availability. A missing relay shows an actionable message; CSV and demo mode continue to work.

Run `npm test` for aggregation, complete-sample missing values, weighted percentages, CSV validation/export, plotting edge cases, provider failures, key lifetime and relay restrictions. `npm run build` checks types and produces the production assets. No real key is needed by the automated tests.

### Personal players and custom datasets

Use **Add my data** in the Data Hub. **Add myself** accepts a player name, team, role, minutes, sample label and any known statistics. Choose totals or per-90 input; percentages remain percentages. Personal players use diamond markers and a **Yours** badge, stay visible while benchmark filters change, and can be edited or removed. Averages, correlation and percentile comparisons exclude personal markers from the benchmark. Heatmaps remain available only for actual PitchAPI players, never for personal profiles.

**Import a dataset** accepts a CSV upload or pasted CSV, detects familiar headers (including Squad, Min, PrgP and PrgC), and lets users map other headings. Units are chosen per statistic, supporting mixed totals and per-90 columns. Review validation and the first three rows before adding up to 50 personal comparison players or replacing the base table with up to 5,000 players. Namespaced import IDs keep separate imports distinct. Unknown figures remain missing; invalid numbers, duplicated mappings and unusable per-90 inputs are rejected. At least two available metrics select usable axes automatically.

Files and profiles stay in tab memory. **Save my players** downloads a totals CSV with sample labels for later re-import. CSV exports identify personal versus benchmark rows; chart exports include a personal-data caption. A personal player can be entered before connecting PitchAPI and remains available when the professional benchmark imports. Reload clears data and credentials; disconnect clears imported and personal session data. Per-90 comparisons adjust for minutes only, not competition strength or incompatible provider definitions.

### Personalization and motion

The palette button on the home page or Data Hub opens live appearance controls: five accents, light/dark mode, soft/crisp panels, comfortable/compact tables, role/accent player colors, marker size, chart height, grid visibility, and smooth/reduced motion. Appearance preferences are stored locally under `ztb.studio.appearance.v1`; named chart views under `ztb.stats.views.v1` store axes, units, benchmark filters, columns and display toggles only. Neither store contains player datasets or API keys. Up to eight named views can be saved, restored or removed. The existing board theme persistence is unchanged.

Home-page entrances and hover states, dialog entrances, percentile bars and scatter-point movement use short CSS transitions. Point movement is disabled above 500 plotted players. Both the personal reduced-motion preference and the operating system's `prefers-reduced-motion` setting suppress transitions. Pitch interaction mechanics are unaffected.
