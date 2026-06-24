import { createSpinner, type Spinner } from "./spinner.ts";
import { THEMES } from "./themes.ts";

/** Wire up the themed "Spinners" tab: a category picker plus one wheel. */
export function initFunSpinners(): void {
  const select = document.querySelector<HTMLSelectElement>("#category")!;
  const wheelsEl = document.querySelector<HTMLDivElement>("#fun-wheels")!;
  const spinBtn = document.querySelector<HTMLButtonElement>("#fun-spin-btn")!;
  const resultEl = document.querySelector<HTMLParagraphElement>("#fun-result")!;

  THEMES.forEach((theme, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = theme.name;
    select.appendChild(opt);
  });

  let spinner: Spinner | null = null;
  let spinning = false;

  function build(themeIndex: number) {
    const theme = THEMES[themeIndex];
    wheelsEl.replaceChildren();
    resultEl.textContent = "";
    resultEl.className = "fun-result";

    const wrap = document.createElement("div");
    wrap.className = "wheel-wrap fun-wheel";
    wheelsEl.appendChild(wrap);
    spinner = createSpinner(wrap, { items: theme.items, orientation: "radial", fontSize: 8 });
  }

  build(0);
  select.addEventListener("change", () => build(Number(select.value)));

  spinBtn.addEventListener("click", async () => {
    if (!spinner || spinning) return;
    spinning = true;
    spinBtn.disabled = true;
    resultEl.textContent = "…";
    resultEl.className = "fun-result";
    const item = await spinner.spin();
    resultEl.textContent = `🎯 ${item}`;
    resultEl.className = "fun-result landed";
    spinning = false;
    spinBtn.disabled = false;
  });
}
