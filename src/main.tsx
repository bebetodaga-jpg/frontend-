import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { NotificationProvider } from './context/NotificationContext'
import { NotificationContainer } from './components/common/NotificationContainer'
import { ThemeProvider } from './context/ThemeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <NotificationProvider>
        <App />
        <NotificationContainer />
      </NotificationProvider>
    </ThemeProvider>
  </StrictMode>,
)
