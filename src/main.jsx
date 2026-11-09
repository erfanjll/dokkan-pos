import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// ثبت و به‌روزرسانی خودکار فوری سرویس‌ورکر
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // بازنشانی و لود نسخه جدید بلافاصله پس از دریافت تغییرات
    updateSW(true)
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
