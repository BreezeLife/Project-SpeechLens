// apps/extension/src/contracts.ts
var OFFSCREEN_URL = "offscreen.html";

// apps/extension/src/background.ts
var offscreenReady = false;
async function ensureOffscreen() {
  if (offscreenReady) return;
  const contexts = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"], documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)] });
  if (contexts.length === 0) await chrome.offscreen.createDocument({ url: OFFSCREEN_URL, reasons: ["USER_MEDIA"], justification: "Process the active tab audio for live transcription." });
  offscreenReady = true;
}
async function send(command) {
  await ensureOffscreen();
  if (command.type === "session/start") {
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: command.tabId });
    await chrome.runtime.sendMessage({ ...command, streamId });
  } else await chrome.runtime.sendMessage(command);
}
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  await chrome.sidePanel.open({ tabId: tab.id });
  await send({ type: "session/start", tabId: tab.id });
});
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-session") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) await send({ type: "session/start", tabId: tab.id });
  }
});
chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.url?.endsWith("/index.html") && message.type.startsWith("session/")) void send(message);
});
