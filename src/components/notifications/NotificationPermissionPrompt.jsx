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

      // Verificar se já foi dispensado permanentemente
      const dismissed = localStorage.getItem('notification_prompt_permanently_dismissed');
      if (dismissed === 'true') {
        return;
      }

      // Verificar se foi dispensado recentemente (últimas 24h)
      const lastDismissed = localStorage.getItem('notification_prompt_dismissed');
      if (lastDismissed) {
        const daysSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 1) {
          return;
        }
      }

      // Mostrar prompt apenas se permissão ainda não foi respondida
      if (currentPermission === 'default') {
        // Aguardar 5s após load da página (mais tempo para não ser intrusivo)
        const timer = setTimeout(() => {
          setShow(true);
        }, 5000);

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
      localStorage.setItem('notification_prompt_permanently_dismissed', 'true');
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('notification_prompt_dismissed', Date.now().toString());
  };

  const handlePermanentDismiss = () => {
    setShow(false);
    localStorage.setItem('notification_prompt_permanently_dismissed', 'true');
  };

  if (!show || permission !== 'default') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        className="fixed top-16 sm:top-20 right-2 sm:right-4 z-[100] max-w-[280px] sm:max-w-[320px]"
      >
        <Card className="bg-gradient-to-br from-white via-cyan-50 to-purple-50 border-2 border-cyan-400/60 shadow-2xl backdrop-blur-xl overflow-hidden">
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

          <CardContent className="p-4 sm:p-5 relative z-10">
            <div className="flex items-start gap-3">
              {/* Animated Icon */}
              <motion.div
                className="flex-shrink-0 rounded-full p-2 relative overflow-hidden"
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
                  <Bell className="w-5 h-5 text-white" />
                </motion.div>
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-base sm:text-lg mb-1 flex items-center gap-2">
                  Ativar Notificações
                  <Zap className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                </h3>
                <p className="text-xs sm:text-sm text-gray-200 mb-3">
                  Receba alertas de:
                </p>
                <ul className="text-[10px] sm:text-xs text-gray-300 space-y-0.5 mb-3">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-cyan-400" />
                    📍 Eventos próximos
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-purple-400" />
                    ❤️ Curtidas e comentários
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-pink-400" />
                    🎉 Eventos surpresa
                  </li>
                </ul>

                <div className="flex gap-2">
                  <Button
                    onClick={handleRequestPermission}
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white font-semibold text-xs h-8"
                  >
                    <Bell className="w-3.5 h-3.5 mr-1" />
                    Ativar
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    className="text-white hover:bg-white/10 text-xs h-8 px-2.5"
                  >
                    Depois
                  </Button>
                </div>

                <button
                  onClick={handlePermanentDismiss}
                  className="text-[10px] text-gray-400 hover:text-gray-300 underline mt-2 w-full text-center"
                >
                  Não perguntar novamente
                </button>
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