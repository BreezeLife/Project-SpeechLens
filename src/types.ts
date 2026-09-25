export type View = "live" | "transcript" | "timeline" | "claims" | "report";
export type MetricKey =
  | "overall"
  | "trust"
  | "wisdom"
  | "aiRelevance"
  | "economicRelevance"
  | "expression";

export type EventKind = "insight" | "claim" | "quote" | "topic_shift" | "repetition" | "emotion_shift";

export interface Metric {
  key: MetricKey;
  label: string;
  score: number;
  trend: "up" | "down" | "flat";
  delta: number;
  confidence: number;
  color: string;
  description: string;
  points: number[];
}

export interface TranscriptSegment {
  id: string;
  time: string;
  speaker: string;
  text: string;
  confidence: number;
  tags: string[];
  tone?: string;
}

export interface InsightEvent {
  id: string;
  kind: EventKind;
  label: string;
  title: string;
  explanation: string;
  time: string;
  severity: "positive" | "warning" | "info";
  metric?: MetricKey;
  segmentId: string;
}

export interface Claim {
  id: string;
  status: "supported" | "searching" | "insufficient_evidence" | "mixed";
  text: string;
  type: string;
  confidence: number;
  source?: string;
  sourceMeta?: string;
  time: string;
}
