# Changelog

## [0.1.0] - 2026-11-27

### Fixed
- Compiler: function children are passed through untouched, so `For` works
- Compiler: text on the same line as an expression keeps its spaces
- Compiler: SVG and MathML namespaces are inherited by static children and by
  elements created inside `.map()` and `For`
- Compiler: attribute names such as `data-*` and `aria-*` are quoted correctly
- Compiler: `<>...</>` support (needs `levelojs` 2.3.0 or newer)

### Status
- Not ready for general use yet. Use Vite with `vite-plugin-levelojs` for now.

---

## [0.0.1] - 2026-11-23

### Add
- First npm release