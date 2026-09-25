// apps/extension/src/sidepanel.ts
var status = document.querySelector("#status");
var interim = document.querySelector("#interim");
var level = document.querySelector("#level");
var transcript = document.querySelector("#transcript");
var pause = document.querySelector("#pause");
var score = document.querySelector("#score");
var paused = false;
var sessionId = `extension-${crypto.randomUUID()}`;
var finalized = [];
var scoreController;
function send(message) {
  chrome.runtime.sendMessage(message).catch(() => void 0);
}
async function scoreTranscript() {
  scoreController?.abort();
  scoreController = new AbortController();
  const response = await fetch("http://127.0.0.1:8787/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, segments: finalized }),
    signal: scoreController.signal
  });
  if (!response.ok) throw new Error(`Scoring API ${response.status}`);
  const payload = await response.json();
  score.textContent = `Local score: ${payload.snapshot?.smoothed?.overall ?? "--"}`;
}
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "session/status") {
    status.textContent = message.status;
    if (message.status === "error") interim.textContent = message.reason ?? "Session error";
    paused = message.status === "paused";
    pause.textContent = paused ? "Resume" : "Pause";
  } else if (message.type === "stt/interim") interim.textContent = message.text;
  else if (message.type === "stt/final") {
    interim.textContent = "";
    const item = document.createElement("li");
    item.textContent = message.text;
    transcript.append(item);
    const elapsedSeconds = finalized.length + 1;
    finalized.push({ id: `segment-${elapsedSeconds}`, time: `00:${String(elapsedSeconds).padStart(2, "0")}`, text: message.text, confidence: message.confidence });
    void scoreTranscript().catch((error) => {
      if (error.name !== "AbortError") score.textContent = "Local scorer offline";
    });
  } else if (message.type === "audio/level") level.style.width = `${Math.round(message.value * 100)}%`;
});
pause.addEventListener("click", () => send({ type: paused ? "session/resume" : "session/pause" }));
document.querySelector("#stop").addEventListener("click", () => send({ type: "session/stop" }));
