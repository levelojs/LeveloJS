# Levelo JS

Levelo JS is a lightweight fine-grained UI runtime designed for near-native speed on the web and native-level performance across platforms.

## Rendering model

Levelo does not use a Virtual DOM, tree reconciliation, or tree diffing for reactive updates.

The initial UI structure is created once. Reactive expressions then subscribe directly to the signals they read and update only the specific target node, property, style, event, or dynamic child—without re-running component functions or diffing trees.

```text
Signal
  ↓
Reactive binding
  ↓
Direct target update
  ↓
Web DOM / Platform adapter
```

## Web usage

Install the runtime and the Vite compiler plugin:

```bash
npm install levelojs
npm install -D vite vite-plugin-levelojs
```

Configure Vite:

```ts
import { defineConfig } from 'vite';
import { leveloPlugin } from 'vite-plugin-levelojs';

export default defineConfig({
  plugins: [leveloPlugin()],
});
```

Mount your app:

```tsx
import { render } from 'levelojs';

function App() {
  return (
    <div>
      <h1>Hello Levelo</h1>
      <p>Fine-grained reactive UI on the web.</p>
    </div>
  );
}

render(App, document.getElementById('app'));
```

## Fine-grained updates

Reactive JSX expressions compile into lazy getters so each binding tracks only its own signal dependencies:

```tsx
import { render, state } from 'levelojs';

function Counter() {
  const [count, setCount] = state(0);

  return (
    <div>
      <span>{count()}</span>
      <button onclick={() => setCount(count() + 1)}>Increment</button>
    </div>
  );
}

render(Counter, document.getElementById('app'));
```

When `count` changes, only the bound `span` content updates—`Counter` is not re-executed and no Virtual DOM diffing occurs.

## Documentation

Full API reference, guides, and multi-platform details are available in the official documentation:
https://levelojs.motionmindx.com

## License

MIT