import { defineConfig } from "levelojs";

export default defineConfig({
    icon: './public/levelojs.svg',
    web: {
        minify: false,
        port: 2100
    },
    native: {
        window: {
            maxHeight: 11800
        }
    }
})