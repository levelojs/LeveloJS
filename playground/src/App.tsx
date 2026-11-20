import { state, style } from "levelojs";
import './style.css';

const styles = style({
  container: {
    backgroundColor: "#090d16",
    color: "#f8fafc",
    padding: "24px",
    height: '100vh',
  },
  card: {
    backgroundColor: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "18px",
  },
  btnPrimary: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    padding: "10px 16px",
    borderRadius: "8px",
  },
  customBox: {
    backgroundColor: "#1e1b4b",
    border: "1px solid #6366f1",
    padding: "14px",
    borderRadius: "8px",
    marginTop: "16px",
    color: "#c7d2fe",
  },
});

export function App() {
  const [count, setCount] = state(1);

  return (
    <main className={styles.container}>
      <section className={styles.card}>
        <h1>LeveloJS Style Test</h1>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => setCount(count() + 1)}
        >
          Count: {count()}
        </button>
        <div style={styles.customBox}>Box via style prop</div>
        <div className={styles.customBox}>Box via className prop</div>
      </section>
    </main>
  );
}