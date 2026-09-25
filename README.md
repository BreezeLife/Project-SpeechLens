# SpeechLens

SpeechLens is a Manifest V3 speech-intelligence prototype. This repository currently implements the PRD Phase 1 surface: a responsive Side Panel-style UI with deterministic-looking mock data, live score movement, transcript navigation, event anchors, claim states, and a session report.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://127.0.0.1:5173`). Start the local scoring API in a second terminal with `npm run scoring:api`; the UI sends finalized transcript windows to `http://127.0.0.1:8787` through the Vite proxy.

## Verify

```bash
npm run typecheck
npm test
npm run build
```

The scoring path is fully local. `services/scoring_engine.py` owns the 30-second windows, smoothing, confidence, stale fallback, score-change events, and secondary content signals. No API key or raw audio is used or persisted.

The Phase 2 MV3 boundary is in `apps/extension`. It includes `tabCapture`, an Offscreen Document, a local audio level meter, and a `MockSttAdapter`. Build it with `npm run build:extension`.

The same scoring contract is available without the TypeScript toolchain:

```bash
python3 -m unittest discover -s services -v
python3 services/demo.py
```

`services/scoring_engine.py` is standard-library Python and exposes `LocalRulesProvider`, `ScorePipeline`, snapshots, confidence, stale fallback, secondary signals, and score-change events. `services/server.py` exposes these through `GET /health` and `POST /api/score`.
