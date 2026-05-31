import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Garantir que nenhum Service Worker antigo interfira com o carregamento direto da VPS
try {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (let registration of registrations) {
        registration.unregister().catch(() => {});
      }
    }).catch(() => {});
  }
} catch (e) {
  console.error("Erro ao desregistrar Service Worker:", e);
}

// Limpar caches do Service Worker antigos para forçar o download dos arquivos novos da VPS
try {
  if ('caches' in window && typeof caches !== 'undefined') {
    caches.keys().then((names) => {
      for (let name of names) {
        caches.delete(name).catch(() => {});
      }
    }).catch(() => {});
  }
} catch (e) {
  console.error("Erro ao limpar cache:", e);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
