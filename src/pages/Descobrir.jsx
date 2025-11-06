import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Heart,
  Star,
  Sparkles,
  Filter,
  X,
  Clock,
  Accessibility,
  Music,
  Users,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, isAfter, isBefore, startOfDay, endOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export default function Descobrir() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all', // all, today, week, month, custom
    customStartDate: '',
    customEndDate: '',
    priceRange: 'all', // all, free, cheap, moderate, premium
    minPrice: 0,
    maxPrice: 1000,
    distance: 50, // km
    genres: [],
    types: [],
    accessibility: {
      wheelchair: false,
      parking: false,
      publicTransport: false,
      signLanguage: false
    },
    minCapacity: 0,
    onlyApprovalRequired: false
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['discoverEvents'],
    queryFn: async () => {
      const data = await base44.entities.Event.list('-date', 100);
      return (data || []).filter(e => e?.id && e?.location?.lat && e?.location?.lng);
    },
    staleTime: 5 * 60 * 1000,
    initialData: [],
  });

  const { data: userInteractions = { likes: [], comments: [], attended: [] } } = useQuery({
    queryKey: ['userInteractions', user?.id],
    queryFn: async () => {
      if (!user) return { likes: [], comments: [], attended: [] };
      
      try {
        const [likes, comments, tickets] = await Promise.all([
          base44.entities.Like.filter({ user_id: user.id }),
          base44.entities.Comment.filter({ user_id: user.id }),
          base44.entities.Ticket.filter({ user_id: user.id, status: 'valid' })
        ]);

        return {
          likes: likes || [],
          comments: comments || [],
          attended: tickets || []
        };
      } catch {
        return { likes: [], comments: [], attended: [] };
      }
    },
    enabled: !!user,
    initialData: { likes: [], comments: [], attended: [] },
  });

  // Algoritmo de recomendação personalizada
  const getRecommendationScore = (event) => {
    let score = 0;

    if (!user) return score;

    // 1. Preferências musicais (peso 3)
    if (user.music_preferences?.includes(event.genre)) {
      score += 30;
    }

    // 2. Eventos similares curtidos (peso 2)
    const likedGenres = userInteractions.likes
      .map(like => events.find(e => e.id === like.event_id)?.genre)
      .filter(Boolean);
    
    if (likedGenres.includes(event.genre)) {
      score += 20;
    }

    // 3. Mesma cidade (peso 2)
    if (user.location?.city && event.location?.city === user.location.city) {
      score += 20;
    }

    // 4. Distância próxima (peso 1)
    if (user.location?.lat && event.location?.lat) {
      const distance = getDistance(
        user.location.lat,
        user.location.lng,
        event.location.lat,
        event.location.lng
      );
      if (distance < 10) score += 15;
      else if (distance < 25) score += 10;
      else if (distance < 50) score += 5;
    }

    // 5. Nível apropriado (peso 1)
    if (user.underground_level >= event.minimum_level) {
      score += 10;
    }

    // 6. Vibe atual do usuário (peso 2)
    if (user.current_vibe && event.vibe_tags?.includes(user.current_vibe)) {
      score += 20;
    }

    // 7. Histórico de participação (peso 1)
    const attendedEventTypes = userInteractions.attended
      .map(ticket => events.find(e => e.id === ticket.event_id)?.type)
      .filter(Boolean);
    
    if (attendedEventTypes.includes(event.type)) {
      score += 10;
    }

    // 8. Popularidade (peso 0.5)
    if (event.current_attendees > 50) score += 5;

    return score;
  };

  // Filtros avançados
  const filteredEvents = useMemo(() => {
    let result = events;

    // Busca por texto
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(e =>
        e.title?.toLowerCase().includes(lower) ||
        e.genre?.toLowerCase().includes(lower) ||
        e.location?.city?.toLowerCase().includes(lower) ||
        e.location?.venue_name?.toLowerCase().includes(lower)
      );
    }

    // Filtro de data
    const now = new Date();
    if (filters.dateRange !== 'all') {
      result = result.filter(e => {
        const eventDate = new Date(e.date);
        
        switch (filters.dateRange) {
          case 'today':
            return eventDate >= startOfDay(now) && eventDate <= endOfDay(now);
          case 'week':
            return eventDate >= now && eventDate <= addDays(now, 7);
          case 'month':
            return eventDate >= now && eventDate <= addDays(now, 30);
          case 'custom':
            if (filters.customStartDate && filters.customEndDate) {
              const start = new Date(filters.customStartDate);
              const end = new Date(filters.customEndDate);
              return eventDate >= start && eventDate <= end;
            }
            return true;
          default:
            return true;
        }
      });
    }

    // Filtro de preço
    if (filters.priceRange !== 'all') {
      result = result.filter(e => {
        const price = e.price || 0;
        
        switch (filters.priceRange) {
          case 'free':
            return price === 0;
          case 'cheap':
            return price > 0 && price <= 50;
          case 'moderate':
            return price > 50 && price <= 150;
          case 'premium':
            return price > 150;
          case 'custom':
            return price >= filters.minPrice && price <= filters.maxPrice;
          default:
            return true;
        }
      });
    }

    // Filtro de distância
    if (user?.location?.lat && filters.distance < 50) {
      result = result.filter(e => {
        if (!e.location?.lat) return false;
        const distance = getDistance(
          user.location.lat,
          user.location.lng,
          e.location.lat,
          e.location.lng
        );
        return distance <= filters.distance;
      });
    }

    // Filtro de gêneros
    if (filters.genres.length > 0) {
      result = result.filter(e => filters.genres.includes(e.genre));
    }

    // Filtro de tipos
    if (filters.types.length > 0) {
      result = result.filter(e => filters.types.includes(e.type));
    }

    // Filtro de acessibilidade
    if (Object.values(filters.accessibility).some(v => v)) {
      result = result.filter(e => {
        if (!e.accessibility) return false;
        
        return (
          (!filters.accessibility.wheelchair || e.accessibility.wheelchair) &&
          (!filters.accessibility.parking || e.accessibility.parking) &&
          (!filters.accessibility.publicTransport || e.accessibility.publicTransport) &&
          (!filters.accessibility.signLanguage || e.accessibility.signLanguage)
        );
      });
    }

    // Filtro de capacidade mínima
    if (filters.minCapacity > 0) {
      result = result.filter(e => (e.max_capacity || 0) >= filters.minCapacity);
    }

    // Filtro de aprovação
    if (filters.onlyApprovalRequired) {
      result = result.filter(e => e.requires_approval);
    }

    return result;
  }, [events, searchTerm, filters, user]);

  // Eventos recomendados (ordenados por score)
  const recommendedEvents = useMemo(() => {
    return filteredEvents
      .map(event => ({
        ...event,
        score: getRecommendationScore(event)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [filteredEvents, user, userInteractions]);

  // Eventos próximos
  const nearbyEvents = useMemo(() => {
    if (!user?.location?.lat) return [];
    
    return filteredEvents
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
      .slice(0, 10);
  }, [filteredEvents, user]);

  // Eventos populares
  const popularEvents = useMemo(() => {
    return filteredEvents
      .sort((a, b) => (b.current_attendees || 0) - (a.current_attendees || 0))
      .slice(0, 10);
  }, [filteredEvents]);

  // Eventos em alta (próximos + populares)
  const trendingEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents
      .filter(e => {
        const eventDate = new Date(e.date);
        const daysUntil = (eventDate - now) / (1000 * 60 * 60 * 24);
        return daysUntil >= 0 && daysUntil <= 14; // Próximos 14 dias
      })
      .sort((a, b) => (b.current_attendees || 0) - (a.current_attendees || 0))
      .slice(0, 10);
  }, [filteredEvents]);

  const handleGenreToggle = (genre) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const handleTypeToggle = (type) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateRange: 'all',
      customStartDate: '',
      customEndDate: '',
      priceRange: 'all',
      minPrice: 0,
      maxPrice: 1000,
      distance: 50,
      genres: [],
      types: [],
      accessibility: {
        wheelchair: false,
        parking: false,
        publicTransport: false,
        signLanguage: false
      },
      minCapacity: 0,
      onlyApprovalRequired: false
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange !== 'all') count++;
    if (filters.priceRange !== 'all') count++;
    if (filters.distance < 50) count++;
    if (filters.genres.length > 0) count += filters.genres.length;
    if (filters.types.length > 0) count += filters.types.length;
    if (Object.values(filters.accessibility).some(v => v)) count++;
    if (filters.minCapacity > 0) count++;
    if (filters.onlyApprovalRequired) count++;
    return count;
  }, [filters]);

  const allGenres = ['techno', 'house', 'trance', 'drum_bass', 'dubstep', 'ambient', 'experimental', 'funk', 'trap'];
  const allTypes = ['rave', 'warehouse', 'rooftop', 'underground', 'club', 'secret'];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text mb-2">
          Descobrir Eventos
        </h1>
        <p className="text-gray-400">
          {user ? 'Eventos personalizados para você' : 'Encontre os melhores eventos underground'}
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar por evento, gênero, local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-900/80 border-gray-700 pl-10 text-white"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`border-gray-700 ${activeFiltersCount > 0 ? 'border-cyan-500 text-cyan-400' : 'text-gray-400'}`}
        >
          <SlidersHorizontal className="w-5 h-5 mr-2" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 bg-cyan-600">{activeFiltersCount}</Badge>
          )}
        </Button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="bg-gray-900/50 border-gray-700 mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros Avançados
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Range */}
            <div>
              <label className="text-sm font-semibold text-gray-300 mb-2 block flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data do Evento
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                {[
                  { value: 'all', label: 'Todas' },
                  { value: 'today', label: 'Hoje' },
                  { value: 'week', label: 'Esta Semana' },
                  { value: 'month', label: 'Este Mês' }
                ].map(option => (
                  <Button
                    key={option.value}
                    variant={filters.dateRange === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, dateRange: option.value }))}
                    className={filters.dateRange === option.value ? 'bg-cyan-600' : 'border-gray-700'}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              {filters.dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="date"
                    value={filters.customStartDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, customStartDate: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <Input
                    type="date"
                    value={filters.customEndDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, customEndDate: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              )}
            </div>

            {/* Price Range */}
            <div>
              <label className="text-sm font-semibold text-gray-300 mb-2 block flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Faixa de Preço
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'free', label: 'Grátis' },
                  { value: 'cheap', label: 'Até R$50' },
                  { value: 'moderate', label: 'R$50-150' },
                  { value: 'premium', label: 'R$150+' }
                ].map(option => (
                  <Button
                    key={option.value}
                    variant={filters.priceRange === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, priceRange: option.value }))}
                    className={filters.priceRange === option.value ? 'bg-purple-600' : 'border-gray-700'}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Distance */}
            {user?.location?.lat && (
              <div>
                <label className="text-sm font-semibold text-gray-300 mb-2 block flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Distância Máxima: {filters.distance}km
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={filters.distance}
                  onChange={(e) => setFilters(prev => ({ ...prev, distance: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}

            {/* Genres */}
            <div>
              <label className="text-sm font-semibold text-gray-300 mb-2 block flex items-center gap-2">
                <Music className="w-4 h-4" />
                Gêneros Musicais
              </label>
              <div className="flex flex-wrap gap-2">
                {allGenres.map(genre => (
                  <Badge
                    key={genre}
                    onClick={() => handleGenreToggle(genre)}
                    className={`cursor-pointer transition-all ${
                      filters.genres.includes(genre)
                        ? 'bg-cyan-600 hover:bg-cyan-700'
                        : 'bg-gray-800 hover:bg-gray-700 border-gray-600'
                    }`}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Types */}
            <div>
              <label className="text-sm font-semibold text-gray-300 mb-2 block flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Tipos de Evento
              </label>
              <div className="flex flex-wrap gap-2">
                {allTypes.map(type => (
                  <Badge
                    key={type}
                    onClick={() => handleTypeToggle(type)}
                    className={`cursor-pointer transition-all ${
                      filters.types.includes(type)
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-gray-800 hover:bg-gray-700 border-gray-600'
                    }`}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Accessibility */}
            <div>
              <label className="text-sm font-semibold text-gray-300 mb-2 block flex items-center gap-2">
                <Accessibility className="w-4 h-4" />
                Recursos de Acessibilidade
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'wheelchair', label: '♿ Cadeira de Rodas' },
                  { key: 'parking', label: '🅿️ Estacionamento' },
                  { key: 'publicTransport', label: '🚇 Transporte Público' },
                  { key: 'signLanguage', label: '🤟 Libras' }
                ].map(option => (
                  <Button
                    key={option.key}
                    variant={filters.accessibility[option.key] ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      accessibility: {
                        ...prev.accessibility,
                        [option.key]: !prev.accessibility[option.key]
                      }
                    }))}
                    className={filters.accessibility[option.key] ? 'bg-green-600' : 'border-gray-700 text-sm'}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue={user ? "recommended" : "trending"} className="w-full">
        <TabsList className="bg-gray-900/50 border-gray-700 grid grid-cols-2 sm:grid-cols-4">
          {user && (
            <TabsTrigger value="recommended" className="data-[state=active]:bg-cyan-600">
              <Sparkles className="w-4 h-4 mr-2" />
              Para Você
            </TabsTrigger>
          )}
          <TabsTrigger value="trending" className="data-[state=active]:bg-purple-600">
            <TrendingUp className="w-4 h-4 mr-2" />
            Em Alta
          </TabsTrigger>
          {user?.location?.lat && (
            <TabsTrigger value="nearby" className="data-[state=active]:bg-pink-600">
              <MapPin className="w-4 h-4 mr-2" />
              Perto de Você
            </TabsTrigger>
          )}
          <TabsTrigger value="popular" className="data-[state=active]:bg-orange-600">
            <Star className="w-4 h-4 mr-2" />
              Populares
          </TabsTrigger>
        </TabsList>

        {/* Recommended Tab */}
        {user && (
          <TabsContent value="recommended" className="mt-6">
            <EventGrid events={recommendedEvents} user={user} showScore={true} />
          </TabsContent>
        )}

        {/* Trending Tab */}
        <TabsContent value="trending" className="mt-6">
          <EventGrid events={trendingEvents} user={user} />
        </TabsContent>

        {/* Nearby Tab */}
        {user?.location?.lat && (
          <TabsContent value="nearby" className="mt-6">
            <EventGrid events={nearbyEvents} user={user} showDistance={true} />
          </TabsContent>
        )}

        {/* Popular Tab */}
        <TabsContent value="popular" className="mt-6">
          <EventGrid events={popularEvents} user={user} showAttendees={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Event Grid Component
function EventGrid({ events, user, showScore, showDistance, showAttendees }) {
  const navigate = useNavigate();

  if (events.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-900/50 rounded-lg">
        <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Nenhum evento encontrado</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map(event => (
        <Card
          key={event.id}
          className="bg-gray-900/50 border-gray-700 overflow-hidden hover:border-cyan-500/50 transition-all cursor-pointer group"
          onClick={() => navigate(createPageUrl("Feed"))}
        >
          <div className="relative h-48 overflow-hidden">
            <img
              src={event.image_url || `https://picsum.photos/400/300?random=${event.id}`}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              <Badge className="bg-cyan-600/90 text-white text-xs">
                {event.genre}
              </Badge>
              {showScore && event.score > 50 && (
                <Badge className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  {Math.round(event.score)}% Match
                </Badge>
              )}
            </div>

            {/* Info overlays */}
            <div className="absolute bottom-2 left-2 right-2">
              <h3 className="text-white font-bold text-lg mb-1 line-clamp-1">
                {event.title}
              </h3>
              <div className="flex items-center gap-2 text-white text-xs">
                <Clock className="w-3 h-3" />
                <span>{format(new Date(event.date), 'dd/MM HH:mm', { locale: ptBR })}</span>
              </div>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{event.location?.venue_name || event.location?.city}</span>
            </div>

            {showDistance && event.distance !== undefined && (
              <div className="flex items-center gap-2 text-sm text-cyan-400 mb-2">
                <MapPin className="w-4 h-4" />
                <span>{event.distance.toFixed(1)}km de você</span>
              </div>
            )}

            {showAttendees && (
              <div className="flex items-center gap-2 text-sm text-purple-400 mb-2">
                <Users className="w-4 h-4" />
                <span>{event.current_attendees || 0} participantes</span>
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <Badge variant="outline" className="text-green-400 border-green-500/30">
                {event.price === 0 ? 'Grátis' : `R$ ${event.price}`}
              </Badge>
              
              <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                Ver Mais
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}