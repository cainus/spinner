const DEFAULT_ITEMS = Array.from({ length: 12 }, (_, i) => String(i + 1)); // "1".."12"
const COLORS = [
  "#e63946", "#f4a261", "#2a9d8f", "#457b9d",
  "#e76f51", "#8ab17d", "#e9c46a", "#9d4edd",
  "#ff6b6b", "#1abc9c", "#3d5a80", "#c77dff",
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
  /**
   * Spin the wheel; resolves with the item under the pointer when it stops.
   * Pass a value present on the wheel to land on it; omit for a random landing.
   */
  spin(forcedItem?: string): Promise<string>;
  spinning: boolean;
}

export interface SpinnerOptions {
  /** The labels shown on the wheel, in order. Defaults to "1".."12". */
  items?: string[];
  /** Convenience for numeric wheels — converted to string items. */
  numbers?: number[];
  /**
   * How each label is rotated:
   * - "tangent": along the slice's tangent (default)
   * - "radial": along the slice's radius — leaves room for long labels
   */
  orientation?: "tangent" | "radial";
  /** Override the auto-computed label font size. */
  fontSize?: number;
}

export function createSpinner(mount: HTMLElement, options: SpinnerOptions = {}): Spinner {
  const items = options.items ?? options.numbers?.map(String) ?? DEFAULT_ITEMS;
  const orientation = options.orientation ?? "tangent";
  const segments = items.length;
  const segmentAngle = 360 / segments;

  // Scale labels and outlines so dense wheels stay legible.
  const fontSize = options.fontSize ?? Math.max(4, Math.min(22, segmentAngle * 0.7));
  const labelRadius =
    RADIUS * (orientation === "radial" ? 0.62 : segments > 24 ? 0.8 : 0.66);
  const strokeWidth = segments > 24 ? 0.3 : 1;

  const svg = el("svg", { viewBox: "0 0 200 200", class: "wheel-svg" });

  // Rotating group holds the wedges + labels.
  const wheel = el("g", { class: "wheel" });

  for (let i = 0; i < segments; i++) {
    const start = i * segmentAngle;
    const end = start + segmentAngle;
    const [x0, y0] = pointAt(start, RADIUS);
    const [x1, y1] = pointAt(end, RADIUS);
    const path = el("path", {
      d: `M ${CENTER} ${CENTER} L ${x0} ${y0} A ${RADIUS} ${RADIUS} 0 0 1 ${x1} ${y1} Z`,
      fill: COLORS[i % COLORS.length],
      stroke: "#1d1d1d",
      "stroke-width": strokeWidth,
    });
    wheel.appendChild(path);

    const mid = start + segmentAngle / 2;
    const [lx, ly] = pointAt(mid, labelRadius);
    // Tangent labels rotate by the mid angle; radial labels turn a further 90°
    // so the digits run outward along the radius.
    const labelAngle = orientation === "radial" ? mid - 90 : mid;
    const label = el("text", {
      x: lx,
      y: ly,
      "text-anchor": "middle",
      "dominant-baseline": "central",
      "font-size": fontSize,
      transform: `rotate(${labelAngle} ${lx} ${ly})`,
      class: "wheel-label",
    });
    label.textContent = items[i];
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
    spin(forcedItem?: string) {
      if (api.spinning) return Promise.resolve(currentItem());

      let targetIndex =
        forcedItem != null ? items.indexOf(forcedItem) : Math.floor(Math.random() * segments);
      if (targetIndex < 0) targetIndex = 0;

      // Land the centre of the chosen wedge under the top pointer, with a little jitter.
      const jitter = (Math.random() - 0.5) * (segmentAngle * 0.7);
      const desiredMod =
        (360 - (targetIndex * segmentAngle + segmentAngle / 2 + jitter)) % 360;
      const extraTurns = 4 + Math.floor(Math.random() * 3); // 4..6 full turns
      const delta =
        extraTurns * 360 + ((desiredMod - (currentRotation % 360)) + 360) % 360;
      currentRotation += delta;

      api.spinning = true;
      wheel.style.transform = `rotate(${currentRotation}deg)`;

      return new Promise<string>((resolve) => {
        const onEnd = () => {
          wheel.removeEventListener("transitionend", onEnd);
          api.spinning = false;
          resolve(items[targetIndex]);
        };
        wheel.addEventListener("transitionend", onEnd);
      });
    },
  };

  function currentItem(): string {
    const atTop = (((-currentRotation) % 360) + 360) % 360;
    return items[Math.floor(atTop / segmentAngle) % segments];
  }

  return api;
}
