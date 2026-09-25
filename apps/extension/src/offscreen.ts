import { MockSttAdapter } from "./stt/mock-stt";
import type { SessionCommand, SttMessage } from "./contracts";

const stt = new MockSttAdapter();
let audioContext: AudioContext | undefined;
let source: MediaStreamAudioSourceNode | undefined;
let stream: MediaStream | undefined;

function post(message: SttMessage) {
  chrome.runtime.sendMessage(message).catch(() => undefined);
}

async function start(streamId: string) {
  await stop();
  stream = await navigator.mediaDevices.getUserMedia({ audio: { mandatory: { chromeMediaSource: "tab", chromeMediaSourceId: streamId } } as MediaTrackConstraints, video: false });
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
  stream = undefined;
  source?.disconnect();
  source = undefined;
  await audioContext?.close();
  audioContext = undefined;
  post({ type: "session/status", status: "stopped" });
}

chrome.runtime.onMessage.addListener((message: SessionCommand) => {
  if (message.type === "session/start" && message.streamId) void start(message.streamId).catch((error: Error) => post({ type: "session/status", status: "error", reason: error.message }));
  if (message.type === "session/pause") { stt.stop(); void audioContext?.suspend(); post({ type: "session/status", status: "paused" }); }
  if (message.type === "session/resume") { void audioContext?.resume(); stt.start(post); post({ type: "session/status", status: "listening" }); }
  if (message.type === "session/stop") void stop();
});
