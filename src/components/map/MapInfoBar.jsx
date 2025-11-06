import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Wifi, WifiOff, ChevronDown, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function MapInfoBar({
  internalCount = 0,
  externalCount = 0,
  includeExternal = true,
  backendStatus = null,
  syncing = false,
  onToggleExternal,
  onSync,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalEvents = internalCount + externalCount;

  const getStatusColor = () => {
    if (!includeExternal) return 'bg-gray-700';
    if (backendStatus === 'online') return 'bg-green-500';
    if (backendStatus === 'offline') return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getStatusText = () => {
    if (!includeExternal) return 'Externos desativados';
    if (backendStatus === 'online') return 'APIs externas online';
    if (backendStatus === 'offline') return 'APIs externas offline';
    return 'Verificando...';
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed bottom-28 sm:bottom-32 left-4 z-30"
      >
        {/* Compact View */}
        <motion.div
          layout
          className="bg-black/90 backdrop-blur-2xl rounded-2xl border border-cyan-500/30 shadow-2xl overflow-hidden w-auto"
          style={{
            boxShadow: '0 8px 32px rgba(6, 182, 212, 0.15), 0 0 0 1px rgba(6, 182, 212, 0.1)'
          }}
        >
          {/* Main Info Bar */}
          <div className="flex items-center justify-between gap-3 p-3">
            {/* Left: Event Count */}
            <div className="flex items-center gap-2">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">{totalEvents}</span>
                </div>
                {/* Status Dot */}
                <motion.div
                  className={`absolute -top-0.5 -right-0.5 w-3 h-3 ${getStatusColor()} rounded-full border-2 border-black`}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              <div className="flex flex-col">
                <span className="text-white font-semibold text-sm whitespace-nowrap">
                  {totalEvents} {totalEvents === 1 ? 'Evento' : 'Eventos'}
                </span>
                <span className="text-gray-400 text-xs whitespace-nowrap">
                  {internalCount} int. {externalCount > 0 && `+ ${externalCount} ext.`}
                </span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Sync Button (only if online) */}
              {includeExternal && backendStatus === 'online' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onSync}
                      disabled={syncing}
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 p-0 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors"
                    >
                      <motion.div
                        animate={syncing ? { rotate: 360 } : {}}
                        transition={{ duration: 1, repeat: syncing ? Infinity : 0, ease: "linear" }}
                      >
                        {syncing ? (
                          <Loader2 className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </motion.div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 border-cyan-500/30">
                    <p className="text-xs">Sincronizar região</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Expand Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setIsExpanded(!isExpanded)}
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0 hover:bg-purple-500/10 hover:text-purple-400 transition-colors"
                  >
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 border-purple-500/30">
                  <p className="text-xs">{isExpanded ? 'Recolher' : 'Expandir'} detalhes</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-gray-800/50 overflow-hidden"
              >
                <div className="p-4 space-y-3 w-72">
                  {/* Status Info */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/30">
                    {includeExternal && backendStatus ? (
                      backendStatus === 'online' ? (
                        <Wifi className="w-4 h-4 text-green-400" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-yellow-400" />
                      )
                    ) : (
                      <Info className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-xs text-gray-300">{getStatusText()}</span>
                  </div>

                  {/* Event Sources */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Fonte</span>
                      <span className="text-gray-400">Quantidade</span>
                    </div>
                    
                    {/* Internal Events */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="text-sm text-cyan-300">Base44</span>
                      </div>
                      <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
                        {internalCount}
                      </Badge>
                    </div>

                    {/* External Events */}
                    <div 
                      className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                        includeExternal 
                          ? 'bg-purple-500/5 border border-purple-500/20' 
                          : 'bg-gray-800/30 border border-gray-700/30 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${includeExternal ? 'bg-purple-400' : 'bg-gray-600'}`} />
                        <span className={`text-sm ${includeExternal ? 'text-purple-300' : 'text-gray-500'}`}>
                          APIs Externas
                        </span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          includeExternal 
                            ? 'border-purple-500/30 text-purple-400' 
                            : 'border-gray-700/30 text-gray-500'
                        }`}
                      >
                        {externalCount}
                      </Badge>
                    </div>
                  </div>

                  {/* Toggle External */}
                  <Button
                    onClick={onToggleExternal}
                    variant="outline"
                    className={`w-full text-xs ${
                      includeExternal
                        ? 'border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                        : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    {includeExternal ? '✓ Eventos Externos Ativos' : '✗ Ativar Eventos Externos'}
                  </Button>

                  {/* Offline Warning */}
                  {includeExternal && backendStatus === 'offline' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/30"
                    >
                      <div className="flex items-start gap-2">
                        <WifiOff className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs text-yellow-400 font-semibold">
                            Backend Offline
                          </p>
                          <p className="text-xs text-yellow-300/70">
                            APIs externas não disponíveis. Usando apenas eventos do Base44.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
}