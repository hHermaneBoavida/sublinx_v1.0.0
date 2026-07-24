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
  Ticket, TrendingUp, Search, Plus, Settings, BarChart3, Crown
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import GuestListManager from "../components/guestlist/GuestListManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function MeusEventos() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showGuestList, setShowGuestList] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const userData = await base44.auth.me();
        if (!userData.is_organizer) {
          navigate(createPageUrl("Planos"));
          return null;
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
                className="bg-white hover:bg-gray-100 text-black font-black border border-gray-300"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("CriarEvento"))}
                className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-black"
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
            <h2 className="text-xl font-bold mb-4 text-cyan-400">Eventos Futuros</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {futureEvents.map((event, index) => (
                <EventManagementCard
                  key={event.id}
                  event={event}
                  allTickets={allTickets}
                  navigate={navigate}
                  index={index}
                  onManageTickets={() => navigate(createPageUrl("GerenciarIngressos") + `?eventId=${event.id}`)}
                  onEditEvent={() => navigate(createPageUrl("EditarEvento") + `?id=${event.id}`)}
                  onManageGuestList={() => {
                    setSelectedEvent(event);
                    setShowGuestList(true);
                  }}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastEvents.map((event, index) => (
                <EventManagementCard
                  key={event.id}
                  event={event}
                  allTickets={allTickets}
                  navigate={navigate}
                  index={index}
                  isPast
                  onManageTickets={() => navigate(createPageUrl("GerenciarIngressos") + `?eventId=${event.id}`)}
                  onEditEvent={() => navigate(createPageUrl("EditarEvento") + `?id=${event.id}`)}
                  onManageGuestList={() => {
                    setSelectedEvent(event);
                    setShowGuestList(true);
                  }}
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
                className="bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Evento
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Guest List Modal */}
      {showGuestList && selectedEvent && (
        <Dialog open={showGuestList} onOpenChange={setShowGuestList}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{selectedEvent.title}</DialogTitle>
            </DialogHeader>
            <GuestListManager event={selectedEvent} user={user} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function EventManagementCard({ event, allTickets, navigate, index, isPast = false, onManageTickets, onEditEvent, onManageGuestList }) {
  const tickets = allTickets.filter(t => t.event_id === event.id && t.status !== 'cancelled');
  const revenue = tickets.reduce((sum, t) => sum + (t.price || 0), 0);
  const occupancy = event.max_capacity > 0 ? (tickets.length / event.max_capacity) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`bg-gray-900/80 border-gray-700 overflow-hidden ${isPast ? 'opacity-75' : ''} hover:border-cyan-500/40 transition-all`}>
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
        <CardContent className="p-4 space-y-3">
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
              <p className="text-xs text-gray-400">participação</p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={onManageTickets}
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-black shadow-lg"
            >
              <Ticket className="w-4 h-4 mr-1.5" />
              Ingressos
            </Button>
            <Button
              onClick={onManageGuestList}
              size="sm"
              className="bg-purple-600 hover:bg-purple-500 text-white font-black shadow-lg"
            >
              <Crown className="w-4 h-4 mr-1.5" />
              Lista de convidados
            </Button>
          </div>

          <Button
            onClick={onEditEvent}
            size="sm"
            className="w-full bg-white hover:bg-gray-100 text-black font-black border border-gray-400"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar Evento
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}