const stage = document.getElementById("reaction-stage");
const promptElement = document.getElementById("reaction-prompt");
const instructionElement = document.getElementById("reaction-instruction");
const historyElement = document.getElementById("reaction-history");
const clearButton = document.getElementById("clear-results");
const inputHint = document.getElementById("reaction-input-hint");

// Timing controls: increase this range to make the signal less predictable.
const WAIT_MIN_MS = 1400;
const WAIT_MAX_MS = 4200;
const HISTORY_LIMIT = 8;
const SVG_NS = "http://www.w3.org/2000/svg";

let state = "idle";
let readyAt = 0;
let signalTimer = null;
let signalFrame = null;
let results = [];
let falseStarts = 0;

function setStageState(nextState, prompt, instruction) {
  state = nextState;
  stage.className = `reaction-stage is-${nextState}`;
  if (nextState === "idle") {
    const hint = inputHint.cloneNode(true);
    hint.removeAttribute("id");
    promptElement.replaceChildren(hint);
  } else {
    promptElement.textContent = prompt;
  }
  instructionElement.textContent = instruction;
}

function startAttempt() {
  cancelSignal();
  const delay = WAIT_MIN_MS + Math.random() * (WAIT_MAX_MS - WAIT_MIN_MS);
  setStageState("waiting", "Wait for it", "React only when the screen turns purple.");
  signalTimer = window.setTimeout(() => {
    // Change the signal at a frame boundary, rather than between screen updates.
    signalFrame = requestAnimationFrame(() => {
      setStageState("ready", "Click now", "Go.");
      readyAt = performance.now();
    });
  }, delay);
}

function cancelSignal() {
  window.clearTimeout(signalTimer);
  cancelAnimationFrame(signalFrame);
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

  const width = 800;
  const height = 190;
  const plot = { left: 54, right: 24, top: 20, bottom: 34 };
  const minimum = Math.min(...recent);
  const maximum = Math.max(...recent);
  // Round the adaptive scale so the chart stays readable as results change.
  const minY = Math.max(0, Math.floor((minimum - 40) / 50) * 50);
  const maxY = Math.max(minY + 100, Math.ceil((maximum + 40) / 50) * 50);
  const plotWidth = width - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;
  const xFor = index => recent.length === 1
    ? plot.left + plotWidth / 2
    : plot.left + (index / (recent.length - 1)) * plotWidth;
  const yFor = value => plot.top + ((maxY - value) / (maxY - minY)) * plotHeight;
  const makeSvgElement = (name, attributes = {}) => {
    const element = document.createElementNS(SVG_NS, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  };

  const chart = makeSvgElement("svg", {
    class: "history-chart",
    viewBox: `0 0 ${width} ${height}`,
    role: "img",
    "aria-label": `Reaction time trend: ${recent.join(", ")} milliseconds`
  });

  [maxY, Math.round((maxY + minY) / 2), minY].forEach(value => {
    const y = yFor(value);
    chart.append(makeSvgElement("line", { class: "history-grid", x1: plot.left, y1: y, x2: width - plot.right, y2: y }));
    const label = makeSvgElement("text", { class: "history-axis-label", x: plot.left - 10, y: y + 4, "text-anchor": "end" });
    label.textContent = value;
    chart.append(label);
  });

  const average = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  chart.append(makeSvgElement("line", {
    class: "history-average",
    x1: plot.left,
    y1: yFor(average),
    x2: width - plot.right,
    y2: yFor(average)
  }));

  const points = recent.map((value, index) => `${xFor(index)},${yFor(value)}`).join(" ");
  if (recent.length > 1) chart.append(makeSvgElement("polyline", { class: "history-line", points }));

  recent.forEach((value, index) => {
    const x = xFor(index);
    const y = yFor(value);
    const dot = makeSvgElement("circle", {
      class: `history-dot${index === recent.length - 1 ? " is-latest" : ""}`,
      cx: x,
      cy: y,
      r: index === recent.length - 1 ? 5 : 4
    });
    const title = makeSvgElement("title");
    title.textContent = `Attempt ${results.length - recent.length + index + 1}: ${value} ms`;
    dot.append(title);
    chart.append(dot);

    const attemptLabel = makeSvgElement("text", { class: "history-axis-label", x, y: height - 8, "text-anchor": "middle" });
    attemptLabel.textContent = String(results.length - recent.length + index + 1);
    chart.append(attemptLabel);
  });

  historyElement.append(chart);
  historyElement.setAttribute("aria-label", `Recent reaction times: ${recent.join(", ")} milliseconds`);
}

function renderStats() {
  const latest = results.at(-1);
  const average = results.length ? Math.round(results.reduce((sum, value) => sum + value, 0) / results.length) : null;
  document.getElementById("latest-result").textContent = latest ?? "--";
  document.getElementById("best-result").textContent = results.length ? Math.min(...results) : "--";
  document.getElementById("average-result").textContent = average ?? "--";
  document.getElementById("attempt-count").textContent = String(results.length);
  document.getElementById("false-start-count").textContent = String(falseStarts);
  renderHistory();
}

function finishAttempt(inputAt) {
  const elapsed = Math.max(1, Math.round(inputAt - readyAt));
  results.push(elapsed);
  setStageState("result", `${elapsed} ms`, "Click or press Space to try again.");
  renderStats();
}

function activate(inputAt = performance.now()) {
  stage.focus({ preventScroll: true });

  if (state === "waiting" || (state === "ready" && inputAt < readyAt)) {
    cancelSignal();
    falseStarts += 1;
    setStageState("early", "Too soon", "The signal had not changed. Click to retry.");
    renderStats();
    return;
  }

  if (state === "ready") {
    finishAttempt(inputAt);
    return;
  }

  startAttempt();
}

stage.addEventListener("pointerdown", event => {
  if (event.button !== 0) return;
  event.preventDefault();
  activate(event.timeStamp);
});

document.addEventListener("keydown", event => {
  if (event.key !== " " && event.key !== "Enter") return;
  if (event.repeat) { event.preventDefault(); return; }
  if (event.target.closest("button, a")) return;
  event.preventDefault();
  activate(event.timeStamp);
});

// Parent and iframe clocks have different origins; preserve the original input time.
document.addEventListener("reaction-input", event => {
  activate(event.detail.absoluteTime - performance.timeOrigin);
});

clearButton.addEventListener("click", () => {
  cancelSignal();
  results = [];
  falseStarts = 0;
  setStageState("idle", "", "Wait for the screen to turn purple, then react.");
  renderStats();
});

function pauseAttempt() {
  if (state !== "waiting" && state !== "ready") return;
  cancelSignal();
  setStageState("idle", "", "Test paused. Click or press Space to begin again.");
}
document.addEventListener("visibilitychange", () => { if (document.hidden) pauseAttempt(); });
window.addEventListener("blur", pauseAttempt);

setStageState("idle", "", "Wait for the screen to turn purple, then react.");
renderStats();
// Own keyboard focus immediately when opened directly or inside the site shell.
requestAnimationFrame(() => stage.focus({ preventScroll: true }));
