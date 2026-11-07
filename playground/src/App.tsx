import { state } from "levelojs";

export function App() {
  const [count, setCount] = state(0);
  const [visible, setVisible] = state(true);

  return (
    <main id="root">
      <header>
        <h1>LeveloJS Native Engine</h1>
        <p>Testing direct Skia rendering & reactivity without Webview or V8.</p>
      </header>

      <div>শ্রী ক্ষমা বিদ্যালয় যুক্তাক্ষর</div>

      <section id="reactive-test">
        <h2>Counter Test</h2>
        <p>
          Current Count: <strong>{count()}</strong>
        </p>

        <button
          type="button"
          onClick={() => {
            setCount(count() + 1);
          }}
          style={{ background: '#3355dd', width: '100px', height: '50px', color: '#ff0000', borderRadius: '5px' }}
        >
          Increment Counter
        </button>
      </section>

      <section id="toggle-test">
        <h2>Dynamic Condition</h2>
        <button
          type="button"
          onClick={() => {
            setVisible(!visible());
          }}
        >
          Toggle Content
        </button>

        <div>
          {visible() ? <p>Status: Active & Rendering Smoothly</p> : null}
        </div>
      </section>
    </main>
  );
}
