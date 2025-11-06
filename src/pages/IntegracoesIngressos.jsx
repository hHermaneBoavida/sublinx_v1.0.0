import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Ticket, Link2, CheckCircle, XCircle, RefreshCw, Plus,
  Settings, TrendingUp, AlertCircle, Zap, ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const platforms = [
  {
    id: "eventbrite",
    name: "Eventbrite",
    icon: "https://cdn.worldvectorlogo.com/logos/eventbrite-1.svg",
    color: "from-orange-500 to-red-500",
    description: "Plataforma global de eventos e ingressos"
  },
  {
    id: "ticketmaster",
    name: "Ticketmaster",
    icon: "https://cdn.worldvectorlogo.com/logos/ticketmaster-1.svg",
    color: "from-blue-500 to-cyan-500",
    description: "Líder mundial em ingressos de entretenimento"
  },
  {
    id: "sympla",
    name: "Sympla",
    icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8VPmYGxJ_5fqB0mxqzE3jC3rGqLqJzWqEiw&s",
    color: "from-purple-500 to-pink-500",
    description: "Maior plataforma de ingressos do Brasil"
  },
  {
    id: "shotgun",
    name: "Shotgun",
    icon: "https://shotgun.live/images/android-chrome-192x192.png",
    color: "from-yellow-500 to-orange-500",
    description: "Plataforma para eventos underground"
  }
];

export default function IntegracoesIngressos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [newIntegration, setNewIntegration] = useState({
    platform: "",
    api_key: "",
    api_secret: "",
    auto_sync: true,
    sync_interval: 300
  });

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

  // Buscar integrações existentes
  const { data: integrations = [] } = useQuery({
    queryKey: ['ticketIntegrations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.TicketPlatformIntegration.filter({ organizer_id: user.id });
    },
    enabled: !!user,
  });

  // Buscar tickets externos sincronizados
  const { data: externalTickets = [] } = useQuery({
    queryKey: ['externalTickets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Buscar eventos do organizador
      const events = await base44.entities.Event.filter({ organizer_id: user.id });
      const eventIds = events.map(e => e.id);
      
      if (eventIds.length === 0) return [];
      
      return await base44.entities.ExternalTicket.filter({ event_id: { $in: eventIds } });
    },
    enabled: !!user,
  });

  // Mutation para adicionar integração
  const addIntegrationMutation = useMutation({
    mutationFn: async (integration) => {
      return await base44.entities.TicketPlatformIntegration.create({
        ...integration,
        organizer_id: user.id,
        last_sync: new Date().toISOString(),
        sync_status: "pending"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ticketIntegrations']);
      setShowAddDialog(false);
      setNewIntegration({
        platform: "",
        api_key: "",
        api_secret: "",
        auto_sync: true,
        sync_interval: 300
      });
      alert("✅ Integração adicionada com sucesso!");
    },
  });

  // Mutation para sincronizar ingressos
  const syncMutation = useMutation({
    mutationFn: async (integration) => {
      // Simulação de sincronização com API externa
      // Em produção, isso chamaria a API real da plataforma
      
      const mockTickets = [
        {
          event_id: "mock_event_1",
          platform: integration.platform,
          external_event_id: `ext_${Math.random().toString(36).substr(2, 9)}`,
          external_ticket_id: `ticket_${Math.random().toString(36).substr(2, 9)}`,
          ticket_type: "Pista",
          price: 50.00,
          quantity_total: 100,
          quantity_sold: Math.floor(Math.random() * 50),
          quantity_available: 100 - Math.floor(Math.random() * 50),
          purchase_url: `https://${integration.platform}.com/event/12345`,
          status: "available",
          synced_at: new Date().toISOString()
        },
        {
          event_id: "mock_event_1",
          platform: integration.platform,
          external_event_id: `ext_${Math.random().toString(36).substr(2, 9)}`,
          external_ticket_id: `ticket_${Math.random().toString(36).substr(2, 9)}`,
          ticket_type: "VIP",
          price: 120.00,
          quantity_total: 30,
          quantity_sold: Math.floor(Math.random() * 20),
          quantity_available: 30 - Math.floor(Math.random() * 20),
          purchase_url: `https://${integration.platform}.com/event/12345/vip`,
          status: "available",
          synced_at: new Date().toISOString()
        }
      ];

      // Criar tickets no banco
      await Promise.all(mockTickets.map(ticket => 
        base44.entities.ExternalTicket.create(ticket)
      ));

      // Atualizar status da integração
      await base44.entities.TicketPlatformIntegration.update(integration.id, {
        last_sync: new Date().toISOString(),
        sync_status: "success",
        sync_error: null
      });

      return mockTickets.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries(['ticketIntegrations']);
      queryClient.invalidateQueries(['externalTickets']);
      alert(`✅ Sincronização concluída! ${count} ingressos atualizados.`);
    },
    onError: async (error, integration) => {
      // Atualizar status de erro
      await base44.entities.TicketPlatformIntegration.update(integration.id, {
        sync_status: "error",
        sync_error: error.message
      });
      alert("❌ Erro na sincronização. Verifique suas credenciais.");
    }
  });

  // Mutation para toggle ativo/inativo
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }) => {
      return await base44.entities.TicketPlatformIntegration.update(id, { is_active: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ticketIntegrations']);
    },
  });

  const handleAddIntegration = () => {
    if (!newIntegration.platform || !newIntegration.api_key) {
      alert("❌ Preencha todos os campos obrigatórios!");
      return;
    }

    addIntegrationMutation.mutate(newIntegration);
  };

  const handleSync = (integration) => {
    syncMutation.mutate(integration);
  };

  const totalTicketsSold = externalTickets.reduce((sum, t) => sum + (t.quantity_sold || 0), 0);
  const totalRevenue = externalTickets.reduce((sum, t) => sum + ((t.price || 0) * (t.quantity_sold || 0)), 0);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text mb-2">
              <Link2 className="w-8 h-8" />
              Integrações de Ingressos
            </h1>
            <p className="text-gray-400">
              Conecte suas plataformas de ingressos e sincronize vendas em tempo real
            </p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Integração
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Integrações Ativas
            </CardTitle>
            <Zap className="w-4 h-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {integrations.filter(i => i.is_active).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              de {integrations.length} total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Ingressos Vendidos
            </CardTitle>
            <Ticket className="w-4 h-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {totalTicketsSold}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Via plataformas externas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Receita Total
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              R$ {totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Sincronizado automaticamente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Integrações Existentes */}
      <div className="space-y-4 mb-8">
        <h2 className="text-xl font-bold text-white">Minhas Integrações</h2>
        
        {integrations.length > 0 ? (
          integrations.map((integration) => {
            const platform = platforms.find(p => p.id === integration.platform);
            const ticketsForPlatform = externalTickets.filter(t => t.platform === integration.platform);
            const soldCount = ticketsForPlatform.reduce((sum, t) => sum + (t.quantity_sold || 0), 0);
            
            return (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${platform?.color} flex items-center justify-center`}>
                          <Ticket className="w-8 h-8 text-white" />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-white">
                              {platform?.name}
                            </h3>
                            <Badge className={
                              integration.is_active 
                                ? "bg-green-600" 
                                : "bg-gray-600"
                            }>
                              {integration.is_active ? "Ativa" : "Inativa"}
                            </Badge>
                            {integration.sync_status === "success" && (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            )}
                            {integration.sync_status === "error" && (
                              <AlertCircle className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-400 mb-2">
                            {platform?.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              📊 {soldCount} ingressos vendidos
                            </span>
                            <span>
                              🕐 Última sincronização: {integration.last_sync ? format(new Date(integration.last_sync), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "Nunca"}
                            </span>
                            {integration.auto_sync && (
                              <Badge variant="outline" className="border-cyan-500/30 text-cyan-300">
                                Auto-sync ativo
                              </Badge>
                            )}
                          </div>

                          {integration.sync_error && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
                              <AlertCircle className="w-3 h-3" />
                              <span>{integration.sync_error}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSync(integration)}
                          disabled={syncMutation.isPending || !integration.is_active}
                          className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/20"
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                          Sincronizar
                        </Button>

                        <Switch
                          checked={integration.is_active}
                          onCheckedChange={() => toggleActiveMutation.mutate({
                            id: integration.id,
                            isActive: integration.is_active
                          })}
                        />
                      </div>
                    </div>

                    {/* Tickets desta integração */}
                    {ticketsForPlatform.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">
                          Ingressos Sincronizados
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {ticketsForPlatform.slice(0, 4).map((ticket) => (
                            <div key={ticket.id} className="bg-gray-800/30 rounded-lg p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold text-white text-sm">
                                    {ticket.ticket_type}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    R$ {ticket.price.toFixed(2)}
                                  </p>
                                </div>
                                <Badge className={
                                  ticket.status === "available" ? "bg-green-600" : "bg-red-600"
                                }>
                                  {ticket.status === "available" ? "Disponível" : "Esgotado"}
                                </Badge>
                              </div>
                              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                                <span>
                                  {ticket.quantity_sold} / {ticket.quantity_total} vendidos
                                </span>
                                {ticket.purchase_url && (
                                  <a 
                                    href={ticket.purchase_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-400 hover:underline flex items-center gap-1"
                                  >
                                    Comprar
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-12 text-center">
              <Link2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                Nenhuma integração configurada
              </h3>
              <p className="text-gray-500 mb-6">
                Conecte suas plataformas de ingressos para sincronizar vendas automaticamente
              </p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-gradient-to-r from-cyan-600 to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeira Integração
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Adicionar Integração */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-gray-900 border-purple-500 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Plus className="w-6 h-6 text-cyan-400" />
              Nova Integração de Ingressos
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Conecte sua conta de uma plataforma de ingressos para sincronizar vendas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Seleção de Plataforma */}
            <div>
              <Label className="text-gray-300 mb-3 block">Escolha a Plataforma</Label>
              <div className="grid grid-cols-2 gap-3">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => setNewIntegration({ ...newIntegration, platform: platform.id })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      newIntegration.platform === platform.id
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center mx-auto mb-2`}>
                      <Ticket className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-semibold text-white text-sm">{platform.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{platform.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Configurações */}
            {newIntegration.platform && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-gray-300">API Key *</Label>
                  <Input
                    type="password"
                    value={newIntegration.api_key}
                    onChange={(e) => setNewIntegration({ ...newIntegration, api_key: e.target.value })}
                    placeholder="Sua chave de API"
                    className="bg-gray-800 border-gray-600 text-white mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Encontre sua API Key no painel da plataforma
                  </p>
                </div>

                <div>
                  <Label className="text-gray-300">API Secret</Label>
                  <Input
                    type="password"
                    value={newIntegration.api_secret}
                    onChange={(e) => setNewIntegration({ ...newIntegration, api_secret: e.target.value })}
                    placeholder="Seu secret (opcional)"
                    className="bg-gray-800 border-gray-600 text-white mt-1"
                  />
                </div>

                <div className="flex items-center justify-between bg-gray-800/30 p-4 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">Sincronização Automática</p>
                    <p className="text-xs text-gray-400">
                      Atualizar vendas a cada {newIntegration.sync_interval / 60} minutos
                    </p>
                  </div>
                  <Switch
                    checked={newIntegration.auto_sync}
                    onCheckedChange={(checked) => setNewIntegration({ ...newIntegration, auto_sync: checked })}
                  />
                </div>

                {newIntegration.auto_sync && (
                  <div>
                    <Label className="text-gray-300">Intervalo de Sincronização (minutos)</Label>
                    <Select
                      value={newIntegration.sync_interval.toString()}
                      onValueChange={(value) => setNewIntegration({ ...newIntegration, sync_interval: parseInt(value) })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="300">5 minutos</SelectItem>
                        <SelectItem value="600">10 minutos</SelectItem>
                        <SelectItem value="900">15 minutos</SelectItem>
                        <SelectItem value="1800">30 minutos</SelectItem>
                        <SelectItem value="3600">1 hora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-cyan-300 mb-1">
                        Como obter suas credenciais
                      </p>
                      <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
                        <li>Acesse o painel de desenvolvedor da {platforms.find(p => p.id === newIntegration.platform)?.name}</li>
                        <li>Navegue até "API" ou "Integrações"</li>
                        <li>Gere uma nova chave de API com permissões de leitura</li>
                        <li>Cole as credenciais aqui no Sublinx</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              className="flex-1 border-gray-600 text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddIntegration}
              disabled={!newIntegration.platform || !newIntegration.api_key || addIntegrationMutation.isPending}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600"
            >
              {addIntegrationMutation.isPending ? "Conectando..." : "Conectar Integração"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}