import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }

    // Verificar se já foi instalado via localStorage
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const lastDismissed = localStorage.getItem('pwa-install-dismissed-time');
    
    // Se foi descartado há menos de 7 dias, não mostrar
    if (dismissed && lastDismissed) {
      const daysSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Esperar 3 segundos antes de mostrar o prompt
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listener para quando o app for instalado
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    } else {
      localStorage.setItem('pwa-install-dismissed', 'true');
      localStorage.setItem('pwa-install-dismissed-time', Date.now().toString());
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    localStorage.setItem('pwa-install-dismissed-time', Date.now().toString());
  };

  // Não mostrar se já instalado ou se não há prompt
  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-50"
      >
        <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-cyan-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Glow Effect */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at top right, rgba(6, 182, 212, 0.3), transparent 70%)'
            }}
          />

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>

          <div className="flex items-start gap-3 relative z-10">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 p-2 shadow-lg">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/116e0559c_Sublinx_icon.png"
                  alt="SUBLINX"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="text-white font-bold text-base mb-1 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                Instalar SUBLINX
              </h3>
              <p className="text-gray-300 text-xs mb-3">
                Instale o app para acesso rápido e experiência completa, mesmo offline
              </p>

              {/* Features */}
              <div className="space-y-1 mb-3">
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="text-green-400">✓</span>
                  <span>Acesso rápido com um toque</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="text-green-400">✓</span>
                  <span>Notificações de eventos</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="text-green-400">✓</span>
                  <span>Funciona offline</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleInstallClick}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 h-9 text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Instalar
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  className="border-gray-700 hover:bg-gray-800 h-9 text-xs px-3"
                >
                  Depois
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}