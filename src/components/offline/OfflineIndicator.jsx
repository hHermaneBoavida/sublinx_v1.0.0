import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* Status Bar */}
      {!isOnline && (
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 px-4 text-center text-sm font-medium shadow-lg"
        >
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span>Modo Offline - Algumas funcionalidades limitadas</span>
          </div>
        </motion.div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-20 left-1/2 z-[9999]"
          >
            <div className={`${
              isOnline 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                : 'bg-gradient-to-r from-orange-600 to-red-600'
            } text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3`}>
              {isOnline ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Conexão Restaurada</span>
                  <Wifi className="w-5 h-5" />
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">Sem Conexão</span>
                  <WifiOff className="w-5 h-5" />
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Badge */}
      {!isOnline && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-24 md:bottom-8 right-4 z-[9998]"
        >
          <Badge className="bg-orange-600 text-white border-0 shadow-lg px-3 py-2 flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse" />
            Offline
          </Badge>
        </motion.div>
      )}
    </>
  );
}