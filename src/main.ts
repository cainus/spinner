import { createSpinner } from "./spinner.ts";

const app = document.querySelector<HTMLDivElement>("#app")!;
const result = document.querySelector<HTMLParagraphElement>("#result")!;

const wheelWrap = document.createElement("div");
wheelWrap.className = "wheel-wrap";
app.appendChild(wheelWrap);

const spinner = createSpinner(wheelWrap);

const button = document.createElement("button");
button.id = "spin-btn";
button.textContent = "Spin";
app.appendChild(button);

async function doSpin() {
  if (spinner.spinning) return;
  button.disabled = true;
  result.textContent = "…";
  const value = await spinner.spin();
  result.textContent = `You spun ${value}!`;
  button.disabled = false;
}

button.addEventListener("click", doSpin);
wheelWrap.addEventListener("click", doSpin);
