# Native Supported Styles & Units

Internal reference showing which style properties and units are currently handled in the Native runtime (Windows target).

## Units (Native)

| Unit / Syntax | Status | Notes |
| :--- | :--- | :--- |
| `px` (and unitless numbers) | Supported | Parsed via `parse_px` (e.g. `"20px"`, `"20"`) |
| `vh` | Supported | Supported on `height` and `min-height` (e.g. `"100vh"`) |
| `%`, `rem`, `em`, `vw` | Not Supported | Currently ignored by native style parser |

## Layout & Box Model (Native)

| Property | Status | Notes |
| :--- | :--- | :--- |
| `x`, `y` | Supported | Explicit position coordinates in native layout |
| `width` | Supported | Numeric / `px` values |
| `height` | Supported | Supports `px` and `vh` |
| `min-height` | Supported | Supports `px` and `vh` |
| `display` | Supported | Passed to native layout engine |
| `flex-direction` | Supported | Passed to native layout engine |
| `align-items` | Supported | Passed to native layout engine |
| `justify-content` | Supported | Passed to native layout engine |
| `gap` | Supported | Numeric / `px` values |
| `padding` | Supported | Supports 1, 2, 3, and 4 value shorthand |
| `padding-top` / `right` / `bottom` / `left` | Supported | Numeric / `px` values |
| `margin` | Supported | Supports 1, 2, 3, and 4 value shorthand |
| `margin-top` / `right` / `bottom` / `left` | Supported | Numeric / `px` values |

## Borders, Background & Typography (Native)

| Property | Status | Notes |
| :--- | :--- | :--- |
| `border` | Supported | Parses width, style keyword, and color (`"1px solid #1f2937"`, `"none"`) |
| `border-width` | Supported | Numeric / `px` values |
| `border-color` | Supported | Supports `#hex` (`#rgb`, `#rrggbb`) and basic color names |
| `border-radius` | Supported | Numeric / `px` values |
| `background` / `background-color` | Supported | Solid colors (`#hex` and basic named colors) |
| `color` | Supported | Inherited down the node tree if not explicitly set on child |
| `font-size` | Supported | Inherited down the node tree; defaults applied for `h1`–`h6` and `small` |
| `font-weight` | Supported | Stored as string on `UiNode.style` |

## Default Tag Font Sizes (Native)

| Tag | Default `font-size` |
| :--- | :--- |
| `h1` | `32px` |
| `h2` | `24px` |
| `h3` | `18.7px` |
| `h4` | `16px` |
| `h5` | `13.3px` |
| `h6` | `10.7px` |
| `small` | `13px` |

## Not Yet Supported in Native

- Positioning & layering: `position` (`relative`, `absolute`, `fixed`), `z-index`, `overflow`
- Visual effects: `box-shadow`, `opacity`, `linear-gradient` / `radial-gradient`, `transform`
- Typography & alignment: `text-align`, `line-height`, `letter-spacing`, `font-family`
- Selectors & media: `:hover`, `:focus`, `:active`, `@media` queries, CSS variables (`var(--...)`)
- Native form/text input controls (`<input>`, caret/cursor, selection, clipboard, context menu)