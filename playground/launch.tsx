import { launch } from "levelojs";
import { App } from "./src/App";

launch(() => {
    return (
        <html>
            <head>
                <title>Levelo App</title>
            </head>
            <body>
                <App />
            </body>
        </html>
    )
})