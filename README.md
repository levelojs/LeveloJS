<p align="center">
  <img src="./assets/logo-colored.svg" alt="Levelo JS logo" width="120" />
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

## What is Levelo JS?

Levelo JS is a lightweight JavaScript framework with zero runtime overhead, targeting the real DOM on the web and a WebView-free native engine.

The same source code can target:

- **Web**: real DOM output, tiny runtime, fast startup.
- **Native (Windows, early preview)**: the same JSX is rendered without a WebView, using QuickJS, Taffy (layout) and Skia (drawing). Android is planned.


## Features

- Real DOM rendering, no virtual DOM
- Fine-grained reactivity: `state`, `effect`, `computed`, `batch`
- Lifecycle helpers: `mount`, `cleanup`
- Built-in `style` and dynamic `head` management
- Built-in routing with `Pages` and `Page`
- Custom Babel JSX transform that compiles to direct `h()` calls
- One import path for every platform: `import { ... } from "levelojs"`
- TypeScript support

## Quick start

```bash
# Create a new project (check the docs for the latest command)
npx create-levelo-app my-app
cd my-app
npm install
npm run dev
```

## Example

```tsx
import { state } from "levelojs";

export function App() {
  // state() returns a getter and a setter
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

```tsx
// src/main.tsx
import { render } from "levelojs";
import { App } from "./App";

render(App);
```

## How it works

```
JSX
 └─ Levelo Babel transform  ->  h() calls
      ├─ web target:    real DOM nodes
      └─ native target: operation batch -> Taffy layout -> Skia drawing
```

The web and native renderers are separate, so a web-only app never ships
native code.

## Platform status

| Platform | Status |
| --- | --- |
| Web | Stable |
| Windows (native) | Early preview |
| Android (native) | Planned |

Native support is under active development. APIs and supported CSS may change,
and some features (such as scrolling and text input) are not available yet.

## Repository layout

```
packages/
  create-levelo-app    -> for creating template
  levelojs/            -> core runtime (web and native entries)
  levelo-cli/          -> CLI, compiler and bundlers
  levelo-windows/      -> native Windows host
assets/                -> logos and brand assets
```

## Contributing

Contributions are welcome. Please open an issue first for larger changes.
Pull requests are reviewed by the maintainers before they are merged.

## Credits

**Founder and lead developer:** MD Saiful Alom Siam, [@MotionMind2007](https://github.com/MotionMind2007)

**Contributors:**

- [Joseph Nicholas Aburu](https://github.com/Joseph4sure)

Levelo JS is built and maintained under [Motion Mind X](https://motionmindx.com).

## License

[MIT](./LICENSE) © Motion Mind X