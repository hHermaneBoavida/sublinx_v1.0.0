import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Users, DollarSign, Eye, Heart, MessageCircle, Clock,
  Calendar, Target, Award, ArrowLeft, Download, TrendingDown, ArrowUp
} from "lucide-react";
import { format, subDays, startOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export default function AnalyticsOrganizador() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      if (!userData?.is_organizer) {
        navigate(createPageUrl("Planos"));
        return null;
      }
      return userData;
    },
    staleTime: Infinity,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['myEvents', user?.id],
    queryFn: async () => await base44.entities.Event.filter({ organizer_id: user.id }, "-date", 100),
    enabled: !!user,
    staleTime: 120000,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['allTickets', events],
    queryFn: async () => {
      const eventIds = events.map(e => e.id);
      if (eventIds.length === 0) return [];
      return await base44.entities.Ticket.filter({ event_id: { $in: eventIds } });
    },
    enabled: events.length > 0,
    staleTime: 60000,
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions', events],
    queryFn: async () => {
      const eventIds = events.map(e => e.id);
      if (eventIds.length === 0) return [];
      const [likes, comments] = await Promise.all([
        base44.entities.Like.filter({ event_id: { $in: eventIds } }),
        base44.entities.Comment.filter({ event_id: { $in: eventIds } })
      ]);
      return { likes, comments };
    },
    enabled: events.length > 0,
    staleTime: 60000,
  });

  const analytics = useMemo(() => {
    // Revenue Over Time (Last 30 days)
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 30),
      end: new Date()
    });

    const revenueByDay = last30Days.map(day => {
      const dayTickets = tickets.filter(t => {
        const ticketDate = new Date(t.created_date);
        return ticketDate.toDateString() === day.toDateString();
      });
      const revenue = dayTickets.reduce((sum, t) => sum + (t.price || 0), 0);
      return {
        date: format(day, "dd/MM", { locale: ptBR }),
        receita: revenue,
        vendas: dayTickets.length
      };
    });

    // Events Performance
    const eventPerformance = events.map(event => {
      const eventTickets = tickets.filter(t => t.event_id === event.id);
      const eventLikes = interactions.likes?.filter(l => l.event_id === event.id).length || 0;
      const eventComments = interactions.comments?.filter(c => c.event_id === event.id).length || 0;
      const revenue = eventTickets.reduce((sum, t) => sum + (t.price || 0), 0);
      const occupancy = event.max_capacity > 0 ? (eventTickets.length / event.max_capacity) * 100 : 0;
      
      return {
        name: event.title,
        vendas: eventTickets.length,
        receita: revenue,
        likes: eventLikes,
        comentarios: eventComments,
        ocupacao: occupancy,
        engajamento: eventLikes + eventComments
      };
    }).sort((a, b) => b.receita - a.receita).slice(0, 10);

    // Genre Distribution
    const genreData = events.reduce((acc, event) => {
      const genre = event.genre || 'outros';
      if (!acc[genre]) acc[genre] = 0;
      acc[genre]++;
      return acc;
    }, {});

    const genreChart = Object.entries(genreData).map(([genre, count]) => ({
      name: genre,
      eventos: count
    }));

    // Engagement Metrics
    const totalLikes = interactions.likes?.length || 0;
    const totalComments = interactions.comments?.length || 0;
    const totalRevenue = tickets.reduce((sum, t) => sum + (t.price || 0), 0);
    const totalTicketsSold = tickets.length;
    const avgTicketPrice = totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0;

    // Growth Rate (compare last 7 vs previous 7 days)
    const last7Days = tickets.filter(t => {
      const diff = (new Date() - new Date(t.created_date)) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    });
    const prev7Days = tickets.filter(t => {
      const diff = (new Date() - new Date(t.created_date)) / (1000 * 60 * 60 * 24);
      return diff > 7 && diff <= 14;
    });
    
    const revenueGrowth = prev7Days.length > 0
      ? ((last7Days.length - prev7Days.length) / prev7Days.length) * 100
      : 0;

    return {
      revenueByDay,
      eventPerformance,
      genreChart,
      totalLikes,
      totalComments,
      totalRevenue,
      totalTicketsSold,
      avgTicketPrice,
      revenueGrowth
    };
  }, [events, tickets, interactions]);

  if (!user) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-cyan-500" />
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
          className="mb-6"
        >
          <Button
            onClick={() => navigate(createPageUrl("DashboardOrganizador"))}
            variant="ghost"
            size="sm"
            className="mb-4 text-gray-400"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                Analytics Avançado
              </h1>
              <p className="text-gray-400">Análise completa do desempenho dos seus eventos</p>
            </div>
            <Button variant="outline" className="border-cyan-500/30 text-cyan-400">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            icon={DollarSign}
            title="Receita Total"
            value={`R$ ${analytics.totalRevenue.toFixed(2)}`}
            subtitle={`Ticket médio: R$ ${analytics.avgTicketPrice.toFixed(2)}`}
            trend={analytics.revenueGrowth}
            color="from-green-900/30 to-gray-900"
            iconColor="text-green-400"
          />
          <KPICard
            icon={Users}
            title="Ingressos Vendidos"
            value={analytics.totalTicketsSold}
            subtitle={`${events.length} eventos`}
            color="from-blue-900/30 to-gray-900"
            iconColor="text-blue-400"
          />
          <KPICard
            icon={Heart}
            title="Total de Likes"
            value={analytics.totalLikes}
            subtitle={`${(analytics.totalLikes / events.length).toFixed(1)} por evento`}
            color="from-pink-900/30 to-gray-900"
            iconColor="text-pink-400"
          />
          <KPICard
            icon={MessageCircle}
            title="Comentários"
            value={analytics.totalComments}
            subtitle={`${(analytics.totalComments / events.length).toFixed(1)} por evento`}
            color="from-purple-900/30 to-gray-900"
            iconColor="text-purple-400"
          />
        </div>

        {/* Charts */}
        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900/80 border border-gray-700">
            <TabsTrigger value="revenue">Receita</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4 mt-4">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  Receita e Vendas - Últimos 30 Dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.revenueByDay}>
                    <defs>
                      <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                    <YAxis stroke="#9ca3af" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="receita" stroke="#06b6d4" fillOpacity={1} fill="url(#colorReceita)" />
                    <Area type="monotone" dataKey="vendas" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorVendas)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Top 10 Eventos - Receita</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.eventPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="#9ca3af" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      />
                      <Bar dataKey="receita" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Engajamento por Evento</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.eventPerformance.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                      <YAxis stroke="#9ca3af" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Bar dataKey="likes" fill="#ec4899" />
                      <Bar dataKey="comentarios" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4 mt-4">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Distribuição por Gênero Musical</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.genreChart}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      dataKey="eventos"
                    >
                      {analytics.genreChart.map((entry, index) => (
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, title, value, subtitle, trend, color, iconColor }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`bg-gradient-to-br ${color} border-gray-700 relative overflow-hidden`}>
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
              <Badge className={`${trend >= 0 ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'} text-xs`}>
                {trend >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(trend).toFixed(1)}%
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}