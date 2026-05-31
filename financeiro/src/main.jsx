import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Garantir que nenhum Service Worker antigo interfira com o carregamento direto da VPS (evita telas brancas e CSSs antigos em cache)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

// Limpar caches do Service Worker antigos para forçar o download dos arquivos novos da VPS
if ('caches' in window) {
  caches.keys().then((names) => {
    for (let name of names) caches.delete(name);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
