import { state } from "levelojs";

export function App() {
  const [count, setCount] = state(0);
  const [visible, setVisible] = state(true);

  const handleIncrement = () => {
    setCount(count() + 1);
    console.log("[JSX] Button clicked inside JS! Count:", count());
  };

  const handleDynamicCondition = () => {
    setVisible(!visible());
    console.log("[JSX] Button clicked for dynamic UI, vissible:", visible());
  }

  return (
    <main id="root" style={{ background: "#00ff00" }}>
      <header>
        <h1>LeveloJS Native Engine and Web Engine</h1>
        <p>Testing direct Skia rendering & reactivity without Webview or V8.</p>
      </header>

      <div>শ্রী ক্ষমা বিদ্যালয় যুক্তাক্ষর</div>

      <p>😍🖐👍</p>

      <section
        id="reactive-test"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h2>Counter Test</h2>
        <p style={{ display: "flex", flexDirection: "column" }}>
          Current Count: <strong><p>{count()}</p></strong>
        </p>

        <button
          type="button"
          onClick={handleIncrement}
          style={{
            background: "#3355dd",
            width: "100px",
            height: "50px",
            color: "#ff0000",
            borderRadius: "5px",
          }}
        >
          Increment Counter
        </button>
      </section>

      <section id="toggle-test">
        <h2>Dynamic Condition</h2>
        <button
          type="button"
          onClick={handleDynamicCondition}
        >
          Toggle Content how did we are in the city
        </button>

        <div>
          {(visible() ? <p>Status: Active & Rendering Smoothly</p> : null)}
        </div>
      </section>
    </main>
  );
}
