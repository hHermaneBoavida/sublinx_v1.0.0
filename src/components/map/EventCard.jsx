import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, Clock, Users, Heart, Share2, Play, Pause, Crown, X, Zap, Check, Loader2, Ticket
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EventCard({ event, onClose, user, isGuest, onRequirePlan }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [eventRequest, setEventRequest] = useState(null);
  const [hasTicket, setHasTicket] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      if (isGuest || !user || !event?.id || !user?.id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const tickets = await base44.entities.Ticket.filter({ user_id: user.id, event_id: event.id });
        if (tickets.length > 0) {
          setHasTicket(true);
        } else {
          const requests = await base44.entities.EventRequest.filter({ user_id: user.id, event_id: event.id });
          if (requests.length > 0) {
            setEventRequest(requests[0]);
          } else {
            setEventRequest(null);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar status:", error);
        setEventRequest(null);
      }
      setIsLoading(false);
    };
    checkStatus();
  }, [user, event, isGuest]);


  const getGenreColor = (genre) => {
    const colors = {
      techno: 'from-cyan-500 to-blue-500', house: 'from-green-500 to-lime-500',
      trance: 'from-purple-500 to-indigo-500', drum_bass: 'from-orange-500 to-red-500',
      dubstep: 'from-yellow-500 to-orange-500', experimental: 'from-pink-500 to-purple-500'
    };
    return colors[genre] || 'from-gray-500 to-gray-600';
  };

  const togglePlayback = () => setIsPlaying(!isPlaying);
  const toggleLike = () => setIsLiked(!isLiked);

  const handleRequestTicket = async () => {
    if (isGuest) {
      navigate(createPageUrl("BemVindo"));
      return;
    }
    if (event.minimum_level && event.minimum_level > (user.underground_level || 1)) {
        alert(`Você precisa ser nível ${event.minimum_level} para solicitar. Seu nível é ${user.underground_level || 1}.`);
        return;
    }
    if (event.is_secret && !user.is_pro_member) {
        if (onRequirePlan) onRequirePlan();
        else alert("Para eventos secretos, é necessário um plano Pro.");
        return;
    }
    
    setIsLoading(true);
    try {
      const newRequest = await base44.entities.EventRequest.create({
        user_id: user.id, event_id: event.id, organizer_id: event.organizer_id,
        status: "pending", underground_level_required: event.minimum_level || 1
      });
      setEventRequest(newRequest);
      alert("Solicitação enviada com sucesso!");
    } catch (error) {
      console.error("Erro ao criar solicitação:", error);
      alert("Falha ao enviar solicitação. Tente novamente.");
    }
    setIsLoading(false);
  };
  
  const renderConfirmButton = () => {
    if (isGuest) return <Button onClick={handleRequestTicket} className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white"><Zap className="w-4 h-4 mr-2" />Fazer Login para Solicitar</Button>;
    if (isLoading) return <Button disabled className="w-full bg-gray-600"><Loader2 className="w-4 h-4 mr-2 animate-spin" />Carregando...</Button>;
    if (hasTicket) return <Button onClick={() => navigate(createPageUrl("Perfil"))} className="w-full bg-green-600 hover:bg-green-700"><Ticket className="w-4 h-4 mr-2" />Ver Meu Ingresso</Button>;
    
    if (eventRequest) {
      switch (eventRequest.status) {
        case 'pending': return <Button disabled className="w-full bg-yellow-600"><Clock className="w-4 h-4 mr-2" />Solicitação Pendente</Button>;
        case 'approved': return <Button onClick={() => navigate(createPageUrl(`ComprarIngresso?eventId=${event.id}&requestId=${eventRequest.id}`))} className="w-full bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600"><Ticket className="w-4 h-4 mr-2" />Comprar Ingresso</Button>;
        case 'denied': return <Button disabled className="w-full bg-red-600"><X className="w-4 h-4 mr-2" />Solicitação Negada</Button>;
      }
    }

    return <Button onClick={handleRequestTicket} className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white"><Zap className="w-4 h-4 mr-2" />Solicitar Ingresso</Button>;
  };

  return (
    <Card className="bg-black/90 backdrop-blur-lg border border-gray-700 text-white overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {event.is_secret && <Badge className="bg-purple-600 border-purple-400 text-white"><Crown className="w-3 h-3 mr-1" />Secreto</Badge>}
              <Badge variant="outline" className={`bg-gradient-to-r ${getGenreColor(event.genre)} text-white border-transparent`}>{event.genre}</Badge>
              <Badge variant="outline" className="border-gray-600 text-gray-300">{event.type}</Badge>
            </div>
            <h3 className="text-xl font-bold text-transparent bg-gradient-to-r from-white to-gray-300 bg-clip-text">{event.title}</h3>
            {event.organizer && <p className="text-sm text-gray-400 mt-1">por {event.organizer}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-300"><Clock className="w-4 h-4" /><span>{format(new Date(event.date), "dd/MM 'às' HH:mm", { locale: ptBR })}</span></div>
          <div className="flex items-center space-x-2 text-sm text-gray-300"><Users className="w-4 h-4" /><span>{event.current_attendees || 0}/{event.max_capacity || '∞'}</span></div>
        </div>

        <div className="flex items-start space-x-2 text-sm">
          <MapPin className="w-4 h-4 mt-0.5 text-cyan-400" />
          <div>
            {event.location?.is_secret ? <div><p className="text-gray-300">Localização será revelada</p><p className="text-xs text-gray-400">24h antes do evento</p></div> : <div><p className="text-gray-300">{event.location?.venue_name}</p><p className="text-xs text-gray-400">{event.location?.address}</p></div>}
          </div>
        </div>

        {event.audio_preview_url && (
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="icon" onClick={togglePlayback} className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">{isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</Button>
                <div><p className="text-sm font-medium">Preview do Som</p><p className="text-xs text-gray-400">30 segundos</p></div>
              </div>
              <div className="flex items-center space-x-1">{Array.from({ length: 5 }).map((_, i) => <div key={i} className={`w-1 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full ${isPlaying ? 'animate-pulse' : ''}`} style={{ height: `${Math.random() * 20 + 10}px` }} />)}</div>
            </div>
          </div>
        )}

        {event.description && <div className="text-sm text-gray-300"><p>{event.description}</p></div>}
        {event.vibe_tags && event.vibe_tags.length > 0 && <div className="flex flex-wrap gap-2">{event.vibe_tags.map((tag, index) => <span key={index} className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded-full border border-gray-600">#{tag}</span>)}</div>}
        {event.price && <div className="text-center py-2"><span className="text-2xl font-bold text-transparent bg-gradient-to-r from-lime-400 to-green-400 bg-clip-text">R$ {event.price.toFixed(2)}</span></div>}
        
        <div className="flex flex-col space-y-3 pt-4">
          <div className="flex space-x-3">
            <Button variant="outline" onClick={toggleLike} className={`flex-1 border-gray-600 ${isLiked ? 'bg-pink-600 border-pink-500 text-white' : 'text-gray-300 hover:bg-gray-800'}`}><Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />Curtir</Button>
            <Button variant="outline" className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"><Share2 className="w-4 h-4 mr-2" />Compartilhar</Button>
          </div>
          {renderConfirmButton()}
        </div>
      </CardContent>
    </Card>
  );
}