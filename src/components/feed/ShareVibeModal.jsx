import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Heart, Loader2, CheckCircle2, Zap, Coffee, Wind, Moon, MapPin, Calendar, Flame, Star, TrendingUp, Users, Gift, Sparkles, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import confetti from 'canvas-confetti';

const vibes = [
  { 
    id: 'dançar', 
    label: 'Dançar', 
    icon: Zap, 
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-400',
    emoji: '💃',
    description: 'Energia total',
    recommendations: ['techno', 'house', 'funk']
  },
  { 
    id: 'relaxar', 
    label: 'Relaxar', 
    icon: Wind, 
    color: 'from-cyan-400 to-blue-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    textColor: 'text-cyan-400',
    emoji: '🌊',
    description: 'Vibe tranquila',
    recommendations: ['ambient', 'lounge', 'jazz']
  },
  { 
    id: 'socializar', 
    label: 'Socializar', 
    icon: Coffee, 
    color: 'from-pink-400 to-purple-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    textColor: 'text-pink-400',
    emoji: '🎉',
    description: 'Fazer amigos',
    recommendations: ['diversos', 'rooftop', 'bar']
  },
  { 
    id: 'adrenalina', 
    label: 'Adrenalina', 
    icon: Moon, 
    color: 'from-red-400 to-pink-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    emoji: '⚡',
    description: 'Máxima intensidade',
    recommendations: ['rave', 'hardcore', 'drum_bass']
  },
];

export default function ShareVibeModal({ onClose, user }) {
  const [selectedVibe, setSelectedVibe] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [message, setMessage] = useState('');
  const [sharing, setSharing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [vibeStreak, setVibeStreak] = useState(0);
  const [totalVibesShared, setTotalVibesShared] = useState(0);
  const [matchingUsers, setMatchingUsers] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      setVibeStreak(user.vibe_streak || 0);
      setTotalVibesShared(user.total_vibes_shared || 0);
    }
  }, [user]);

  const { data: similarVibeUsers } = useQuery({
    queryKey: ['similarVibeUsers', selectedVibe],
    queryFn: async () => {
      if (!selectedVibe) return 0;
      const users = await base44.entities.User.filter({ current_vibe: selectedVibe });
      return users.length;
    },
    enabled: !!selectedVibe,
    initialData: 0,
  });

  useEffect(() => {
    setMatchingUsers(similarVibeUsers);
  }, [similarVibeUsers]);

  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ['availableEventsForVibe', selectedVibe],
    queryFn: async () => {
      try {
        const data = await base44.entities.Event.list("-date", 100);
        if (!data || data.length === 0) return [];
        
        const now = new Date();
        let futureEvents = data.filter(e => new Date(e.date) > now);
        
        if (selectedVibe) {
          const vibeData = vibes.find(v => v.id === selectedVibe);
          if (vibeData && vibeData.recommendations) {
            futureEvents = futureEvents.filter(e => 
              vibeData.recommendations.some(rec => 
                e.genre?.toLowerCase().includes(rec) || 
                e.type?.toLowerCase().includes(rec)
              )
            );
          }
        }
        return futureEvents;
      } catch (error) {
        return [];
      }
    },
    retry: 2,
    staleTime: 2 * 60 * 1000,
    initialData: [],
    enabled: !!selectedVibe,
  });

  const handleVibeSelect = (vibeId) => {
    setSelectedVibe(vibeId);
  };

  const handleShare = async () => {
    if (!selectedVibe) {
      alert("❌ Selecione uma vibe para compartilhar!");
      return;
    }

    setSharing(true);
    try {
      const vibeData = vibes.find(v => v.id === selectedVibe);
      const newStreak = vibeStreak + 1;
      const newTotal = totalVibesShared + 1;

      const updateData = {
        current_vibe: selectedVibe,
        vibe_message: message || `${vibeData.emoji} Estou com vibe de ${vibeData.label.toLowerCase()}!`,
        vibe_streak: newStreak,
        total_vibes_shared: newTotal,
        last_vibe_shared: new Date().toISOString()
      };

      if (selectedEventId && selectedEventId !== "none" && selectedEventId !== "") {
        updateData.vibe_event_id = selectedEventId;
      }

      await base44.auth.updateMe(updateData);

      setSuccess(true);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#8b5cf6', '#ec4899']
      });

      if (newTotal === 10 || newTotal === 50 || newTotal === 100) {
        setTimeout(() => {
          alert(`🎉 PARABÉNS! Você compartilhou ${newTotal} vibes! Badge especial desbloqueado!`);
        }, 1000);
      }

      if (newStreak === 7) {
        setTimeout(() => {
          alert(`🔥 STREAK DE 7 DIAS! Você está on fire!`);
        }, 1500);
      }

      setTimeout(() => {
        onClose();
        queryClient.invalidateQueries(['currentUser']);
      }, 2500);
    } catch (error) {
      console.error("Erro ao compartilhar vibe:", error);
      alert("❌ Erro ao compartilhar vibe. Tente novamente.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-gradient-to-b from-gray-900 via-gray-900 to-black border border-purple-500/30 rounded-2xl w-full max-w-sm relative shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Compacto */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Compartilhe sua Vibe</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-3" />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">Vibe Compartilhada! 🎉</h3>
            <p className="text-sm text-gray-400 mb-4">A comunidade sabe sua energia agora</p>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2">
                <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{vibeStreak + 1}</div>
                <div className="text-[10px] text-gray-400">Streak</div>
              </div>
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-2">
                <Star className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{totalVibesShared + 1}</div>
                <div className="text-[10px] text-gray-400">Total</div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2">
                <Users className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{matchingUsers}</div>
                <div className="text-[10px] text-gray-400">Match</div>
              </div>
            </div>

            {matchingUsers > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 bg-purple-500/10 border border-purple-500/30 rounded-lg p-2"
              >
                <p className="text-xs text-purple-300">
                  🔥 <strong>{matchingUsers}</strong> {matchingUsers === 1 ? 'pessoa tem' : 'pessoas têm'} a mesma vibe!
                </p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Streak Badge */}
            {vibeStreak > 0 && (
              <div className="flex items-center justify-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-semibold text-orange-300">
                  {vibeStreak} {vibeStreak === 1 ? 'dia' : 'dias'} de streak! 🔥
                </span>
              </div>
            )}

            {/* Grid de Vibes - COMPACTO */}
            <div className="grid grid-cols-2 gap-2">
              {vibes.map((vibe) => {
                const Icon = vibe.icon;
                const isSelected = selectedVibe === vibe.id;
                
                return (
                  <motion.button
                    key={vibe.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleVibeSelect(vibe.id)}
                    className={`relative p-3 rounded-xl border transition-all ${
                      isSelected
                        ? `${vibe.bgColor} ${vibe.borderColor} border-2`
                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                    
                    <div className="flex flex-col items-center gap-1.5">
                      <Icon className={`w-6 h-6 ${isSelected ? vibe.textColor : 'text-gray-400'}`} />
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                            {vibe.label}
                          </span>
                          <span className="text-sm">{vibe.emoji}</span>
                        </div>
                        {isSelected && (
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[10px] text-gray-400 mt-0.5"
                          >
                            {vibe.description}
                          </motion.p>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Recomendações Inteligentes */}
            <AnimatePresence>
              {selectedVibe && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-semibold text-white">Recomendações</span>
                    </div>
                    
                    {loadingEvents ? (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Buscando eventos...</span>
                      </div>
                    ) : events && events.length > 0 ? (
                      <div className="space-y-1">
                        <p className="text-xs text-cyan-300">
                          🎯 <strong>{events.length} evento(s)</strong> combinam com sua vibe
                        </p>
                        {matchingUsers > 0 && (
                          <p className="text-xs text-purple-300">
                            👥 <strong>{matchingUsers}</strong> {matchingUsers === 1 ? 'pessoa tem' : 'pessoas têm'} a mesma energia
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">Nenhum evento encontrado</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Seletor de Evento - COMPACTO */}
            {selectedVibe && events && events.length > 0 && (
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Marcar evento (opcional)
                </label>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white h-9 text-sm">
                    <SelectValue placeholder="Selecione um evento" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white max-h-[200px]">
                    <SelectItem value="none" className="text-gray-400 text-sm">Nenhum evento</SelectItem>
                    {events.slice(0, 10).map(event => (
                      <SelectItem key={event.id} value={event.id} className="text-white text-sm py-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium truncate">{event.title}</span>
                          <span className="text-xs text-gray-400 truncate">
                            {format(new Date(event.date), "dd/MM HH:mm", { locale: ptBR })} • {event.location?.venue_name}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Mensagem */}
            <div>
              <Textarea
                placeholder="Adicione uma mensagem... 💬"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 text-sm h-20 resize-none"
                maxLength={200}
              />
              <div className="flex justify-between items-center mt-1 text-xs">
                <span className="text-gray-500">{message.length}/200</span>
                {message.length > 100 && (
                  <span className="text-green-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Ótima mensagem!
                  </span>
                )}
              </div>
            </div>

            {/* Dica do Dia - COMPACTA */}
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-2.5">
              <div className="flex items-start gap-2">
                <Gift className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold text-yellow-300">💡 Dica do Dia</p>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    Compartilhe diariamente para manter seu streak e ganhar recompensas!
                  </p>
                </div>
              </div>
            </div>

            {/* Botão Compartilhar - COMPACTO */}
            <Button
              onClick={handleShare}
              disabled={sharing || !selectedVibe}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 disabled:opacity-50 h-11 font-semibold text-sm shadow-lg"
            >
              {sharing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Compartilhando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Compartilhar Vibe {selectedVibe && vibes.find(v => v.id === selectedVibe)?.emoji}
                </>
              )}
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}