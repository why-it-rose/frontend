import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initForegroundMessage } from '@/features/fcm/fcmService'
import { initLsTokenLifecycle } from '@/features/ls/lsTokenScheduler'

initForegroundMessage()
initLsTokenLifecycle()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
