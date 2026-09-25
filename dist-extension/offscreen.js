// apps/extension/src/stt/mock-stt.ts
var samples = [
  "The interface between a model and a team is becoming the product.",
  "Context retrieval changes the workflow from asking questions to delegating outcomes.",
  "The feedback loop around real work creates the durable advantage."
];
var MockSttAdapter = class {
  cursor = 0;
  timer;
  start(emit) {
    this.stop();
    this.timer = window.setInterval(() => {
      const text = samples[this.cursor % samples.length];
      this.cursor += 1;
      emit({ type: "stt/interim", text: text.slice(0, Math.max(8, Math.floor(text.length * 0.65))), at: Date.now() });
      window.setTimeout(() => emit({ type: "stt/final", text, confidence: 0.94, at: Date.now() }), 500);
    }, 3200);
  }
  stop() {
    if (this.timer !== void 0) window.clearInterval(this.timer);
    this.timer = void 0;
  }
};

// apps/extension/src/offscreen.ts
var stt = new MockSttAdapter();
var audioContext;
var source;
var stream;
function post(message) {
  chrome.runtime.sendMessage(message).catch(() => void 0);
}
async function start(streamId) {
  await stop();
  stream = await navigator.mediaDevices.getUserMedia({ audio: { mandatory: { chromeMediaSource: "tab", chromeMediaSourceId: streamId } }, video: false });
  audioContext = new AudioContext();
  source = audioContext.createMediaStreamSource(stream);
  source.connect(audioContext.destination);
  const analyser = audioContext.createAnalyser();
  source.connect(analyser);
  const levels = new Uint8Array(analyser.fftSize);
  const tick = () => {
    if (!audioContext || audioContext.state === "closed") return;
    analyser.getByteTimeDomainData(levels);
    const rms = Math.sqrt(levels.reduce((sum, value) => sum + ((value - 128) / 128) ** 2, 0) / levels.length);
    post({ type: "audio/level", value: Math.min(1, rms * 3), at: Date.now() });
    requestAnimationFrame(tick);
  };
  tick();
  stt.start(post);
  post({ type: "session/status", status: "listening" });
}
async function stop() {
  stt.stop();
  stream?.getTracks().forEach((track) => track.stop());
  stream = void 0;
  source?.disconnect();
  source = void 0;
  await audioContext?.close();
  audioContext = void 0;
  post({ type: "session/status", status: "stopped" });
}
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "session/start" && message.streamId) void start(message.streamId).catch((error) => post({ type: "session/status", status: "error", reason: error.message }));
  if (message.type === "session/pause") {
    stt.stop();
    void audioContext?.suspend();
    post({ type: "session/status", status: "paused" });
  }
  if (message.type === "session/resume") {
    void audioContext?.resume();
    stt.start(post);
    post({ type: "session/status", status: "listening" });
  }
  if (message.type === "session/stop") void stop();
});
