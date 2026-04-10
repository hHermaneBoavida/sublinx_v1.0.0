import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Apenas registrar se houver um arquivo real /service-worker.js
    // Blob URLs não são suportadas como ServiceWorker
    fetch('/service-worker.js', { method: 'HEAD' })
      .then(res => {
        if (res.ok) {
          navigator.serviceWorker
            .register('/service-worker.js')
            .then(reg => {
              reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker?.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('Nova versão disponível.');
                  }
                });
              });
            })
            .catch(() => {}); // silenciar erros de SW
        }
      })
      .catch(() => {}); // /service-worker.js não existe, ignorar
  }, []);

  return null;
}