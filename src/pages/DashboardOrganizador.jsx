
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
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
  Gift, Target, Eye, Clock, MapPin, Share2, BarChart3, Heart,
  Plus, RefreshCw, Loader2, ExternalLink, CheckCircle2, AlertCircle, X
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";


const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function DashboardOrganizador() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [syncingEvents, setSyncingEvents] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  // Verificar acesso de organizador
  useEffect(() => {
    checkOrganizerAccess();
  }, []);

  const checkOrganizerAccess = async () => {
    try {
      const userData = await base44.auth.me();
      if (!userData.is_organizer) {
        navigate(createPageUrl("Planos"));
        return;
      }
      setUser(userData);
    } catch (error) {
      navigate(createPageUrl("BemVindo"));
    } finally {
      setLoading(false);
    }
  };

  // Buscar eventos do organizador
  const { data: events = [] } = useQuery({
    queryKey: ['organizerEvents', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Event.filter({ organizer_id: user.id }, "-date");
    },
    enabled: !!user,
  });

  // Buscar tickets vendidos
  const { data: tickets = [] } = useQuery({
    queryKey: ['organizerTickets', events],
    queryFn: async () => {
      if (!events || events.length === 0) return [];
      const eventIds = events.map(e => e.id);
      return await base44.entities.Ticket.filter({ event_id: { $in: eventIds } });
    },
    enabled: events.length > 0,
  });

  // Buscar solicitações
  const { data: requests = [] } = useQuery({
    queryKey: ['organizerRequests', events],
    queryFn: async () => {
      if (!events || events.length === 0) return [];
      const eventIds = events.map(e => e.id);
      return await base44.entities.EventRequest.filter({ event_id: { $in: eventIds } });
    },
    enabled: events.length > 0,
  });

  // Buscar likes e comentários
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

  const handleSyncExternalEvents = async () => {
    if (!user || user.role !== 'admin') {
      alert('❌ Apenas administradores podem sincronizar eventos externos');
      return;
    }

    setSyncingEvents(true);
    setSyncResult(null);

    try {
      const { data } = await base44.functions.invoke('syncExternalEvents', {
        city: 'São Paulo',
        force: true
      });

      setSyncResult(data);
      queryClient.invalidateQueries(['organizerEvents']);
      queryClient.invalidateQueries(['dashboardStats']); // Assuming a dashboardStats query exists
    } catch (error) {
      console.error('Erro na sincronização:', error);
      setSyncResult({
        success: false,
        error: error.message || 'Erro desconhecido'
      });
    } finally {
      setSyncingEvents(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  // Cálculos de métricas
  const totalRevenue = tickets.reduce((sum, t) => sum + (t.price || 0), 0);
  const totalTicketsSold = tickets.length;
  const avgTicketPrice = totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const approvedRequests = requests.filter(r => r.status === 'approved').length;
  const totalLikes = interactions.likes.length;
  const totalComments = interactions.comments.length;
  const engagementRate = events.length > 0 ? ((totalLikes + totalComments) / events.length).toFixed(1) : 0;

  // Dados para gráficos
  const revenueByEvent = events.map(event => {
    const eventTickets = tickets.filter(t => t.event_id === event.id);
    const revenue = eventTickets.reduce((sum, t) => sum + (t.price || 0), 0);
    return {
      name: event.title.substring(0, 15) + (event.title.length > 15 ? '...' : ''),
      revenue,
      tickets: eventTickets.length
    };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const requestsByStatus = [
    { name: 'Aprovadas', value: approvedRequests, color: '#10b981' },
    { name: 'Pendentes', value: pendingRequests, color: '#f59e0b' },
    { name: 'Negadas', value: requests.filter(r => r.status === 'denied').length, color: '#ef4444' }
  ].filter(item => item.value > 0);

  const ticketTypeDistribution = tickets.reduce((acc, ticket) => {
    const type = ticket.ticket_type || 'Padrão';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const ticketTypeData = Object.entries(ticketTypeDistribution).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Dashboard Organizador
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Bem-vindo, <span className="text-cyan-400 font-semibold">{user?.full_name || user?.email}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            {user?.role === 'admin' && (
              <Button
                onClick={handleSyncExternalEvents}
                disabled={syncingEvents}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-xs sm:text-sm h-9 sm:h-10 flex-1 sm:flex-none"
              >
                {syncingEvents ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync APIs
                  </>
                )}
              </Button>
            )}
            <Link to={createPageUrl("CriarEvento")} className="flex-1 sm:flex-none">
              <Button className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-xs sm:text-sm h-9 sm:h-10">
                <Plus className="w-4 h-4 mr-2" />
                Criar Evento
              </Button>
            </Link>
            <Link to={createPageUrl("IntegracoesIngressos")} className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 text-xs sm:text-sm h-9 sm:h-10">
                <ExternalLink className="w-4 h-4 mr-2" />
                Integrações
              </Button>
            </Link>
          </div>
        </div>

        {/* Resultado da Sincronização */}
        <AnimatePresence>
          {syncResult && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-lg border ${
                syncResult.success 
                  ? 'bg-green-900/20 border-green-500/50' 
                  : 'bg-red-900/20 border-red-500/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-sm sm:text-base mb-2 flex items-center gap-2">
                    {syncResult.success ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        Sincronização Concluída!
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        Erro na Sincronização
                      </>
                    )}
                  </h3>
                  
                  {syncResult.success ? (
                    <div className="space-y-2 text-xs sm:text-sm">
                      <p className="text-gray-300">{syncResult.message}</p>
                      
                      {syncResult.stats && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                          <div className="bg-black/30 rounded p-2">
                            <div className="text-cyan-400 font-bold text-lg">{syncResult.stats.total_found}</div>
                            <div className="text-gray-400 text-xs">Encontrados</div>
                          </div>
                          <div className="bg-black/30 rounded p-2">
                            <div className="text-purple-400 font-bold text-lg">{syncResult.stats.valid_after_validation}</div>
                            <div className="text-gray-400 text-xs">Validados</div>
                          </div>
                          <div className="bg-black/30 rounded p-2">
                            <div className="text-green-400 font-bold text-lg">{syncResult.stats.successfully_inserted}</div>
                            <div className="text-gray-400 text-xs">Inseridos</div>
                          </div>
                          <div className="bg-black/30 rounded p-2">
                            <div className="text-red-400 font-bold text-lg">{syncResult.stats.errors}</div>
                            <div className="text-gray-400 text-xs">Erros</div>
                          </div>
                        </div>
                      )}
                      
                      {syncResult.sources && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge className="bg-blue-600/20 border-blue-500/30 text-blue-300 text-xs">
                            Eventbrite: {syncResult.sources.eventbrite}
                          </Badge>
                          <Badge className="bg-purple-600/20 border-purple-500/30 text-purple-300 text-xs">
                            JamBase: {syncResult.sources.jambase}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-red-300 text-sm">{syncResult.error}</p>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSyncResult(null)}
                  className="flex-shrink-0 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

        <Card className="bg-gradient-to-br from-blue-900/30 to-gray-900 border-blue-700/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Ingressos Vendidos</CardTitle>
            <Users className="w-5 h-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalTicketsSold}</div>
            <p className="text-xs text-gray-400 mt-1">
              De {events.reduce((sum, e) => sum + (e.max_capacity || 0), 0)} vagas totais
            </p>
          </CardContent>
        </Card>

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
      </div>

      {/* Tabs de Análises */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="tickets">Ingressos</TabsTrigger>
          <TabsTrigger value="engagement">Engajamento</TabsTrigger>
          <TabsTrigger value="communication">Comunicação</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de Receita por Evento */}
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

            {/* Gráfico de Solicitações por Status */}
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

          {/* Lista de Eventos Recentes */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Seus Eventos ({events.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.slice(0, 5).map(event => {
                  const eventTickets = tickets.filter(t => t.event_id === event.id);
                  const eventRevenue = eventTickets.reduce((sum, t) => sum + (t.price || 0), 0);
                  const occupancyRate = event.max_capacity > 0 
                    ? ((event.current_attendees / event.max_capacity) * 100).toFixed(0) 
                    : 0;

                  return (
                    <div key={event.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <h3 className="font-semibold text-white">{event.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(event.date), "dd MMM", { locale: ptBR })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {event.current_attendees}/{event.max_capacity}
                            </span>
                            <Badge variant="outline" className="border-cyan-500/30 text-cyan-300">
                              {occupancyRate}% ocupado
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">R$ {eventRevenue.toFixed(2)}</div>
                        <div className="text-sm text-gray-400">{eventTickets.length} ingressos</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Ingressos */}
        <TabsContent value="tickets" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Distribuição de Tipos de Ingresso */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Distribuição por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Estatísticas de Vendas */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Estatísticas de Vendas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300">Total de Vendas</span>
                  <span className="text-xl font-bold text-white">{totalTicketsSold}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300">Receita Total</span>
                  <span className="text-xl font-bold text-green-400">R$ {totalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300">Ticket Médio</span>
                  <span className="text-xl font-bold text-cyan-400">R$ {avgTicketPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300">Taxa de Conversão</span>
                  <span className="text-xl font-bold text-purple-400">
                    {requests.length > 0 ? ((approvedRequests / requests.length) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Engajamento */}
        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                  Taxa de Engajamento
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

          {/* Comentários Recentes */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comentários Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {interactions.comments.slice(0, 5).map(comment => (
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
                        <p className="text-gray-300">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Comunicação */}
        <TabsContent value="communication" className="space-y-4">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Central de Comunicação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  Ferramentas de Comunicação
                </h3>
                <p className="text-gray-400 mb-6">
                  Envie anúncios e mensagens para seus participantes
                </p>
                <Button
                  onClick={() => navigate(createPageUrl("Chat"))}
                  className="bg-gradient-to-r from-cyan-600 to-purple-600"
                >
                  Acessar Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}
