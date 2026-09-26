const gameElement = document.querySelector(".game");
const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const resetButton = document.getElementById("reset");
const playerXCard = document.getElementById("card-x");
const playerOCard = document.getElementById("card-o");
const scoreXElement = document.getElementById("score-x");
const scoreOElement = document.getElementById("score-o");
const scoreDrawElement = document.getElementById("score-draw");
const moveCountElement = document.getElementById("move-count");
const streakLabelElement = document.getElementById("streak-label");
const roundLabelElement = document.getElementById("round-label");

const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

let boardState = Array(9).fill("");
let currentPlayer = "X";
let gameOver = false;
let winningCells = [];
let lastMoveIndex = null;
let roundNumber = 1;
let scores = {
  X: 0,
  O: 0,
  draw: 0
};
let streak = {
  player: "",
  count: 0
};
let introAnimationTimer = null;
const INTRO_MAX_DELAY = 620;

function createBoard() {
  boardElement.innerHTML = "";

  boardState.forEach((value, index) => {
    const button = document.createElement("button");
    button.className = "cell";
    button.type = "button";
    button.dataset.index = index;
    button.disabled = Boolean(value) || gameOver;
    button.dataset.value = value;

    applyCellState(button, value, index, false);

    button.addEventListener("click", handleMove);
    boardElement.appendChild(button);
  });

  updateActivePlayerCard();
  updateHud();
}

function updateBoard() {
  const buttons = boardElement.querySelectorAll(".cell");

  buttons.forEach((button, index) => {
    const value = boardState[index];
    const previousValue = button.dataset.value || "";
    const shouldAnimateMark = !previousValue && Boolean(value);

    button.disabled = Boolean(value) || gameOver;
    button.dataset.value = value;
    applyCellState(button, value, index, shouldAnimateMark);
  });

  updateActivePlayerCard();
  updateHud();
}

function applyCellState(button, value, index, shouldAnimateMark) {
  button.classList.toggle("x", value === "X");
  button.classList.toggle("o", value === "O");
  button.classList.toggle("win", winningCells.includes(index));
  button.classList.toggle("last-move", lastMoveIndex === index);

  button.textContent = "";

  if (!value) {
    return;
  }

  const mark = createMark(value);

  if (shouldAnimateMark) {
    mark.classList.add("is-drawing");
  } else {
    mark.classList.add("is-static");
  }

  button.appendChild(mark);
}

function createMark(value) {
  const mark = document.createElement("span");
  mark.className = `mark mark-${value.toLowerCase()}`;

  if (value === "X") {
    mark.innerHTML = [
      '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">',
      '<line x1="24" y1="22" x2="76" y2="78" pathLength="100"></line>',
      '<line x1="76" y1="22" x2="24" y2="78" pathLength="100"></line>',
      "</svg>"
    ].join("");
    return mark;
  }

  mark.innerHTML = [
    '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">',
    '<circle cx="50" cy="50" r="32" pathLength="100"></circle>',
    "</svg>"
  ].join("");
  return mark;
}

function handleMove(event) {
  const index = Number(event.currentTarget.dataset.index);

  if (boardState[index] || gameOver) {
    return;
  }

  boardState[index] = currentPlayer;
  lastMoveIndex = index;

  const winner = getWinner();
  if (winner) {
    gameOver = true;
    winningCells = winner.line;
    scores[winner.player] += 1;
    updateStreak(winner.player);
    statusElement.textContent = `Player ${winner.player} wins`;
  } else if (boardState.every(Boolean)) {
    gameOver = true;
    scores.draw += 1;
    streak.player = "";
    streak.count = 0;
    statusElement.textContent = "Draw game";
  } else {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusElement.textContent = `Player ${currentPlayer}'s turn`;
  }

  updateBoard();
}

function getWinner() {
  for (const [a, b, c] of winningLines) {
    if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
      return {
        player: boardState[a],
        line: [a, b, c]
      };
    }
  }

  return null;
}

function updateActivePlayerCard() {
  playerXCard.classList.toggle("is-active", !gameOver && currentPlayer === "X");
  playerOCard.classList.toggle("is-active", !gameOver && currentPlayer === "O");
}

function updateHud() {
  const movesPlayed = boardState.filter(Boolean).length;

  if (scoreXElement) {
    scoreXElement.textContent = String(scores.X);
  }

  if (scoreOElement) {
    scoreOElement.textContent = String(scores.O);
  }

  if (scoreDrawElement) {
    scoreDrawElement.textContent = String(scores.draw);
  }

  if (moveCountElement) {
    moveCountElement.textContent = String(movesPlayed);
  }

  if (roundLabelElement) {
    roundLabelElement.textContent = `Round ${roundNumber}`;
  }

  if (streakLabelElement) {
    streakLabelElement.textContent = streak.count > 1 ? `${streak.player} x${streak.count}` : "None";
  }
}

function updateStreak(player) {
  if (streak.player === player) {
    streak.count += 1;
    return;
  }

  streak.player = player;
  streak.count = 1;
}

function resetGame() {
  boardState = Array(9).fill("");
  currentPlayer = "X";
  gameOver = false;
  winningCells = [];
  lastMoveIndex = null;
  roundNumber += 1;
  statusElement.textContent = "Player X's turn";
  updateBoard();
  triggerIntroAnimation();
}

function triggerIntroAnimation() {
  if (introAnimationTimer) {
    window.clearTimeout(introAnimationTimer);
    introAnimationTimer = null;
  }

  applyIntroDelays();

  gameElement.classList.remove("is-intro");
  boardElement.classList.remove("is-intro");

  void gameElement.offsetWidth;
  void boardElement.offsetWidth;

  gameElement.classList.add("is-intro");
  boardElement.classList.add("is-intro");

  introAnimationTimer = window.setTimeout(() => {
    gameElement.classList.remove("is-intro");
    boardElement.classList.remove("is-intro");
    introAnimationTimer = null;
  }, 1200);
}

function applyIntroDelays() {
  const animatedElements = [
    ...gameElement.querySelectorAll(".status-panel, .scoreboard, .insight-card, .board, .cell")
  ];

  const viewportWidth = Math.max(window.innerWidth, 1);
  const viewportHeight = Math.max(window.innerHeight, 1);

  animatedElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const normalizedX = centerX / viewportWidth;
    const normalizedY = centerY / viewportHeight;
    const diagonalProgress = (normalizedX + normalizedY) / 2;
    const delay = Math.round(diagonalProgress * INTRO_MAX_DELAY);

    element.style.setProperty("--intro-delay", `${delay}ms`);
  });
}

resetButton.addEventListener("click", resetGame);
window.addEventListener("resize", applyIntroDelays);
createBoard();
triggerIntroAnimation();
