const SEGMENTS = 8;
const SEGMENT_ANGLE = 360 / SEGMENTS; // 45°
const NUMBERS = Array.from({ length: SEGMENTS }, (_, i) => i + 1); // 1..8
const COLORS = [
  "#e63946", "#f4a261", "#2a9d8f", "#457b9d",
  "#e76f51", "#8ab17d", "#e9c46a", "#9d4edd",
];

const SVG = "http://www.w3.org/2000/svg";
const CENTER = 100;
const RADIUS = 92;

/** Point on the wheel, with angle measured clockwise from the top (12 o'clock). */
function pointAt(angleDeg: number, radius: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [CENTER + radius * Math.sin(rad), CENTER - radius * Math.cos(rad)];
}

function el<K extends keyof SVGElementTagNameMap>(
  name: K,
  attrs: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

export interface Spinner {
  /** Spin the wheel; resolves with the number under the pointer when it stops. */
  spin(): Promise<number>;
  spinning: boolean;
}

export function createSpinner(mount: HTMLElement): Spinner {
  const svg = el("svg", { viewBox: "0 0 200 200", class: "wheel-svg" });

  // Rotating group holds the wedges + labels.
  const wheel = el("g", { class: "wheel" });

  for (let i = 0; i < SEGMENTS; i++) {
    const start = i * SEGMENT_ANGLE;
    const end = start + SEGMENT_ANGLE;
    const [x0, y0] = pointAt(start, RADIUS);
    const [x1, y1] = pointAt(end, RADIUS);
    const path = el("path", {
      d: `M ${CENTER} ${CENTER} L ${x0} ${y0} A ${RADIUS} ${RADIUS} 0 0 1 ${x1} ${y1} Z`,
      fill: COLORS[i],
      stroke: "#1d1d1d",
      "stroke-width": 1,
    });
    wheel.appendChild(path);

    const mid = start + SEGMENT_ANGLE / 2;
    const [lx, ly] = pointAt(mid, RADIUS * 0.66);
    const label = el("text", {
      x: lx,
      y: ly,
      "text-anchor": "middle",
      "dominant-baseline": "central",
      // Rotate the digit to align with the slice's tangent (perpendicular to its radius).
      transform: `rotate(${mid} ${lx} ${ly})`,
      class: "wheel-label",
    });
    label.textContent = String(NUMBERS[i]);
    wheel.appendChild(label);
  }

  // Hub in the centre.
  wheel.appendChild(el("circle", { cx: CENTER, cy: CENTER, r: 10, fill: "#1d1d1d" }));
  svg.appendChild(wheel);

  // Fixed pointer at the top, pointing into the wheel.
  const pointer = el("polygon", {
    points: `${CENTER - 10},6 ${CENTER + 10},6 ${CENTER},30`,
    fill: "#1d1d1d",
    class: "pointer",
  });
  svg.appendChild(pointer);

  mount.appendChild(svg);

  let currentRotation = 0;
  const api: Spinner = {
    spinning: false,
    spin() {
      if (api.spinning) return Promise.resolve(currentNumber());

      const targetIndex = Math.floor(Math.random() * SEGMENTS);
      // Land the centre of the chosen wedge under the top pointer, with a little jitter.
      const jitter = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.7);
      const desiredMod =
        (360 - (targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2 + jitter)) % 360;
      const extraTurns = 4 + Math.floor(Math.random() * 3); // 4..6 full turns
      const delta =
        extraTurns * 360 + ((desiredMod - (currentRotation % 360)) + 360) % 360;
      currentRotation += delta;

      api.spinning = true;
      wheel.style.transform = `rotate(${currentRotation}deg)`;

      return new Promise<number>((resolve) => {
        const onEnd = () => {
          wheel.removeEventListener("transitionend", onEnd);
          api.spinning = false;
          resolve(targetIndex + 1);
        };
        wheel.addEventListener("transitionend", onEnd);
      });
    },
  };

  function currentNumber(): number {
    const atTop = (((-currentRotation) % 360) + 360) % 360;
    return (Math.floor(atTop / SEGMENT_ANGLE) % SEGMENTS) + 1;
  }

  return api;
}
