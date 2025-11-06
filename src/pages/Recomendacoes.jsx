import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  TrendingUp, 
  MapPin, 
  Heart, 
  Zap, 
  Clock,
  Users,
  Music,
  Loader2,
  AlertCircle,
  Star,
  Target,
  Calendar,
  Award,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Função auxiliar para calcular distância
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function Recomendacoes() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ai");

  // Buscar usuário
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      if (!userData.music_preferences) userData.music_preferences = [];
      if (!userData.interests) userData.interests = [];
      if (!userData.preferred_vibes) userData.preferred_vibes = [];
      return userData;
    },
    retry: false,
    staleTime: 30 * 1000,
  });

  // Buscar eventos
  const { data: allEvents = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['allEvents'],
    queryFn: async () => {
      const events = await base44.entities.Event.list("-date", 50);
      const now = new Date();
      return (events || []).filter(e => 
        e?.id && 
        e?.title && 
        e?.location?.lat && 
        e?.location?.lng &&
        new Date(e.date) > now
      );
    },
    staleTime: 10 * 60 * 1000,
    initialData: [],
  });

  // Buscar histórico de participação
  const { data: attendedEvents = [] } = useQuery({
    queryKey: ['userAttendedEvents', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const tickets = await base44.entities.Ticket.filter({ user_id: user.id });
      const eventIds = [...new Set(tickets.map(t => t.event_id))];
      
      if (eventIds.length === 0) return [];

      const events = await Promise.all(
        eventIds.map(async id => {
          try {
            const eventList = await base44.entities.Event.filter({ id });
            return eventList[0] || null;
          } catch {
            return null;
          }
        })
      );

      return events.filter(e => e !== null);
    },
    enabled: !!user?.id,
    initialData: [],
  });

  // RECOMENDAÇÕES COM IA
  const { data: aiRecommendations = [], isLoading: loadingAI, refetch: refetchAI } = useQuery({
    queryKey: ['aiRecommendations', user?.id, allEvents.length],
    queryFn: async () => {
      if (!user || allEvents.length === 0) return [];

      console.log("🤖 Gerando recomendações com IA...");

      const attendedGenres = [...new Set(attendedEvents.map(e => e.genre))];
      const attendedTypes = [...new Set(attendedEvents.map(e => e.type))];

      const prompt = `
Você é um sistema de recomendação de eventos underground. Analise os dados do usuário e recomende os 5 melhores eventos.

**PERFIL DO USUÁRIO:**
- Gêneros favoritos: ${user.music_preferences?.join(', ') || 'Nenhum'}
- Interesses: ${user.interests?.join(', ') || 'Nenhum'}
- Vibes preferidas: ${user.preferred_vibes?.join(', ') || 'Nenhuma'}
- Cidade: ${user.location?.city || user.city || 'São Paulo'}
- Histórico: Participou de ${attendedEvents.length} eventos (${attendedGenres.join(', ')})

**EVENTOS DISPONÍVEIS:**
${allEvents.slice(0, 20).map((e, i) => `
${i + 1}. "${e.title}"
   - ID: ${e.id}
   - Gênero: ${e.genre}
   - Tipo: ${e.type}
   - Local: ${e.location?.city || 'N/A'}
   - Data: ${format(new Date(e.date), "dd/MM/yyyy")}
   - Vibes: ${e.vibe_tags?.join(', ') || 'N/A'}
`).join('\n')}

**INSTRUÇÕES:**
1. Analise a compatibilidade entre perfil do usuário e cada evento
2. Considere: gêneros musicais, vibes, localização, histórico
3. Priorize eventos na mesma cidade
4. Retorne os 5 eventos com MAIOR score de compatibilidade

**IMPORTANTE:** Retorne APENAS os IDs dos eventos, do mais recomendado ao menos recomendado.
`;

      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              recommended_event_ids: {
                type: "array",
                items: { type: "string" },
                description: "IDs dos 5 eventos mais recomendados, ordenados"
              },
              reasoning: {
                type: "string",
                description: "Breve explicação da recomendação"
              }
            }
          }
        });

        console.log("✅ IA respondeu:", response);

        const recommendedIds = response.recommended_event_ids || [];
        const recommended = recommendedIds
          .map(id => allEvents.find(e => e.id === id))
          .filter(e => e !== undefined);

        console.log(`✅ ${recommended.length} eventos recomendados pela IA`);
        return recommended;
      } catch (error) {
        console.error("❌ Erro na IA:", error);
        return allEvents.slice(0, 5);
      }
    },
    enabled: !!user && allEvents.length > 0,
    staleTime: 15 * 60 * 1000,
    initialData: [],
  });

  // TRENDING - Eventos populares na cidade do usuário
  const trendingEvents = useMemo(() => {
    if (!user || allEvents.length === 0) return [];

    const userCity = user.location?.city || user.city || 'São Paulo';
    
    return allEvents
      .filter(e => e.location?.city === userCity)
      .sort((a, b) => (b.current_attendees || 0) - (a.current_attendees || 0))
      .slice(0, 5);
  }, [allEvents, user]);

  // NEARBY - Eventos próximos
  const nearbyEvents = useMemo(() => {
    if (!user?.location?.lat || allEvents.length === 0) return [];

    return allEvents
      .map(event => ({
        ...event,
        distance: getDistance(
          user.location.lat,
          user.location.lng,
          event.location.lat,
          event.location.lng
        )
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [allEvents, user]);

  // PERFECT MATCH - Eventos que combinam PERFEITAMENTE com preferências
  const perfectMatchEvents = useMemo(() => {
    if (!user || allEvents.length === 0) return [];

    return allEvents
      .map(event => {
        let score = 0;

        // Score por gênero
        if (user.music_preferences?.includes(event.genre)) score += 3;

        // Score por vibe
        const hasMatchingVibe = event.vibe_tags?.some(tag => 
          user.preferred_vibes?.includes(tag)
        );
        if (hasMatchingVibe) score += 2;

        // Score por histórico (se já foi em eventos similares)
        const attendedSimilar = attendedEvents.some(e => 
          e.genre === event.genre || e.type === event.type
        );
        if (attendedSimilar) score += 1;

        // Score por cidade
        const userCity = user.location?.city || user.city;
        if (event.location?.city === userCity) score += 2;

        return { ...event, matchScore: score };
      })
      .filter(e => e.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
  }, [allEvents, user, attendedEvents]);

  const isLoading = loadingUser || loadingEvents;

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
          <p className="text-gray-400">Gerando recomendações personalizadas...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="bg-gray-900/50 border-red-500/50">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Login Necessário</h3>
            <p className="text-gray-400 mb-4">
              Faça login para receber recomendações personalizadas baseadas em IA.
            </p>
            <Button onClick={() => navigate(createPageUrl("BemVindo"))}>
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 text-white">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            Recomendações
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetchAI()}
            disabled={loadingAI}
            className="hover:bg-cyan-500/20"
          >
            <RefreshCw className={`w-5 h-5 text-cyan-400 ${loadingAI ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-gray-400 text-sm">
          Eventos selecionados especialmente para você com IA
        </p>
      </div>

      {/* User Preferences Card */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30 mb-6">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Seu Perfil de Preferências
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-2">Gêneros Favoritos</p>
              <div className="flex flex-wrap gap-1">
                {user.music_preferences && user.music_preferences.length > 0 ? (
                  user.music_preferences.slice(0, 3).map(genre => (
                    <Badge key={genre} className="bg-purple-600/20 border-purple-500/30 text-purple-300 text-xs">
                      {genre}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-500 text-xs">Nenhum selecionado</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Vibes Preferidas</p>
              <div className="flex flex-wrap gap-1">
                {user.preferred_vibes && user.preferred_vibes.length > 0 ? (
                  user.preferred_vibes.slice(0, 3).map(vibe => (
                    <Badge key={vibe} className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300 text-xs">
                      {vibe}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-500 text-xs">Nenhuma selecionada</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Histórico</p>
              <p className="text-white font-semibold">{attendedEvents.length} eventos participados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 mb-6">
          <TabsTrigger value="ai" className="text-xs sm:text-sm">
            <Sparkles className="w-4 h-4 mr-1" />
            IA
          </TabsTrigger>
          <TabsTrigger value="trending" className="text-xs sm:text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            Trend
          </TabsTrigger>
          <TabsTrigger value="nearby" className="text-xs sm:text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            Perto
          </TabsTrigger>
          <TabsTrigger value="perfect" className="text-xs sm:text-sm">
            <Star className="w-4 h-4 mr-1" />
            Match
          </TabsTrigger>
        </TabsList>

        {/* AI Recommendations */}
        <TabsContent value="ai">
          <div className="mb-4 p-4 bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border border-cyan-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white mb-1">Seleção Inteligente com IA</h3>
                <p className="text-sm text-gray-300">
                  Nossa IA analisou seu perfil, histórico e preferências para selecionar os eventos perfeitos para você.
                </p>
              </div>
            </div>
          </div>

          {loadingAI ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : aiRecommendations.length > 0 ? (
            <div className="grid gap-4">
              {aiRecommendations.map((event, index) => (
                <EventRecommendationCard 
                  key={event.id} 
                  event={event} 
                  rank={index + 1}
                  badge="IA"
                  badgeColor="from-cyan-600 to-purple-600"
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={Sparkles}
              title="Nenhuma recomendação ainda"
              description="Complete seu perfil com gêneros e vibes favoritas para receber recomendações personalizadas."
            />
          )}
        </TabsContent>

        {/* Trending */}
        <TabsContent value="trending">
          <div className="mb-4 p-4 bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white mb-1">Eventos em Alta</h3>
                <p className="text-sm text-gray-300">
                  Os eventos mais populares na sua cidade com maior número de participantes.
                </p>
              </div>
            </div>
          </div>

          {trendingEvents.length > 0 ? (
            <div className="grid gap-4">
              {trendingEvents.map((event, index) => (
                <EventRecommendationCard 
                  key={event.id} 
                  event={event} 
                  rank={index + 1}
                  badge="Trending"
                  badgeColor="from-orange-600 to-red-600"
                  showAttendees
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={TrendingUp}
              title="Nenhum evento em alta"
              description="Ainda não há eventos populares na sua cidade."
            />
          )}
        </TabsContent>

        {/* Nearby */}
        <TabsContent value="nearby">
          <div className="mb-4 p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <MapPin className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white mb-1">Perto de Você</h3>
                <p className="text-sm text-gray-300">
                  Eventos mais próximos da sua localização atual.
                </p>
              </div>
            </div>
          </div>

          {nearbyEvents.length > 0 ? (
            <div className="grid gap-4">
              {nearbyEvents.map((event, index) => (
                <EventRecommendationCard 
                  key={event.id} 
                  event={event} 
                  rank={index + 1}
                  badge={`${event.distance.toFixed(1)} km`}
                  badgeColor="from-green-600 to-emerald-600"
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={MapPin}
              title="Nenhum evento próximo"
              description="Não encontramos eventos próximos à sua localização. Atualize sua localização no perfil."
            />
          )}
        </TabsContent>

        {/* Perfect Match */}
        <TabsContent value="perfect">
          <div className="mb-4 p-4 bg-gradient-to-r from-pink-900/20 to-purple-900/20 border border-pink-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Star className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white mb-1">Match Perfeito</h3>
                <p className="text-sm text-gray-300">
                  Eventos que combinam perfeitamente com suas preferências de gênero, vibe e histórico.
                </p>
              </div>
            </div>
          </div>

          {perfectMatchEvents.length > 0 ? (
            <div className="grid gap-4">
              {perfectMatchEvents.map((event, index) => (
                <EventRecommendationCard 
                  key={event.id} 
                  event={event} 
                  rank={index + 1}
                  badge={`${event.matchScore}/8`}
                  badgeColor="from-pink-600 to-purple-600"
                  showMatchScore
                  matchScore={event.matchScore}
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={Star}
              title="Nenhum match perfeito"
              description="Complete suas preferências para encontrar eventos que combinam perfeitamente com você."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente de Card de Evento
function EventRecommendationCard({ event, rank, badge, badgeColor, showAttendees, showMatchScore, matchScore }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
    >
      <Card 
        className="bg-gray-900/80 border-gray-700 hover:border-cyan-500/50 transition-all cursor-pointer overflow-hidden group"
        onClick={() => navigate(createPageUrl("Feed"))}
      >
        <div className="flex">
          {/* Rank Badge */}
          <div className="w-16 flex-shrink-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border-r border-gray-700">
            <div className="text-center">
              <Award className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
              <span className="text-2xl font-bold text-white">#{rank}</span>
            </div>
          </div>

          {/* Image */}
          <div className="w-32 h-32 flex-shrink-0 relative overflow-hidden">
            <img
              src={event.image_url || `https://picsum.photos/200/200?random=${event.id}`}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${badgeColor} shadow-lg`}>
              {badge}
            </div>
          </div>

          {/* Content */}
          <CardContent className="flex-1 p-4">
            <h3 className="font-bold text-white text-base mb-2 line-clamp-1 group-hover:text-cyan-400 transition-colors">
              {event.title}
            </h3>

            <div className="space-y-1.5 text-sm text-gray-400 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>{format(new Date(event.date), "PPP", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span className="truncate">{event.location?.venue_name || event.location?.city}</span>
              </div>
              {showAttendees && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-400" />
                  <span>{event.current_attendees || 0} participantes</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300 text-xs">
                {event.genre}
              </Badge>
              <Badge className="bg-purple-600/20 border-purple-500/30 text-purple-300 text-xs">
                {event.type}
              </Badge>
              {showMatchScore && (
                <Badge className="bg-pink-600/20 border-pink-500/30 text-pink-300 text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Score: {matchScore}/8
                </Badge>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}

// Componente de Estado Vazio
function EmptyState({ icon: Icon, title, description }) {
  const navigate = useNavigate();

  return (
    <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-700">
      <Icon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-400 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      <Button 
        onClick={() => navigate(createPageUrl("Perfil"))}
        className="bg-gradient-to-r from-cyan-600 to-purple-600"
      >
        Editar Preferências
      </Button>
    </div>
  );
}