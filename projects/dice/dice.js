const row = document.getElementById('dice-row');
const rollButton = document.getElementById('roll');
const countButtons = [...document.querySelectorAll('[data-count]')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
// All dice share one clock: no staggered finish or cooldown after landing.
const ROLL_DURATION_MS = 640;
const HISTORY_LIMIT = 8;
const SVG_NS = 'http://www.w3.org/2000/svg';
const pipPositions = [[5], [1, 9], [1, 5, 9], [1, 3, 7, 9], [1, 3, 5, 7, 9], [1, 3, 4, 6, 7, 9]];
let diceCount = 1;
let rolling = false;
let queuedRoll = false;
let rolls = 0;
let history = [];
let dice = [];

function randomFace() {
  // Reject excess byte values so all six outcomes have equal probability.
  const byte = new Uint8Array(1);
  do { crypto.getRandomValues(byte); } while (byte[0] >= 252);
  return byte[0] % 6 + 1;
}

function svgElement(name, attributes) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function makePips(value) {
  const group = svgElement('g', { class: 'die-pips' });
  pipPositions[value - 1].forEach(position => {
    group.append(svgElement('circle', {
      cx: 43 + ((position - 1) % 3) * 37,
      cy: 39 + Math.floor((position - 1) / 3) * 37,
      r: 8
    }));
  });
  return group;
}

function buildDice() {
  row.replaceChildren();
  dice = Array.from({ length: diceCount }, (_, index) => {
    const space = document.createElement('div');
    space.className = 'die-space';
    space.setAttribute('role', 'img');
    space.setAttribute('aria-label', 'Die ' + (index + 1) + ': ready to roll');
    const shadow = document.createElement('span');
    shadow.className = 'die-shadow';
    const body = svgElement('svg', { class: 'die', viewBox: '0 0 160 168', 'aria-hidden': 'true' });
    body.append(
      svgElement('rect', { class: 'die-edge', x: 8, y: 17, width: 144, height: 143, rx: 25 }),
      svgElement('rect', { class: 'die-surface', x: 8, y: 7, width: 144, height: 143, rx: 25 }),
      svgElement('rect', { class: 'die-rim', x: 12, y: 11, width: 136, height: 135, rx: 22 })
    );
    const pips = makePips(1);
    body.append(pips);
    space.append(shadow, body);
    row.append(space);
    return { body, space, shadow, pips };
  });
}

function recordRoll(values) {
  const total = values.reduce((sum, value) => sum + value, 0);
  rolls += 1;
  history.unshift({ values, total });
  history = history.slice(0, HISTORY_LIMIT);
  document.getElementById('roll-total').textContent = total;
  document.getElementById('roll-values').textContent = values.join(' + ');
  document.getElementById('roll-count').textContent = rolls;
  document.getElementById('roll-history').replaceChildren(...history.map(result => {
    const item = document.createElement('li');
    item.textContent = result.values.length > 1 ? result.values.join(' + ') + ' = ' + result.total : String(result.total);
    return item;
  }));
}

function roll() {
  if (rolling) {
    // Buffer one deliberate press, rather than silently dropping input near landing.
    queuedRoll = true;
    return;
  }
  rolling = true;
  rollButton.setAttribute('aria-busy', 'true');
  countButtons.forEach(button => { button.disabled = true; });
  const values = dice.map(randomFace);
  dice.forEach((die, index) => {
    die.nextPips = makePips(values[index]);
    die.nextPips.style.opacity = '0';
    die.body.append(die.nextPips);
  });
  const startedAt = performance.now();

  function finish() {
    dice.forEach((die, index) => {
      die.pips.remove();
      die.pips = die.nextPips;
      die.pips.style.opacity = '1';
      die.body.style.transform = '';
      die.shadow.style.opacity = '';
      die.shadow.style.transform = '';
      die.space.setAttribute('aria-label', 'Die ' + (index + 1) + ': ' + values[index]);
    });
    recordRoll(values);
    rolling = false;
    rollButton.removeAttribute('aria-busy');
    countButtons.forEach(button => { button.disabled = false; });
    if (queuedRoll) {
      queuedRoll = false;
      roll();
    }
  }

  function frame(now) {
    const t = Math.min(1, (now - startedAt) / ROLL_DURATION_MS);
    if (t >= 1 || reducedMotion.matches) { finish(); return; }
    // Smooth start and landing; one transform avoids competing CSS/JS animations.
    const progress = t - Math.sin(t * Math.PI * 2) / (Math.PI * 2);
    const lift = Math.pow(Math.sin(Math.PI * t), 2);
    const blend = Math.max(0, Math.min(1, (t - .28) / .32));
    dice.forEach((die, index) => {
      const direction = index % 2 ? -1 : 1;
      const angle = direction * 360 * progress;
      const drift = direction * 10 * Math.sin(Math.PI * 2 * t) * lift;
      die.body.style.transform = 'translate(' + drift + 'px,' + (-48 * lift) + 'px) rotate(' + angle + 'deg)';
      die.pips.style.opacity = String(1 - blend);
      die.nextPips.style.opacity = String(blend);
      die.shadow.style.opacity = String(1 - lift * .5);
      die.shadow.style.transform = 'scale(' + (1 - lift * .22) + ')';
    });
    requestAnimationFrame(frame);
  }
  if (reducedMotion.matches) finish();
  else requestAnimationFrame(frame);
}

countButtons.forEach(button => button.addEventListener('click', () => {
  if (rolling) return;
  diceCount = Number(button.dataset.count);
  countButtons.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
  buildDice();
  rollButton.focus({ preventScroll: true });
}));
rollButton.addEventListener('click', roll);
document.addEventListener('dice-roll', roll);
// Capture Space even when a count button has keyboard focus; prevent native activation.
document.addEventListener('keydown', event => {
  if (event.code !== 'Space' && event.key !== ' ') return;
  event.preventDefault();
  event.stopPropagation();
  if (!event.repeat) roll();
}, true);
document.addEventListener('keyup', event => {
  if (event.code === 'Space' || event.key === ' ') event.preventDefault();
}, true);
buildDice();
