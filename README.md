# Platformer POC

A small 2D platformer proof-of-concept built with **Phaser 4**, **TypeScript**, and **Vite**.
Move with the arrow keys (or `A`/`D`), jump with `Space`/`W`/`Up`, stomp enemies, and reach the flag.

## Prerequisites

- **Node.js** — v20.19+ or v22.12+ (required by Vite 8). Newer LTS releases work too.
- **npm** — bundled with Node (v10+).

Check what you have:

```bash
node -v
npm -v
```

Then install dependencies once:

```bash
npm install
```

## Running the game

Start the Vite dev server (opens the game in your browser automatically at
[http://localhost:5173](http://localhost:5173), with hot-reload):

```bash
npm run dev
```

## Testing

**1. Unit tests ([Vitest](https://vitest.dev)).** Run the automated test suite once:

```bash
npm test
```

Or re-run tests automatically as you edit:

```bash
npm run test:watch
```

Tests live next to the code they cover as `*.test.ts` files (e.g.
`src/levels/patrol.test.ts`). The suite targets Phaser-free pure logic so it runs fast
without a browser or game instance.

**2. Type-check + production build.** The build script runs the TypeScript compiler in
no-emit mode (`tsc --noEmit`) and then bundles with Vite. If types are wrong or the
bundle fails, this is where you'll catch it:

```bash
npm run build
```

Output is written to `dist/`.

**3. Preview the production build.** Serve the built `dist/` output locally to verify the
release bundle behaves the same as the dev server:

```bash
npm run preview
```

**4. Manual play-testing.** Run `npm run dev` and verify the core loop by hand:

- Movement, jumping, and variable-height jumps (tap vs. hold) feel right.
- Stomping an enemy squashes it and bounces the player.
- Touching an enemy from the side, hitting spikes, or falling into a pit ends the run
  (Game Over).
- Reaching the flag triggers the Win screen.
