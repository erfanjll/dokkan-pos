import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// ثبت و به‌روزرسانی خودکار فوری سرویس‌ورکر
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true)
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  }
})

// اجبار مرورگر به بررسی فوری نسخه جدید سرور و لود خودکار
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((reg) => {
    reg.update().catch(() => {})
  })

  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true
      window.location.reload()
    }
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
