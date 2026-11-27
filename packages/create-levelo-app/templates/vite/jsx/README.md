<p align="center">
  <img src="https://raw.githubusercontent.com/levelojs/LeveloJs/main/assets/logo-colored.svg" alt="Levelo JS logo" width="120" />
</p>

<h1 align="center">Levelo JS</h1>

<p align="center">
  A lightweight JavaScript framework with zero runtime overhead, targeting the real DOM on the web and a WebView-free native engine.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/levelojs"><img src="https://img.shields.io/npm/v/levelojs" alt="npm version" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license" />
  <a href="https://levelojs.motionmindx.com"><img src="https://img.shields.io/badge/Docs-7C6BF6" alt="Documentation" /></a>
</p>

<p align="center">
  A project by <a href="https://motionmindx.com"><b>Motion Mind X</b></a>
</p>

---

## Getting Started

This project was created with [create-levelo-app](https://github.com/levelojs/LeveloJs/tree/main/packages/create-levelo-app).

```bash
npm install
npm run dev
```

Open the local URL from the terminal to see your app.

## Project Structure

```
my-app/
├── src/
│   ├── App.tsx        <- Main component, start here
│   ├── main.tsx       <- App entry point
│   ├── App.css        <- Component styles
│   └── main.css       <- Global styles
├── index.html
├── vite.config.ts     <- Levelo Vite plugin pre-configured
└── package.json
```

## What is Levelo JS?

Levelo JS is a lightweight JavaScript framework with zero runtime overhead, targeting the real DOM on the web and a WebView-free native engine.

No Virtual DOM. State changes update only the target DOM node.

## Example

```tsx
import { state } from "levelojs";

export function App() {
  const [count, setCount] = state(0);

  return (
    <main>
      <h1>Hello, Levelo JS</h1>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(count() + 1)}>Increment</button>
    </main>
  );
}
```

## Features

- Real DOM rendering, no Virtual DOM
- Fine-grained reactivity: state, effect, computed, batch
- TypeScript and JSX support
- Vite-powered workflow with fast HMR
- Built-in routing, styles, and head management

## Learn More

- [Documentation](https://levelojs.motionmindx.com)
- [GitHub Repository](https://github.com/levelojs/LeveloJs)
