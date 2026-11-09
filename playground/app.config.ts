import { defineConfig } from "levelojs";

export default defineConfig({
    icon: './public/levelojs.svg',
    web: {
        title: 'Levelo JS',
    },
    native: {
        window: {
            maxHeight: 11800
        }
    }
})