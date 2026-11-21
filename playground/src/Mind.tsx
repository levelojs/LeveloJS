import { state, Show } from "levelojs";

export function Mind() {
  const [isActive, setIsActive] = state(false);
  return (
    <div class="active">
      <button
        onClick={() => {
          setIsActive(!isActive());
        }}
      >
        Click
      </button>
      <Show when={isActive()}>
        <h2>Welcome</h2>
      </Show>
    </div>
  );
}
