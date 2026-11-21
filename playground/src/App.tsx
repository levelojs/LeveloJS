import { state, style } from "levelojs";
import "./style.css";

const styles = style({
  container: {
    backgroundColor: "#090d16",
    color: "#f8fafc",
    padding: "24px",
    minHeight: "100vh",
  },
  header: {
    marginBottom: "20px",
  },
  title: {
    fontSize: "28px",
    marginBottom: "8px",
    color: "#f8fafc",
  },
  subtitle: {
    fontSize: "14px",
    color: "#94a3b8",
  },
  navBar: {
    display: "flex",
    flexDirection: "row",
    gap: "12px",
    marginBottom: "20px",
  },
  tabBtn: {
    backgroundColor: "#1e293b",
    color: "#cbd5e1",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #334155",
  },
  tabBtnActive: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #6366f1",
  },
  card: {
    backgroundColor: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "18px",
  },
  cardTitle: {
    fontSize: "20px",
    marginBottom: "12px",
    color: "#f8fafc",
  },
  btnPrimary: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    padding: "10px 16px",
    borderRadius: "8px",
    marginRight: "10px",
  },
  btnSecondary: {
    backgroundColor: "#0f172a",
    color: "#38bdf8",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #0284c7",
  },
  infoBox: {
    backgroundColor: "#1e1b4b",
    border: "1px solid #6366f1",
    padding: "14px",
    borderRadius: "8px",
    marginTop: "16px",
    color: "#c7d2fe",
  },
  badgeRow: {
    display: "flex",
    gap: "10px",
    marginTop: "14px",
  },
  badge: {
    backgroundColor: "#064e3b",
    border: "1px solid #10b981",
    color: "#a7f3d0",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "13px",
  },
  dynamicBanner: {
    backgroundColor: "#164e63",
    border: "1px solid #06b6d4",
    color: "#cffafe",
    padding: "14px",
    borderRadius: "8px",
    marginTop: "14px",
  },
});

export function App() {
  const [activePage, setActivePage] = state<"overview" | "reactivity" | "styles">("overview");
  const [count, setCount] = state(1);
  const [visible, setVisible] = state(false);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>LeveloJS Playground</h1>
        <p className={styles.subtitle}>
          Cross-runtime parity test without router (Web & Native)
        </p>
      </header>

      <nav className={styles.navBar}>
        <button
          type="button"
          className={activePage() === "overview" ? styles.tabBtnActive : styles.tabBtn}
          onClick={() => setActivePage("overview")}
        >
          Overview
        </button>
        <button
          type="button"
          className={activePage() === "reactivity" ? styles.tabBtnActive : styles.tabBtn}
          onClick={() => setActivePage("reactivity")}
        >
          Reactivity
        </button>
        <button
          type="button"
          className={activePage() === "styles" ? styles.tabBtnActive : styles.tabBtn}
          onClick={() => setActivePage("styles")}
        >
          Style Parity
        </button>
      </nav>

      {activePage() === "overview" && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Overview Page</h2>
          <p>
            Active tab switching dynamically mounts and prunes entire component subtrees.
          </p>
          <div className={styles.badgeRow}>
            <div className={styles.badge}>Signals Ready</div>
            <div className={styles.badge}>Subtree Pruning</div>
            <div className={styles.badge}>Style Parity</div>
          </div>
        </section>
      )}

      {activePage() === "reactivity" && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Reactivity & Dynamic Mount Test</h2>
          <div>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => setCount(count() + 1)}
            >
              Count: {count()}
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setVisible(!visible())}
            >
              {visible() ? "Hide Banner" : "Show Banner"}
            </button>
          </div>

          {visible() && (
            <div className={styles.dynamicBanner}>
              <h3>Dynamic Node Mounted</h3>
              <p>Toggling this block tests clean subtree insertion and removal.</p>
            </div>
          )}
        </section>
      )}

      {activePage() === "styles" && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Style Token & Box Model Test</h2>
          <div style={styles.infoBox}>Box rendered via style prop</div>
          <div className={styles.infoBox}>Box rendered via className prop</div>
        </section>
      )}
    </main>
  );
}