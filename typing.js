const vocabulary = 'the of and to in you that it he was for on are as with his they at be this have from or one had by word but what some we can out other were all there when up use your how said an each she which do their time if will way about many then them write would like so these her long make thing see him two has look more day could go come did number sound no most people my over know water than call first who may down side been now find any new work part take get place made live where after back little only round man year came show every good me give our under name very through just form much great think say help low line before turn cause same mean differ move right boy old too does tell sentence set three want air well also play small end put home read hand port large spell add even land here must big high such follow act why ask men change went light kind off need house picture try us again animal point mother world near build self earth father head stand own page should country found answer school grow study still learn plant cover food sun four state keep eye never last let thought city tree cross farm hard start might story saw far sea draw left late run while press close night real life few stop open seem together next white children begin got walk example ease paper group always music those both mark often letter until mile river car feet care second book carry took science eat room friend began idea fish mountain north once base hear horse cut sure watch color face wood main enough plain girl usual young ready above ever red list though feel talk bird soon body dog family direct leave song measure door product black short wind question happen complete ship area half rock order fire south problem piece told knew pass since top whole king space heard best hour better true during hundred five remember step early hold west ground interest reach fast verb sing listen six table travel less morning ten simple several vowel toward war lay against pattern slow center love person money serve appear road map rain rule pull cold notice voice unit power town fine fly fall lead cry dark machine note wait plan figure star box field rest correct able'.split(' ');
const input = document.getElementById('typing-input');
const wordsElement = document.getElementById('words');
const viewport = document.getElementById('word-window');
const stage = document.getElementById('typing-stage');
const caretElement = document.getElementById('typing-caret');
const status = document.getElementById('typing-status');
let duration = 30;
let target = '';
let characters = [];
let startedAt = null;
let timer = null;
let finished = false;
let attempts = 0;
let correctAttempts = 0;
let previous = '';
let samples = [];
let lastSampleSecond = -1;
let lastSampleErrors = 0;
let caretIdleTimer = null;

const results = document.getElementById('results');
const svgNamespace = 'http://www.w3.org/2000/svg';

function metrics(elapsed) {
  const correct = [...input.value].reduce((total, char, index) => total + Number(char === target[index]), 0);
  const incorrect = input.value.length - correct;
  const minutes = elapsed / 60;
  return {
    wpm: elapsed > 0 ? Math.round(correct / 5 / minutes) : 0,
    raw: elapsed > 0 ? Math.round(input.value.length / 5 / minutes) : 0,
    accuracy: attempts ? Math.round(correctAttempts / attempts * 100) : 100,
    correct,
    incorrect
  };
}

function sampleProgress(elapsed, force = false) {
  const second = Math.min(duration, Math.max(0, elapsed));
  const wholeSecond = Math.floor(second);
  if (!force && wholeSecond === lastSampleSecond) return;
  const result = metrics(Math.max(second, .25));
  const totalErrors = attempts - correctAttempts;
  samples.push({ second, wpm: result.wpm, raw: result.raw, errors: Math.max(0, totalErrors - lastSampleErrors) });
  lastSampleSecond = wholeSecond;
  lastSampleErrors = totalErrors;
}

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(svgNamespace, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function renderChart() {
  const chart = document.getElementById('result-chart');
  chart.replaceChildren();
  const width = 900;
  const height = 260;
  const padding = { left: 42, right: 18, top: 18, bottom: 30 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxSpeed = Math.max(20, ...samples.flatMap(sample => [sample.wpm, sample.raw]));
  const speedCeiling = Math.ceil(maxSpeed / 20) * 20;
  const x = second => padding.left + second / duration * plotWidth;
  const y = speed => padding.top + plotHeight - speed / speedCeiling * plotHeight;

  for (let step = 0; step <= 4; step++) {
    const speed = speedCeiling * step / 4;
    const lineY = y(speed);
    chart.append(svgElement('line', { x1: padding.left, y1: lineY, x2: width - padding.right, y2: lineY, class: 'chart-grid' }));
    const label = svgElement('text', { x: padding.left - 9, y: lineY + 4, 'text-anchor': 'end', class: 'chart-label' });
    label.textContent = Math.round(speed);
    chart.append(label);
  }

  const tickCount = duration === 60 ? 6 : duration === 30 ? 6 : 5;
  for (let step = 0; step <= tickCount; step++) {
    const second = duration * step / tickCount;
    const label = svgElement('text', { x: x(second), y: height - 7, 'text-anchor': 'middle', class: 'chart-label' });
    label.textContent = `${Math.round(second)}s`;
    chart.append(label);
  }

  const pathFor = key => samples.map((sample, index) => `${index ? 'L' : 'M'} ${x(sample.second).toFixed(1)} ${y(sample[key]).toFixed(1)}`).join(' ');
  chart.append(svgElement('path', { d: pathFor('raw'), class: 'chart-raw' }));
  chart.append(svgElement('path', { d: pathFor('wpm'), class: 'chart-wpm' }));
  samples.filter(sample => sample.errors).forEach(sample => {
    chart.append(svgElement('circle', { cx: x(sample.second), cy: y(sample.wpm), r: 3.5, class: 'chart-error' }));
  });
}

function renderResults(result, elapsed) {
  const speeds = samples.map(sample => sample.wpm).filter(Boolean);
  const average = speeds.length ? speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length : 0;
  const variance = speeds.length ? speeds.reduce((sum, speed) => sum + (speed - average) ** 2, 0) / speeds.length : 0;
  const consistency = average ? Math.max(0, Math.round(100 - Math.sqrt(variance) / average * 100)) : 100;
  document.getElementById('result-wpm').textContent = result.wpm;
  document.getElementById('result-accuracy').textContent = `${result.accuracy}%`;
  document.getElementById('result-raw').textContent = result.raw;
  document.getElementById('result-characters').textContent = `${result.correct} / ${result.incorrect}`;
  document.getElementById('result-consistency').textContent = `${consistency}%`;
  document.getElementById('result-time').textContent = `${Math.round(elapsed)}s`;
  renderChart();
  results.hidden = false;
  requestAnimationFrame(() => results.classList.add('is-visible'));
}

function updateStats(elapsed = 0) {
  const result = metrics(elapsed);
  document.getElementById('time').textContent = Math.max(0, Math.ceil(duration - elapsed));
  document.getElementById('wpm').textContent = result.wpm;
  document.getElementById('accuracy').textContent = result.accuracy;
  return result;
}

function finish() {
  if (finished) return;
  finished = true;
  clearInterval(timer);
  input.disabled = true;
  stage.classList.add('is-finished');
  const elapsed = startedAt === null ? duration : Math.min(duration, (performance.now() - startedAt) / 1000);
  const result = updateStats(elapsed);
  sampleProgress(elapsed, true);
  document.body.classList.remove('test-running');
  document.body.classList.add('test-finished');
  renderResults(result, elapsed);
  status.textContent = `Test complete. ${result.wpm} WPM, ${result.accuracy}% accuracy. Restart to try again.`;
}

function moveCaret(instant = false) {
  const targetCharacter = characters[Math.min(input.value.length, characters.length - 1)];
  if (!targetCharacter) return;

  const characterRect = targetCharacter.getBoundingClientRect();
  const viewportRect = viewport.getBoundingClientRect();
  const x = characterRect.left - viewportRect.left + viewport.scrollLeft;
  const y = characterRect.top - viewportRect.top + viewport.scrollTop + (characterRect.height - caretElement.offsetHeight) / 2;

  if (instant) caretElement.style.transition = 'none';
  caretElement.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  if (instant) requestAnimationFrame(() => caretElement.style.removeProperty('transition'));
}

function showActiveCaret() {
  clearTimeout(caretIdleTimer);
  caretElement.classList.add('is-moving');
  caretIdleTimer = setTimeout(() => caretElement.classList.remove('is-moving'), 180);
}

function tick() {
  const elapsed = (performance.now() - startedAt) / 1000;
  if (elapsed >= duration) finish();
  else {
    updateStats(elapsed);
    sampleProgress(elapsed);
  }
}

function reset(focus = false) {
  clearInterval(timer);
  clearTimeout(caretIdleTimer);
  startedAt = null;
  finished = false;
  attempts = correctAttempts = 0;
  previous = '';
  samples = [{ second: 0, wpm: 0, raw: 0, errors: 0 }];
  lastSampleSecond = 0;
  lastSampleErrors = 0;
  input.value = '';
  input.disabled = false;
  stage.classList.remove('is-finished');
  caretElement.classList.remove('is-moving');
  document.body.classList.remove('test-running', 'test-finished');
  results.classList.remove('is-visible');
  results.hidden = true;
  target = Array.from({ length: 250 }, () => vocabulary[Math.floor(Math.random() * vocabulary.length)]).join(' ');
  wordsElement.replaceChildren();
  characters = [];
  target.split(' ').forEach((word, index, list) => {
    const wrapper = document.createElement('span');
    wrapper.className = 'typing-word';
    for (const letter of word + (index < list.length - 1 ? ' ' : '')) {
      const span = document.createElement('span');
      span.textContent = letter;
      wrapper.append(span);
      characters.push(span);
    }
    wordsElement.append(wrapper);
  });
  input.maxLength = target.length;
  viewport.scrollTop = 0;
  status.textContent = 'Click the typing area to begin.';
  updateStats();
  requestAnimationFrame(() => moveCaret(true));
  if (focus) input.focus();
}

input.addEventListener('paste', event => event.preventDefault());
input.addEventListener('drop', event => event.preventDefault());
input.addEventListener('input', () => {
  if (finished) return;
  if (startedAt !== null && performance.now() - startedAt >= duration * 1000) {
    input.value = previous;
    finish();
    return;
  }
  if (startedAt === null && input.value.length) {
    startedAt = performance.now();
    timer = setInterval(tick, 100);
    document.body.classList.add('test-running');
    status.textContent = 'Keep going. Backspace is available for corrections.';
  }
  // Count new attempts, including corrections made in the middle of the input.
  let common = 0;
  while (common < previous.length && common < input.value.length && previous[common] === input.value[common]) common++;
  let suffix = 0;
  while (suffix < previous.length - common && suffix < input.value.length - common && previous[previous.length - 1 - suffix] === input.value[input.value.length - 1 - suffix]) suffix++;
  for (let i = common; i < input.value.length - suffix; i++) {
    attempts++;
    if (input.value[i] === target[i]) correctAttempts++;
  }
  previous = input.value;
  showActiveCaret();
  characters.forEach((span, i) => {
    span.className = i < input.value.length ? (input.value[i] === target[i] ? 'correct' : 'incorrect') : '';
  });
  const nextCharacter = characters[input.value.length];
  if (nextCharacter) {
    viewport.scrollTop += nextCharacter.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 58;
    requestAnimationFrame(() => moveCaret());
  }
  if (startedAt !== null) tick();
  if (input.value.length === target.length) finish();
});
stage.addEventListener('click', () => {
  if (!finished) input.focus();
});
document.addEventListener('click', event => {
  if (finished || event.target.closest('a, button')) return;
  input.focus({ preventScroll: true });
});
input.addEventListener('focus', () => stage.classList.add('is-focused'));
input.addEventListener('blur', () => stage.classList.remove('is-focused'));
document.getElementById('restart').addEventListener('click', () => reset(true));
document.querySelectorAll('[data-seconds]').forEach(button => {
  button.addEventListener('click', () => {
    duration = Number(button.dataset.seconds);
    document.querySelectorAll('[data-seconds]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    reset(true);
  });
});
document.addEventListener('keydown', event => {
  if (document.activeElement === input || finished || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key.length !== 1 && event.key !== 'Backspace') return;

  event.preventDefault();
  input.focus();
  input.value = event.key === 'Backspace' ? input.value.slice(0, -1) : input.value + event.key;
  input.dispatchEvent(new Event('input', { bubbles: true }));
});
document.addEventListener('visibilitychange', () => { if (startedAt !== null && !finished) tick(); });
window.addEventListener('resize', () => moveCaret(true));
reset();
