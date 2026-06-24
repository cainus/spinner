# spinner

A small TypeScript web app with two modes (switch via the tabs at the top):

- **Math** — an arithmetic-practice game built on *Game of Life*–style spinners.
- **Spinners** — a gallery of 16 themed wheels (Professions, Colors, Numbers,
  Holidays, Seasons, TV Shows, Animals, Fruits, Countries, Sports, Instruments,
  Planets, Emotions, Weather, Pizza Toppings, Board Games). Pick a category and
  spin to land on a random item.

## Math mode

Press **Spin** and both wheels spin to two distinct numbers, forming a
multiplication question (`a × b = ?`). Then:

- A **15-second countdown** starts once the question is decided.
- Type your answer (the field accepts **digits only**) and press **Check**
  (or Enter).
- Or press **See the answer** to reveal the product.
- Your **score** is shown as a percentage correct over the latest **15**
  questions.

Addition uses a dedicated pair of wheels with double the range (**1–24**);
subtraction and multiplication use **1–12** wheels.

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
