import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { validateEnv } from "./lib/env";

// Validate environment variables before rendering
try {
  validateEnv();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; font-family: sans-serif;">
      <div style="max-width: 500px; text-align: center;">
        <h1 style="color: #991b1b; margin-bottom: 10px;">Configuration Error</h1>
        <pre style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: left; overflow: auto; white-space: pre-wrap;">${message}</pre>
      </div>
    </div>
  `;
  throw error;
}

createRoot(document.getElementById("root")!).render(<App />);
