import React, { useState, useEffect } from "react";
import { Bell, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotificationPermissionPrompt() {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    if (!('Notification' in window)) return;

    const currentPermission = Notification.permission;
    setPermission(currentPermission);

    const dismissed = localStorage.getItem('notification_prompt_permanently_dismissed');
    if (dismissed === 'true') return;

    const lastDismissed = localStorage.getItem('notification_prompt_dismissed');
    if (lastDismissed) {
      const daysSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 1) return;
    }

    if (currentPermission === 'default') {
      const timer = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setShow(false);
      localStorage.setItem('notification_prompt_permanently_dismissed', 'true');
    } catch (error) {
      setShow(false);
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
    <div className="fixed top-16 sm:top-20 right-2 sm:right-4 z-50 max-w-[280px] sm:max-w-[320px]">
      <Card className="bg-gradient-to-br from-white via-cyan-50 to-purple-50 border-2 border-cyan-400/60 shadow-2xl overflow-hidden">
        <CardContent className="p-3 sm:p-4 relative">
          <div className="flex items-start gap-2.5">
            {/* Icon */}
            <div
              className="flex-shrink-0 rounded-full p-2"
              style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 1), rgba(139, 92, 246, 1))',
                boxShadow: '0 0 12px rgba(6, 182, 212, 0.5)'
              }}
            >
              <Bell className="w-4 h-4 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1 flex items-center gap-1.5">
                Ativar Notificações
                <Zap className="w-3 h-3 text-yellow-500" />
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-700 mb-2">
                Receba alertas de:
              </p>
              <ul className="text-[9px] sm:text-[10px] text-gray-600 space-y-0.5 mb-2.5">
                <li className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-cyan-500" />
                  📍 Eventos próximos
                </li>
                <li className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-purple-500" />
                  ❤️ Curtidas e comentários
                </li>
                <li className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-pink-500" />
                  🎉 Eventos surpresa
                </li>
              </ul>

              <div className="flex gap-1.5">
                <Button
                  onClick={handleRequestPermission}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white font-semibold text-[10px] sm:text-xs h-7"
                >
                  <Bell className="w-3 h-3 mr-1" />
                  Ativar
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  className="text-gray-700 hover:bg-gray-200 text-[10px] sm:text-xs h-7 px-2"
                >
                  Depois
                </Button>
              </div>

              <button
                onClick={handlePermanentDismiss}
                className="text-[9px] text-gray-500 hover:text-gray-700 underline mt-1.5 w-full text-center"
              >
                Não perguntar novamente
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}