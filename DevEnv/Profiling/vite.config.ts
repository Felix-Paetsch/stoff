import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
    server: {
        port: 3009,
        host: true,
        fs: {
            allow: ['../../']
        }
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "../../")
        }
    },
    root: __dirname,
    build: {
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.html')
            }
        }
    }
});