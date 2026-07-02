import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Users, DollarSign, Calendar, MessageSquare, Target, Eye, 
  Clock, Ticket, BarChart3, Heart, AlertTriangle, TrendingDown,
  Zap, Crown, Bell, X, CheckCircle, ArrowUpRight, ArrowDownRight, Percent,
  Download, FileText, Settings as SettingsIcon
} from "lucide-react";
import { format, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { CACHE_CONFIG } from "../components/shared/optimizations";

const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

// DEFAULT THRESHOLDS
const DEFAULT_THRESHOLDS = {
  lowSalesOccupancy: 30,
  lowSalesDaysUntil: 7,
  nearSoldOutOccupancy: 85,
  highPendingRequests: 5
};

export default function DashboardOrganizador() {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [thresholds, setThresholds] = useState(() => {
    const saved = localStorage.getItem('dashboard_thresholds');
    return saved ? JSON.parse(saved) : DEFAULT_THRESHOLDS;
  });

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const userData = await base44.auth.me();
        if (!userData?.is_organizer) {
          navigate(createPageUrl("Planos"));
          return null;
        }
        return userData;
      } catch (error) {
        navigate(createPageUrl("BemVindo"));
        return null;
      }
    },
    retry: false,
    ...CACHE_CONFIG.STATIC,
  });

  // SSR: Fetch dashboard metrics from backend function
  const { data: dashboardData, isLoading: loadingMetrics } = useQuery({
    queryKey: ['dashboardMetrics', user?.id],
    queryFn: async () => {
      const response = await base44.functions.invoke('getDashboardMetrics');
      return response.data;
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const metrics = dashboardData?.metrics || {};
  const chartData = dashboardData?.charts || {};
  const { events = [], tickets = [], requests = [], comments = [] } = dashboardData?.rawData || {};

  React.useEffect(() => {
    if (user && events.length === 0 && !localStorage.getItem('onboarding_completed')) {
      setShowOnboarding(true);
    }
  }, [user, events.length]);

  // CONFIGURABLE ALERTS
  const alerts = useMemo(() => {
    const alertList = [];
    
    events.forEach(event => {
      const eventTickets = tickets.filter(t => t.event_id === event.id && t.status !== 'cancelled');
      const sold = eventTickets.length;
      const capacity = event.max_capacity || 0;
      const occupancy = capacity > 0 ? (sold / capacity) * 100 : 0;
      const daysUntil = Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24));

      // Near Sold Out Alert
      if (occupancy >= thresholds.nearSoldOutOccupancy && occupancy < 100) {
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

      // Low Sales Alert
      if (daysUntil <= thresholds.lowSalesDaysUntil && daysUntil > 0 && occupancy < thresholds.lowSalesOccupancy) {
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

      // High Pending Requests Alert
      const eventPending = requests.filter(r => r.event_id === event.id && r.status === 'pending');
      if (eventPending.length >= thresholds.highPendingRequests) {
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
  }, [events, tickets, requests, dismissedAlerts, thresholds, navigate]);

  const handleExportReport = async (reportType) => {
    try {
      const response = await base44.functions.invoke('exportDashboardReport', { reportType });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${reportType}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar relatório');
    }
  };

  const handleSaveThresholds = () => {
    localStorage.setItem('dashboard_thresholds', JSON.stringify(thresholds));
    setShowSettings(false);
    alert('Configurações salvas!');
  };

  if (loadingUser || loadingMetrics) {
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

  if (!user) return null;

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
          <div className="flex flex-row gap-2 flex-wrap justify-end">
            <Button
              onClick={() => navigate(createPageUrl("AnalyticsOrganizador"))}
              variant="outline"
              size="sm"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/20 whitespace-nowrap"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button
              onClick={() => setShowSettings(true)}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-400 hover:bg-gray-900 whitespace-nowrap"
            >
              <SettingsIcon className="w-4 h-4 mr-2" />
              Alertas
            </Button>
            <Button
              onClick={() => setShowOnboarding(true)}
              variant="outline"
              size="sm"
              className="border-purple-500/30 text-purple-400 hover:bg-purple-900/20 whitespace-nowrap"
            >
              <Zap className="w-4 h-4 mr-2" />
              Tutorial
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("CriarEvento"))}
              className="bg-gradient-to-r from-cyan-600 to-purple-600 whitespace-nowrap"
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
            value={`R$ ${(metrics.totalRevenue || 0).toFixed(2)}`}
            subtitle={`Ticket médio: R$ ${(metrics.avgPrice || 0).toFixed(2)}`}
            trend={chartData.revenueGrowth}
            color="from-green-900/30 to-gray-900 border-green-700/50"
            iconColor="text-green-400"
            delay={0.1}
          />
          
          <MetricCard
            icon={Ticket}
            title="Ingressos Vendidos"
            value={metrics.totalSold || 0}
            subtitle={`De ${metrics.totalCapacity || 0} vagas totais`}
            color="from-blue-900/30 to-gray-900 border-blue-700/50"
            iconColor="text-blue-400"
            delay={0.2}
          />
          
          <MetricCard
            icon={Percent}
            title="Taxa de Ocupação"
            value={`${metrics.occupancyRate || 0}%`}
            subtitle={`${metrics.totalSold || 0}/${metrics.totalCapacity || 0} vendidos`}
            color="from-purple-900/30 to-gray-900 border-purple-700/50"
            iconColor="text-purple-400"
            delay={0.3}
          />
          
          <MetricCard
            icon={TrendingUp}
            title="Engajamento"
            value={metrics.engagement || 0}
            subtitle={`${metrics.totalLikes || 0} likes • ${metrics.totalComments || 0} comments`}
            color="from-pink-900/30 to-gray-900 border-pink-700/50"
            iconColor="text-pink-400"
            delay={0.4}
          />
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            onClick={() => handleExportReport('sales')}
            variant="outline"
            size="sm"
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Vendas CSV
          </Button>
          <Button
            onClick={() => handleExportReport('attendees')}
            variant="outline"
            size="sm"
            className="border-purple-500/30 text-purple-400 hover:bg-purple-900/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Participantes CSV
          </Button>
          <Button
            onClick={() => handleExportReport('events')}
            variant="outline"
            size="sm"
            className="border-green-500/30 text-green-400 hover:bg-green-900/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Eventos CSV
          </Button>
        </div>

        {/* Charts */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900/80 border border-gray-700">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    Top Eventos por Receita
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.revenueByEvent?.slice(0, 5) || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                      <YAxis stroke="#9ca3af" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
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

              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Vendas - Últimos 30 Dias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData.last30Days || []}>
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
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4 mt-4">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Distribuição por Tipo de Ingresso</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.ticketTypesData || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      dataKey="vendas"
                    >
                      {(chartData.ticketTypesData || []).map((entry, index) => (
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

          <TabsContent value="insights" className="space-y-4 mt-4">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Crescimento Semanal
                  </span>
                  <Badge className={`${
                    (chartData.revenueGrowth || 0) >= 0 
                      ? 'bg-green-600/20 border-green-500/30 text-green-300'
                      : 'bg-red-600/20 border-red-500/30 text-red-300'
                  }`}>
                    {(chartData.revenueGrowth || 0) >= 0 ? (
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                    )}
                    {Math.abs(chartData.revenueGrowth || 0).toFixed(1)}%
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          thresholds={thresholds}
          setThresholds={setThresholds}
          onSave={handleSaveThresholds}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showOnboarding && (
        <OnboardingModal onClose={() => {
          setShowOnboarding(false);
          localStorage.setItem('onboarding_completed', 'true');
        }} />
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
              <Badge className={`${trend >= 0 ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'} text-xs`}>
                {trend >= 0 ? '+' : ''}{trend}%
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SettingsModal({ thresholds, setThresholds, onSave, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md">
        <Card className="bg-gray-900 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Configurar Alertas</span>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Ocupação para alerta de baixa venda: <span className="text-white font-bold">{thresholds.lowSalesOccupancy}%</span>
              </label>
              <Slider
                value={[thresholds.lowSalesOccupancy]}
                onValueChange={([val]) => setThresholds(prev => ({ ...prev, lowSalesOccupancy: val }))}
                min={10}
                max={50}
                step={5}
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Dias antes do evento para alerta: <span className="text-white font-bold">{thresholds.lowSalesDaysUntil}</span>
              </label>
              <Slider
                value={[thresholds.lowSalesDaysUntil]}
                onValueChange={([val]) => setThresholds(prev => ({ ...prev, lowSalesDaysUntil: val }))}
                min={3}
                max={14}
                step={1}
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Ocupação para alerta de esgotamento: <span className="text-white font-bold">{thresholds.nearSoldOutOccupancy}%</span>
              </label>
              <Slider
                value={[thresholds.nearSoldOutOccupancy]}
                onValueChange={([val]) => setThresholds(prev => ({ ...prev, nearSoldOutOccupancy: val }))}
                min={70}
                max={95}
                step={5}
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Solicitações pendentes para alerta: <span className="text-white font-bold">{thresholds.highPendingRequests}</span>
              </label>
              <Slider
                value={[thresholds.highPendingRequests]}
                onValueChange={([val]) => setThresholds(prev => ({ ...prev, highPendingRequests: val }))}
                min={3}
                max={20}
                step={1}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setThresholds(DEFAULT_THRESHOLDS)} variant="outline" className="flex-1 border-gray-600">
                Resetar
              </Button>
              <Button onClick={onSave} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const steps = [
    { title: "Bem-vindo! 🎉", description: "Dashboard com métricas em tempo real", icon: Crown, color: "text-yellow-400" },
    { title: "Crie Eventos 🎪", description: "Configure e publique seus eventos", icon: Calendar, color: "text-cyan-400", action: () => navigate(createPageUrl("CriarEvento")) },
    { title: "Alertas Inteligentes 🔔", description: "Configure thresholds personalizados", icon: Bell, color: "text-green-400" },
    { title: "Exporte Relatórios 📊", description: "Baixe dados em CSV", icon: FileText, color: "text-purple-400" }
  ];

  const currentStep = steps[step];
  const StepIcon = currentStep.icon;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-lg">
        <Card className="bg-gray-900 border-cyan-500/30">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <motion.div key={step} initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center mx-auto mb-6">
                <StepIcon className={`w-10 h-10 ${currentStep.color}`} />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-3">{currentStep.title}</h2>
              <p className="text-gray-400">{currentStep.description}</p>
            </div>

            <div className="flex justify-center gap-2 mb-8">
              {steps.map((_, index) => (
                <div key={index} className={`w-2 h-2 rounded-full transition-all ${index === step ? 'bg-cyan-400 w-8' : index < step ? 'bg-green-400' : 'bg-gray-600'}`} />
              ))}
            </div>

            <div className="flex gap-3">
              {step > 0 && <Button onClick={() => setStep(step - 1)} variant="outline" className="flex-1">Voltar</Button>}
              {step < steps.length - 1 ? (
                <Button onClick={() => currentStep.action ? (currentStep.action(), onClose()) : setStep(step + 1)} className="flex-1 bg-cyan-600">
                  {currentStep.action ? 'Começar' : 'Próximo'}
                </Button>
              ) : (
                <Button onClick={onClose} className="flex-1 bg-green-600">Começar!</Button>
              )}
            </div>
            <Button onClick={onClose} variant="ghost" size="sm" className="w-full mt-4 text-gray-500">Pular</Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}