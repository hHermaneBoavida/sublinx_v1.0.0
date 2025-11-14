import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Users, DollarSign, Calendar, MessageSquare,
  Gift, Target, Eye, Clock, MapPin, Ticket, BarChart3, Heart, Settings
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function DashboardOrganizador() {
  const navigate = useNavigate();

  const { data: user, isLoading: loadingUser } = useQuery({
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

  const { data: events = [] } = useQuery({
    queryKey: ['organizerEvents', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Event.filter({ organizer_id: user.id }, "-date");
    },
    enabled: !!user,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['organizerTickets', events],
    queryFn: async () => {
      if (!events || events.length === 0) return [];
      const eventIds = events.map(e => e.id);
      return await base44.entities.Ticket.filter({ event_id: { $in: eventIds } });
    },
    enabled: events.length > 0,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['organizerRequests', events],
    queryFn: async () => {
      if (!events || events.length === 0) return [];
      const eventIds = events.map(e => e.id);
      return await base44.entities.EventRequest.filter({ event_id: { $in: eventIds } });
    },
    enabled: events.length > 0,
  });

  const { data: interactions = { likes: [], comments: [] } } = useQuery({
    queryKey: ['organizerInteractions', events],
    queryFn: async () => {
      if (!events || events.length === 0) return { likes: [], comments: [] };
      const eventIds = events.map(e => e.id);
      
      const [likes, comments] = await Promise.all([
        base44.entities.Like.filter({ event_id: { $in: eventIds } }),
        base44.entities.Comment.filter({ event_id: { $in: eventIds } })
      ]);

      return { likes, comments };
    },
    enabled: events.length > 0,
  });

  if (loadingUser) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  // Métricas
  const totalRevenue = tickets.filter(t => t.status !== 'cancelled').reduce((sum, t) => sum + (t.price || 0), 0);
  const totalTicketsSold = tickets.filter(t => t.status !== 'cancelled').length;
  const avgTicketPrice = totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const approvedRequests = requests.filter(r => r.status === 'approved').length;
  const totalLikes = interactions.likes.length;
  const totalComments = interactions.comments.length;
  const engagementRate = events.length > 0 ? ((totalLikes + totalComments) / events.length).toFixed(1) : 0;

  // Gráficos
  const revenueByEvent = events.map(event => {
    const eventTickets = tickets.filter(t => t.event_id === event.id && t.status !== 'cancelled');
    const revenue = eventTickets.reduce((sum, t) => sum + (t.price || 0), 0);
    return {
      name: event.title.substring(0, 15) + (event.title.length > 15 ? '...' : ''),
      revenue,
      tickets: eventTickets.length
    };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const ticketTypeDistribution = tickets
    .filter(t => t.status !== 'cancelled')
    .reduce((acc, ticket) => {
      const type = ticket.ticket_type || 'Padrão';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

  const ticketTypeData = Object.entries(ticketTypeDistribution).map(([name, value]) => ({
    name,
    value
  }));

  const requestsByStatus = [
    { name: 'Aprovadas', value: approvedRequests, color: '#10b981' },
    { name: 'Pendentes', value: pendingRequests, color: '#f59e0b' },
    { name: 'Negadas', value: requests.filter(r => r.status === 'denied').length, color: '#ef4444' }
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text mb-2">
              Dashboard de Organizador
            </h1>
            <p className="text-gray-400">Analise o desempenho dos seus eventos</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(createPageUrl("CriarEvento"))}
              className="bg-gradient-to-r from-cyan-600 to-purple-600"
            >
              Criar Evento
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("MeusEventos"))}
              variant="outline"
              className="border-gray-600"
            >
              Gerenciar Eventos
            </Button>
          </div>
        </motion.div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-green-900/30 to-gray-900 border-green-700/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Receita Total</CardTitle>
                <DollarSign className="w-5 h-5 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">R$ {totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-gray-400 mt-1">
                  Ticket médio: R$ {avgTicketPrice.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-blue-900/30 to-gray-900 border-blue-700/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Ingressos Vendidos</CardTitle>
                <Ticket className="w-5 h-5 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{totalTicketsSold}</div>
                <p className="text-xs text-gray-400 mt-1">
                  De {events.reduce((sum, e) => sum + (e.max_capacity || 0), 0)} vagas totais
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-purple-900/30 to-gray-900 border-purple-700/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Engajamento</CardTitle>
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{engagementRate}</div>
                <p className="text-xs text-gray-400 mt-1">
                  {totalLikes} curtidas • {totalComments} comentários
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-yellow-900/30 to-gray-900 border-yellow-700/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Solicitações</CardTitle>
                <Clock className="w-5 h-5 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{pendingRequests}</div>
                <p className="text-xs text-gray-400 mt-1">
                  Pendentes de aprovação
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="tickets">Vendas</TabsTrigger>
            <TabsTrigger value="attendees">Participantes</TabsTrigger>
            <TabsTrigger value="engagement">Engajamento</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Top 5 Eventos por Receita
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueByEvent}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="revenue" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Status de Solicitações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={requestsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {requestsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Events List */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Seus Eventos ({events.length})
                  </CardTitle>
                  <Button
                    onClick={() => navigate(createPageUrl("MeusEventos"))}
                    variant="outline"
                    size="sm"
                    className="border-gray-600"
                  >
                    Ver Todos
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.slice(0, 5).map(event => {
                    const eventTickets = tickets.filter(t => t.event_id === event.id && t.status !== 'cancelled');
                    const eventRevenue = eventTickets.reduce((sum, t) => sum + (t.price || 0), 0);
                    const occupancyRate = event.max_capacity > 0 
                      ? ((eventTickets.length / event.max_capacity) * 100).toFixed(0) 
                      : 0;

                    return (
                      <motion.div
                        key={event.id}
                        whileHover={{ scale: 1.01 }}
                        className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-colors cursor-pointer"
                        onClick={() => navigate(createPageUrl("GerenciarIngressos") + `?eventId=${event.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={event.image_url || `https://picsum.photos/100/100?random=${event.id}`}
                            alt={event.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div>
                            <h3 className="font-semibold text-white mb-1">{event.title}</h3>
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(event.date), "dd MMM", { locale: ptBR })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {eventTickets.length}/{event.max_capacity || 0}
                              </span>
                              <Badge variant="outline" className="border-cyan-500/30 text-cyan-300 text-xs">
                                {occupancyRate}% ocupado
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-400">R$ {eventRevenue.toFixed(2)}</div>
                          <div className="text-sm text-gray-400">{eventTickets.length} ingresso{eventTickets.length !== 1 ? 's' : ''}</div>
                          <Button
                            size="sm"
                            className="mt-2 bg-cyan-600 hover:bg-cyan-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(createPageUrl("GerenciarIngressos") + `?eventId=${event.id}`);
                            }}
                          >
                            <Settings className="w-3 h-3 mr-1" />
                            Gerenciar
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendas */}
          <TabsContent value="tickets" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Distribuição por Tipo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ticketTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={ticketTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {ticketTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      Nenhuma venda registrada
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-300">Total de Vendas</span>
                    <span className="text-xl font-bold text-white">{totalTicketsSold}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-300">Receita Bruta</span>
                    <span className="text-xl font-bold text-green-400">R$ {totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-300">Ticket Médio</span>
                    <span className="text-xl font-bold text-cyan-400">R$ {avgTicketPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-300">Taxa de Conversão</span>
                    <span className="text-xl font-bold text-purple-400">
                      {requests.length > 0 ? ((totalTicketsSold / requests.length) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Participantes */}
          <TabsContent value="attendees" className="space-y-4">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Lista de Participantes ({totalTicketsSold})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {tickets.filter(t => t.status !== 'cancelled').map(ticket => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-600/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {ticket.attendee_info?.full_name || 'Participante'}
                          </p>
                          <p className="text-xs text-gray-400">{ticket.ticket_type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={ticket.checked_in_at ? 'bg-green-600' : 'bg-yellow-600/20 border-yellow-500/30 text-yellow-300'}>
                          {ticket.checked_in_at ? '✓ Check-in' : 'Pendente'}
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">
                          R$ {ticket.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Engajamento */}
          <TabsContent value="engagement" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <Card className="bg-gradient-to-br from-red-900/30 to-gray-900 border-red-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Curtidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white">{totalLikes}</div>
                  <p className="text-sm text-gray-400 mt-2">
                    Média: {(totalLikes / Math.max(events.length, 1)).toFixed(1)} por evento
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-900/30 to-gray-900 border-blue-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Comentários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white">{totalComments}</div>
                  <p className="text-sm text-gray-400 mt-2">
                    Média: {(totalComments / Math.max(events.length, 1)).toFixed(1)} por evento
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-900/30 to-gray-900 border-purple-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Engajamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white">{engagementRate}</div>
                  <p className="text-sm text-gray-400 mt-2">
                    Interações por evento
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Comentários Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {interactions.comments.slice(0, 10).map(comment => (
                    <div key={comment.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex items-start gap-3">
                        <img
                          src={`https://i.pravatar.cc/40?u=${comment.user_id}`}
                          alt="User"
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white">{comment.user_name}</span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(comment.created_date), "PPp", { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}