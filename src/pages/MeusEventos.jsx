import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Calendar, MapPin, Users, DollarSign, Edit, 
  Ticket, TrendingUp, Search, Plus, Settings, BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MeusEventos() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const userData = await base44.auth.me();
        if (!userData.is_organizer) {
          navigate(createPageUrl("Planos"));
          throw new Error("Não é organizador");
        }
        return userData;
      } catch (error) {
        navigate(createPageUrl("BemVindo"));
        throw error;
      }
    },
    retry: false,
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['myEvents', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Event.filter({ organizer_id: user.id }, "-date");
    },
    enabled: !!user,
  });

  const { data: allTickets = [] } = useQuery({
    queryKey: ['allTickets', events],
    queryFn: async () => {
      if (!events || events.length === 0) return [];
      const eventIds = events.map(e => e.id);
      return await base44.entities.Ticket.filter({ event_id: { $in: eventIds } });
    },
    enabled: events.length > 0,
  });

  const filteredEvents = events.filter(event =>
    event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location?.venue_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const futureEvents = filteredEvents.filter(e => new Date(e.date) > new Date());
  const pastEvents = filteredEvents.filter(e => new Date(e.date) <= new Date());

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Meus Eventos
            </h1>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate(createPageUrl("DashboardOrganizador"))}
                variant="outline"
                className="border-gray-600"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("CriarEvento"))}
                className="bg-gradient-to-r from-cyan-600 to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Evento
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-700 text-white"
            />
          </div>
        </motion.div>

        {/* Future Events */}
        {futureEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              Próximos Eventos ({futureEvents.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {futureEvents.map((event, index) => (
                <EventManagementCard
                  key={event.id}
                  event={event}
                  tickets={allTickets.filter(t => t.event_id === event.id && t.status !== 'cancelled')}
                  navigate={navigate}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-400 mb-4">
              Eventos Passados ({pastEvents.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastEvents.map((event, index) => (
                <EventManagementCard
                  key={event.id}
                  event={event}
                  tickets={allTickets.filter(t => t.event_id === event.id && t.status !== 'cancelled')}
                  navigate={navigate}
                  index={index}
                  isPast
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {searchTerm ? "Nenhum evento encontrado" : "Nenhum evento criado"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? "Tente ajustar sua busca" : "Comece criando seu primeiro evento"}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => navigate(createPageUrl("CriarEvento"))}
                className="bg-gradient-to-r from-cyan-600 to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Evento
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EventManagementCard({ event, tickets, navigate, index, isPast = false }) {
  const revenue = tickets.reduce((sum, t) => sum + (t.price || 0), 0);
  const occupancy = event.max_capacity > 0 ? (tickets.length / event.max_capacity) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`bg-gray-900/80 border-gray-700 hover:border-cyan-500/50 transition-colors ${isPast ? 'opacity-70' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            <img
              src={event.image_url || `https://picsum.photos/120/120?random=${event.id}`}
              alt={event.title}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div className="flex-1">
              <CardTitle className="text-white mb-2">{event.title}</CardTitle>
              <div className="flex flex-wrap gap-2 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(event.date), "dd MMM", { locale: ptBR })}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.location?.venue_name || 'Venue'}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <DollarSign className="w-4 h-4 text-green-400 mx-auto mb-1" />
              <p className="text-sm font-bold text-white">R$ {revenue.toFixed(0)}</p>
              <p className="text-xs text-gray-400">Receita</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <p className="text-sm font-bold text-white">{tickets.length}</p>
              <p className="text-xs text-gray-400">Vendidos</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <TrendingUp className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <p className="text-sm font-bold text-white">{occupancy.toFixed(0)}%</p>
              <p className="text-xs text-gray-400">Ocupação</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(createPageUrl("GerenciarIngressos") + `?eventId=${event.id}`)}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
              size="sm"
            >
              <Ticket className="w-4 h-4 mr-2" />
              Ingressos
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("EditarEvento") + `?id=${event.id}`)}
              variant="outline"
              className="border-gray-600"
              size="sm"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}