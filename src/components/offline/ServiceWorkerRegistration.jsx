import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Never register in dev — stale SW cache causes duplicate React / null hook errors
    if (import.meta.env.DEV) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => reg.unregister());
      });
      caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
      return;
    }

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
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  return null;
}