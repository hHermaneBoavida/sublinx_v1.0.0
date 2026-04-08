import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, UploadCloud, Loader2, PartyPopper, CheckCircle2, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculateDistance, filterFutureEvents, CACHE_CONFIG } from '../shared/helpers';

export default function UploadReelModal({ onClose, onUploadComplete, events, userLocation }) {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const { data: user } = useQuery({ 
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    ...CACHE_CONFIG.STATIC
  });

  const { data: availableEvents, isLoading: loadingEvents } = useQuery({
    queryKey: ['uploadReelEvents'],
    queryFn: async () => {
      const data = await base44.entities.Event.list("-date", 100);
      return filterFutureEvents(data);
    },
    enabled: !events || events.length === 0,
    initialData: [],
    ...CACHE_CONFIG.MEDIUM,
  });

  const eventsList = events && events.length > 0 ? events : availableEvents;

  const sortedEvents = React.useMemo(() => {
    if (!eventsList || eventsList.length === 0) return [];
    
    return [...eventsList]
      .filter(e => e?.location?.lat && e?.location?.lng)
      .sort((a, b) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.location.lat, a.location.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.location.lat, b.location.lng);
        return distA - distB;
      });
  }, [eventsList, userLocation]);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      if (!selectedFile.type.startsWith('video/')) {
        alert("❌ Por favor, selecione um arquivo de vídeo.");
        return;
      }
      
      if (selectedFile.size > 100 * 1024 * 1024) {
        alert("❌ O vídeo é muito grande. Tamanho máximo: 100MB");
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedEventId || !user) {
      alert("❌ Preencha todos os campos.");
      return;
    }

    // Verificar limite de 10 reels ativos
    try {
      const now = new Date().toISOString();
      const myReels = await base44.entities.Reel.filter({ user_id: user.id });
      const activeReels = myReels.filter(r => !r.expires_at || r.expires_at > now);
      if (activeReels.length >= 10) {
        alert("❌ Você atingiu o limite de 10 Reels ativos. Aguarde a expiração de algum para publicar novo.");
        return;
      }
    } catch (e) {
      console.error("Erro ao verificar limite de reels:", e);
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await base44.entities.Reel.create({
        event_id: selectedEventId,
        user_id: user.id,
        video_url: file_url,
        description: description || "",
        thumbnail_url: file_url,
        likes_count: 0,
        comments_count: 0,
        view_count: 0,
        expires_at: expiresAt
      });
      
      setUploadSuccess(true);
      setTimeout(() => {
        onUploadComplete();
      }, 2000);
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("❌ Falha no upload. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-gray-900/95 border border-cyan-500/50 rounded-2xl p-4 sm:p-6 w-full max-w-md relative overflow-y-auto max-h-[90vh]"
      >
        <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-2 right-2 text-gray-400 h-8 w-8">
          <X className="w-5 h-5" />
        </Button>
        
        {uploadSuccess ? (
          <div className="text-center py-6 sm:py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20 text-green-400 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Reel Publicado!</h2>
            <p className="text-sm sm:text-base text-gray-300 mb-6">Sua vibe foi compartilhada! 🔥</p>
            <Button onClick={onUploadComplete} className="bg-gradient-to-r from-green-500 to-emerald-500 w-full">
              Voltar
            </Button>
          </div>
        ) : (
          <>
            <h2 className="text-xl sm:text-2xl font-bold text-center text-white mb-4 sm:mb-6">Compartilhe a Vibe</h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:border-cyan-500 transition-colors" 
                   onClick={() => document.getElementById('video-upload').click()}>
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400 mx-auto mb-2 animate-spin" />
                    <p className="text-sm text-gray-400">Enviando...</p>
                  </div>
                ) : file ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-green-400 truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Clique para enviar seu vídeo</p>
                    <p className="text-xs text-gray-500 mt-1">MP4, MOV (máx. 100MB)</p>
                  </>
                )}
                <input 
                  id="video-upload" 
                  type="file" 
                  accept="video/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </div>
              
              <Textarea 
                placeholder="Adicione uma legenda..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white h-16 sm:h-20 text-sm"
                disabled={uploading}
              />
              
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Selecione o Evento *</label>
                {loadingEvents ? (
                  <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Carregando eventos...</p>
                  </div>
                ) : sortedEvents.length > 0 ? (
                  <>
                    <Select 
                      value={selectedEventId} 
                      onValueChange={setSelectedEventId}
                      disabled={uploading}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white text-sm">
                        <SelectValue placeholder="Escolha um evento" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600 text-white max-h-[300px]">
                        {sortedEvents.map(event => {
                          const distance = calculateDistance(
                            userLocation.lat, 
                            userLocation.lng, 
                            event.location.lat, 
                            event.location.lng
                          );
                          
                          return (
                            <SelectItem 
                              key={event.id} 
                              value={event.id} 
                              className="text-sm py-3 hover:bg-gray-700 cursor-pointer"
                            >
                              <div className="flex flex-col gap-1 w-full">
                                <span className="font-semibold text-white">{event.title}</span>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <MapPin className="w-3 h-3" />
                                  <span>{distance.toFixed(1)}km</span>
                                  <span>•</span>
                                  <span className="truncate">{event.location.venue_name || event.location.city}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  <span>{format(new Date(event.date), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {sortedEvents.length} evento(s) disponível(is)
                    </p>
                  </>
                ) : (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-400">😔 Nenhum evento disponível</p>
                    <p className="text-xs text-gray-500 mt-1">Aguarde novos eventos!</p>
                  </div>
                )}
              </div>
              
              <Button 
                onClick={handleUpload} 
                disabled={uploading || !file || !selectedEventId} 
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:opacity-50 text-sm sm:text-base h-10 sm:h-11"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <PartyPopper className="w-4 h-4 mr-2" />
                    Publicar Reel
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}