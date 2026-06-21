import { createSpinner } from "./spinner.ts";

const SEGMENTS = 12;
const COUNTDOWN_SECONDS = 15;
const HISTORY_LIMIT = 15; // only the latest 15 questions count toward the score

type OpKey = "add" | "subtract" | "multiply" | "divide";
const SYMBOLS: Record<OpKey, string> = {
  add: "+",
  subtract: "−",
  multiply: "×",
  divide: "÷",
};

const wheelsEl = document.querySelector<HTMLDivElement>("#wheels")!;
const spinBtn = document.querySelector<HTMLButtonElement>("#spin-btn")!;
const questionEl = document.querySelector<HTMLParagraphElement>("#question")!;
const timerEl = document.querySelector<HTMLDivElement>("#timer")!;
const inputEl = document.querySelector<HTMLInputElement>("#answer-input")!;
const checkBtn = document.querySelector<HTMLButtonElement>("#check-btn")!;
const answerBtn = document.querySelector<HTMLButtonElement>("#answer-btn")!;
const scoreEl = document.querySelector<HTMLParagraphElement>("#score")!;

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

/** Every non-prime number from 1 to 144 (1 and all composites). */
const NON_PRIMES = Array.from({ length: 144 }, (_, i) => i + 1).filter((n) => !isPrime(n));

function makeWheel(numbers?: number[]) {
  const wrap = document.createElement("div");
  wrap.className = "wheel-wrap";
  wheelsEl.appendChild(wrap);
  return { wrap, spinner: createSpinner(wrap, { numbers }) };
}
const left = makeWheel();
const right = makeWheel();
const divisionWheel = makeWheel(NON_PRIMES); // single wheel used for division
divisionWheel.wrap.classList.add("division-wheel");

const history: boolean[] = []; // true = answered correctly
let current: { a: number; b: number; answer: number; symbol: string } | null = null;
let resolved = true; // no live question to answer yet
let timerId: number | null = null;
let remaining = 0;

function selectedOp(): OpKey {
  const checked = document.querySelector<HTMLInputElement>('input[name="op"]:checked');
  return (checked?.value as OpKey) ?? "multiply";
}

/** Pick two distinct numbers in 1..SEGMENTS. */
function pickTwoDistinct(): [number, number] {
  const a = Math.floor(Math.random() * SEGMENTS) + 1;
  let b = Math.floor(Math.random() * (SEGMENTS - 1)) + 1;
  if (b >= a) b += 1; // skip a, keeping b a uniform distinct pick
  return [a, b];
}

/** All factors of n (1..n that divide it). */
function factorsOf(n: number): number[] {
  const factors: number[] = [];
  for (let d = 1; d <= n; d++) if (n % d === 0) factors.push(d);
  return factors;
}

/** Division uses its own single wheel (non-primes up to 144); the others are hidden. */
function syncWheelVisibility() {
  const dividing = selectedOp() === "divide";
  left.wrap.hidden = dividing;
  right.wrap.hidden = dividing;
  divisionWheel.wrap.hidden = !dividing;
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

/**
 * Spin both wheels and build a question for the chosen operation.
 * - subtraction: always larger − smaller (so the result is never negative)
 * - division: spin the non-primes wheel, divisor is a random factor of it
 */
async function spinForOperation(
  op: OpKey,
): Promise<{ a: number; b: number; answer: number }> {
  if (op === "divide") {
    // Spin the non-primes wheel, then choose a factor of that number as the divisor.
    const n = await divisionWheel.spinner.spin();
    const factors = factorsOf(n);
    const d = factors[Math.floor(Math.random() * factors.length)];
    return { a: n, b: d, answer: n / d };
  }

  let [a, b] = pickTwoDistinct();
  if (op === "subtract" && b > a) [a, b] = [b, a]; // larger on the left
  const [ra, rb] = await Promise.all([left.spinner.spin(a), right.spinner.spin(b)]);
  const answer =
    op === "add" ? ra + rb : op === "subtract" ? ra - rb : ra * rb;
  return { a: ra, b: rb, answer };
}

function anySpinning(): boolean {
  return left.spinner.spinning || right.spinner.spinning || divisionWheel.spinner.spinning;
}

async function spinBoth() {
  if (anySpinning() || !resolved) return;

  resolved = false;
  current = null;
  stopTimer();
  syncWheelVisibility();
  spinBtn.disabled = true;
  answerBtn.hidden = true;
  inputEl.disabled = true;
  checkBtn.disabled = true;
  inputEl.value = "";
  questionEl.className = "";
  questionEl.textContent = "Spinning…";
  timerEl.hidden = true;

  const op = selectedOp();
  const symbol = SYMBOLS[op];
  const { a, b, answer } = await spinForOperation(op);
  current = { a, b, answer, symbol };

  // Question decided: open the field and start the countdown.
  questionEl.textContent = `${a} ${symbol} ${b} = ?`;
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
  const { a, b, answer, symbol } = current;
  const correct = userAnswer === answer;

  history.push(correct);
  while (history.length > HISTORY_LIMIT) history.shift();

  inputEl.disabled = true;
  checkBtn.disabled = true;
  answerBtn.hidden = true;
  timerEl.hidden = true;
  spinBtn.disabled = false;

  const equation = `${a} ${symbol} ${b} = ${answer}`;
  if (how === "answer") {
    questionEl.textContent = correct ? `Correct! ${equation}` : `Not quite — ${equation}`;
  } else if (how === "timeout") {
    questionEl.textContent = `⏰ Time's up! ${equation}`;
  } else {
    questionEl.textContent = equation;
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

// Preview the right layout for the chosen operation when idle (no live question).
document.querySelectorAll<HTMLInputElement>('input[name="op"]').forEach((radio) =>
  radio.addEventListener("change", () => {
    if (resolved && !anySpinning()) syncWheelVisibility();
  }),
);

syncWheelVisibility(); // hide the division wheel until ÷ is chosen
renderScore();
