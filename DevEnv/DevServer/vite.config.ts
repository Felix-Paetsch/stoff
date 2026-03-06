import { defineConfig } from "vite";
// @ts-ignore
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [
        react({
            jsxRuntime: "automatic",
        }),
    ],

    resolve: {
        alias: {
            "@": path.resolve(__dirname, "../../"),
        },
    },

    esbuild: {
        sourcemap: true,
    },

    build: {
        sourcemap: true,
    },
});
