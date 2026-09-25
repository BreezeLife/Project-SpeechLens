"""Local transcript scoring engine using only the Python standard library."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
import re
from typing import Protocol

METRICS = ("overall", "trust", "wisdom", "aiRelevance", "economicRelevance", "expression")


@dataclass(frozen=True)
class Segment:
    id: str
    time: str
    text: str
    confidence: float = 1.0

    @property
    def milliseconds(self) -> int:
        minutes, seconds = (int(value) for value in self.time.split(":"))
        return (minutes * 60 + seconds) * 1000


@dataclass(frozen=True)
class Window:
    id: str
    start_ms: int
    end_ms: int
    segments: tuple[Segment, ...]


@dataclass
class Secondary:
    dominantEmotion: str
    emotionIntensity: int
    speakingRateWpm: int | None
    pauseRatio: int | None
    informationDensity: int
    logicalCoherence: int
    evidenceStrength: int
    repetition: int
    actionability: int
    buzzwordDensity: int


@dataclass
class Decision:
    scores: dict[str, int]
    confidence: dict[str, float]
    secondary: Secondary
    reasons: dict[str, dict[str, object]]


@dataclass
class Snapshot:
    window: Window
    raw: dict[str, int]
    smoothed: dict[str, int]
    confidence: dict[str, float]
    secondary: Secondary
    stale: bool = False
    reasons: dict[str, dict[str, object]] = field(default_factory=dict)


@dataclass
class Change:
    metric: str
    before: int
    after: int
    direction: str
    reason: dict[str, object]
    confidence: float
    evidenceType: str = "transcript"


class Provider(Protocol):
    def analyze(self, window: Window, context: list[Segment]) -> Decision: ...


def clamp(value: float) -> int:
    return max(0, min(100, round(value)))


def occurrences(text: str, pattern: str) -> int:
    return len(re.findall(pattern, text, re.IGNORECASE))


def make_window(segments: list[Segment], end_ms: int, duration_ms: int = 30_000) -> Window:
    start = max(0, end_ms - duration_ms)
    selected = tuple(segment for segment in segments if start < segment.milliseconds <= end_ms)
    return Window(f"window-{end_ms}", start, end_ms, selected)


class LocalRulesProvider:
    def analyze(self, window: Window, context: list[Segment]) -> Decision:
        text = " ".join(segment.text for segment in window.segments).lower()
        prior = " ".join(segment.text.lower() for segment in context if segment.milliseconds <= window.start_ms)
        words = re.findall(r"[\w]+", text)
        sentence_count = max(1, occurrences(text, r"[.!?]"))
        ai = occurrences(text, r"\b(ai|models?|agents?|prompts?|context|retrieval|inference|data)\b")
        economy = occurrences(text, r"\b(markets?|costs?|revenue|investment|commercial|products?|workflows?|partners?|advantage)\b")
        causal = occurrences(text, r"\b(because|therefore|if|when|why|determines?|changes?|loops?|outcomes?)\b")
        evidence = occurrences(text, r"\b(research|study|source|measured|saw|across|percent)\b|%")
        claims = occurrences(text, r"\b\d+(?:\.\d+)?\s*(?:percent|%|times?)\b")
        qualifiers = occurrences(text, r"\b(but|only if|still early|may|might|depends|boundary|unless)\b")
        unique_ratio = len(set(words)) / max(1, len(words))
        repeated = bool(prior and any(segment.text.lower()[:45] in prior for segment in window.segments))
        scores = {
            "overall": 0,
            "trust": clamp(54 + evidence * 5 + qualifiers * 5 - claims * 10),
            "wisdom": clamp(44 + causal * 7 + qualifiers * 5 + (7 if unique_ratio > .72 else 0) - (12 if repeated else 0)),
            "aiRelevance": clamp(20 + ai * 12),
            "economicRelevance": clamp(20 + economy * 11),
            "expression": clamp(48 + min(20, len(words) / sentence_count) + (8 if unique_ratio > .7 else 0)),
        }
        weights = {"wisdom": .32, "trust": .26, "expression": .17, "aiRelevance": .12 if ai else 0, "economicRelevance": .13 if economy else 0}
        total = sum(weights.values()) or 1
        scores["overall"] = clamp(sum(scores[key] * weight for key, weight in weights.items()) / total)
        transcript_confidence = sum(segment.confidence for segment in window.segments) / max(1, len(window.segments))
        confidence_base = min(.82, (.38 + min(30, len(words)) * .012) * max(.35, transcript_confidence))
        confidence = {key: max(.3, confidence_base - (.15 if key == "trust" and claims else 0)) for key in METRICS}
        ids = [segment.id for segment in window.segments]
        secondary = Secondary(
            "Measured" if qualifiers or claims else "Confident" if causal else "Neutral",
            clamp(42 + min(35, (claims + causal) * 7)),
            None,
            None,
            clamp(len(words) / sentence_count * 2.4),
            clamp(48 + causal * 8 + qualifiers * 4),
            clamp(32 + evidence * 13 - claims * 7),
            72 if repeated else clamp(12 + (1 - unique_ratio) * 35),
            clamp(28 + occurrences(text, r"\b(action|use|build|implement|workflow|outcome|determine)\b") * 12),
            clamp(occurrences(text, r"\b(scale|transform|revolution|paradigm|leverage|synergy)\b") / max(1, len(words)) * 1000),
        )
        reasons = {key: {"code": "CONTENT_SIGNAL", "text": "The local provider estimated this metric from the transcript window.", "segmentIds": ids} for key in METRICS}
        if claims:
            reasons["trust"] = {"code": "UNVERIFIED_NUMERIC_CLAIM", "text": "A numerical claim needs independent verification.", "segmentIds": ids}
        return Decision(scores, confidence, secondary, reasons)


class ScorePipeline:
    def __init__(self, provider: Provider):
        self.provider = provider
        self.snapshots: list[Snapshot] = []
        self._sum = {key: 0 for key in METRICS}

    def process(self, window: Window, context: list[Segment]) -> tuple[Snapshot, list[Change]]:
        previous = self.snapshots[-1] if self.snapshots else None
        if previous and previous.window.id == window.id:
            return previous, []
        if not window.segments:
            if not previous:
                raise ValueError("cannot score an empty first window")
            return Snapshot(window, previous.raw, previous.smoothed, previous.confidence, previous.secondary, True, previous.reasons), []
        try:
            decision = self.provider.analyze(window, context)
        except Exception:
            if not previous:
                raise
            return Snapshot(window, previous.raw, previous.smoothed, previous.confidence, previous.secondary, True, previous.reasons), []
        index = len(self.snapshots)
        smoothed: dict[str, int] = {}
        changes: list[Change] = []
        for key in METRICS:
            average = self._sum[key] / index if index else decision.scores[key]
            value = decision.scores[key] if not previous else decision.scores[key] * .35 + previous.smoothed[key] * .45 + average * .2
            smoothed[key] = clamp(value)
            delta = smoothed[key] - previous.smoothed[key] if previous else 0
            if previous and abs(delta) > 8 and decision.confidence[key] >= .55:
                changes.append(Change(key, previous.smoothed[key], smoothed[key], "up" if delta > 0 else "down", decision.reasons[key], decision.confidence[key]))
        snapshot = Snapshot(window, decision.scores, smoothed, decision.confidence, decision.secondary, False, decision.reasons)
        self.snapshots.append(snapshot)
        for key in METRICS:
            self._sum[key] += decision.scores[key]
        return snapshot, changes


def snapshot_json(snapshot: Snapshot) -> dict[str, object]:
    result = asdict(snapshot)
    result["window"]["segments"] = [asdict(segment) for segment in snapshot.window.segments]
    result["window"]["startMs"] = result["window"].pop("start_ms")
    result["window"]["endMs"] = result["window"].pop("end_ms")
    return result
