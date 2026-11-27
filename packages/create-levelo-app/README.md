<div align="center">
<img style="width: 200px; height: 200px;" src="https://raw.githubusercontent.com/levelojs/LeveloJs/main/assets/logo-colored.svg">
  <h1>create-levelo-app</h1>
  <a href="https://motionmindx.com"><img alt="Made by Motion Mind X" src="https://img.shields.io/badge/MADE%20BY%20Motion%20Mind%20X-000000.svg?style=for-the-badge&labelColor=000"></a>
  <a href="https://www.npmjs.com/package/create-levelo-app"><img alt="NPM version" src="https://img.shields.io/npm/v/create-levelo-app.svg?style=for-the-badge&labelColor=000000"></a>
  <a href="https://github.com/levelojs/LeveloJs/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-000000.svg?style=for-the-badge&labelColor=000000"></a>
</div>

<br/>

> The official CLI to scaffold [Levelo JS](https://github.com/levelojs/LeveloJs) projects instantly.
> No Virtual DOM. Direct Real DOM. Built for speed and simplicity by [Motion Mind X](https://motionmindx.com).

---

## Quick Start

```sh
npx create-levelo-app my-app
cd my-app
npm run dev
```

That's it. You're leveling up. ⚡

---

## Usage

```sh
npx create-levelo-app <project-name>
```

To scaffold inside the current directory:

```sh
npx create-levelo-app .
```

Skip the menu with a template:

```sh
npx create-levelo-app my-app --template vite-tsx
```

### Package Manager

The CLI auto-detects your package manager:

```sh
npx create-levelo-app my-app      # uses npm
pnpm dlx create-levelo-app my-app # uses pnpm
yarn dlx create-levelo-app my-app # uses yarn
bunx create-levelo-app my-app     # uses bun
```

---

## Templates

| Template | Description | Status |
| -------- | ----------- | ------ |
| `vite-tsx` | Vite + TypeScript | Recommended |
| `vite-jsx` | Vite + JavaScript | Available |
| `levelo-tsx` | Levelo CLI + TypeScript | Early preview |
| `levelo-jsx` | Levelo CLI + JavaScript | Early preview |

> Levelo CLI is in early preview (alpha). For production work, Vite + TypeScript is recommended.

---

## What You Get

### Vite Template

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

### Levelo CLI Template

```
my-app/
├── launch.tsx         <- App entry point, defines html, head and body
├── app.config.ts      <- Levelo CLI config (port, minify, platform)
├── src/
│   ├── App.tsx        <- Main component, start here
│   └── App.css        <- Component styles
└── package.json
```

---

## Features

- No Virtual DOM
- Direct Real DOM
- Fine-grained reactivity: state, effect, computed, batch
- TypeScript and JSX support
- Vite-powered workflow, or Levelo CLI for multi-platform
- Simple and lightweight setup

---

## Related

- [Levelo JS](https://levelojs.motionmindx.com) — Documentation
- [GitHub Repository](https://github.com/levelojs/LeveloJs) — Full monorepo
- [Motion Mind X](https://motionmindx.com) — More products by Motion Mind X

---

## License

[MIT](https://github.com/levelojs/LeveloJs/blob/main/LICENSE) © [Motion Mind X](https://motionmindx.com)

---

<div align="center">
Built with by <a href="https://motionmindx.com">Motion Mind X</a>
</div>
