import {
  Fragment,
  Page,
  Pages,
  batch,
  cleanup,
  computed,
  effect,
  head,
  mount,
  navigate,
  state,
  style,
} from "levelojs";
import "./App.css";
import logo from '/levelojs.svg';

// Child component to test mount() and cleanup() lifecycle hooks
function LifecycleBox() {
  const [ticks, setTicks] = state(0);

  mount(() => {
    console.log("[Lifecycle] LifecycleBox mounted!");
    const timer = setInterval(() => {
      setTicks(ticks() + 1);
    }, 1000);

    cleanup(() => {
      console.log("[Lifecycle] LifecycleBox unmounted & timer cleared!");
      clearInterval(timer);
    });
  });

  return (
    <div
      style={{
        padding: "12px",
        background: "#0f172a",
        borderRadius: "8px",
        marginTop: "10px",
      }}
    >
      <p>
        Active Timer Ticks: <strong>{ticks()}s</strong>
      </p>
      <small style={{ color: "#94a3b8" }}>
        Toggle off to test cleanup() in console.
      </small>
    </div>
  );
}

// Route views to test Pages, Page, and navigate()
function HomeView() {
  return (
    <div>
      <h3>Home Route (/)</h3>
      <p>Default route rendered successfully via Levelo Router.</p>
    </div>
  );
}

function AboutView() {
  head({
    title: 'About Page'
  })
  return (
    <div>
      <h3>About Route (/about)</h3>
      <p>Navigation works smoothly without full page reload.</p>
      <img src={logo} />
    </div>
  );
}

function ProfileView() {
  return (
    <div>
      <h3>User Profile Route (/user/42)</h3>
      <p>Dynamic or nested route view rendered.</p>
    </div>
  );
}

export function App() {
  // 1. Test state()
  const [count, setCount] = state(1);
  const [multiplier, setMultiplier] = state(2);
  const [showLifecycle, setShowLifecycle] = state(true);
  const [effectLogs, setEffectLogs] = state<string[]>([]);

  // 2. Test computed()
  const totalValue = computed(() => count() * multiplier());

  // 3. Test head()
  head({
    title: `LeveloJS Test (${count()})`,
    meta: [
      { name: "description", content: "Testing all LeveloJS Web Runtime APIs" },
    ],
  });

  // 4. Test effect()
  effect(() => {
    const currentCount = count();
    const currentMult = multiplier();
    const logMsg = `Effect triggered -> count: ${currentCount}, multiplier: ${currentMult}`;
    console.log("[Effect]", logMsg);

    // Update head title reactively
    head({ title: `LeveloJS (${currentCount} x ${currentMult})` });
  });

  // 5. Test batch() - should trigger effect only ONCE for two state updates
  const handleBatchUpdate = () => {
    batch(() => {
      setCount(count() + 1);
      setMultiplier(multiplier() + 1);
    });
    setEffectLogs([
      ...effectLogs(),
      `Batched update executed at ${new Date().toLocaleTimeString()}`,
    ]);
  };

  // 6. Test style() helper
  const styles = style({
    customBox: {
      backgroundColor: "#1e1b4b",
      border: "1px solid #6366f1",
      padding: "12px",
      borderRadius: "8px",
      marginTop: "10px",
      color: "#c7d2fe",
    },
  });

  return (
    <Fragment>
      <main id="root" className="app-container">
        {/* Header & Unicode / Emoji Check */}
        <header className="card">
          <span className="badge">Web Runtime API Diagnostics</span>
          <h1 style={{ marginTop: "8px" }}>LeveloJS Full API Test Suite</h1>
          <p style={{ color: "#94a3b8" }}>
            Testing Reactivity, Lifecycle, Router, Head, Style helper, and JSX
            Fragment.
          </p>
          <div
            style={{ marginTop: "10px", fontSize: "14px", color: "#cbd5e1" }}
          >
            Unicode Check: শ্রী ক্ষমা বিদ্যালয় যুক্তাক্ষর | 😍🖐👍 | 漢字/汉字
          </div>
        </header>

        {/* Section 1: state, computed, effect, batch */}
        <section className="card">
          <h2>1. Reactivity (state, computed, effect, batch)</h2>
          <div style={{ display: "flex", gap: "20px", margin: "12px 0" }}>
            <p>
              Count: <strong>{count()}</strong>
            </p>
            <p>
              Multiplier: <strong>{multiplier()}</strong>
            </p>
            <p>
              Computed Total: <strong>{totalValue()}</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn"
              onClick={() => setCount(count() + 1)}
            >
              Increment Count
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setMultiplier(multiplier() + 1)}
            >
              Increment Multiplier
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBatchUpdate}
            >
              Batch Update Both (+1 each)
            </button>
          </div>

          {effectLogs().length > 0 ? (
            <ul
              style={{
                marginTop: "12px",
                paddingLeft: "20px",
                color: "#38bdf8",
                fontSize: "13px",
              }}
            >
              {effectLogs().map((item) => (
                <li>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>

        {/* Section 2: mount & cleanup */}
        <section className="card">
          <h2>2. Lifecycle Hooks (mount & cleanup)</h2>
          <button
            type="button"
            className="btn"
            style={{ marginTop: "10px" }}
            onClick={() => setShowLifecycle(!showLifecycle())}
          >
            {showLifecycle()
              ? "Unmount Timer Component"
              : "Mount Timer Component"}
          </button>

          {showLifecycle() ? <LifecycleBox /> : null}
        </section>

        {/* Section 3: Router (Pages, Page, navigate) */}
        <section className="card">
          <h2>3. Client-Side Router (Pages, Page, navigate)</h2>
          <nav className="nav-bar">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/")}
            >
              Go Home (/)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/about")}
            >
              Go About (/about)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/user/42")}
            >
              Go Profile (/user/42)
            </button>
          </nav>

          <div
            style={{
              marginTop: "14px",
              padding: "12px",
              background: "#0f172a",
              borderRadius: "8px",
            }}
          >
            <Pages>
              <Page path="/" component={HomeView} />
              <Page path="/about" component={AboutView} />
              <Page path="/user/:id" component={ProfileView} />
            </Pages>
          </div>
        </section>

        {/* Section 4: style() helper */}
        <section className="card">
          <h2>4. Style Helper API (style)</h2>
          <div style={styles.customBox}>
            This box uses the <code>style()</code> API from LeveloJS. Check
            DevTools to verify how it compiles.
          </div>
        </section>
      </main>
    </Fragment>
  );
}
