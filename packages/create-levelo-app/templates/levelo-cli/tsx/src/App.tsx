import { state } from "levelojs";
import { Zap, Layers, Box, ArrowUpRight } from "kivex-levelo";
import "./App.css";

export function App() {
  const [count, setCount] = state(0);
  const [version, setVersion] = state("2.3.1");
  const [loaded, setLoaded] = state(false);

  // Load latest version once
  if (!loaded()) {
    setLoaded(true);
    fetch("https://registry.npmjs.org/levelojs/latest")
      .then((res) => res.json())
      .then((data) => {
        if (data?.version) setVersion(data.version);
      })
      .catch(() => {});
  }

  return (
    <div class="levelo-app">
      <header class="navbar">
        <div class="logo-group">
          <span class="logo-mark">
            <img src="/levelojs.svg" alt="Levelo JS" />
          </span>
          <span class="logo-text">Levelo JS</span>
          <span class="version-badge">v{version()}</span>
        </div>
        <nav class="nav-links">
          <a
            href="https://levelojs.motionmindx.com"
            target="_blank"
            rel="noopener"
          >
            Docs
          </a>
          <a
            href="https://github.com/levelojs/LeveloJs"
            target="_blank"
            rel="noopener"
          >
            GitHub
          </a>
        </nav>
      </header>

      <main class="main">
        <section class="hero">
          <h1>
            Build fast.
            <br />
            <span class="gradient">Stay Levelo.</span>
          </h1>
          <p class="subtitle">
            A lightweight framework with fine-grained reactivity. No Virtual
            DOM. Only the changed node updates.
          </p>

          <div class="actions">
            <a
              href="https://levelojs.motionmindx.com"
              target="_blank"
              rel="noopener"
              class="btn-primary"
            >
              Get Started <ArrowUpRight size={16} />
            </a>
            <button class="btn-secondary" onClick={() => setCount(count() + 1)}>
              Count: {count()}
            </button>
          </div>

          <p class="hint">
            Edit <code>src/App.tsx</code> and save to see HMR in action.
          </p>
        </section>

        <section class="features">
          <div class="card">
            <span class="icon">
              <Zap size={20} />
            </span>
            <h3>Fine-Grained Reactivity</h3>
            <p>
              State changes update only the target DOM node, not the whole
              component.
            </p>
          </div>
          <div class="card">
            <span class="icon">
              <Layers size={20} />
            </span>
            <h3>TypeScript & JSX</h3>
            <p>
              Clean types, fast HMR, and a familiar Vite workflow for TSX and
              JSX.
            </p>
          </div>
          <div class="card">
            <span class="icon">
              <Box size={20} />
            </span>
            <h3>Lightweight</h3>
            <p>
              Small size, low overhead, and direct DOM updates built for speed.
            </p>
          </div>
        </section>
      </main>

      <footer class="footer">
        <span>© 2026 Motion Mind X</span>
        <span>•</span>
        <a
          href="https://levelojs.motionmindx.com"
          target="_blank"
          rel="noopener"
        >
          Docs
        </a>
        <a
          href="https://github.com/levelojs/LeveloJs"
          target="_blank"
          rel="noopener"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
