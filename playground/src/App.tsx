import { state, style } from "levelojs";
import './App.css';

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
    <main id="root" style={{ background: "#00ff00",  }}>
      <header>
        <h1>LeveloJS Native Engine and Web Engine</h1>
        <p style={{ color: '#ddd' }}>Testing direct Skia rendering & reactivity without Webview or V8.</p>
      </header>

      <div>শ্রী ক্ষমা বিদ্যালয় যুক্তাক্ষর</div>
      <p>😍🖐👍</p>
      <p>漢字/汉字</p>

      <section
        id="reactive-test"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 'bold'
        }}
      >
        <h2>Counter Test</h2>
        <p style={{ display: "flex" }}>
          Current Count: {count()}
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
          this is the big button on this canvas for checking button width, is that perfect or not
        </button>

        <div>
          {(visible() ? <p>Status: Active & Rendering Smoothly</p> : null)}
        </div>
      </section>

      <div>
        Type Test
        <h1>Type Test: h1</h1>
        <h2>Type Test: h2</h2>
        <h3>Type Test: h3</h3>
        <h4>Type Test: h4</h4>
        <h5>Type Test: h5</h5>
        <h6>Type Test: h6</h6>
        <p>Type Test: paragraph</p>
      </div>
    </main>
  );
}
