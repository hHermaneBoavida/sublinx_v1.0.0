import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ExternalLink,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Download,
  CheckCircle,
  Loader2,
  Sparkles,
  Globe,
  Music2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GenreBadge } from "../components/shared/EventBadge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const SOURCES = [
  { id: 'all', name: 'Todas', icon: Globe, color: '#06B6D4' },
  { id: 'sympla', name: 'Sympla', icon: Music2, color: '#FF6B35' },
  { id: 'eventbrite', name: 'Eventbrite', icon: Music2, color: '#F05537' },
  { id: 'facebook', name: 'Facebook', icon: Music2, color: '#1877F2' }
];

export default function Descobrir() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState('all');
  const [importedEvents, setImportedEvents] = useState(new Set());
  const navigate = useNavigate();

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

  const isOrganizer = user?.is_organizer;

  const { data: userLocation } = useQuery({
    queryKey: ['userLocation'],
    queryFn: () => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve({ lat: -23.5505, lng: -46.6333, city: 'São Paulo' });
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              city: 'São Paulo'
            });
          },
          () => {
            resolve({ lat: -23.5505, lng: -46.6333, city: 'São Paulo' });
          }
        );
      });
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: externalEvents = [], isLoading, refetch } = useQuery({
    queryKey: ['externalEvents', searchQuery, selectedSource, userLocation],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 3) return [];

      const { data } = await base44.functions.invoke('importExternalEvents', {
        source: selectedSource,
        query: searchQuery,
        location: userLocation
      });

      return data?.events || [];
    },
    enabled: searchQuery.length >= 3 && !!userLocation,
    staleTime: 5 * 60 * 1000,
  });

  const saveEventMutation = useMutation({
    mutationFn: async (externalEvent) => {
      const { data } = await base44.functions.invoke('saveExternalEvent', {
        externalEvent
      });
      return data;
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        setImportedEvents(prev => new Set([...prev, variables.id]));
      }
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.length >= 3) {
      refetch();
    }
  };

  const handleImportEvent = async (event) => {
    if (!isOrganizer) {
      alert('Apenas organizadores podem importar eventos');
      return;
    }

    await saveEventMutation.mutateAsync(event);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md bg-gray-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8 text-center">
          <Globe className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">
            Entre para Descobrir
          </h2>
          <p className="text-gray-300 mb-6">
            Faça login para descobrir eventos de outras plataformas
          </p>
          <Button
            onClick={() => navigate(createPageUrl("BemVindo"))}
            className="w-full bg-gradient-to-r from-cyan-600 to-purple-600"
          >
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{
                rotate: [0, 360]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Globe className="w-8 h-8 text-cyan-400" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Descobrir Eventos
            </h1>
          </div>
          <p className="text-gray-400">
            Encontre eventos de múltiplas plataformas em um só lugar
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSearch}
          className="mb-6"
        >
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar eventos (mín. 3 caracteres)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12 bg-gray-900/80 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-500 rounded-xl"
            />
          </div>

          {/* Source Filter */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SOURCES.map(source => (
              <Button
                key={source.id}
                type="button"
                onClick={() => setSelectedSource(source.id)}
                variant={selectedSource === source.id ? 'default' : 'outline'}
                className={`h-12 ${
                  selectedSource === source.id
                    ? 'bg-gradient-to-r from-cyan-600 to-purple-600 border-0'
                    : 'bg-gray-900/50 border-gray-700 hover:bg-gray-800'
                }`}
              >
                <source.icon className="w-4 h-4 mr-2" />
                {source.name}
              </Button>
            ))}
          </div>
        </motion.form>

        {/* Organizer Notice */}
        {!isOrganizer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-300 mb-1">
                  Torne-se Organizador
                </h3>
                <p className="text-sm text-yellow-200/80">
                  Apenas organizadores podem importar eventos externos para a plataforma.
                </p>
                <Button
                  onClick={() => navigate(createPageUrl("Planos"))}
                  size="sm"
                  className="mt-3 bg-yellow-600 hover:bg-yellow-700"
                >
                  Ver Planos
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mb-4" />
            <p className="text-gray-400">Buscando eventos...</p>
          </div>
        )}

        {/* Results */}
        <AnimatePresence mode="popLayout">
          {!isLoading && externalEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  {externalEvents.length} eventos encontrados
                </h2>
                <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300">
                  {selectedSource === 'all' ? 'Todas as fontes' : SOURCES.find(s => s.id === selectedSource)?.name}
                </Badge>
              </div>

              {externalEvents.map((event, index) => (
                <ExternalEventCard
                  key={event.id}
                  event={event}
                  index={index}
                  isImported={importedEvents.has(event.id)}
                  isImporting={saveEventMutation.isPending}
                  onImport={() => handleImportEvent(event)}
                  canImport={isOrganizer}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!isLoading && searchQuery.length >= 3 && externalEvents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              Nenhum evento encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              Tente ajustar sua busca ou escolher outra fonte
            </p>
          </motion.div>
        )}

        {/* Initial State */}
        {!isLoading && searchQuery.length < 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Globe className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Descubra Eventos Externos
            </h3>
            <p className="text-gray-400 mb-6">
              Busque eventos do Sympla, Eventbrite, Facebook e mais
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto text-left">
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                <Search className="w-6 h-6 text-cyan-400 mb-2" />
                <h4 className="font-semibold text-white mb-1">Buscar</h4>
                <p className="text-sm text-gray-400">
                  Digite o que procura (mín. 3 caracteres)
                </p>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                <Download className="w-6 h-6 text-purple-400 mb-2" />
                <h4 className="font-semibold text-white mb-1">Importar</h4>
                <p className="text-sm text-gray-400">
                  Organizadores podem importar eventos
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ExternalEventCard({ event, index, isImported, isImporting, onImport, canImport }) {
  const sourceColors = {
    sympla: 'from-orange-500 to-red-500',
    eventbrite: 'from-red-500 to-pink-500',
    facebook: 'from-blue-500 to-indigo-500',
    external: 'from-cyan-500 to-purple-500'
  };

  const sourceColor = sourceColors[event.source] || sourceColors.external;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="bg-gray-900/80 backdrop-blur-xl border border-gray-700 overflow-hidden hover:border-cyan-500/50 transition-all">
        {/* Source Badge */}
        <div className="absolute top-3 left-3 z-10">
          <Badge className={`bg-gradient-to-r ${sourceColor} text-white border-0 shadow-lg`}>
            <ExternalLink className="w-3 h-3 mr-1" />
            {event.source?.toUpperCase()}
          </Badge>
        </div>

        {/* Image */}
        {event.image_url && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
        )}

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
            {event.title}
          </h3>

          {/* Description */}
          {event.description && (
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">
              {event.description}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            <GenreBadge genre={event.genre} />
            <Badge className="bg-purple-600/20 border-purple-500/30 text-purple-300 text-xs">
              {event.type}
            </Badge>
          </div>

          {/* Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Calendar className="w-4 h-4 text-cyan-400" />
              {format(new Date(event.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-300">
              <MapPin className="w-4 h-4 text-purple-400" />
              {event.location?.venue_name || 'Local a definir'}
            </div>

            {event.price !== undefined && (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                {event.price === 0 ? 'Gratuito' : `R$ ${event.price.toFixed(2)}`}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-gray-600 hover:bg-gray-800"
              onClick={() => window.open(event.external_url, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Original
            </Button>

            {canImport && (
              <Button
                onClick={onImport}
                disabled={isImported || isImporting}
                className={`flex-1 ${
                  isImported
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700'
                }`}
              >
                {isImporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isImported ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Importado
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Importar
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}