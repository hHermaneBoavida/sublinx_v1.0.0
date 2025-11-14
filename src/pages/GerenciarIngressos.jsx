import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Ticket, Plus, Trash2, Edit2, Save, X, TrendingUp, 
  Users, DollarSign, Clock, CheckCircle, AlertCircle, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createPageUrl } from "@/utils";

export default function GerenciarIngressos() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const searchParams = new URLSearchParams(location.search);
  const eventId = searchParams.get('eventId');

  const [editingTicketId, setEditingTicketId] = useState(null);
  const [newTicketType, setNewTicketType] = useState({
    name: "",
    price: 0,
    quantity_available: 0,
    description: "",
    benefits: [],
    is_active: true
  });
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        navigate(createPageUrl("BemVindo"));
        throw error;
      }
    },
    retry: false,
  });

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const events = await base44.entities.Event.filter({ id: eventId });
      if (events.length === 0) throw new Error("Evento não encontrado");
      return events[0];
    },
    enabled: !!eventId,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['eventTickets', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      return await base44.entities.Ticket.filter({ event_id: eventId });
    },
    enabled: !!eventId,
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, data }) => {
      return await base44.entities.Event.update(eventId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['event', eventId]);
      setShowNewTicketForm(false);
      setEditingTicketId(null);
    }
  });

  const handleAddTicketType = async () => {
    if (!event || !newTicketType.name || newTicketType.price <= 0) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    const ticketId = `ticket-${Date.now()}`;
    const updatedTicketTypes = [
      ...(event.ticket_types || []),
      { ...newTicketType, id: ticketId, quantity_sold: 0 }
    ];

    await updateEventMutation.mutateAsync({
      eventId: event.id,
      data: { ticket_types: updatedTicketTypes }
    });

    setNewTicketType({
      name: "",
      price: 0,
      quantity_available: 0,
      description: "",
      benefits: [],
      is_active: true
    });
  };

  const handleUpdateTicketType = async (ticketId, updatedData) => {
    if (!event) return;

    const updatedTicketTypes = event.ticket_types.map(ticket =>
      ticket.id === ticketId ? { ...ticket, ...updatedData } : ticket
    );

    await updateEventMutation.mutateAsync({
      eventId: event.id,
      data: { ticket_types: updatedTicketTypes }
    });
  };

  const handleDeleteTicketType = async (ticketId) => {
    if (!event) return;
    if (!confirm("Tem certeza que deseja deletar este tipo de ingresso?")) return;

    const ticketsSold = tickets.filter(t => 
      t.ticket_type === event.ticket_types.find(tt => tt.id === ticketId)?.name
    ).length;

    if (ticketsSold > 0) {
      alert(`Não é possível deletar. ${ticketsSold} ingresso(s) já vendido(s).`);
      return;
    }

    const updatedTicketTypes = event.ticket_types.filter(ticket => ticket.id !== ticketId);

    await updateEventMutation.mutateAsync({
      eventId: event.id,
      data: { ticket_types: updatedTicketTypes }
    });
  };

  const stats = useMemo(() => {
    if (!event || !tickets) return { totalSold: 0, totalRevenue: 0, occupancy: 0 };

    const totalSold = tickets.filter(t => t.status !== 'cancelled').length;
    const totalRevenue = tickets
      .filter(t => t.status !== 'cancelled')
      .reduce((sum, t) => sum + (t.price || 0), 0);
    const occupancy = event.max_capacity > 0 ? (totalSold / event.max_capacity) * 100 : 0;

    return { totalSold, totalRevenue, occupancy };
  }, [event, tickets]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-16 h-16 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!event || event.organizer_id !== user?.id) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black p-4">
        <Card className="bg-gray-900 border-red-500/30">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
            <p className="text-gray-400 mb-4">Você não tem permissão para gerenciar este evento</p>
            <Button onClick={() => navigate(createPageUrl("MeusEventos"))}>
              Voltar
            </Button>
          </CardContent>
        </Card>
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
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                Gerenciar Ingressos
              </h1>
              <p className="text-gray-400">{event.title}</p>
            </div>
            <Button
              onClick={() => navigate(createPageUrl("MeusEventos"))}
              variant="outline"
              className="border-gray-600"
            >
              Voltar
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-green-900/30 to-gray-900 border-green-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                Receita Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                R$ {stats.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Média: R$ {stats.totalSold > 0 ? (stats.totalRevenue / stats.totalSold).toFixed(2) : '0.00'} por ingresso
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/30 to-gray-900 border-blue-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Ingressos Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalSold}</div>
              <p className="text-xs text-gray-400 mt-1">
                De {event.max_capacity || 0} vagas disponíveis
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/30 to-gray-900 border-purple-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Ocupação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.occupancy.toFixed(0)}%
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.occupancy}%` }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ticket Types List */}
        <Card className="bg-gray-900/80 border-gray-700 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Tipos de Ingresso
              </CardTitle>
              <Button
                onClick={() => setShowNewTicketForm(!showNewTicketForm)}
                className="bg-gradient-to-r from-cyan-600 to-purple-600"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Tipo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* New Ticket Form */}
            <AnimatePresence>
              {showNewTicketForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-800/50 border border-cyan-500/30 rounded-xl p-4 space-y-4"
                >
                  <h3 className="font-semibold text-white mb-3">Novo Tipo de Ingresso</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Nome do Ingresso *</Label>
                      <Input
                        placeholder="Ex: Early Bird, VIP, Pista"
                        value={newTicketType.name}
                        onChange={(e) => setNewTicketType({ ...newTicketType, name: e.target.value })}
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300">Preço (R$) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newTicketType.price}
                        onChange={(e) => setNewTicketType({ ...newTicketType, price: parseFloat(e.target.value) || 0 })}
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300">Quantidade Disponível</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newTicketType.quantity_available}
                        onChange={(e) => setNewTicketType({ ...newTicketType, quantity_available: parseInt(e.target.value) || 0 })}
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newTicketType.is_active}
                        onCheckedChange={(checked) => setNewTicketType({ ...newTicketType, is_active: checked })}
                      />
                      <Label className="text-gray-300">Ativo</Label>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300">Descrição</Label>
                    <Textarea
                      placeholder="Descrição do ingresso..."
                      value={newTicketType.description}
                      onChange={(e) => setNewTicketType({ ...newTicketType, description: e.target.value })}
                      className="bg-gray-900 border-gray-700 text-white"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddTicketType}
                      disabled={updateEventMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {updateEventMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Salvar
                    </Button>
                    <Button
                      onClick={() => setShowNewTicketForm(false)}
                      variant="outline"
                      className="border-gray-600"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Existing Ticket Types */}
            <div className="space-y-3">
              {(event.ticket_types || []).map((ticketType) => {
                const soldCount = tickets.filter(t => 
                  t.ticket_type === ticketType.name && t.status !== 'cancelled'
                ).length;
                const revenue = tickets
                  .filter(t => t.ticket_type === ticketType.name && t.status !== 'cancelled')
                  .reduce((sum, t) => sum + (t.price || 0), 0);
                const availability = ticketType.quantity_available > 0 
                  ? ((soldCount / ticketType.quantity_available) * 100).toFixed(0)
                  : 0;

                return (
                  <motion.div
                    key={ticketType.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white text-lg">{ticketType.name}</h3>
                          <Badge className={ticketType.is_active ? 'bg-green-600' : 'bg-gray-600'}>
                            {ticketType.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-gray-400">Preço</p>
                            <p className="font-semibold text-green-400">R$ {ticketType.price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Vendidos</p>
                            <p className="font-semibold text-white">{soldCount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Disponíveis</p>
                            <p className="font-semibold text-white">{ticketType.quantity_available || '∞'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Receita</p>
                            <p className="font-semibold text-cyan-400">R$ {revenue.toFixed(2)}</p>
                          </div>
                        </div>

                        {ticketType.quantity_available > 0 && (
                          <div>
                            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                              <span>Disponibilidade</span>
                              <span>{availability}% vendido</span>
                            </div>
                            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${availability}%` }}
                                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteTicketType(ticketType.id)}
                          disabled={soldCount > 0}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {(!event.ticket_types || event.ticket_types.length === 0) && !showNewTicketForm && (
                <div className="text-center py-12">
                  <Ticket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    Nenhum tipo de ingresso cadastrado
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Adicione tipos de ingresso para começar a vender
                  </p>
                  <Button
                    onClick={() => setShowNewTicketForm(true)}
                    className="bg-gradient-to-r from-cyan-600 to-purple-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Ingresso
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}