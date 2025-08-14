import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './i18n.ts' // Initialize i18next
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
