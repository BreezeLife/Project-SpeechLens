import type { SttMessage } from "../contracts";

const samples = [
  "The interface between a model and a team is becoming the product.",
  "Context retrieval changes the workflow from asking questions to delegating outcomes.",
  "The feedback loop around real work creates the durable advantage.",
];

export class MockSttAdapter {
  private cursor = 0;
  private timer: number | undefined;

  start(emit: (message: SttMessage) => void) {
    this.stop();
    this.timer = window.setInterval(() => {
      const text = samples[this.cursor % samples.length];
      this.cursor += 1;
      emit({ type: "stt/interim", text: text.slice(0, Math.max(8, Math.floor(text.length * 0.65))), at: Date.now() });
      window.setTimeout(() => emit({ type: "stt/final", text, confidence: 0.94, at: Date.now() }), 500);
    }, 3200);
  }

  stop() {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
  }
}
