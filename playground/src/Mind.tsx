import { state, effect, batch, untrack, Show } from "levelojs";

// ---------------------------------------------------------------------------
// Inline styles (plain strings, no style() API needed)
// ---------------------------------------------------------------------------
const pageStyle =
  "min-height:100vh;padding:24px 16px;background:#0f1117;color:#e6e8ee;" +
  "font-family:system-ui,-apple-system,Segoe UI,sans-serif;";
const wrapStyle = "max-width:720px;margin:0 auto;";
const titleStyle = "font-size:26px;font-weight:700;margin:0 0 4px;";
const subStyle = "margin:0 0 24px;color:#8b90a0;font-size:14px;";
const cardStyle =
  "background:#171a23;border:1px solid #262a37;border-radius:14px;" +
  "padding:18px;margin-bottom:16px;";
const cardTitleStyle = "font-size:15px;font-weight:600;margin:0 0 12px;color:#c9cdda;";
const rowStyle = "display:flex;align-items:center;gap:10px;flex-wrap:wrap;";
const btnStyle =
  "background:#4f6ef7;color:#fff;border:0;border-radius:10px;padding:9px 16px;" +
  "font-size:14px;font-weight:600;cursor:pointer;";
const btnGhostStyle =
  "background:#232736;color:#e6e8ee;border:1px solid #31364a;border-radius:10px;" +
  "padding:9px 16px;font-size:14px;font-weight:600;cursor:pointer;";
const valueStyle = "font-size:20px;font-weight:700;color:#7ee0a8;min-width:36px;";
const mutedStyle = "color:#8b90a0;font-size:13px;";
const welcomeStyle = "margin:14px 0 0;color:#7ee0a8;font-size:22px;";

const testRowStyle =
  "display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid #222637;";
const testNameStyle = "flex:1;font-size:13.5px;line-height:1.45;";
const errStyle = "color:#ff8a8a;font-size:12px;margin-top:3px;";
const badgeBase =
  "min-width:48px;text-align:center;border-radius:8px;padding:3px 8px;" +
  "font-size:11.5px;font-weight:700;";
const badgeIdle = badgeBase + "background:#232736;color:#8b90a0;";
const badgePass = badgeBase + "background:#12331f;color:#7ee0a8;";
const badgeFail = badgeBase + "background:#3a1818;color:#ff8a8a;";

// ---------------------------------------------------------------------------
// Reactivity tests (pure logic, no DOM involved)
// ---------------------------------------------------------------------------
type Fx = (callback: () => void) => () => void;
type TestCase = { name: string; run: (fx: Fx) => void };

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const tests: TestCase[] = [
  {
    name: "state: getter returns the initial value and setter updates it",
    run() {
      const [n, setN] = state(1);
      assert(n() === 1, "initial value should be 1");
      setN(5);
      assert(n() === 5, "value should be 5 after set");
    },
  },
  {
    name: "effect: runs immediately once, then again on every change",
    run(fx) {
      const [n, setN] = state(0);
      let runs = 0;
      fx(() => {
        n();
        runs++;
      });
      assert(runs === 1, "should run once on creation");
      setN(1);
      setN(2);
      assert(runs === 3, "should have run 3 times, got " + runs);
    },
  },
  {
    name: "state: setting the same value does not trigger effects",
    run(fx) {
      const [n, setN] = state(1);
      let runs = 0;
      fx(() => {
        n();
        runs++;
      });
      setN(1);
      assert(runs === 1, "same value must not re-run, got " + runs);
    },
  },
  {
    name: "state: NaN set repeatedly does not trigger (Object.is)",
    run(fx) {
      const [n, setN] = state<number>(NaN);
      let runs = 0;
      fx(() => {
        n();
        runs++;
      });
      setN(NaN);
      setN(NaN);
      assert(runs === 1, "NaN -> NaN must not re-run, got " + runs);
    },
  },
  {
    name: "state: updater function receives the previous value",
    run() {
      const [n, setN] = state(10);
      setN((prev) => prev + 5);
      setN((prev) => prev * 2);
      assert(n() === 30, "expected 30, got " + n());
    },
  },
  {
    name: "state: signals read inside an updater are not tracked (untracked)",
    run(fx) {
      const [a, setA] = state(1);
      const [b, setB] = state(0);
      let runs = 0;
      fx(() => {
        runs++;
        setB(() => a() * 10);
      });
      assert(b() === 10, "b should be 10 after the first run");
      setA(2);
      assert(runs === 1, "changing a must not re-run the effect, got " + runs);
    },
  },
  {
    name: "dependencies: effect follows the active branch only",
    run(fx) {
      const [flag, setFlag] = state(true);
      const [a, setA] = state(0);
      const [b, setB] = state(0);
      let runs = 0;
      fx(() => {
        runs++;
        if (flag()) a();
        else b();
      });
      setB(1);
      assert(runs === 1, "b is not read yet, should not run");
      setA(1);
      assert(runs === 2, "a is read, should run");
      setFlag(false);
      assert(runs === 3, "flag changed, should run");
      setA(2);
      assert(runs === 3, "a is no longer read, should not run");
      setB(2);
      assert(runs === 4, "b is read now, should run, got " + runs);
    },
  },
  {
    name: "dependencies: stable dependencies keep working after many runs",
    run(fx) {
      const [n, setN] = state(0);
      let runs = 0;
      fx(() => {
        n();
        runs++;
      });
      for (let i = 1; i <= 50; i++) setN(i);
      assert(runs === 51, "expected 51 runs, got " + runs);
    },
  },
  {
    name: "untrack: reads inside untrack() do not subscribe",
    run(fx) {
      const [a, setA] = state(0);
      const [b, setB] = state(0);
      let runs = 0;
      fx(() => {
        runs++;
        a();
        untrack(() => b());
      });
      setB(1);
      assert(runs === 1, "untracked b must not re-run, got " + runs);
      setA(1);
      assert(runs === 2, "tracked a must re-run, got " + runs);
    },
  },
  {
    name: "nested effects: outer keeps tracking after an inner effect finishes",
    run(fx) {
      const [a, setA] = state(0);
      const [b, setB] = state(0);
      let outerRuns = 0;
      fx(() => {
        outerRuns++;
        effect(() => {
          a();
        });
        b();
      });
      setB(1);
      assert(outerRuns === 2, "outer must re-run on b, got " + outerRuns);
      setA(1);
      assert(outerRuns === 2, "only the inner effect should re-run on a");
    },
  },
  {
    name: "nested effects: old child effects are disposed when the parent re-runs",
    run(fx) {
      const [outer, setOuter] = state(0);
      const [inner, setInner] = state(0);
      let innerRuns = 0;
      fx(() => {
        outer();
        effect(() => {
          inner();
          innerRuns++;
        });
      });
      setOuter(1);
      setOuter(2);
      innerRuns = 0;
      setInner(1);
      assert(innerRuns === 1, "only one live child expected, got " + innerRuns);
    },
  },
  {
    name: "dispose: a disposed effect never runs again",
    run() {
      const [n, setN] = state(0);
      let runs = 0;
      const stop = effect(() => {
        n();
        runs++;
      });
      stop();
      setN(1);
      assert(runs === 1, "disposed effect must not run, got " + runs);
    },
  },
  {
    name: "dispose: calling the disposer twice is safe",
    run() {
      const stop = effect(() => {});
      stop();
      stop();
    },
  },
  {
    name: "batch: multiple updates cause a single effect run",
    run(fx) {
      const [a, setA] = state(0);
      const [b, setB] = state(0);
      let runs = 0;
      fx(() => {
        a();
        b();
        runs++;
      });
      batch(() => {
        setA(1);
        setB(1);
        setA(2);
      });
      assert(runs === 2, "expected 1 initial + 1 batched run, got " + runs);
    },
  },
  {
    name: "batch: nested batch() flushes only once at the end",
    run(fx) {
      const [a, setA] = state(0);
      let runs = 0;
      fx(() => {
        a();
        runs++;
      });
      batch(() => {
        setA(1);
        batch(() => {
          setA(2);
        });
        assert(runs === 1, "must not flush before the outer batch ends");
      });
      assert(runs === 2, "expected 2 runs total, got " + runs);
    },
  },
  {
    name: "batch: an effect disposed before the flush does not run",
    run() {
      const [a, setA] = state(0);
      let runs = 0;
      const stop = effect(() => {
        a();
        runs++;
      });
      batch(() => {
        setA(1);
        stop();
      });
      assert(runs === 1, "disposed effect ran during flush, got " + runs);
    },
  },
  {
    name: "errors: an effect that throws can still run again later",
    run(fx) {
      const [a, setA] = state(0);
      let runs = 0;
      fx(() => {
        runs++;
        if (a() === 1) throw new Error("boom");
      });
      try {
        setA(1);
      } catch {
        // Expected: the effect threw on purpose.
      }
      setA(2);
      assert(runs === 3, "effect got stuck after an error, runs = " + runs);
    },
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function Mind() {
  // Demo 1: the original toggle
  const [isActive, setIsActive] = state(false);

  // Demo 2: counter (direct set + updater)
  const [count, setCount] = state(0);

  // Demo 3: batch (two updates, one render)
  const [first, setFirst] = state(0);
  const [second, setSecond] = state(0);
  const [renders, setRenders] = state(0);
  effect(() => {
    first();
    second();
    // Read the counter without subscribing, so the effect never triggers itself.
    untrack(() => setRenders(renders() + 1));
  });

  // Test runner state: one status/message pair per test
  const rows = tests.map((t) => {
    const [status, setStatus] = state("idle");
    const [message, setMessage] = state("");
    return { name: t.name, run: t.run, status, setStatus, message, setMessage };
  });
  const [summary, setSummary] = state("Not run yet");

  function runAll() {
    let passed = 0;

    for (const row of rows) {
      const disposers: (() => void)[] = [];
      const fx: Fx = (callback) => {
        const stop = effect(callback);
        disposers.push(stop);
        return stop;
      };

      try {
        row.run(fx);
        row.setStatus("pass");
        row.setMessage("");
        passed++;
      } catch (error) {
        row.setStatus("fail");
        row.setMessage(error instanceof Error ? error.message : String(error));
      } finally {
        // Always dispose effects created by the test.
        disposers.forEach((stop) => stop());
      }
    }

    setSummary(passed + " / " + rows.length + " passed");
  }

  return (
    <div class="active" style={pageStyle}>
      <div style={wrapStyle}>
        <h1 style={titleStyle}>Levelo JS Reactivity Lab</h1>
        <p style={subStyle}>Live demos and an automated test suite for state and effect.</p>

        {/* Demo 1: Show */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>1. Show / toggle</h3>
          <div style={rowStyle}>
            <button
              style={btnStyle}
              onClick={() => {
                setIsActive(!isActive());
              }}
            >
              Click
            </button>
            <span style={mutedStyle}>isActive: {isActive() ? "true" : "false"}</span>
          </div>
          <Show when={isActive()}>
            <h2 style={welcomeStyle}>Welcome</h2>
          </Show>
        </div>

        {/* Demo 2: counter */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>2. Counter, derived values, updater</h3>
          <div style={rowStyle}>
            <button style={btnGhostStyle} onClick={() => setCount(count() - 1)}>
              -1
            </button>
            <span style={valueStyle}>{count()}</span>
            <button style={btnStyle} onClick={() => setCount(count() + 1)}>
              +1
            </button>
            <button style={btnGhostStyle} onClick={() => setCount((prev) => prev + 10)}>
              +10 (updater)
            </button>
            <button style={btnGhostStyle} onClick={() => setCount(0)}>
              Reset
            </button>
          </div>
          <p style={mutedStyle}>
            double: {count() * 2} | parity: {count() % 2 === 0 ? "even" : "odd"}
          </p>
        </div>

        {/* Demo 3: batch */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>3. Batch: two updates, one effect run</h3>
          <div style={rowStyle}>
            <button
              style={btnGhostStyle}
              onClick={() => {
                setFirst(first() + 1);
                setSecond(second() + 1);
              }}
            >
              Update without batch
            </button>
            <button
              style={btnStyle}
              onClick={() => {
                batch(() => {
                  setFirst(first() + 1);
                  setSecond(second() + 1);
                });
              }}
            >
              Update with batch
            </button>
          </div>
          <p style={mutedStyle}>
            first: {first()} | second: {second()} | effect runs: {renders()}
          </p>
        </div>

        {/* Test runner */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>4. Automated tests</h3>
          <div style={rowStyle}>
            <button style={btnStyle} onClick={runAll}>
              Run all tests
            </button>
            <span style={mutedStyle}>{summary()}</span>
          </div>
          <div style="margin-top:12px;">
            {rows.map((row) => (
              <div style={testRowStyle}>
                <span
                  style={
                    row.status() === "pass"
                      ? badgePass
                      : row.status() === "fail"
                        ? badgeFail
                        : badgeIdle
                  }
                >
                  {row.status() === "pass" ? "PASS" : row.status() === "fail" ? "FAIL" : "-"}
                </span>
                <div style={testNameStyle}>
                  {row.name}
                  <div style={errStyle}>{row.message()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}