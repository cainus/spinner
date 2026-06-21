# spinner

A small TypeScript web app: a multiplication-practice game built on two
*Game of Life*–style spinners (numbers **1–12**).

Press **Spin** and both wheels spin to two distinct numbers, forming a
multiplication question (`a × b = ?`). Then:

- A **15-second countdown** starts once the question is decided.
- Type your answer (the field accepts **digits only**) and press **Check**
  (or Enter).
- Or press **See the answer** to reveal the product.
- Your **score** is shown as a percentage correct over the latest **15**
  questions.

For division, a single dedicated wheel containing every non-prime number from
1 to 144 spins, and the divisor is chosen as a random factor of that number,
so the answer is always a whole number.

Revealing the answer or letting the timer run out counts the question as
incorrect.

## Tech

- [Vite](https://vitejs.dev/) + TypeScript
- SVG wheel with a CSS-animated spin

## Develop

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and build to dist/
npm run preview  # preview the production build
```
