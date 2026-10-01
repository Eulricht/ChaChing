const row = document.getElementById('dice-row');
const rollButton = document.getElementById('roll');
const countButtons = [...document.querySelectorAll('[data-count]')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
// Adjust tumble duration and retained history here.
const ROLL_DURATION_MS = 1050;
const HISTORY_LIMIT = 8;
const pipPositions = [[5], [1, 9], [1, 5, 9], [1, 3, 7, 9], [1, 3, 5, 7, 9], [1, 3, 4, 6, 7, 9]];
const faceAngles = [[0, 0], [0, -90], [-90, 0], [90, 0], [0, 90], [0, 180]];
let diceCount = 1;
let rolling = false;
let rolls = 0;
let history = [];
let dice = [];

function randomFace() {
  // Reject the four excess byte values so all six outcomes are equally likely.
  const byte = new Uint8Array(1);
  do { crypto.getRandomValues(byte); } while (byte[0] >= 252);
  return byte[0] % 6 + 1;
}

function orientation(x, y) {
  return `rotateX(-12deg) rotateY(-18deg) rotateX(${x}deg) rotateY(${y}deg)`;
}

function buildDice() {
  row.replaceChildren();
  dice = Array.from({ length: diceCount }, (_, index) => {
    const space = document.createElement('div');
    space.className = 'die-space';
    space.setAttribute('role', 'img');
    space.setAttribute('aria-label', `Die ${index + 1}: ready to roll`);
    const cube = document.createElement('div');
    cube.className = 'die';
    pipPositions.forEach(positions => {
      const face = document.createElement('div');
      face.className = 'die-face';
      positions.forEach(position => {
        const pip = document.createElement('span');
        pip.className = 'pip';
        pip.style.gridRow = Math.ceil(position / 3);
        pip.style.gridColumn = (position - 1) % 3 + 1;
        face.append(pip);
      });
      cube.append(face);
    });
    cube.style.transform = orientation(0, 0);
    space.append(cube);
    row.append(space);
    return { cube, space, x: 0, y: 0 };
  });
}

async function roll() {
  if (rolling) return;
  rolling = true;
  rollButton.disabled = true;
  countButtons.forEach(button => { button.disabled = true; });
  row.classList.add('is-rolling');
  const values = dice.map(randomFace);
  await Promise.all(dice.map(async (die, index) => {
    const [x, y] = faceAngles[values[index] - 1];
    if (!reducedMotion.matches) {
      const animation = die.cube.animate([
        { transform: orientation(die.x, die.y), offset: 0 },
        { transform: `translateY(-32px) ${orientation(x + 240, y + 300)}`, offset: .38 },
        { transform: `translateY(-5px) ${orientation(x + 345, y + 355)}`, offset: .83 },
        { transform: orientation(x + 360, y + 360), offset: 1 }
      ], { duration: ROLL_DURATION_MS + index * 100, easing: 'cubic-bezier(.2,.65,.3,1)' });
      await animation.finished;
    }
    die.cube.style.transform = orientation(x, y);
    die.x = x;
    die.y = y;
    die.space.setAttribute('aria-label', `Die ${index + 1}: ${values[index]}`);
  }));
  const total = values.reduce((sum, value) => sum + value, 0);
  rolls += 1;
  history.unshift({ values, total });
  history = history.slice(0, HISTORY_LIMIT);
  document.getElementById('roll-total').textContent = total;
  document.getElementById('roll-values').textContent = values.join(' + ');
  document.getElementById('roll-count').textContent = rolls;
  const historyList = document.getElementById('roll-history');
  historyList.replaceChildren(...history.map(result => {
    const item = document.createElement('li');
    item.textContent = result.values.length > 1 ? `${result.values.join(' + ')} = ${result.total}` : String(result.total);
    return item;
  }));
  row.classList.remove('is-rolling');
  rolling = false;
  rollButton.disabled = false;
  countButtons.forEach(button => { button.disabled = false; });
}

countButtons.forEach(button => button.addEventListener('click', () => {
  if (rolling) return;
  diceCount = Number(button.dataset.count);
  countButtons.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
  buildDice();
}));
rollButton.addEventListener('click', roll);
document.addEventListener('dice-roll', roll);
document.addEventListener('keydown', event => {
  if (event.key !== ' ' || event.target.closest('button, a')) return;
  event.preventDefault();
  if (!event.repeat) roll();
});
buildDice();
