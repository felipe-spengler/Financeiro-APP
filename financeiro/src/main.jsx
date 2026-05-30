import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Registrar Service Worker para atualizações automáticas OTA (Over-The-Air)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Quando encontrar nova versão, instalar e recarregar
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão detectada e instalada. Forçar recarga automática da página.
              console.log('Nova versão do app disponível! Atualizando...');
              window.location.reload();
            }
          });
        }
      });
    }).catch((err) => {
      console.error('Falha ao registrar o Service Worker:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
