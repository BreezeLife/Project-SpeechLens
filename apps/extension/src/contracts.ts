export type SessionStatus = "idle" | "starting" | "listening" | "paused" | "stopped" | "error";

export type SttMessage =
  | { type: "stt/interim"; text: string; at: number }
  | { type: "stt/final"; text: string; at: number; confidence: number }
  | { type: "audio/level"; value: number; at: number }
  | { type: "session/status"; status: SessionStatus; reason?: string };

export type SessionCommand =
  | { type: "session/start"; tabId: number; streamId?: string }
  | { type: "session/pause" }
  | { type: "session/resume" }
  | { type: "session/stop" };

export const OFFSCREEN_URL = "offscreen.html";
