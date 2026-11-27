// launch.jsx - 
import { launch } from "levelojs";
import { App } from "./src/App";

launch(() => {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Levelo JS App</title>
        <link rel="icon" type="image/svg+xml" href="/levelojs.svg" />
      </head>
      <body>
        <App />
      </body>
    </html>
  );
});
