# Contributing to LeveloJS

Thank you for your interest in contributing to **LeveloJS**! Whether you are fixing a bug, improving documentation, or proposing a new feature across the Web or Native runtimes, your help is welcome.

## Prerequisites

Make sure you have the following installed before setting up the repository:

- **Node.js** `>= 20.0.0`
- **pnpm** `>= 9.0.0`
- **Rust Toolchain** (`rustc` & `cargo` — required for native Windows/desktop host development)

## Local Development Setup

1. **Fork and clone the repository:**

```sh
git clone https://github.com/levelojs/LeveloJS.git
cd LeveloJS
```

2. **Install JavaScript/TypeScript dependencies:**

```sh
pnpm install
```

3. **Build workspace packages:**

```sh
pnpm build
```

4. **Run the playground app:**

```sh
cd playground
pnpm levelo dev -p web
```

## Repository Structure

- `packages/levelojs` — Core reactive runtime, router, styles & JSX engine
- `packages/create-levelo-app` — Interactive CLI scaffolding tool for bootstrapping
- `packages/vite-plugin-levelojs` — Official Vite plugin for compiling and running LeveloJS apps on the web
- `packages/levelo-cli` — CLI, dev server, Web & native bundler & preview server
- `packages/levelo-windows` — Native Windows host runtime (Rust)
- `playground` — Local sandbox for testing features
- `templates` — Starter templates (Levelo CLI & Vite)

## Code Quality & Formatting

This repository uses **Biome** for linting and formatting. Before submitting a Pull Request, please ensure your code passes checks:

```sh
pnpm format
```

## Commit & Pull Request Guidelines

- Follow **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- Keep Pull Requests focused on a single feature or bug fix.
- Verify that both TypeScript builds and `cargo check --workspace` (if touching Rust code) succeed without errors.
