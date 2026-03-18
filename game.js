const screens = {
  start: document.getElementById("start-screen"),
  memory: document.getElementById("memory-screen"),
  game: document.getElementById("game-screen"),
  end: document.getElementById("end-screen"),
};

const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const backBtn = document.getElementById("back-btn");
const countdownOverlay = document.getElementById("countdown-overlay");

const memoryBar = document.getElementById("memory-bar");
const memoryTimeText = document.getElementById("memory-time");
const memoryCard = document.getElementById("memory-card");
const memoryColor = memoryCard.querySelector(".memory-color");
const memoryProject = memoryCard.querySelector(".memory-project");
const memoryIcon = document.getElementById("memory-icon");

const gameBar = document.getElementById("game-bar");
const gameTimeText = document.getElementById("game-time");
const scoreText = document.getElementById("score");
const fallArea = document.getElementById("fall-area");
const tubeRow = document.getElementById("tube-row");
const tubes = Array.from(tubeRow.querySelectorAll(".tube"));

const finalScoreText = document.getElementById("final-score");
const evaluationText = document.getElementById("evaluation");

const ICONS = {
  rbc: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="22" cy="32" r="14" fill="#ff6b6b" />
      <circle cx="22" cy="32" r="6" fill="#ffd1d1" />
      <circle cx="44" cy="28" r="12" fill="#ffffff" stroke="#9bc2ff" stroke-width="4" />
    </svg>
  `,
  bandage: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="10" y="24" width="44" height="16" rx="6" fill="#f6d3a6" stroke="#e4b97f" stroke-width="2" />
      <rect x="26" y="16" width="12" height="32" rx="4" fill="#fbe7c6" />
      <circle cx="22" cy="32" r="2" fill="#d8a56b" />
      <circle cx="32" cy="32" r="2" fill="#d8a56b" />
      <circle cx="42" cy="32" r="2" fill="#d8a56b" />
    </svg>
  `,
  sediment: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="18" cy="18" r="4" fill="#ff6b6b" />
      <circle cx="30" cy="26" r="4" fill="#ff6b6b" />
      <circle cx="42" cy="34" r="4" fill="#ff6b6b" />
      <path d="M32 12 L32 40" stroke="#4d5dff" stroke-width="4" stroke-linecap="round" />
      <path d="M24 36 L32 46 L40 36" fill="none" stroke="#4d5dff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `,
  liver: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M10 34 C12 18, 36 10, 50 22 C58 30, 54 46, 40 48 C30 49, 20 46, 16 40 Z" fill="#ff8b74" stroke="#e56a5b" stroke-width="2" />
    </svg>
  `,
  shield: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 8 L50 14 V30 C50 42 42 52 32 56 C22 52 14 42 14 30 V14 Z" fill="#a8e6cf" stroke="#4abf7d" stroke-width="3" />
      <circle cx="38" cy="30" r="6" fill="#59c68a" />
      <circle cx="38" cy="30" r="2" fill="#ffffff" />
      <line x1="38" y1="20" x2="38" y2="16" stroke="#4abf7d" stroke-width="2" />
      <line x1="38" y1="44" x2="38" y2="48" stroke="#4abf7d" stroke-width="2" />
      <line x1="28" y1="30" x2="24" y2="30" stroke="#4abf7d" stroke-width="2" />
      <line x1="48" y1="30" x2="52" y2="30" stroke="#4abf7d" stroke-width="2" />
    </svg>
  `,
  emergency: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <polyline points="10,36 22,36 28,24 34,44 40,32 54,32" fill="none" stroke="#ff6f6f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      <polygon points="32,10 22,34 34,34 26,54 44,28 32,28" fill="#ffd43b" />
    </svg>
  `,
};

const CARD_DATA = [
  {
    color: "purple",
    colorName: "紫色管",
    project: "血常规检查",
    icon: ICONS.rbc,
    colorHex: "#7a58ff",
  },
  {
    color: "blue",
    colorName: "蓝色管",
    project: "凝血四项",
    icon: ICONS.bandage,
    colorHex: "#3d7bff",
  },
  {
    color: "black",
    colorName: "黑色管",
    project: "血沉检测",
    icon: ICONS.sediment,
    colorHex: "#3b3b3b",
  },
  {
    color: "red",
    colorName: "红色管",
    project: "肝功能",
    icon: ICONS.liver,
    colorHex: "#ff5b5b",
  },
  {
    color: "yellow",
    colorName: "黄色管",
    project: "乙肝五项",
    icon: ICONS.shield,
    colorHex: "#ffcc4d",
  },
  {
    color: "green",
    colorName: "绿色管",
    project: "急诊生化检测",
    icon: ICONS.emergency,
    colorHex: "#41c97f",
  },
];

let audioContext = null;
let memoryInterval = null;
let memoryTimer = null;
let gameTimer = null;
let spawnTimeout = null;
let animationFrame = null;
let cards = [];
let score = 0;
let gameRunning = false;
let gameStartTime = 0;

function showScreen(name) {
  Object.entries(screens).forEach(([key, screen]) => {
    if (key === name) {
      screen.classList.add("active");
    } else {
      screen.classList.remove("active");
    }
  });
}

function setBar(fillEl, remainingMs, totalMs) {
  const ratio = Math.max(0, Math.min(1, remainingMs / totalMs));
  fillEl.style.width = `${ratio * 100}%`;
}

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playTone(type) {
  if (!audioContext) return;
  const duration = type === "success" ? 0.18 : 0.22;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.value = type === "success" ? 740 : 220;
  gain.gain.value = 0.15;

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();

  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
  oscillator.stop(audioContext.currentTime + duration);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runCountdown() {
  countdownOverlay.classList.remove("hidden");
  const sequence = ["3", "2", "1", "开始!"];
  for (const value of sequence) {
    countdownOverlay.textContent = value;
    await wait(value === "开始!" ? 600 : 800);
  }
  countdownOverlay.classList.add("hidden");
}

function renderMemoryCard(data) {
  memoryColor.textContent = data.colorName;
  memoryProject.textContent = data.project;
  memoryIcon.innerHTML = data.icon;
  memoryCard.style.border = `4px solid ${data.colorHex}`;
  memoryColor.style.color = data.colorHex;
  memoryCard.style.background = `linear-gradient(140deg, ${data.colorHex}22, #ffffff 65%)`;
}

function startMemoryPhase() {
  clearAllTimers();
  showScreen("memory");

  const totalMs = 30000;
  const endTime = Date.now() + totalMs;
  let index = 0;
  renderMemoryCard(CARD_DATA[index]);

  memoryInterval = setInterval(() => {
    index = (index + 1) % CARD_DATA.length;
    renderMemoryCard(CARD_DATA[index]);
  }, 2000);

  memoryTimer = setInterval(() => {
    const remaining = endTime - Date.now();
    setBar(memoryBar, remaining, totalMs);
    memoryTimeText.textContent = Math.max(0, Math.ceil(remaining / 1000));
    if (remaining <= 0) {
      clearInterval(memoryInterval);
      clearInterval(memoryTimer);
      startGamePhase();
    }
  }, 100);
}

function resetGameState() {
  cards.forEach((card) => card.el.remove());
  cards = [];
  score = 0;
  scoreText.textContent = score;
}

function startGamePhase() {
  clearAllTimers();
  showScreen("game");
  resetGameState();

  const totalMs = 30000;
  const endTime = Date.now() + totalMs;
  gameStartTime = Date.now();
  gameRunning = true;

  const tickTimer = () => {
    const remaining = endTime - Date.now();
    setBar(gameBar, remaining, totalMs);
    gameTimeText.textContent = Math.max(0, Math.ceil(remaining / 1000));
    if (remaining <= 0) {
      endGame();
    }
  };

  gameTimer = setInterval(tickTimer, 100);
  tickTimer();

  scheduleSpawn();
  startAnimationLoop();
}

function scheduleSpawn() {
  if (!gameRunning) return;
  const elapsed = (Date.now() - gameStartTime) / 1000;
  const interval = Math.max(420, 900 - elapsed * 8);
  spawnTimeout = setTimeout(() => {
    spawnCard();
    scheduleSpawn();
  }, interval);
}

function spawnCard() {
  if (!gameRunning) return;
  const data = CARD_DATA[Math.floor(Math.random() * CARD_DATA.length)];
  const cardEl = document.createElement("div");
  cardEl.className = "fall-card";
  cardEl.innerHTML = `
    <div class="card-icon">${data.icon}</div>
    <div class="card-text">${data.project}</div>
  `;

  fallArea.appendChild(cardEl);

  const fallRect = fallArea.getBoundingClientRect();
  const width = cardEl.offsetWidth;
  const height = cardEl.offsetHeight;
  const x = Math.random() * Math.max(10, fallRect.width - width - 10) + 5;

  const card = {
    el: cardEl,
    color: data.color,
    x,
    y: -height,
    speed: 80 + Math.random() * 60,
    width,
    height,
    dragging: false,
    offsetX: 0,
    offsetY: 0,
  };

  cardEl.addEventListener("pointerdown", (event) => startDrag(event, card));
  cardEl.addEventListener("pointermove", (event) => dragMove(event, card));
  cardEl.addEventListener("pointerup", (event) => endDrag(event, card));
  cardEl.addEventListener("pointercancel", (event) => endDrag(event, card));

  cards.push(card);
  updateCardPosition(card);
}

function startDrag(event, card) {
  if (!gameRunning) return;
  card.dragging = true;
  card.el.classList.add("dragging");
  card.el.setPointerCapture(event.pointerId);

  const rect = fallArea.getBoundingClientRect();
  card.offsetX = event.clientX - rect.left - card.x;
  card.offsetY = event.clientY - rect.top - card.y;
}

function dragMove(event, card) {
  if (!card.dragging) return;
  const rect = fallArea.getBoundingClientRect();
  card.x = event.clientX - rect.left - card.offsetX;
  card.y = event.clientY - rect.top - card.offsetY;
  updateCardPosition(card);
}

function endDrag(event, card) {
  if (!card.dragging) return;
  card.dragging = false;
  card.el.classList.remove("dragging");

  const tube = getTubeAtPoint(event.clientX, event.clientY);
  if (tube) {
    const tubeColor = tube.dataset.color;
    if (tubeColor === card.color) {
      handleSuccess(card, tube);
      return;
    }
    handleFail(card, tube);
  }
}

function handleSuccess(card, tube) {
  playTone("success");
  score += 10;
  scoreText.textContent = score;
  flashTube(tube, "flash-success");
  removeCard(card);
}

function handleFail(card, tube) {
  playTone("fail");
  score = Math.max(0, score - 5);
  scoreText.textContent = score;
  flashTube(tube, "flash-fail");
  card.el.classList.add("card-shake");
  card.y = Math.max(0, card.y - 70);
  setTimeout(() => card.el.classList.remove("card-shake"), 300);
}

function flashTube(tube, className) {
  tube.classList.add(className);
  setTimeout(() => tube.classList.remove(className), 260);
}

function getTubeAtPoint(x, y) {
  for (const tube of tubes) {
    const rect = tube.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return tube;
    }
  }
  return null;
}

function removeCard(card) {
  const index = cards.indexOf(card);
  if (index >= 0) {
    cards.splice(index, 1);
  }
  card.el.remove();
}

function updateCardPosition(card) {
  card.el.style.transform = `translate(${card.x}px, ${card.y}px)`;
}

function startAnimationLoop() {
  let lastTime = performance.now();
  const step = (time) => {
    if (!gameRunning) return;
    const delta = (time - lastTime) / 1000;
    lastTime = time;

    const elapsed = (Date.now() - gameStartTime) / 1000;
    const speedMultiplier = 1 + Math.min(0.9, elapsed / 30);

    const fallRect = fallArea.getBoundingClientRect();
    cards.forEach((card) => {
      if (!card.dragging) {
        card.y += card.speed * speedMultiplier * delta;
        updateCardPosition(card);
      }
    });

    cards = cards.filter((card) => {
      if (card.y > fallRect.height) {
        card.el.remove();
        return false;
      }
      return true;
    });

    animationFrame = requestAnimationFrame(step);
  };

  animationFrame = requestAnimationFrame(step);
}

function endGame() {
  if (!gameRunning) return;
  gameRunning = false;
  clearAllTimers();
  cards.forEach((card) => card.el.remove());
  cards = [];

  finalScoreText.textContent = score;
  evaluationText.textContent = getEvaluation(score);
  showScreen("end");
}

function getEvaluation(currentScore) {
  if (currentScore >= 160) return "检验达人！彩虹密码全都记住了。";
  if (currentScore >= 110) return "非常出色！检验质量守护到位。";
  if (currentScore >= 60) return "不错哦！再巩固一下颜色和项目。";
  if (currentScore >= 20) return "起步顺利，继续加油记忆彩虹密码。";
  return "别灰心，再来一次就会更熟练。";
}

function clearAllTimers() {
  if (memoryInterval) clearInterval(memoryInterval);
  if (memoryTimer) clearInterval(memoryTimer);
  if (gameTimer) clearInterval(gameTimer);
  if (spawnTimeout) clearTimeout(spawnTimeout);
  if (animationFrame) cancelAnimationFrame(animationFrame);
  gameRunning = false;
  memoryInterval = null;
  memoryTimer = null;
  gameTimer = null;
  spawnTimeout = null;
  animationFrame = null;
}

function startFlow() {
  initAudio();
  runCountdown().then(startMemoryPhase);
}

startBtn.addEventListener("click", startFlow);
restartBtn.addEventListener("click", startFlow);
backBtn.addEventListener("click", () => {
  clearAllTimers();
  resetGameState();
  showScreen("start");
});

showScreen("start");
