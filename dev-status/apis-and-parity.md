# LeveloJS APIs & Native Status

Internal reference tracking exported APIs across Web (`src/index.ts`), Shared (`src/shared.ts`), and Native (`src/native.ts`), along with current Windows native runtime behavior.

## Shared Exports (`src/shared.ts`)

| Category | API / Export | Web | Native (Current Windows Target) | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Reactivity | `state` | Supported | Supported | Reactive signal state updates drive UI mutations |
| Reactivity | `effect` | Supported | Supported | Runs reactive side effects and tracks dependencies |
| Reactivity | `computed` | Supported | Exported | Derived reactive computation |
| Reactivity | `batch` | Supported | Exported | Batches reactive updates |
| Reactivity | `cleanup` | Supported | Exported | Registers cleanup callbacks |
| Reactivity | `mount` | Supported | Exported | Mount helper / lifecycle hook |
| Router | `navigate`, `Page`, `Pages`, `params` | Supported | Exported | Shared router surface; full native router flow pending |
| Config & Entry | `defineConfig`, `launch` | Supported | Supported | App configuration and entry bootstrap |
| Types | `CSSProperties`, `JSX`, `Reactive` | Supported | Supported | TypeScript types |

## Web-Only Exports (`src/index.ts`)

| Export | Native Behavior | Notes |
| :--- | :--- | :--- |
| `head` | `unsupported('head')` | `<head>` subtrees are stripped in native bundler so they do not render as UI nodes |
| `render`, `unmount` | `unsupported('render' / 'unmount')` | Web DOM mount/unmount entry points |
| `Fragment`, `h`, `jsx`, `jsxs` | Mapped via `./runtime/native/index.js` | Native runtime provides its own JSX/element & opcode emitter layer |
| `style` (`./styles/web.js`) | Uses `./styles/native.js` on Native | Resolves style tokens/objects for native style emission |

## Native Bridge Opcodes (Windows Target)

| Opcode | ID | Status | Behavior |
| :--- | :--- | :--- | :--- |
| `CreateElement` | 1 | Working | Creates a `UiNode` and registers it in scene render order |
| `CreateText` | 2 | Working | Creates a text `UiNode` with `text_content` |
| `AppendChild` | 3 | Working | Appends child node ID to parent's `children` list |
| `InsertBefore` | 4 | Working | Inserts child node before reference sibling |
| `ReplaceChild` | 5 | Working | Replaces old child ID and recursively prunes old subtree |
| `RemoveChild` | 6 | Working | Detaches child from parent and recursively prunes child subtree |
| `DeleteNode` | 7 | Working | Recursively removes node and descendants from scene |
| `SetProperty` | 8 | Stubbed | Parsed in batch; attribute storage not yet wired |
| `RemoveProperty` | 9 | Stubbed | Parsed in batch; attribute removal not yet wired |
| `SetStyle` | 10 | Working | Maps supported properties onto `UiNode.style` |
| `RemoveStyle` | 11 | Working | Clears `background`/`background-color` and `color` |
| `SetText` | 12 | Working | Updates `text_content` on existing text nodes |
| `AddEventListener` | 13 | Working | Maps node ID to QuickJS listener ID (`onClick` verified) |
| `RemoveEventListener` | 14 | Stubbed | Parsed in batch; listener unbinding not yet wired |