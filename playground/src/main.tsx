import { render } from "levelojs";
import { App } from "./App";
import './style.css';

const root = document.getElementById("app");

if (!root) {
  throw new Error("Missing #app element.");
}

render(App, root);
