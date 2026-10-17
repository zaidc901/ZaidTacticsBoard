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
- **Modern original visual identity** with a dark editorial interface, rounded panels, glow accents, and distinctive player labels.

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
