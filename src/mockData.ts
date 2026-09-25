import type { Claim, InsightEvent, Metric, TranscriptSegment } from "./types";

export const metricMeta: Array<Pick<Metric, "key" | "label" | "color" | "description">> = [
  { key: "overall", label: "Overall value", color: "cyan", description: "Worth your attention" },
  { key: "trust", label: "Trust", color: "emerald", description: "Evidence & consistency" },
  { key: "wisdom", label: "Wisdom", color: "violet", description: "Depth & originality" },
  { key: "aiRelevance", label: "AI relevance", color: "blue", description: "Technical signal" },
  { key: "economicRelevance", label: "Economic", color: "amber", description: "Market impact" },
  { key: "expression", label: "Expression", color: "purple", description: "Clarity & delivery" },
];

export const seedMetrics: Metric[] = [
  { ...metricMeta[0], score: 78, trend: "up", delta: 4, confidence: 0.84, points: [67, 68, 70, 69, 73, 72, 76, 78] },
  { ...metricMeta[1], score: 72, trend: "flat", delta: 0, confidence: 0.71, points: [69, 70, 69, 72, 71, 72, 72, 72] },
  { ...metricMeta[2], score: 84, trend: "up", delta: 8, confidence: 0.88, points: [58, 62, 66, 68, 73, 76, 79, 84] },
  { ...metricMeta[3], score: 91, trend: "up", delta: 3, confidence: 0.94, points: [83, 82, 84, 86, 87, 89, 88, 91] },
  { ...metricMeta[4], score: 64, trend: "down", delta: -5, confidence: 0.62, points: [70, 71, 69, 68, 67, 66, 65, 64] },
  { ...metricMeta[5], score: 76, trend: "up", delta: 2, confidence: 0.79, points: [72, 70, 71, 73, 72, 74, 74, 76] },
];

export const transcript: TranscriptSegment[] = [
  { id: "seg-141", time: "08:42", speaker: "Speaker 1", text: "The interesting shift is not that models are getting larger. It is that the interface between a model and a team is becoming the product.", confidence: 0.98, tags: ["insight", "AI"], tone: "confident" },
  { id: "seg-142", time: "08:55", speaker: "Speaker 1", text: "When the system can observe intent, retrieve context, and take a bounded action, the workflow changes from asking questions to delegating outcomes.", confidence: 0.96, tags: ["causal", "AI"], tone: "engaged" },
  { id: "seg-143", time: "09:17", speaker: "Speaker 1", text: "We saw a 42 percent reduction in time-to-resolution across the first three design partners.", confidence: 0.93, tags: ["claim", "metric"], tone: "measured" },
  { id: "seg-144", time: "09:33", speaker: "Speaker 1", text: "That number matters, but only if the team can understand why the agent made a decision and correct it when context changes.", confidence: 0.97, tags: ["insight", "trust"], tone: "careful" },
  { id: "seg-145", time: "09:57", speaker: "Speaker 1", text: "The market is crowded with copilots. The durable advantage is not a clever prompt; it is the feedback loop around real work.", confidence: 0.98, tags: ["quote", "market"], tone: "assertive" },
  { id: "seg-146", time: "10:14", speaker: "Speaker 1", text: "We are still early, and the cost curve will determine which workflows move from experiment to infrastructure.", confidence: 0.95, tags: ["economy", "forecast"], tone: "reflective" },
];

export const initialEvents: InsightEvent[] = [
  { id: "evt-01", kind: "insight", label: "Insight", title: "A new causal framework surfaced", explanation: "The speaker connected context retrieval to delegated outcomes, with a clear boundary condition.", time: "09:01", severity: "positive", metric: "wisdom", segmentId: "seg-142" },
  { id: "evt-02", kind: "claim", label: "Claim", title: "42% time-to-resolution reduction", explanation: "A measurable performance claim was detected. Evidence is queued for verification.", time: "09:18", severity: "warning", metric: "trust", segmentId: "seg-143" },
  { id: "evt-03", kind: "quote", label: "Quote", title: "The feedback loop is the advantage", explanation: "High memorability and shareability signal. This line is concise and independently understandable.", time: "09:58", severity: "positive", metric: "expression", segmentId: "seg-145" },
  { id: "evt-04", kind: "topic_shift", label: "Topic shift", title: "From product to market dynamics", explanation: "The conversation moved from agent workflow design to market structure and commercialization.", time: "10:15", severity: "info", metric: "economicRelevance", segmentId: "seg-146" },
];

export const claims: Claim[] = [
  { id: "clm-01", status: "searching", text: "A 42% reduction in time-to-resolution across the first three design partners.", type: "Performance metric", confidence: 0.84, time: "09:17" },
  { id: "clm-02", status: "supported", text: "The market is crowded with copilots.", type: "Market observation", confidence: 0.77, source: "CB Insights · AI 100", sourceMeta: "Published 2025 · high authority", time: "09:57" },
  { id: "clm-03", status: "insufficient_evidence", text: "The cost curve will determine which workflows become infrastructure.", type: "Forecast / causal", confidence: 0.59, time: "10:14" },
];
