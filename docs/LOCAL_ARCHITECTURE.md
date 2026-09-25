# Local Architecture

SpeechLens runs without a hosted model provider or provider credentials.

```text
Chrome tab audio
  -> MV3 Offscreen Document
  -> offline STT fixture (replaceable message contract)
  -> finalized transcript segments
  -> Python local scoring API
  -> 30-second windows and smoothing
  -> six scores, secondary signals, confidence, events
  -> Side Panel / Vite UI
```

The scoring service is `services/server.py` and listens on `127.0.0.1:8787`. It keeps session state in memory, rejects invalid or out-of-order segments, and caps retained sessions. `POST /api/score` is the only UI scoring dependency. The service never writes raw audio.

The browser extension uses `tabCapture` and an Offscreen Document to own the captured stream. The current STT adapter is intentionally offline and deterministic so the full data path works without credentials. A future STT implementation can emit the same `stt/interim`, `stt/final`, and `session/status` messages.
