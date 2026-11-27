import { launch } from "levelojs";
import { App } from "./src/App";
import { Mind } from "./src/Mind";

launch(() => {
    return (
        <html>
            <head>
                <link rel="icon" type="image/svg+xml" href="/levelojs.svg" />
                <title>Levelo App</title>
            </head>
            <body>
                <Mind />
            </body>
        </html>
    )
})