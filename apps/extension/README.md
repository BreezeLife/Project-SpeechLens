# SpeechLens MV3 prototype

This directory contains the Phase 2 browser boundary. The service worker opens the side panel and creates an Offscreen Document; the Offscreen Document owns tab audio, local level analysis, and a replaceable `MockSttAdapter`.

The files are intentionally independent from the Phase 1 Vite UI. Build them with the extension bundler, then load the generated directory as an unpacked Chrome extension. The bundled STT implementation is deliberately offline and deterministic; a future provider can implement the same message contract without changing the session or scoring layers.
