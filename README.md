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

## Usage Guide

1. Use the left sidebar to rename teams, edit shirt numbers and player labels, add players, and apply formations.
2. Drag markers and the ball on the central pitch.
3. Pick a tool from the floating toolbar:
   - Select
   - Pass arrow
   - Run / curved dashed arrow
   - Highlight zone
   - Text
   - Eraser placeholder
4. Use the right sidebar to change pitch styling, selected player colors/opacity, selected drawing styles, and exports.
5. Use the bottom timeline to capture scenes, duplicate scenes, delete scenes, and restore captured tactical states.

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
4. CSV/JSON squad import, reusable team presets, uploaded photos/badges, advanced layer grouping, and collaborative template libraries.
