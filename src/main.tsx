import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

function dismissInitialLoader() {
  const loader = document.getElementById('initial-loader')
  if (!loader) {
    return
  }

  loader.classList.add('initial-loader--hidden')

  let removed = false
  const removeLoader = () => {
    if (removed) {
      return
    }

    removed = true
    loader.remove()
  }

  loader.addEventListener('transitionend', removeLoader, { once: true })
  window.setTimeout(removeLoader, 320)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

window.requestAnimationFrame(() => {
  window.requestAnimationFrame(dismissInitialLoader)
})

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`
    navigator.serviceWorker.register(swUrl).catch(() => {
      // Ignore registration errors to avoid affecting app usage.
    })
  })
}
