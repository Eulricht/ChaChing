const stage = document.getElementById("reaction-stage");
const promptElement = document.getElementById("reaction-prompt");
const instructionElement = document.getElementById("reaction-instruction");
const historyElement = document.getElementById("reaction-history");
const clearButton = document.getElementById("clear-results");

// Timing controls: increase this range to make the signal less predictable.
const WAIT_MIN_MS = 1400;
const WAIT_MAX_MS = 4200;
const HISTORY_LIMIT = 8;

let state = "idle";
let readyAt = 0;
let signalTimer = null;
let results = [];
let falseStarts = 0;

function setStageState(nextState, prompt, instruction) {
  state = nextState;
  stage.className = `reaction-stage is-${nextState}`;
  promptElement.textContent = prompt;
  instructionElement.textContent = instruction;
}

function startAttempt() {
  window.clearTimeout(signalTimer);
  const delay = WAIT_MIN_MS + Math.random() * (WAIT_MAX_MS - WAIT_MIN_MS);
  setStageState("waiting", "Wait for it", "React only when the screen turns purple.");
  signalTimer = window.setTimeout(() => {
    readyAt = performance.now();
    setStageState("ready", "Click now", "Go.");
  }, delay);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

// These labels are descriptive only; they do not represent a clinical benchmark.
function resultLabel(milliseconds) {
  if (milliseconds < 180) return "Exceptional response.";
  if (milliseconds < 220) return "Very fast response.";
  if (milliseconds < 280) return "Solid response.";
  return "Keep warming up.";
}

function renderHistory() {
  historyElement.replaceChildren();
  const recent = results.slice(-HISTORY_LIMIT);

  if (!recent.length) {
    const empty = document.createElement("p");
    empty.className = "empty-history";
    empty.textContent = "Results will appear here.";
    historyElement.append(empty);
    historyElement.setAttribute("aria-label", "No recorded attempts yet");
    return;
  }

  recent.forEach(value => {
    const item = document.createElement("div");
    item.className = "history-item";
    const bar = document.createElement("span");
    bar.className = "history-bar";
    // Faster results render taller; 120-500ms defines the visible chart range.
    const normalized = 1 - (Math.min(500, Math.max(120, value)) - 120) / 380;
    bar.style.height = `${28 + normalized * 82}%`;
    const label = document.createElement("span");
    label.className = "history-value";
    label.textContent = `${value}ms`;
    item.append(bar, label);
    historyElement.append(item);
  });
  historyElement.setAttribute("aria-label", `Recent reaction times: ${recent.join(", ")} milliseconds`);
}

function renderStats() {
  const latest = results.at(-1);
  const average = results.length ? Math.round(results.reduce((sum, value) => sum + value, 0) / results.length) : null;
  document.getElementById("latest-result").textContent = latest ?? "--";
  document.getElementById("best-result").textContent = results.length ? Math.min(...results) : "--";
  document.getElementById("average-result").textContent = average ?? "--";
  document.getElementById("median-result").textContent = results.length ? median(results) : "--";
  document.getElementById("attempt-count").textContent = String(results.length);
  document.getElementById("false-start-count").textContent = String(falseStarts);
  renderHistory();
}

function finishAttempt() {
  const elapsed = Math.max(1, Math.round(performance.now() - readyAt));
  results.push(elapsed);
  setStageState("result", `${elapsed} ms`, `${resultLabel(elapsed)} Click to try again.`);
  renderStats();
}

function activate() {
  stage.focus({ preventScroll: true });

  if (state === "waiting") {
    window.clearTimeout(signalTimer);
    falseStarts += 1;
    setStageState("early", "Too soon", "The signal had not changed. Click to retry.");
    renderStats();
    return;
  }

  if (state === "ready") {
    finishAttempt();
    return;
  }

  startAttempt();
}

stage.addEventListener("pointerdown", event => {
  if (event.button !== 0) return;
  event.preventDefault();
  activate();
});

document.addEventListener("keydown", event => {
  if (event.key !== " " && event.key !== "Enter") return;
  if (event.target.closest("button, a")) return;
  event.preventDefault();
  activate();
});

clearButton.addEventListener("click", () => {
  window.clearTimeout(signalTimer);
  results = [];
  falseStarts = 0;
  setStageState("idle", "Click to begin", "Wait for the screen to turn purple, then react.");
  renderStats();
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden || state !== "waiting") return;
  window.clearTimeout(signalTimer);
  setStageState("idle", "Test paused", "Return focus, then click to begin again.");
});

renderStats();
