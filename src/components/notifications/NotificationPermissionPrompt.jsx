import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotificationPermissionPrompt() {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);

      // Mostrar prompt se ainda não respondeu
      if (currentPermission === 'default') {
        // Aguardar 3s após load da página
        const timer = setTimeout(() => {
          setShow(true);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        // Mostrar notificação de teste
        new Notification('🎉 Notificações Ativadas!', {
          body: 'Você receberá alertas de eventos próximos e interações',
          icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/116e0559c_Sublinx_icon.png',
          badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/116e0559c_Sublinx_icon.png',
          vibrate: [200, 100, 200]
        });
      }
      
      setShow(false);
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('notification_prompt_dismissed', Date.now().toString());
  };

  if (!show || permission !== 'default') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
      >
        <Card className="bg-gradient-to-r from-cyan-900/95 to-purple-900/95 border-2 border-cyan-500/50 shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Animated Background */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)'
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Scan Line */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, rgba(6, 182, 212, 0.4) 48%, rgba(6, 182, 212, 0.6) 50%, rgba(6, 182, 212, 0.4) 52%, transparent 100%)',
              height: '100%',
            }}
            animate={{ y: ['-100%', '200%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />

          <CardContent className="p-6 relative z-10">
            <div className="flex items-start gap-4">
              {/* Animated Icon */}
              <motion.div
                className="flex-shrink-0 rounded-full p-3 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 1), rgba(139, 92, 246, 1))',
                  boxShadow: '0 0 25px rgba(6, 182, 212, 0.8)'
                }}
                animate={{
                  boxShadow: [
                    '0 0 25px rgba(6, 182, 212, 0.8)',
                    '0 0 35px rgba(6, 182, 212, 1)',
                    '0 0 25px rgba(6, 182, 212, 0.8)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Bell className="w-6 h-6 text-white" />
                </motion.div>
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-lg mb-2 flex items-center gap-2">
                  Ativar Notificações
                  <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
                </h3>
                <p className="text-sm text-gray-200 mb-4">
                  Receba alertas instantâneos de:
                </p>
                <ul className="text-xs text-gray-300 space-y-1 mb-4">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    📍 Eventos próximos de você
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    ❤️ Curtidas e comentários
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                    🎉 Eventos surpresa exclusivos
                  </li>
                </ul>

                <div className="flex gap-2">
                  <Button
                    onClick={handleRequestPermission}
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white font-semibold text-sm h-9"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Ativar
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    className="text-white hover:bg-white/10 text-sm h-9 px-3"
                  >
                    Agora não
                  </Button>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white/80" />
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}