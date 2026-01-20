import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'

// Keep full stack traces for UI error panels.
// (In most browsers this is a no-op, but in V8 it increases captured stack frames.)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Error as any).stackTraceLimit = Infinity;

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)

