import type { MetricKey, TranscriptSegment } from "./types";

export type CoreScores = Record<MetricKey, number>;
export type Confidence = Record<MetricKey, number>;
export type ScoreReason = { code: string; text: string; segmentIds: string[] };
export type SecondaryScores = {
  dominantEmotion: string;
  emotionIntensity: number;
  speakingRateWpm: number | null;
  pauseRatio: number | null;
  informationDensity: number;
  logicalCoherence: number;
  evidenceStrength: number;
  repetition: number;
  actionability: number;
  buzzwordDensity: number;
};
export type MetricSnapshot = {
  window: { id: string; startMs: number; endMs: number };
  raw: CoreScores;
  smoothed: CoreScores;
  confidence: Confidence;
  secondary: SecondaryScores;
  stale: boolean;
  reasons: Partial<Record<MetricKey, ScoreReason>>;
};
export type ScoreChange = { metric: MetricKey; before: number; after: number; direction: "up" | "down"; reason: ScoreReason; confidence: number; evidenceType: "transcript" };
export type ScoreResponse = { snapshot: MetricSnapshot; changes: ScoreChange[] };

export async function scoreTranscript(sessionId: string, segments: TranscriptSegment[], signal?: AbortSignal): Promise<ScoreResponse> {
  const response = await fetch("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, segments: segments.map(({ id, time, text, confidence }) => ({ id, time, text, confidence })) }),
    signal,
  });
  if (!response.ok) throw new Error(`Local scorer returned ${response.status}`);
  return response.json() as Promise<ScoreResponse>;
}
