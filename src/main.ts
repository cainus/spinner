import { createSpinner } from "./spinner.ts";

const SEGMENTS = 12;
const COUNTDOWN_SECONDS = 15;
const HISTORY_LIMIT = 15; // only the latest 15 questions count toward the score

const wheelsEl = document.querySelector<HTMLDivElement>("#wheels")!;
const spinBtn = document.querySelector<HTMLButtonElement>("#spin-btn")!;
const questionEl = document.querySelector<HTMLParagraphElement>("#question")!;
const timerEl = document.querySelector<HTMLDivElement>("#timer")!;
const inputEl = document.querySelector<HTMLInputElement>("#answer-input")!;
const checkBtn = document.querySelector<HTMLButtonElement>("#check-btn")!;
const answerBtn = document.querySelector<HTMLButtonElement>("#answer-btn")!;
const scoreEl = document.querySelector<HTMLParagraphElement>("#score")!;

function makeWheel() {
  const wrap = document.createElement("div");
  wrap.className = "wheel-wrap";
  wheelsEl.appendChild(wrap);
  return createSpinner(wrap);
}
const left = makeWheel();
const right = makeWheel();

const history: boolean[] = []; // true = answered correctly
let current: { a: number; b: number } | null = null;
let resolved = true; // no live question to answer yet
let timerId: number | null = null;
let remaining = 0;

/** Pick two distinct numbers in 1..SEGMENTS. */
function pickTwoDistinct(): [number, number] {
  const a = Math.floor(Math.random() * SEGMENTS) + 1;
  let b = Math.floor(Math.random() * (SEGMENTS - 1)) + 1;
  if (b >= a) b += 1; // skip a, keeping b a uniform distinct pick
  return [a, b];
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function renderTimer() {
  timerEl.textContent = `⏱ ${remaining}s`;
  timerEl.classList.toggle("urgent", remaining <= 5);
}

function startTimer() {
  remaining = COUNTDOWN_SECONDS;
  renderTimer();
  timerEl.hidden = false;
  timerId = window.setInterval(() => {
    remaining -= 1;
    renderTimer();
    if (remaining <= 0) resolveQuestion(null, "timeout");
  }, 1000);
}

function renderScore() {
  const total = history.length;
  if (total === 0) {
    scoreEl.textContent = "";
    return;
  }
  const correct = history.filter(Boolean).length;
  const pct = Math.round((correct / total) * 100);
  scoreEl.textContent = `Score: ${correct}/${total} correct — ${pct}% (last ${total})`;
}

async function spinBoth() {
  if (left.spinning || right.spinning || !resolved) return;

  resolved = false;
  current = null;
  stopTimer();
  spinBtn.disabled = true;
  answerBtn.hidden = true;
  inputEl.disabled = true;
  checkBtn.disabled = true;
  inputEl.value = "";
  questionEl.className = "";
  questionEl.textContent = "Spinning…";
  timerEl.hidden = true;

  const [a, b] = pickTwoDistinct();
  const [ra, rb] = await Promise.all([left.spin(a), right.spin(b)]);
  current = { a: ra, b: rb };

  // Question decided: open the field and start the countdown.
  questionEl.textContent = `${ra} × ${rb} = ?`;
  inputEl.disabled = false;
  checkBtn.disabled = false;
  answerBtn.hidden = false;
  inputEl.focus();
  startTimer();
}

type Outcome = "answer" | "reveal" | "timeout";

function resolveQuestion(userAnswer: number | null, how: Outcome) {
  if (!current || resolved) return;

  resolved = true;
  stopTimer();
  const { a, b } = current;
  const product = a * b;
  const correct = userAnswer === product;

  history.push(correct);
  while (history.length > HISTORY_LIMIT) history.shift();

  inputEl.disabled = true;
  checkBtn.disabled = true;
  answerBtn.hidden = true;
  timerEl.hidden = true;
  spinBtn.disabled = false;

  if (how === "answer") {
    questionEl.textContent = correct
      ? `Correct! ${a} × ${b} = ${product}`
      : `Not quite — ${a} × ${b} = ${product}`;
  } else if (how === "timeout") {
    questionEl.textContent = `⏰ Time's up! ${a} × ${b} = ${product}`;
  } else {
    questionEl.textContent = `${a} × ${b} = ${product}`;
  }
  questionEl.className = correct ? "correct" : "incorrect";
  renderScore();
}

function submitAnswer() {
  if (resolved || !current) return;
  const raw = inputEl.value.trim();
  if (raw === "") return; // nothing typed yet
  resolveQuestion(parseInt(raw, 10), "answer");
}

// Keep the field numbers-only.
inputEl.addEventListener("input", () => {
  const cleaned = inputEl.value.replace(/[^0-9]/g, "");
  if (cleaned !== inputEl.value) inputEl.value = cleaned;
});
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitAnswer();
});

checkBtn.addEventListener("click", submitAnswer);
answerBtn.addEventListener("click", () => resolveQuestion(null, "reveal"));
spinBtn.addEventListener("click", spinBoth);

renderScore();
