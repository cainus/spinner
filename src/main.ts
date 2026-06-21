import { createSpinner } from "./spinner.ts";

const SEGMENTS = 12;

const app = document.querySelector<HTMLDivElement>("#app")!;
const result = document.querySelector<HTMLParagraphElement>("#result")!;

// Two side-by-side spinners.
const wheels = document.createElement("div");
wheels.className = "wheels";
app.appendChild(wheels);

function makeWheel(): ReturnType<typeof createSpinner> {
  const wrap = document.createElement("div");
  wrap.className = "wheel-wrap";
  wheels.appendChild(wrap);
  return createSpinner(wrap);
}

const left = makeWheel();
const right = makeWheel();

// Controls.
const spinBtn = document.createElement("button");
spinBtn.id = "spin-btn";
spinBtn.textContent = "Spin";
app.appendChild(spinBtn);

const answerBtn = document.createElement("button");
answerBtn.id = "answer-btn";
answerBtn.textContent = "See the answer";
answerBtn.hidden = true;
app.appendChild(answerBtn);

let pending: { a: number; b: number } | null = null;

/** Pick two distinct numbers in 1..SEGMENTS. */
function pickTwoDistinct(): [number, number] {
  const a = Math.floor(Math.random() * SEGMENTS) + 1;
  let b = Math.floor(Math.random() * (SEGMENTS - 1)) + 1;
  if (b >= a) b += 1; // skip a, keeping a uniform distinct pick
  return [a, b];
}

async function spinBoth() {
  if (left.spinning || right.spinning) return;

  spinBtn.disabled = true;
  answerBtn.hidden = true;
  result.textContent = "…";

  const [a, b] = pickTwoDistinct();
  const [resA, resB] = await Promise.all([left.spin(a), right.spin(b)]);

  pending = { a: resA, b: resB };
  result.textContent = `${resA} × ${resB} = ?`;
  answerBtn.hidden = false;
  spinBtn.disabled = false;
}

function revealAnswer() {
  if (!pending) return;
  const { a, b } = pending;
  result.textContent = `${a} × ${b} = ${a * b}`;
  answerBtn.hidden = true;
}

spinBtn.addEventListener("click", spinBoth);
answerBtn.addEventListener("click", revealAnswer);
