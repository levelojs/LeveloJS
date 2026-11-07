import { render } from "levelojs";
import { App } from "./App";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Missing #app element.");
}

render(App, root);
