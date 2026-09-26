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
const playerXLabel = document.getElementById("label-x");
const playerOLabel = document.getElementById("label-o");
const winLineElement = document.getElementById("win-line");
const winLinePath = document.getElementById("win-line-path");
const modeButtons = document.querySelectorAll("[data-mode]");

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
let aiThinking = false;
let gameMode = "pvp";
let aiTimer = null;
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
const INTRO_CELL_DELAY = 110;
const INTRO_DURATION = 950;

function createBoard() {
  boardElement.querySelectorAll(".cell").forEach(cell => cell.remove());

  boardState.forEach((value, index) => {
    const button = document.createElement("button");
    button.className = "cell";
    button.type = "button";
    button.dataset.index = index;
    button.disabled = Boolean(value) || gameOver || aiThinking;
    button.dataset.value = value;

    applyCellState(button, value, index, false);

    button.addEventListener("click", handleMove);
    boardElement.insertBefore(button, winLineElement);
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

    button.disabled = Boolean(value) || gameOver || aiThinking;
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
    '<path d="M50 18 A32 32 0 1 1 50 82 A32 32 0 1 1 50 18" pathLength="100"></path>',
    "</svg>"
  ].join("");
  return mark;
}

function handleMove(event) {
  const index = Number(event.currentTarget.dataset.index);

  if (boardState[index] || gameOver || aiThinking || (gameMode !== "pvp" && currentPlayer === "O")) {
    return;
  }

  playMove(index);
}

function playMove(index) {
  if (boardState[index] || gameOver) return;

  boardState[index] = currentPlayer;
  lastMoveIndex = index;

  const winner = getWinner();
  if (winner) {
    gameOver = true;
    winningCells = winner.line;
    scores[winner.player] += 1;
    updateStreak(winner.player);
    statusElement.textContent = gameMode === "pvp" ? `Player ${winner.player} wins` : winner.player === "X" ? "You win" : "Computer wins";
    showWinningLine(winner.line);
  } else if (boardState.every(Boolean)) {
    gameOver = true;
    scores.draw += 1;
    streak.player = "";
    streak.count = 0;
    statusElement.textContent = "Draw game";
  } else {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    if (gameMode === "pvp") {
      statusElement.textContent = `Player ${currentPlayer}'s turn`;
    } else if (currentPlayer === "O") {
      aiThinking = true;
      statusElement.textContent = "Computer is thinking";
    } else {
      statusElement.textContent = "Your turn";
    }
  }

  updateBoard();

  if (aiThinking && !gameOver) {
    aiTimer = window.setTimeout(playComputerMove, 320);
  }
}

function getWinner(state = boardState) {
  for (const [a, b, c] of winningLines) {
    if (state[a] && state[a] === state[b] && state[a] === state[c]) {
      return {
        player: state[a],
        line: [a, b, c]
      };
    }
  }

  return null;
}

function updateActivePlayerCard() {
  playerXCard.classList.toggle("is-active", !gameOver && currentPlayer === "X");
  playerOCard.classList.toggle("is-active", !gameOver && currentPlayer === "O");
  playerXLabel.textContent = gameMode === "pvp" ? "Player X" : "You";
  playerOLabel.textContent = gameMode === "pvp" ? "Player O" : "Computer";
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
  window.clearTimeout(aiTimer);
  boardState = Array(9).fill("");
  currentPlayer = "X";
  gameOver = false;
  aiThinking = false;
  winningCells = [];
  lastMoveIndex = null;
  roundNumber += 1;
  statusElement.textContent = gameMode === "pvp" ? "Player X's turn" : "Your turn";
  hideWinningLine();
  updateBoard();
  triggerIntroAnimation();
}

function triggerIntroAnimation() {
  if (introAnimationTimer) {
    window.clearTimeout(introAnimationTimer);
    introAnimationTimer = null;
  }

  boardElement.classList.remove("is-intro");
  void boardElement.offsetWidth;
  boardElement.classList.add("is-intro");

  introAnimationTimer = window.setTimeout(() => {
    boardElement.classList.remove("is-intro");
    introAnimationTimer = null;
  }, INTRO_DURATION + INTRO_CELL_DELAY * 4 + 120);
}

function applyIntroDelays() {
  boardElement.querySelectorAll(".cell").forEach((element, index) => {
    const row = Math.floor(index / 3);
    const column = index % 3;
    element.style.setProperty("--intro-delay", `${(row + column) * INTRO_CELL_DELAY}ms`);
  });
}

function openCells(state = boardState) {
  return state.map((value, index) => value ? -1 : index).filter(index => index !== -1);
}

function findTacticalMove(player) {
  return openCells().find(index => {
    const test = [...boardState];
    test[index] = player;
    return getWinner(test)?.player === player;
  });
}

function minimax(state, maximizing, depth = 0) {
  const winner = getWinner(state);
  if (winner?.player === "O") return 10 - depth;
  if (winner?.player === "X") return depth - 10;
  const choices = openCells(state);
  if (!choices.length) return 0;

  const scoresForMoves = choices.map(index => {
    const next = [...state];
    next[index] = maximizing ? "O" : "X";
    return minimax(next, !maximizing, depth + 1);
  });
  return maximizing ? Math.max(...scoresForMoves) : Math.min(...scoresForMoves);
}

function randomChoice(choices) {
  return choices[Math.floor(Math.random() * choices.length)];
}

function sensibleMove(choices) {
  const corners = choices.filter(index => [0, 2, 6, 8].includes(index));
  if (choices.includes(4) && Math.random() < .45) return 4;
  if (corners.length && Math.random() < .7) return randomChoice(corners);
  return randomChoice(choices);
}

function optimalMoves(choices) {
  const scoredMoves = choices.map(index => {
    const next = [...boardState];
    next[index] = "O";
    return { index, score: minimax(next, false, 1) };
  });
  const bestScore = Math.max(...scoredMoves.map(move => move.score));
  return scoredMoves.filter(move => move.score === bestScore).map(move => move.index);
}

function chooseComputerMove() {
  const choices = openCells();
  const winningMove = findTacticalMove("O");
  const blockingMove = findTacticalMove("X");

  if (gameMode === "easy") {
    if (winningMove !== undefined && Math.random() < .6) return winningMove;
    if (blockingMove !== undefined && Math.random() < .18) return blockingMove;
    return sensibleMove(choices);
  }

  if (gameMode === "medium") {
    if (winningMove !== undefined) return winningMove;
    if (blockingMove !== undefined && Math.random() < .72) return blockingMove;
    return Math.random() < .5 ? randomChoice(optimalMoves(choices)) : sensibleMove(choices);
  }

  return randomChoice(optimalMoves(choices));
}

function playComputerMove() {
  aiThinking = false;
  const move = chooseComputerMove();
  if (move !== undefined) playMove(move);
}

function showWinningLine(line) {
  const boardRect = boardElement.getBoundingClientRect();
  const cells = boardElement.querySelectorAll(".cell");
  const centerOf = index => {
    const rect = cells[index].getBoundingClientRect();
    return {
      x: (rect.left + rect.width / 2 - boardRect.left) / boardRect.width * 100,
      y: (rect.top + rect.height / 2 - boardRect.top) / boardRect.height * 100
    };
  };
  const start = centerOf(line[0]);
  const end = centerOf(line[2]);
  winLinePath.setAttribute("x1", start.x);
  winLinePath.setAttribute("y1", start.y);
  winLinePath.setAttribute("x2", end.x);
  winLinePath.setAttribute("y2", end.y);
  winLineElement.classList.remove("is-visible");
  void winLineElement.getBoundingClientRect();
  winLineElement.classList.add("is-visible");
}

function hideWinningLine() {
  winLineElement.classList.remove("is-visible");
}

function changeMode(mode) {
  if (mode === gameMode) return;
  gameMode = mode;
  modeButtons.forEach(button => {
    const selected = button.dataset.mode === mode;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-checked", String(selected));
  });
  scores = { X: 0, O: 0, draw: 0 };
  streak = { player: "", count: 0 };
  roundNumber = 0;
  resetGame();
}

resetButton.addEventListener("click", resetGame);
modeButtons.forEach(button => button.addEventListener("click", () => changeMode(button.dataset.mode)));
createBoard();
applyIntroDelays();
triggerIntroAnimation();
