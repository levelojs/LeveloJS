//main.tsx
import { render } from 'levelojs';
import { App } from './App';
import './main.css';

render(App, (document.getElementById('app') as HTMLElement));
