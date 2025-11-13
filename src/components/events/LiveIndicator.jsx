import React from "react";
import { motion } from "framer-motion";
import { Radio, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LiveIndicator({ isConnected, variant = "default", showLabel = true }) {
  if (variant === "badge") {
    return (
      <Badge 
        className={`${
          isConnected 
            ? 'bg-green-600/20 border-green-500/50 text-green-300' 
            : 'bg-gray-600/20 border-gray-500/50 text-gray-400'
        } flex items-center gap-1.5 px-2 py-1`}
      >
        <motion.div
          className="relative flex items-center"
          animate={isConnected ? {
            scale: [1, 1.2, 1]
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div 
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`}
            style={{
              boxShadow: isConnected ? '0 0 10px rgba(34, 197, 94, 0.8)' : 'none'
            }}
          />
          {isConnected && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-green-500"
                animate={{
                  scale: [1, 2.5, 1],
                  opacity: [0.8, 0, 0.8]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border border-green-400"
                animate={{
                  scale: [1, 1.8, 1],
                  opacity: [0.6, 0, 0.6]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              />
            </>
          )}
        </motion.div>
        {showLabel && (
          <span className="text-[10px] font-semibold">
            {isConnected ? 'AO VIVO' : 'Offline'}
          </span>
        )}
      </Badge>
    );
  }

  return (
    <motion.div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
        isConnected 
          ? 'bg-green-600/20 border-2 border-green-500/50' 
          : 'bg-gray-700/20 border border-gray-600/50'
      }`}
      animate={isConnected ? {
        boxShadow: [
          '0 0 15px rgba(34, 197, 94, 0.3)',
          '0 0 25px rgba(34, 197, 94, 0.5)',
          '0 0 15px rgba(34, 197, 94, 0.3)'
        ]
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <motion.div
        className="relative flex items-center"
        animate={isConnected ? {
          scale: [1, 1.15, 1]
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {isConnected ? (
          <Radio className="w-4 h-4 text-green-400" />
        ) : (
          <WifiOff className="w-4 h-4 text-gray-500" />
        )}
        
        {isConnected && (
          <>
            <motion.div
              className="absolute inset-0"
              animate={{
                scale: [1, 2, 1],
                opacity: [0.6, 0, 0.6]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Radio className="w-4 h-4 text-green-400" />
            </motion.div>
            <motion.div
              className="absolute inset-0"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 0, 0.4]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
            >
              <Radio className="w-4 h-4 text-green-400" />
            </motion.div>
          </>
        )}
      </motion.div>
      
      {showLabel && (
        <span className={`text-xs font-semibold ${isConnected ? 'text-green-300' : 'text-gray-400'}`}>
          {isConnected ? 'Dados ao vivo' : 'Sem conexão'}
        </span>
      )}
    </motion.div>
  );
}