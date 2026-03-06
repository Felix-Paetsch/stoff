import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import "./App.css"
import { App } from "./App.tsx"


// Keep full stack traces for UI error panels.
// (In most browsers this is a no-op, but in V8 it increases captured stack frames.)
(Error as any).stackTraceLimit = Infinity;

const rootEl = document.getElementById("root")!
rootEl.classList.add("root__el")

createRoot(rootEl).render(
    <StrictMode>
        <App />
    </StrictMode>,
)


