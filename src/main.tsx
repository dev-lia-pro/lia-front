import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/drag.css'
import { QueryProvider } from './providers/QueryProvider.tsx'

createRoot(document.getElementById("root")!).render(
  <QueryProvider>
    <App />
  </QueryProvider>
);
