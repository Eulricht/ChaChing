const vocabulary = 'the of and to in you that it he was for on are as with his they at be this have from or one had by word but what some we can out other were all there when up use your how said an each she which do their time if will way about many then them write would like so these her long make thing see him two has look more day could go come did number sound no most people my over know water than call first who may down side been now find any new work part take get place made live where after back little only round man year came show every good me give our under name very through just form much great think say help low line before turn cause same mean differ move right boy old too does tell sentence set three want air well also play small end put home read hand port large spell add even land here must big high such follow act why ask men change went light kind off need house picture try us again animal point mother world near build self earth father head stand own page should country found answer school grow study still learn plant cover food sun four state keep eye never last let thought city tree cross farm hard start might story saw far sea draw left late run while press close night real life few stop open seem together next white children begin got walk example ease paper group always music those both mark often letter until mile river car feet care second book carry took science eat room friend began idea fish mountain north once base hear horse cut sure watch color face wood main enough plain girl usual young ready above ever red list though feel talk bird soon body dog family direct leave song measure door product black short wind question happen complete ship area half rock order fire south problem piece told knew pass since top whole king space heard best hour better true during hundred five remember step early hold west ground interest reach fast verb sing listen six table travel less morning ten simple several vowel toward war lay against pattern slow center love person money serve appear road map rain rule pull cold notice voice unit power town fine fly fall lead cry dark machine note wait plan figure star box field rest correct able'.split(' ');
const input = document.getElementById('typing-input');
const wordsElement = document.getElementById('words');
const viewport = document.getElementById('word-window');
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

function metrics(elapsed) {
  const correct = [...input.value].reduce((total, char, index) => total + Number(char === target[index]), 0);
  return { wpm: elapsed > 0 ? Math.round(correct / 5 / (elapsed / 60)) : 0,
    accuracy: attempts ? Math.round(correctAttempts / attempts * 100) : 100 };
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
  const elapsed = Math.min(duration, (performance.now() - startedAt) / 1000);
  const result = updateStats(elapsed);
  status.textContent = `Test complete. ${result.wpm} WPM, ${result.accuracy}% accuracy. Restart to try again.`;
}

function tick() {
  const elapsed = (performance.now() - startedAt) / 1000;
  if (elapsed >= duration) finish();
  else updateStats(elapsed);
}

function reset(focus = false) {
  clearInterval(timer);
  startedAt = null;
  finished = false;
  attempts = correctAttempts = 0;
  previous = '';
  input.value = '';
  input.disabled = false;
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
  characters[0].className = 'caret';
  input.maxLength = target.length;
  viewport.scrollTop = 0;
  status.textContent = 'The timer starts with your first character.';
  updateStats();
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
  characters.forEach((span, i) => {
    span.className = i < input.value.length ? (input.value[i] === target[i] ? 'correct' : 'incorrect') : '';
  });
  const caret = characters[input.value.length];
  if (caret) {
    caret.className = 'caret';
    viewport.scrollTop += caret.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 48;
  }
  if (startedAt !== null) tick();
  if (input.value.length === target.length) finish();
});
document.getElementById('restart').addEventListener('click', () => reset(true));
document.querySelectorAll('[data-seconds]').forEach(button => {
  button.addEventListener('click', () => {
    duration = Number(button.dataset.seconds);
    document.querySelectorAll('[data-seconds]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    reset(true);
  });
});
document.addEventListener('visibilitychange', () => { if (startedAt !== null && !finished) tick(); });
reset();
