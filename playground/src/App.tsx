import {
  Fragment,
  batch,
  cleanup,
  computed,
  effect,
  head,
  mount,
  state,
  style,
} from "levelojs";
import logo from "/levelojs.svg";

// Shared component styles compiled via LeveloJS style() API
// Works identically on Web (DOM CSS injection) and Native (Zero-overhead SetStyle commands)
const styles = style({
  container: {
    backgroundColor: "#090d16",
    color: "#f8fafc",
    padding: "24px",
    minHeight: "100vh",
    fontFamily: "sans-serif",
  },
  card: {
    backgroundColor: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "18px",
  },
  badge: {
    backgroundColor: "#312e81",
    color: "#a5b4fc",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
  },
  title: {
    marginTop: "10px",
    marginBottom: "6px",
    fontSize: "24px",
    color: "#ffffff",
  },
  sectionTitle: {
    fontSize: "18px",
    marginBottom: "12px",
    color: "#e2e8f0",
  },
  mutedText: {
    color: "#94a3b8",
    fontSize: "14px",
  },
  row: {
    display: "flex",
    gap: "14px",
    marginTop: "12px",
    marginBottom: "12px",
  },
  btnPrimary: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
  },
  btnSecondary: {
    backgroundColor: "#1e293b",
    color: "#e2e8f0",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #334155",
    fontSize: "14px",
  },
  lifecycleBox: {
    padding: "14px",
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "8px",
    marginTop: "12px",
  },
  customBox: {
    backgroundColor: "#1e1b4b",
    border: "1px solid #6366f1",
    padding: "14px",
    borderRadius: "8px",
    marginTop: "100px",
    color: "#c7d2fe",
  },
  unicodeBanner: {
    marginTop: "12px",
    padding: "10px",
    backgroundColor: "#0f172a",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#cbd5e1",
  },
});

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
    <div className={styles.lifecycleBox}>
      <p>
        Active Timer Ticks: <strong>{ticks()}s</strong>
      </p>
      <small style={styles.mutedText}>
        Toggle off to test cleanup() in console.
      </small>
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
      { name: "description", content: "Testing all LeveloJS Runtime APIs" },
    ],
  });

  // 4. Test effect()
  effect(() => {
    const currentCount = count();
    const currentMult = multiplier();
    const logMsg = `Effect triggered -> count: ${currentCount}, multiplier: ${currentMult}`;
    console.log("[Effect]", logMsg);

    head({ title: `LeveloJS (${currentCount} x ${currentMult})` });
  });

  // 5. Test batch()
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

  return (
    <Fragment>
      <main id="root" className={styles.container}>
        {/* Header & Unicode / Emoji Check */}
        <header className={styles.card}>
          <span className={styles.badge}>LeveloJS Cross-Platform Runtime</span>
          <h1 style={styles.title}>LeveloJS Full API Test Suite</h1>
          <p style={styles.mutedText}>
            Testing Reactivity, Lifecycle, Head, Asset import, and Unified style() API.
          </p>
          <div className={styles.unicodeBanner}>
            Unicode Check: শ্রী ক্ষমা বিদ্যালয় যুক্তাক্ষর | 😍🖐👍 | 漢字/汉字
          </div>
          <img
            src={logo}
            style={{ width: "48px", height: "48px", marginTop: "12px" }}
          />
        </header>

        {/* Section 1: state, computed, effect, batch */}
        <section className={styles.card}>
          <h2 style={styles.sectionTitle}>
            1. Reactivity (state, computed, effect, batch)
          </h2>
          <div className={styles.row}>
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

          <div className={styles.row}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => setCount(count() + 1)}
            >
              Increment Count
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => setMultiplier(multiplier() + 1)}
            >
              Increment Multiplier
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
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
        <section className={styles.card}>
          <h2 style={styles.sectionTitle}>
            2. Lifecycle Hooks (mount & cleanup)
          </h2>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setShowLifecycle(!showLifecycle())}
          >
            {showLifecycle()
              ? "Unmount Timer Component"
              : "Mount Timer Component"}
          </button>

          {showLifecycle() ? <LifecycleBox /> : null}
        </section>

        {/* Section 3: style() API verification (both style={} and className={}) */}
        <section className={styles.card}>
          <h2 style={styles.sectionTitle}>
            3. Unified Style Helper API (style)
          </h2>
          <div style={styles.customBox}>
            Box A: Applied via <code>style=&#123;styles.customBox&#125;</code>
          </div>
          <div className={styles.customBox}>
            Box B: Applied via <code>className=&#123;styles.customBox&#125;</code>
          </div>
        </section>
      </main>
    </Fragment>
  );
}