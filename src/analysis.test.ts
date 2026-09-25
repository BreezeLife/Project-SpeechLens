import { afterEach, describe, expect, it, vi } from "vitest";
import { scoreTranscript } from "./analysis";

afterEach(() => vi.unstubAllGlobals());

describe("local scoring API client", () => {
  it("sends finalized transcript segments and returns a snapshot", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ snapshot: { smoothed: { overall: 71 } }, changes: [] }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await scoreTranscript("session-1", [{ id: "seg-1", time: "00:01", speaker: "Speaker 1", text: "A useful claim.", confidence: .9, tags: [] }]);
    expect(result.snapshot.smoothed.overall).toBe(71);
    expect(fetchMock).toHaveBeenCalledWith("/api/score", expect.objectContaining({ method: "POST" }));
  });

  it("surfaces a service failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("offline", { status: 503 })));
    await expect(scoreTranscript("session-1", [])).rejects.toThrow("503");
  });
});
