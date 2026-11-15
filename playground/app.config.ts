import { defineConfig } from "levelojs";

export default defineConfig({
    icon: './public/levelojs.svg',
    web: {
        
    },
    native: {
        window: {
            maxHeight: 11800
        }
    }
})