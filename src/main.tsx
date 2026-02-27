import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './i18n/i18n.ts';
export { default as LanguageSwitcher } from './i18n/languageSwitcher/LanguageSwitcher.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
