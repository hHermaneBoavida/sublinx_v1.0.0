import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Users, DollarSign, Calendar, MessageSquare, Target, Eye, 
  Clock, Ticket, BarChart3, Heart, Settings, AlertTriangle, TrendingDown,
  Zap, Crown, Bell, X, CheckCircle, ArrowUpRight, ArrowDownRight, Percent
} from "lucide-react";
import { format, subDays, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { CACHE_CONFIG } from "../components/shared/helpers";

const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export default function DashboardOrganizador() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

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
    ...CACHE_CONFIG.STATIC,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['organizerEvents', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Event.filter({ organizer_id: user.id }, "-date");
    },
    enabled: !!user,
    ...CACHE_CONFIG.SHORT,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['organizerTickets', events.length],
    queryFn: async () => {
      if (!events || events.length === 0) return [];
      const eventIds = events.map(e => e.id);
      return await base44.entities.Ticket.filter({ event_id: { $in: eventIds } });
    },
    enabled: events.length > 0,
    ...CACHE_CONFIG.SHORT,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['organizerRequests', events.length],
    queryFn: async () => {
      if (!events || events.length === 0) return [];
      const eventIds = events.map(e => e.id);
      return await base44.entities.EventRequest.filter({ event_id: { $in: eventIds } });
    },
    enabled: events.length > 0,
    ...CACHE_CONFIG.SHORT,
  });

  const { data: interactions = { likes: [], comments: [] } } = useQuery({
    queryKey: ['organizerInteractions', events.length],
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
    ...CACHE_CONFIG.SHORT,
  });

  // Verificar se é novo organizador
  React.useEffect(() => {
    if (user && events.length === 0 && !localStorage.getItem('onboarding_completed')) {
      setShowOnboarding(true);
    }
  }, [user, events.length]);

  // Métricas principais
  const metrics = useMemo(() => {
    const validTickets = tickets.filter(t => t.status !== 'cancelled' && t.status !== 'refunded');
    const totalRevenue = validTickets.reduce((sum, t) => sum + (t.price || 0), 0);
    const totalSold = validTickets.length;
    const avgPrice = totalSold > 0 ? totalRevenue / totalSold : 0;
    
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const totalLikes = interactions.likes.length;
    const totalComments = interactions.comments.length;
    const engagement = events.length > 0 ? ((totalLikes + totalComments) / events.length).toFixed(1) : 0;
    
    const totalCapacity = events.reduce((sum, e) => sum + (e.max_capacity || 0), 0);
    const occupancyRate = totalCapacity > 0 ? ((totalSold / totalCapacity) * 100).toFixed(1) : 0;

    return {
      totalRevenue,
      totalSold,
      avgPrice,
      pendingRequests,
      totalLikes,
      totalComments,
      engagement,
      occupancyRate,
      totalCapacity,
      conversionRate: requests.length > 0 ? ((totalSold / requests.length) * 100).toFixed(1) : 0
    };
  }, [tickets, requests, interactions, events]);

  // Alertas automáticos
  const alerts = useMemo(() => {
    const alertList = [];
    
    events.forEach(event => {
      const eventTickets = tickets.filter(t => t.event_id === event.id && t.status !== 'cancelled');
      const sold = eventTickets.length;
      const capacity = event.max_capacity || 0;
      const occupancy = capacity > 0 ? (sold / capacity) * 100 : 0;
      const daysUntil = Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24));

      // Alerta: Esgotando
      if (occupancy >= 85 && occupancy < 100) {
        alertList.push({
          id: `stock-${event.id}`,
          type: 'warning',
          icon: AlertTriangle,
          title: 'Evento quase esgotado',
          message: `${event.title} está ${occupancy.toFixed(0)}% ocupado`,
          action: () => navigate(createPageUrl("GerenciarIngressos") + `?eventId=${event.id}`),
          actionLabel: 'Gerenciar'
        });
      }

      // Alerta: Baixa venda
      if (daysUntil <= 7 && daysUntil > 0 && occupancy < 30) {
        alertList.push({
          id: `low-sales-${event.id}`,
          type: 'danger',
          icon: TrendingDown,
          title: 'Baixa venda',
          message: `${event.title} em ${daysUntil} dias com apenas ${occupancy.toFixed(0)}% vendido`,
          action: () => navigate(createPageUrl("EditarEvento") + `?id=${event.id}`),
          actionLabel: 'Promover'
        });
      }

      // Alerta: Solicitações pendentes
      const eventPending = requests.filter(r => r.event_id === event.id && r.status === 'pending');
      if (eventPending.length >= 5) {
        alertList.push({
          id: `requests-${event.id}`,
          type: 'info',
          icon: Clock,
          title: 'Solicitações pendentes',
          message: `${eventPending.length} pessoas aguardando aprovação para ${event.title}`,
          action: () => navigate(createPageUrl("MeusEventos")),
          actionLabel: 'Revisar'
        });
      }
    });

    return alertList.filter(alert => !dismissedAlerts.has(alert.id));
  }, [events, tickets, requests, dismissedAlerts]);

  // Dados para gráficos
  const chartData = useMemo(() => {
    // Receita por evento
    const revenueByEvent = events.map(event => {
      const eventTickets = tickets.filter(t => t.event_id === event.id && t.status !== 'cancelled');
      const revenue = eventTickets.reduce((sum, t) => sum + (t.price || 0), 0);
      return {
        name: event.title.substring(0, 12),
        fullName: event.title,
        receita: revenue,
        ingressos: eventTickets.length,
        ocupacao: event.max_capacity > 0 ? ((eventTickets.length / event.max_capacity) * 100).toFixed(0) : 0
      };
    }).sort((a, b) => b.receita - a.receita);

    // Vendas por tipo de ingresso
    const ticketTypes = tickets
      .filter(t => t.status !== 'cancelled')
      .reduce((acc, ticket) => {
        const type = ticket.ticket_type || 'Padrão';
        if (!acc[type]) {
          acc[type] = { vendas: 0, receita: 0 };
        }
        acc[type].vendas += 1;
        acc[type].receita += ticket.price || 0;
        return acc;
      }, {});

    const ticketTypesData = Object.entries(ticketTypes).map(([name, data]) => ({
      name,
      vendas: data.vendas,
      receita: data.receita
    }));

    // Performance temporal (últimos 30 dias)
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayTickets = tickets.filter(t => {
        const ticketDate = new Date(t.created_date);
        return ticketDate.toDateString() === date.toDateString() && t.status !== 'cancelled';
      });
      
      last30Days.push({
        date: format(date, 'dd/MM'),
        vendas: dayTickets.length,
        receita: dayTickets.reduce((sum, t) => sum + (t.price || 0), 0)
      });
    }

    // Comparação de períodos
    const now = new Date();
    const last7Days = tickets.filter(t => {
      const ticketDate = new Date(t.created_date);
      return isAfter(ticketDate, subDays(now, 7)) && t.status !== 'cancelled';
    });
    
    const previous7Days = tickets.filter(t => {
      const ticketDate = new Date(t.created_date);
      return isAfter(ticketDate, subDays(now, 14)) && isBefore(ticketDate, subDays(now, 7)) && t.status !== 'cancelled';
    });

    const revenueGrowth = previous7Days.length > 0
      ? (((last7Days.length - previous7Days.length) / previous7Days.length) * 100).toFixed(1)
      : last7Days.length > 0 ? 100 : 0;

    return {
      revenueByEvent,
      ticketTypesData,
      last30Days,
      revenueGrowth: parseFloat(revenueGrowth)
    };
  }, [events, tickets]);

  if (loadingUser) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text mb-2">
              Dashboard Organizador
            </h1>
            <p className="text-gray-400">Analise e otimize seus eventos em tempo real</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowOnboarding(true)}
              variant="outline"
              size="sm"
              className="border-purple-500/30 text-purple-400 hover:bg-purple-900/20"
            >
              <Zap className="w-4 h-4 mr-2" />
              Tutorial
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("CriarEvento"))}
              className="bg-gradient-to-r from-cyan-600 to-purple-600"
            >
              Criar Evento
            </Button>
          </div>
        </motion.div>

        {/* Alertas */}
        <AnimatePresence>
          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 space-y-2"
            >
              {alerts.map((alert) => {
                const Icon = alert.icon;
                const bgColors = {
                  info: 'from-blue-900/30 to-gray-900 border-blue-500/30',
                  warning: 'from-yellow-900/30 to-gray-900 border-yellow-500/30',
                  danger: 'from-red-900/30 to-gray-900 border-red-500/30'
                };
                const iconColors = {
                  info: 'text-blue-400',
                  warning: 'text-yellow-400',
                  danger: 'text-red-400'
                };

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                  >
                    <Card className={`bg-gradient-to-br ${bgColors[alert.type]} border relative overflow-hidden`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center flex-shrink-0">
                              <Icon className={`w-5 h-5 ${iconColors[alert.type]}`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-white text-sm">{alert.title}</h3>
                              <p className="text-gray-300 text-xs">{alert.message}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={alert.action}
                              size="sm"
                              className="bg-white/10 hover:bg-white/20 text-white border-0"
                            >
                              {alert.actionLabel}
                            </Button>
                            <Button
                              onClick={() => setDismissedAlerts(prev => new Set([...prev, alert.id]))}
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-gray-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon={DollarSign}
            title="Receita Total"
            value={`R$ ${metrics.totalRevenue.toFixed(2)}`}
            subtitle={`Ticket médio: R$ ${metrics.avgPrice.toFixed(2)}`}
            trend={chartData.revenueGrowth}
            color="from-green-900/30 to-gray-900 border-green-700/50"
            iconColor="text-green-400"
            delay={0.1}
          />
          
          <MetricCard
            icon={Ticket}
            title="Ingressos Vendidos"
            value={metrics.totalSold}
            subtitle={`De ${metrics.totalCapacity} vagas totais`}
            color="from-blue-900/30 to-gray-900 border-blue-700/50"
            iconColor="text-blue-400"
            delay={0.2}
          />
          
          <MetricCard
            icon={Percent}
            title="Taxa de Ocupação"
            value={`${metrics.occupancyRate}%`}
            subtitle={`${metrics.totalSold}/${metrics.totalCapacity} vendidos`}
            color="from-purple-900/30 to-gray-900 border-purple-700/50"
            iconColor="text-purple-400"
            delay={0.3}
          />
          
          <MetricCard
            icon={TrendingUp}
            title="Engajamento"
            value={metrics.engagement}
            subtitle={`${metrics.totalLikes} likes • ${metrics.totalComments} comments`}
            color="from-pink-900/30 to-gray-900 border-pink-700/50"
            iconColor="text-pink-400"
            delay={0.4}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-gray-900/80 border border-gray-700">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="attendees">Participantes</TabsTrigger>
            <TabsTrigger value="engagement">Engajamento</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Receita por Evento */}
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    Top Eventos por Receita
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.revenueByEvent.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                      <YAxis stroke="#9ca3af" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="receita" fill="url(#colorRevenue)" radius={[8, 8, 0, 0]} />
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Ocupação por Evento */}
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    Taxa de Ocupação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.revenueByEvent.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                      <YAxis stroke="#9ca3af" fontSize={11} unit="%" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      />
                      <Bar dataKey="ocupacao" fill="url(#colorOccupancy)" radius={[8, 8, 0, 0]} />
                      <defs>
                        <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#ec4899" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickStat icon={Calendar} label="Total Eventos" value={events.length} color="text-cyan-400" />
              <QuickStat icon={CheckCircle} label="Aprovações" value={requests.filter(r => r.status === 'approved').length} color="text-green-400" />
              <QuickStat icon={Clock} label="Pendentes" value={metrics.pendingRequests} color="text-yellow-400" />
              <QuickStat icon={Target} label="Conversão" value={`${metrics.conversionRate}%`} color="text-purple-400" />
            </div>
          </TabsContent>

          {/* Vendas */}
          <TabsContent value="sales" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Vendas nos últimos 30 dias */}
              <Card className="bg-gray-900/50 border-gray-700 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Vendas - Últimos 30 Dias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData.last30Days}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                      <YAxis stroke="#9ca3af" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      />
                      <Area type="monotone" dataKey="vendas" stroke="#06b6d4" fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Distribuição por Tipo */}
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-cyan-400" />
                    Por Tipo de Ingresso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.ticketTypesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        dataKey="vendas"
                      >
                        {chartData.ticketTypesData.map((entry, index) => (
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

              {/* Resumo Financeiro */}
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <FinancialRow label="Receita Bruta" value={`R$ ${metrics.totalRevenue.toFixed(2)}`} color="text-green-400" />
                  <FinancialRow label="Ticket Médio" value={`R$ ${metrics.avgPrice.toFixed(2)}`} color="text-cyan-400" />
                  <FinancialRow label="Total Vendido" value={metrics.totalSold} color="text-white" />
                  <FinancialRow label="Taxa Conversão" value={`${metrics.conversionRate}%`} color="text-purple-400" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance */}
          <TabsContent value="performance" className="space-y-4 mt-4">
            {/* Comparativo de Crescimento */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Crescimento Semanal
                  </span>
                  <Badge className={`${
                    chartData.revenueGrowth >= 0 
                      ? 'bg-green-600/20 border-green-500/30 text-green-300'
                      : 'bg-red-600/20 border-red-500/30 text-red-300'
                  }`}>
                    {chartData.revenueGrowth >= 0 ? (
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                    )}
                    {Math.abs(chartData.revenueGrowth).toFixed(1)}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Últimos 7 dias</p>
                    <p className="text-2xl font-bold text-white">
                      {tickets.filter(t => {
                        const ticketDate = new Date(t.created_date);
                        return isAfter(ticketDate, subDays(new Date(), 7)) && t.status !== 'cancelled';
                      }).length}
                    </p>
                    <p className="text-xs text-cyan-400 mt-1">vendas</p>
                  </div>
                  <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Período anterior</p>
                    <p className="text-2xl font-bold text-white">
                      {tickets.filter(t => {
                        const ticketDate = new Date(t.created_date);
                        return isAfter(ticketDate, subDays(new Date(), 14)) && isBefore(ticketDate, subDays(new Date(), 7)) && t.status !== 'cancelled';
                      }).length}
                    </p>
                    <p className="text-xs text-purple-400 mt-1">vendas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Eventos com Performance */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance por Evento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {chartData.revenueByEvent.map((event, index) => (
                    <motion.div
                      key={event.fullName}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white">{event.fullName}</h3>
                        <Badge className={
                          event.ocupacao >= 80 
                            ? 'bg-green-600/20 border-green-500/30 text-green-300'
                            : event.ocupacao >= 50
                            ? 'bg-yellow-600/20 border-yellow-500/30 text-yellow-300'
                            : 'bg-red-600/20 border-red-500/30 text-red-300'
                        }>
                          {event.ocupacao}% ocupado
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400 mb-1">Receita</p>
                          <p className="font-bold text-green-400">R$ {event.receita.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Vendidos</p>
                          <p className="font-bold text-cyan-400">{event.ingressos}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Ocupação</p>
                          <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full"
                              style={{ width: `${Math.min(event.ocupacao, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendas */}
          <TabsContent value="sales" className="space-y-4 mt-4">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Evolução de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={chartData.last30Days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                    <YAxis yAxisId="left" stroke="#9ca3af" fontSize={11} />
                    <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="vendas" stroke="#06b6d4" strokeWidth={2} name="Vendas" />
                    <Line yAxisId="right" type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} name="Receita (R$)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Vendas por Tipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Vendas por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {chartData.ticketTypesData.map((type, index) => (
                      <div key={type.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-gray-300">{type.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">{type.vendas}</p>
                          <p className="text-xs text-gray-400">R$ {type.receita.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InsightCard
                    title="Tipo Mais Vendido"
                    value={chartData.ticketTypesData.length > 0 
                      ? chartData.ticketTypesData.sort((a, b) => b.vendas - a.vendas)[0].name 
                      : 'N/A'}
                    icon={Trophy}
                    color="text-yellow-400"
                  />
                  <InsightCard
                    title="Maior Receita"
                    value={chartData.ticketTypesData.length > 0
                      ? `R$ ${chartData.ticketTypesData.sort((a, b) => b.receita - a.receita)[0].receita.toFixed(2)}`
                      : 'R$ 0'}
                    icon={DollarSign}
                    color="text-green-400"
                  />
                  <InsightCard
                    title="Melhor Dia"
                    value={chartData.last30Days.length > 0
                      ? chartData.last30Days.sort((a, b) => b.vendas - a.vendas)[0].date
                      : 'N/A'}
                    icon={Calendar}
                    color="text-cyan-400"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance */}
          <TabsContent value="performance" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PerformanceCard
                title="Eventos Futuros"
                value={events.filter(e => isAfter(new Date(e.date), new Date())).length}
                total={events.length}
                icon={Calendar}
                color="cyan"
              />
              <PerformanceCard
                title="Com Ingressos Disponíveis"
                value={events.filter(e => {
                  const sold = tickets.filter(t => t.event_id === e.id && t.status !== 'cancelled').length;
                  return sold < (e.max_capacity || 0);
                }).length}
                total={events.length}
                icon={Ticket}
                color="purple"
              />
              <PerformanceCard
                title="Alta Performance (>70%)"
                value={chartData.revenueByEvent.filter(e => e.ocupacao >= 70).length}
                total={events.length}
                icon={TrendingUp}
                color="green"
              />
            </div>

            {/* Tabela Detalhada */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Análise Completa de Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left text-gray-400 text-sm py-3 px-2">Evento</th>
                        <th className="text-center text-gray-400 text-sm py-3 px-2">Data</th>
                        <th className="text-center text-gray-400 text-sm py-3 px-2">Vendidos</th>
                        <th className="text-center text-gray-400 text-sm py-3 px-2">Ocupação</th>
                        <th className="text-right text-gray-400 text-sm py-3 px-2">Receita</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.revenueByEvent.map((event, index) => (
                        <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/30">
                          <td className="py-3 px-2 text-white text-sm">{event.fullName}</td>
                          <td className="py-3 px-2 text-center text-gray-300 text-xs">
                            {events.find(e => e.title === event.fullName)?.date 
                              ? format(new Date(events.find(e => e.title === event.fullName).date), "dd/MM/yy", { locale: ptBR })
                              : '-'}
                          </td>
                          <td className="py-3 px-2 text-center text-cyan-400 font-semibold">{event.ingressos}</td>
                          <td className="py-3 px-2 text-center">
                            <Badge className={
                              event.ocupacao >= 80 
                                ? 'bg-green-600/20 text-green-300'
                                : event.ocupacao >= 50
                                ? 'bg-yellow-600/20 text-yellow-300'
                                : 'bg-red-600/20 text-red-300'
                            }>
                              {event.ocupacao}%
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-right text-green-400 font-bold">
                            R$ {event.receita.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Participantes */}
          <TabsContent value="attendees" className="space-y-4 mt-4">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Participantes ({metrics.totalSold})
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className="bg-green-600/20 border-green-500/30 text-green-300">
                      {tickets.filter(t => t.checked_in_at).length} Check-ins
                    </Badge>
                    <Badge className="bg-yellow-600/20 border-yellow-500/30 text-yellow-300">
                      {metrics.pendingRequests} Pendentes
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {tickets.filter(t => t.status === 'valid').map((ticket, index) => {
                    const event = events.find(e => e.id === ticket.event_id);
                    
                    return (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {ticket.attendee_info?.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm">
                              {ticket.attendee_info?.full_name || 'Participante'}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span>{ticket.ticket_type}</span>
                              <span>•</span>
                              <span>{event?.title || 'Evento'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={ticket.checked_in_at 
                            ? 'bg-green-600 text-white' 
                            : 'bg-yellow-600/20 border-yellow-500/30 text-yellow-300'
                          }>
                            {ticket.checked_in_at ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Check-in
                              </>
                            ) : (
                              'Pendente'
                            )}
                          </Badge>
                          <p className="text-xs text-gray-400 mt-1">
                            R$ {ticket.price.toFixed(2)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Engajamento */}
          <TabsContent value="engagement" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-red-900/30 to-gray-900 border-red-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Curtidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white mb-2">{metrics.totalLikes}</div>
                  <p className="text-sm text-gray-400">
                    Média: {(metrics.totalLikes / Math.max(events.length, 1)).toFixed(1)} por evento
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
                  <div className="text-4xl font-bold text-white mb-2">{metrics.totalComments}</div>
                  <p className="text-sm text-gray-400">
                    Média: {(metrics.totalComments / Math.max(events.length, 1)).toFixed(1)} por evento
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
                  <div className="text-4xl font-bold text-white mb-2">{metrics.engagement}</div>
                  <p className="text-sm text-gray-400">
                    Interações totais por evento
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
                  {interactions.comments.slice(0, 15).map((comment, index) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={`https://i.pravatar.cc/40?u=${comment.user_id}`}
                          alt="User"
                          className="w-10 h-10 rounded-full border-2 border-cyan-500/30"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white text-sm">{comment.user_name}</span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(comment.created_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm">{comment.content}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          onClose={() => {
            setShowOnboarding(false);
            localStorage.setItem('onboarding_completed', 'true');
          }}
        />
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, title, value, subtitle, trend, color, iconColor, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className={`bg-gradient-to-br ${color} relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">{title}</CardTitle>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white mb-1">{value}</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">{subtitle}</p>
            {trend !== undefined && (
              <Badge className={`${
                trend >= 0 
                  ? 'bg-green-600/20 border-green-500/30 text-green-300'
                  : 'bg-red-600/20 border-red-500/30 text-red-300'
              } text-xs`}>
                {trend >= 0 ? '+' : ''}{trend}%
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuickStat({ icon: Icon, label, value, color }) {
  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardContent className="p-4 text-center">
        <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        <div className="text-xs text-gray-400">{label}</div>
      </CardContent>
    </Card>
  );
}

function FinancialRow({ label, value, color }) {
  return (
    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
      <span className="text-gray-300 text-sm">{label}</span>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
  );
}

function InsightCard({ title, value, icon: Icon, color }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-gray-300 text-sm">{title}</span>
      </div>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}

function PerformanceCard({ title, value, total, icon: Icon, color }) {
  const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
  const colors = {
    cyan: { bg: 'from-cyan-900/30', border: 'border-cyan-700/50', text: 'text-cyan-400', bar: 'from-cyan-500 to-cyan-600' },
    purple: { bg: 'from-purple-900/30', border: 'border-purple-700/50', text: 'text-purple-400', bar: 'from-purple-500 to-purple-600' },
    green: { bg: 'from-green-900/30', border: 'border-green-700/50', text: 'text-green-400', bar: 'from-green-500 to-green-600' }
  };
  const config = colors[color];

  return (
    <Card className={`bg-gradient-to-br ${config.bg} to-gray-900 ${config.border} border`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Icon className={`w-8 h-8 ${config.text}`} />
          <Badge className="bg-black/30 text-white">{percentage}%</Badge>
        </div>
        <h3 className="text-sm text-gray-400 mb-2">{title}</h3>
        <div className="text-3xl font-bold text-white mb-3">
          {value}<span className="text-lg text-gray-500">/{total}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className={`bg-gradient-to-r ${config.bar} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const steps = [
    {
      title: "Bem-vindo ao Dashboard! 🎉",
      description: "Aqui você controla todos os seus eventos em um só lugar",
      icon: Crown,
      color: "text-yellow-400"
    },
    {
      title: "Crie seu Primeiro Evento 🎪",
      description: "Configure ingressos, local, data e comece a vender",
      icon: Calendar,
      color: "text-cyan-400",
      action: () => navigate(createPageUrl("CriarEvento"))
    },
    {
      title: "Acompanhe Vendas em Tempo Real 📊",
      description: "Veja métricas, receita e performance instantaneamente",
      icon: BarChart3,
      color: "text-purple-400"
    },
    {
      title: "Gerencie Participantes 👥",
      description: "Aprove solicitações, faça check-in e comunique-se",
      icon: Users,
      color: "text-pink-400"
    },
    {
      title: "Receba Alertas Inteligentes 🔔",
      description: "Notificações sobre vendas baixas, lotes esgotando e mais",
      icon: Bell,
      color: "text-green-400"
    }
  ];

  const currentStep = steps[step];
  const StepIcon = currentStep.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Card className="bg-gray-900 border-cyan-500/30">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <motion.div
                key={step}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center mx-auto mb-6"
              >
                <StepIcon className={`w-10 h-10 ${currentStep.color}`} />
              </motion.div>
              
              <motion.h2
                key={`title-${step}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-white mb-3"
              >
                {currentStep.title}
              </motion.h2>
              
              <motion.p
                key={`desc-${step}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-400"
              >
                {currentStep.description}
              </motion.p>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-8">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === step 
                      ? 'bg-cyan-400 w-8' 
                      : index < step 
                      ? 'bg-green-400' 
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              {step > 0 && (
                <Button
                  onClick={() => setStep(step - 1)}
                  variant="outline"
                  className="flex-1 border-gray-600"
                >
                  Voltar
                </Button>
              )}
              
              {step < steps.length - 1 ? (
                <Button
                  onClick={() => {
                    if (currentStep.action) {
                      currentStep.action();
                      onClose();
                    } else {
                      setStep(step + 1);
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600"
                >
                  {currentStep.action ? 'Começar Agora' : 'Próximo'}
                </Button>
              ) : (
                <Button
                  onClick={onClose}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                >
                  Começar!
                </Button>
              )}
            </div>

            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="w-full mt-4 text-gray-500 hover:text-gray-300"
            >
              Pular tutorial
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}