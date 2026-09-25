"""Loopback-only HTTP API for local SpeechLens transcript scoring."""
from __future__ import annotations

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
import threading

try:
    from .scoring_engine import LocalRulesProvider, ScorePipeline, Segment, make_window, snapshot_json
except ImportError:
    from scoring_engine import LocalRulesProvider, ScorePipeline, Segment, make_window, snapshot_json


class SessionStore:
    def __init__(self):
        self._pipelines: dict[str, ScorePipeline] = {}
        self._lock = threading.Lock()
        self._max_sessions = 64

    def score(self, session_id: str, segments: list[Segment]) -> dict[str, object]:
        if not segments:
            raise ValueError("At least one finalized segment is required")
        if any(segments[i].milliseconds <= segments[i - 1].milliseconds for i in range(1, len(segments))):
            raise ValueError("Segments must have increasing timestamps")
        with self._lock:
            if session_id not in self._pipelines and len(self._pipelines) >= self._max_sessions:
                self._pipelines.pop(next(iter(self._pipelines)))
            pipeline = self._pipelines.setdefault(session_id, ScorePipeline(LocalRulesProvider()))
            snapshot, changes = pipeline.process(make_window(segments, segments[-1].milliseconds), segments)
            return {"snapshot": snapshot_json(snapshot), "changes": [change.__dict__ for change in changes]}


STORE = SessionStore()


class Handler(BaseHTTPRequestHandler):
    def _json(self, status: int, body: dict[str, object]):
        encoded = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(encoded)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self._json(200, {"status": "ok", "provider": "local-rules"})
        else:
            self._json(404, {"error": "Not found"})

    def do_POST(self):
        if self.path != "/api/score":
            self._json(404, {"error": "Not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > 128_000:
                raise ValueError("Request body must be between 1 and 128000 bytes")
            payload = json.loads(self.rfile.read(length))
            session_id = payload["sessionId"]
            items = payload["segments"]
            if not isinstance(session_id, str) or not (1 <= len(session_id) <= 100):
                raise ValueError("Invalid sessionId")
            if not isinstance(items, list) or not (1 <= len(items) <= 500):
                raise ValueError("Expected 1 to 500 finalized segments")
            segments = []
            for item in items:
                if not isinstance(item, dict) or any(not isinstance(item.get(key), str) for key in ("id", "time", "text")):
                    raise ValueError("Invalid segment")
                if not item["id"] or not item["text"].strip() or len(item["text"]) > 5000:
                    raise ValueError("Invalid segment text or ID")
                confidence = float(item.get("confidence", 1))
                if not 0 <= confidence <= 1:
                    raise ValueError("confidence must be between 0 and 1")
                segments.append(Segment(item["id"], item["time"], item["text"], confidence))
            self._json(200, STORE.score(session_id, segments))
        except (ValueError, KeyError, TypeError, json.JSONDecodeError) as error:
            self._json(400, {"error": str(error)})


def main():
    port = int(os.environ.get("SPEECHLENS_API_PORT", "8787"))
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"SpeechLens local scoring API: http://127.0.0.1:{port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
