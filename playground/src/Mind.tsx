import {
  batch,
  cleanup,
  computed,
  effect,
  For,
  Fragment,
  h,
  head,
  jsx,
  jsxs,
  mount,
  render,
  Show,
  state,
  style,
  unmount,
  untrack,
} from "levelojs";
import type { CSSProperties } from "levelojs";
import { Home } from "kivex-levelo";

// ---------------------------------------------------------------------------
// Inline styles
// ---------------------------------------------------------------------------
const pageStyle =
  "min-height:100vh;padding:24px 16px;background:#0f1117;color:#e6e8ee;" +
  "font-family:system-ui,-apple-system,Segoe UI,sans-serif;";
const wrapStyle = "max-width:680px;margin:0 auto;";
const cardStyle =
  "background:#171a23;border:1px solid #262a37;border-radius:14px;" +
  "padding:18px;margin-bottom:16px;";
const titleStyle = "font-size:16px;font-weight:600;margin:0 0 4px;color:#c9cdda;";
const hintStyle = "font-size:12.5px;color:#8b90a0;margin:0 0 12px;line-height:1.5;";
const rowStyle = "display:flex;align-items:center;gap:10px;flex-wrap:wrap;";
const btnStyle =
  "background:#4f6ef7;color:#fff;border:0;border-radius:10px;padding:9px 14px;" +
  "font-size:14px;font-weight:600;cursor:pointer;";
const btnGhostStyle =
  "background:#232736;color:#e6e8ee;border:1px solid #31364a;border-radius:10px;" +
  "padding:9px 14px;font-size:14px;font-weight:600;cursor:pointer;";
const miniBtnStyle =
  "background:#232736;color:#e6e8ee;border:1px solid #31364a;border-radius:8px;" +
  "padding:3px 10px;font-size:12.5px;font-weight:600;cursor:pointer;";
const inputStyle =
  "background:#10131b;color:#e6e8ee;border:1px solid #31364a;border-radius:10px;" +
  "padding:9px 12px;font-size:14px;min-width:200px;";
const listStyle = "margin:12px 0 0;padding-left:0;list-style:none;";
const itemStyle =
  "display:flex;align-items:center;justify-content:space-between;gap:10px;" +
  "padding:6px 0;border-bottom:1px solid #222637;font-size:14px;";
const okTextStyle = "margin:12px 0 0;color:#7ee0a8;font-size:16px;";
const warnTextStyle = "margin:12px 0 0;color:#ffb86b;font-size:16px;";
const mutedStyle = "margin:10px 0 0;font-size:13.5px;color:#c9cdda;";
const svgBoxStyle = "margin-top:10px;background:#10131b;border-radius:10px;";
const svgLabelStyle = "margin:12px 0 2px;font-size:12.5px;color:#8b90a0;";
const testRowStyle =
  "display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid #222637;";
const testNameStyle = "flex:1;font-size:13.5px;line-height:1.45;";
const errStyle = "color:#ff8a8a;font-size:12px;margin-top:3px;";
const badgeBase =
  "min-width:48px;text-align:center;border-radius:8px;padding:3px 8px;" +
  "font-size:11.5px;font-weight:700;";
const badgeIdle = badgeBase + "background:#232736;color:#8b90a0;";
const badgePass = badgeBase + "background:#12331f;color:#7ee0a8;";
const badgeFail = badgeBase + "background:#3a1818;color:#ff8a8a;";

// Object styles are applied with Object.assign(el.style, ...)
const iconBoxStyle: CSSProperties = {
  border: "1px solid #ff0000",
  width: "140px",
  minHeight: "100px",
  padding: "8px",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

/** Runs `fn` and returns its result as text, or the error message. */
function safe(fn: () => unknown): string {
  try {
    return String(fn());
  } catch (error) {
    return "ERR: " + (error instanceof Error ? error.message : String(error));
  }
}

// style() maps selectors to rule objects and returns a map of scoped class names.
const demoClasses = style({
  ".demo-title": { color: "#7ee0a8", fontWeight: 700, fontSize: "18px" },
});

// ---------------------------------------------------------------------------
// Automated tests
// ---------------------------------------------------------------------------
type Fx = (callback: () => void) => () => void;
type TestCase = { name: string; run: (fx: Fx) => void };

const tests: TestCase[] = [
  // ---- reactivity ----
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
    name: "effect: runs once immediately, then on every change",
    run(fx) {
      const [n, setN] = state(0);
      let runs = 0;
      fx(() => {
        n();
        runs++;
      });
      setN(1);
      setN(2);
      assert(runs === 3, "expected 3 runs, got " + runs);
    },
  },
  {
    name: "state: same value and NaN -> NaN do not trigger effects",
    run(fx) {
      const [a, setA] = state(1);
      const [b, setB] = state<number>(NaN);
      let runs = 0;
      fx(() => {
        a();
        b();
        runs++;
      });
      setA(1);
      setB(NaN);
      assert(runs === 1, "no re-run expected, got " + runs);
    },
  },
  {
    name: "state: updater receives the previous value and is not tracked",
    run(fx) {
      const [a, setA] = state(1);
      const [b, setB] = state(0);
      let runs = 0;
      setB((prev) => prev + 5);
      assert(b() === 5, "updater should give 5");
      fx(() => {
        runs++;
        setB(() => a() * 10);
      });
      setA(2);
      assert(runs === 1, "a must not be tracked by the updater, got " + runs);
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
      assert(runs === 1, "b is not read yet");
      setA(1);
      assert(runs === 2, "a is read");
      setFlag(false);
      setA(2);
      assert(runs === 3, "a is no longer read, got " + runs);
      setB(2);
      assert(runs === 4, "b is read now, got " + runs);
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
      assert(runs === 2, "tracked a must re-run");
    },
  },
  {
    name: "nested effects: outer keeps tracking and old children are disposed",
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
    name: "dispose: a disposed effect never runs again (twice is safe)",
    run() {
      const [n, setN] = state(0);
      let runs = 0;
      const stop = effect(() => {
        n();
        runs++;
      });
      stop();
      stop();
      setN(1);
      assert(runs === 1, "disposed effect ran, got " + runs);
    },
  },
  {
    name: "batch: one run for many updates, nested batch flushes once",
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
        batch(() => {
          setB(1);
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
  {
    name: "cleanup: runs before the next run and when the effect is disposed",
    run(fx) {
      const [n, setN] = state(0);
      let cleaned = 0;
      const stop = fx(() => {
        n();
        cleanup(() => {
          cleaned++;
        });
      });
      setN(1);
      assert(cleaned === 1, "expected 1 cleanup after a re-run, got " + cleaned);
      stop();
      assert(cleaned === 2, "expected 2 cleanups after dispose, got " + cleaned);
    },
  },
  {
    name: "computed (assumes it returns a getter): value follows its sources",
    run() {
      const [a, setA] = state(1);
      const doubled = (computed as any)(() => a() * 2);
      assert(doubled() === 2, "expected 2, got " + doubled());
      setA(4);
      assert(doubled() === 8, "expected 8, got " + doubled());
    },
  },
  {
    name: "computed: an effect that reads it runs once per change",
    run(fx) {
      const [a, setA] = state(1);
      const doubled = (computed as any)(() => a() * 2);
      let runs = 0;
      fx(() => {
        doubled();
        runs++;
      });
      setA(2);
      assert(runs === 2, "expected 2 runs, got " + runs);
    },
  },

  // ---- runtime exports ----
  {
    name: "h: builds an element with props and children",
    run() {
      const el = h("p", { id: "t", "data-id": "7" }, "hi") as HTMLElement;
      assert(el instanceof HTMLElement, "should be an HTMLElement");
      assert(el.id === "t", "id should be t");
      assert(el.getAttribute("data-id") === "7", "data-id should be 7");
      assert(el.textContent === "hi", "text should be hi");
    },
  },
  {
    name: "h: a function child is reactive",
    run() {
      const [n, setN] = state(1);
      const el = h("p", null, () => String(n())) as HTMLElement;
      assert(el.textContent === "1", "initial text should be 1");
      setN(2);
      assert(el.textContent === "2", "text should follow the signal, got " + el.textContent);
    },
  },
  {
    name: "h: a getter prop becomes a reactive attribute",
    run() {
      const [n, setN] = state(1);
      const props = {
        get title() {
          return String(n());
        },
      };
      const el = h("div", props) as HTMLElement;
      assert(el.getAttribute("title") === "1", "initial title should be 1");
      setN(2);
      assert(el.getAttribute("title") === "2", "title should follow the signal");
    },
  },
  {
    name: "h: svg tags are created in the SVG namespace",
    run() {
      const el = h("svg", null) as Element;
      assert(el instanceof SVGElement, "svg should be an SVGElement");
    },
  },
  {
    name: "jsx and jsxs: build elements from props.children",
    run() {
      const a = jsx("p", { id: "a", children: "hi" }) as HTMLElement;
      assert(a.id === "a" && a.textContent === "hi", "jsx result is wrong");
      const b = jsxs("p", { children: ["x", "y"] }) as HTMLElement;
      assert(b.textContent === "xy", "jsxs text should be xy, got " + b.textContent);
    },
  },
  {
    name: "Fragment: returns its children as they are",
    run() {
      assert(Fragment({ children: "x" }) === "x", "single child should be returned as is");
      const list = ["a", "b"];
      assert(Fragment({ children: list }) === list, "array should be returned as is");
    },
  },
  {
    name: "render and unmount (unmount argument is a guess)",
    run() {
      const box = document.createElement("div");
      document.body.appendChild(box);

      try {
        render(() => h("p", null, "rendered") as Element, box);
        assert(box.textContent === "rendered", "render did not fill the container");
        (unmount as any)(box);
        assert(box.textContent === "", "unmount did not clear the container");
      } finally {
        box.remove();
      }
    },
  },
  {
    name: "head (object argument is a guess): sets the document title",
    run() {
      const previous = document.title;

      try {
        (head as any)({ title: "Levelo Test" });
        assert(document.title === "Levelo Test", "title is " + document.title);
      } finally {
        document.title = previous;
      }
    },
  },
  {
    name: "style: returns scoped class names and injects the css",
    run() {
      const classes = style({ ".test-box": { color: "red", fontSize: "12px" } });
      const name = classes["test-box"];
      assert(typeof name === "string", "missing class name for test-box");
      assert(name.startsWith("test-box_"), "unexpected class name " + name);

      const sheet = document.getElementById("levelo-style-sheet");
      assert(
        !!sheet && (sheet.textContent ?? "").includes("." + name),
        "the css for " + name + " was not injected",
      );
    },
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function Mind() {
  // Show tests
  const [visible, setVisible] = state(true);
  const [count, setCount] = state(0);
  const [user, setUser] = state<{ name: string } | null>(null);
  const [flag, setFlag] = state(true);

  // For tests
  const [items, setItems] = state<string[]>(["Task One", "Task Two"]);
  const [rowCleanups, setRowCleanups] = state(0);
  let nextId = 3;

  // SVG tests
  const [dots, setDots] = state<number[]>([0, 1, 2]);

  // Input, ref and lifecycle tests
  const [text, setText] = state("hello");
  const [refInfo, setRefInfo] = state("waiting");
  const [mounted, setMounted] = state("waiting");

  // computed is used with a best-guess signature
  let doubled: () => unknown = () => "computed unavailable";
  try {
    doubled = (computed as any)(() => count() * 2);
  } catch (error) {
    doubled = () => "ERR: " + (error instanceof Error ? error.message : String(error));
  }

  // mount is used with a best-guess signature
  try {
    (mount as any)(() => setMounted("yes"));
  } catch (error) {
    setMounted("ERR: " + (error instanceof Error ? error.message : String(error)));
  }

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
        disposers.forEach((stop) => stop());
      }
    }

    setSummary(passed + " / " + rows.length + " passed");
  }

  function addItem() {
    setItems([...items(), `Task ${nextId++}`]);
  }

  function addDot() {
    setDots([...dots(), dots().length]);
  }

  return (
    <div style={pageStyle}>
      <div style={wrapStyle}>
        {/* 0. Automated tests */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>0. Automated tests</h3>
          <p style={hintStyle}>
            Covers state, effect, batch, untrack, cleanup, computed, h, jsx, jsxs, Fragment,
            render, unmount, head and style. Tests marked "guess" use an assumed signature: a
            failure there means the guess is wrong, not necessarily the API.
          </p>
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

        {/* 1. Show */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>1. Show with fallback</h3>
          <p style={hintStyle}>Expected: the text switches between "Visible now" and "Hidden now".</p>
          <button style={btnStyle} onClick={() => setVisible(!visible())}>
            {visible() ? "Hide" : "Show"}
          </button>
          <Show when={visible()} fallback={<p style={warnTextStyle}>Hidden now</p>}>
            <p style={okTextStyle}>Visible now</p>
          </Show>
        </div>

        {/* 2. Reactive content inside Show */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>2. Reactive content inside Show</h3>
          <p style={hintStyle}>
            Expected: the counter updates while visible. Hide it, press +1 twice, show it again:
            it must show the latest value.
          </p>
          <div style={rowStyle}>
            <button style={btnStyle} onClick={() => setCount(count() + 1)}>
              +1
            </button>
            <button style={btnGhostStyle} onClick={() => setVisible(!visible())}>
              Toggle (shared with test 1)
            </button>
          </div>
          <Show when={visible()}>
            <p style={okTextStyle}>{`Count: ${count()}`}</p>
          </Show>
        </div>

        {/* 3. Function child */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>3. Show with a function child</h3>
          <p style={hintStyle}>Expected: "Hello, Siam" after login, "Logged out" after logout.</p>
          <div style={rowStyle}>
            <button style={btnStyle} onClick={() => setUser({ name: "Siam" })}>
              Login
            </button>
            <button style={btnGhostStyle} onClick={() => setUser(null)}>
              Logout
            </button>
          </div>
          <Show when={user()} fallback={<p style={warnTextStyle}>Logged out</p>}>
            {(u: any) => <p style={okTextStyle}>{`Hello, ${u()?.name}`}</p>}
          </Show>
        </div>

        {/* 4. Ternary JSX */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>4. Ternary with JSX on both sides</h3>
          <p style={hintStyle}>Expected: the box switches between two elements.</p>
          <button style={btnStyle} onClick={() => setFlag(!flag())}>
            Switch
          </button>
          {flag() ? (
            <p style={okTextStyle}>Branch A</p>
          ) : (
            <p style={warnTextStyle}>Branch B</p>
          )}
        </div>

        {/* 5. For */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>5. For, row state and row cleanup</h3>
          <p style={hintStyle}>
            Expected: (a) +1 on a row keeps working after other rows are added or removed. (b)
            Reverse and "- First" renumber the rows. (c) Two "Dup" rows both appear. (d) Every
            removed row adds 1 to the cleanup counter below. (e) Clear shows the fallback.
          </p>
          <div style={rowStyle}>
            <button style={btnStyle} onClick={addItem}>
              + Add
            </button>
            <button style={btnGhostStyle} onClick={() => setItems([...items(), "Dup"])}>
              + Dup
            </button>
            <button style={btnGhostStyle} onClick={() => setItems(items().slice(0, -1))}>
              - Last
            </button>
            <button style={btnGhostStyle} onClick={() => setItems(items().slice(1))}>
              - First
            </button>
            <button style={btnGhostStyle} onClick={() => setItems([...items()].reverse())}>
              Reverse
            </button>
            <button style={btnGhostStyle} onClick={() => setItems([])}>
              Clear
            </button>
          </div>
          <ul style={listStyle}>
            <For each={items()} fallback={<li style={itemStyle}>No items</li>}>
              {(item, index) => {
                // Local state per row: it must survive list updates.
                const [clicks, setClicks] = state(0);

                // Runs when this row is removed (an updater keeps it untracked).
                cleanup(() => setRowCleanups((n) => n + 1));

                return (
                  <li style={itemStyle}>
                    <span>{`${index() + 1}. ${item}`}</span>
                    <button style={miniBtnStyle} onClick={() => setClicks(clicks() + 1)}>
                      {`+1 (${clicks()})`}
                    </button>
                  </li>
                );
              }}
            </For>
          </ul>
          <p style={mutedStyle}>
            Total: {items().length} items | row cleanups run: {rowCleanups()}
          </p>
          <p style={hintStyle}>
            Spacing check: the line above should read "Total: 3 items | row cleanups run: 0".
          </p>
        </div>

        {/* 6. Fragment */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>6. Fragment</h3>
          <p style={hintStyle}>
            Expected: A, B, C, the counter, D, the counter, then E with the counter in front. The
            last block puts an expression directly inside a Fragment inside Show.
          </p>
          <>
            <p style={mutedStyle}>A (short syntax)</p>
            <p style={mutedStyle}>B (short syntax)</p>
          </>
          <Fragment>
            <p style={mutedStyle}>C (Fragment)</p>
            <p style={mutedStyle}>{count()}</p>
          </Fragment>
          <Show when={visible()}>
            <Fragment>
              <p style={mutedStyle}>D (Fragment inside Show)</p>
              <p style={mutedStyle}>{count()}</p>
            </Fragment>
          </Show>
          <Show when={visible()}>
            <Fragment>
              {count()}
              <p style={mutedStyle}>E (expression directly inside Fragment)</p>
            </Fragment>
          </Show>
        </div>

        {/* 7. SVG */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>7. SVG namespace and icons</h3>
          <p style={hintStyle}>Expected: every row shows circles, and both icons are visible.</p>
          <div style={rowStyle}>
            <button style={btnStyle} onClick={addDot}>
              + Dot
            </button>
            <button style={btnGhostStyle} onClick={() => setDots(dots().slice(0, -1))}>
              - Dot
            </button>
          </div>

          <p style={svgLabelStyle}>Static circle</p>
          <svg style={svgBoxStyle} width="260" height="44" viewBox="0 0 260 44">
            <circle cx="22" cy="22" r="10" fill="#7ee0a8" />
          </svg>

          <p style={svgLabelStyle}>Circles from .map()</p>
          <svg style={svgBoxStyle} width="260" height="44" viewBox="0 0 260 44">
            {dots().map((d) => (
              <circle cx={22 + d * 30} cy="22" r="10" fill="#4f6ef7" />
            ))}
          </svg>

          <p style={svgLabelStyle}>Circles from For</p>
          <svg style={svgBoxStyle} width="260" height="44" viewBox="0 0 260 44">
            <For each={dots()}>
              {(d) => <circle cx={22 + d * 30} cy="22" r="10" fill="#ffb86b" />}
            </For>
          </svg>

          <p style={svgLabelStyle}>Icon from kivex-levelo (object style box with minHeight)</p>
          <div style={iconBoxStyle}>
            <h2 style="margin:0 0 6px;font-size:16px;">Home Icon</h2>
            <Home />
          </div>
        </div>

        {/* 8. Input, ref, attributes, style() */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>8. Input, ref, attributes and style()</h3>
          <p style={hintStyle}>
            Expected: typing updates the text below, the ref line says it got a div, data-* and
            aria-* attributes appear in the Elements tab, and the style() token paints green text.
          </p>
          <input
            style={inputStyle}
            value={text()}
            onInput={(e: any) => setText(e.target.value)}
          />
          <p style={mutedStyle}>{`You typed: ${text()}`}</p>
          <div ref={(el: HTMLElement) => setRefInfo(`ref got <${el.tagName.toLowerCase()}>`)}>
            <p style={mutedStyle}>{refInfo()}</p>
          </div>
          <div data-id="1" aria-label="test">
            <p style={mutedStyle}>Attribute check: inspect this block</p>
          </div>
          <p class={demoClasses["demo-title"]}>
            {`style() class: ${demoClasses["demo-title"]}`}
          </p>
        </div>

        {/* 9. Lifecycle and computed */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>9. mount and computed (best-guess signatures)</h3>
          <p style={hintStyle}>
            Expected: mount runs once after the first render, and the doubled value follows the
            counter from test 2.
          </p>
          <p style={mutedStyle}>{`mount ran: ${mounted()}`}</p>
          <p style={mutedStyle}>{`count: ${count()} | doubled: ${safe(() => doubled())}`}</p>
          <button style={btnStyle} onClick={() => setCount(count() + 1)}>
            +1
          </button>
        </div>
      </div>
    </div>
  );
}