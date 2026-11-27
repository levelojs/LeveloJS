# Changelog

## [1.1.1] - 2026-11-27

### Fixed

- Polished README and removed stray AI text and leftover artifacts

## [1.1.0] - 2026-11-27

### Added

- `<>...</>` support, compiled to `h(Fragment, null, ...)` (needs `levelojs` 2.3.0 or newer)

### Fixed

- JSX nested inside expressions (callbacks, ternaries, props) is compiled by Levelo
  instead of falling through to Vite's default JSX transform
- Function children (`{(item, index) => ...}`) are passed through untouched, so `For` works
- Text on the same line as an expression keeps its spaces (`{a()} items` no longer
  renders as `3items`)
- Attribute names such as `data-*`, `aria-*` and `xlink:href` no longer break the build
- SVG and MathML namespaces are inherited by static children and by elements created
  inside `.map()` and `For`
- The `h` import is only added to files that contain JSX

---

## [1.0.1] - 2026-07-17

### Changed

- Updated Vite plugin build/transform handling for LeveloJS integration.

---

## [1.0.0] - 2026-07-17

- Vite JSX/TSX transformation for Levelo public `h()` runtime.
- Expression children are preserved as values so the renderer-backed runtime can build the current render tree.
