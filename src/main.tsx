import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ToastProvider } from './components/Toast'
import { ResultProvider } from './components/ResultModal'
import { PermissionsProvider } from './contexts/PermissionsContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <ResultProvider>
          <PermissionsProvider>
            <App />
          </PermissionsProvider>
        </ResultProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
