
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  DollarSign,
  Clock,
  RefreshCw,
  Download,
  Settings,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DashboardOrganizador() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [syncingEvents, setSyncingEvents] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      if (!userData?.is_organizer) {
        navigate(createPageUrl("Planos")); // Redirect to Plans if not an organizer
      }
      return userData;
    },
    retry: false, // Do not retry if user is not found or not an organizer
    onError: (error) => {
        console.error("Failed to fetch user or not authorized:", error);
        navigate(createPageUrl("BemVindo")); // Redirect to Welcome if auth fails
    },
  });

  const { data: myEvents = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['organizerEvents', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Fetch up to 100 events, ordered by date descending
      const events = await base44.entities.Event.filter({ organizer_id: user.id }, '-date', 100);
      return events || [];
    },
    enabled: !!user?.id,
  });

  const { data: eventRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['organizerRequests', user?.id, myEvents], // Depend on myEvents to ensure they're loaded
    queryFn: async () => {
      if (!user?.id || myEvents.length === 0) return [];
      const eventIds = myEvents.map(e => e.id);
      
      const requests = await base44.entities.EventRequest.filter(
        { event_id: { $in: eventIds } },
        '-created_date', // Order by creation date descending
        100 // Limit to 100 requests
      );
      return requests || [];
    },
    enabled: !!user?.id && myEvents.length > 0, // Only enabled if user and events are available
  });

  // NOVO: Mutation para sincronizar eventos externos
  const syncExternalEventsMutation = useMutation({
    mutationFn: async (city) => {
      const response = await base44.functions.invoke('syncExternalEvents', { 
        city: city || 'São Paulo', // Default city if not provided
        force: true // Force sync, can be made optional
      });
      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ Sincronização concluída:', data);
      setSyncResult(data);
      // Invalidate queries to refetch updated event lists
      queryClient.invalidateQueries({ queryKey: ['organizerEvents'] });
      queryClient.invalidateQueries({ queryKey: ['mapEvents'] }); // Assuming a mapEvents query also exists
      setSyncingEvents(false);
    },
    onError: (error) => {
      console.error('❌ Erro na sincronização:', error);
      setSyncResult({
        success: false,
        error: error.message || 'Unknown error during sync.'
      });
      setSyncingEvents(false);
    }
  });

  const handleSyncEvents = async () => {
    setSyncingEvents(true);
    setSyncResult(null); // Clear previous result
    syncExternalEventsMutation.mutate('São Paulo'); // You might want to allow the user to select a city
  };

  // Cálculos de métricas
  const upcomingEvents = myEvents.filter(e => new Date(e.date) > new Date());
  const totalAttendees = myEvents.reduce((sum, e) => sum + (e.current_attendees || 0), 0);
  // Estimated revenue based on current attendees and event price (assuming each attendee pays event price)
  const totalRevenue = myEvents.reduce((sum, e) => sum + ((e.current_attendees || 0) * (e.price || 0)), 0);
  const pendingRequests = eventRequests.filter(r => r.status === 'pending').length;

  if (loadingUser) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  // If user is null after loading and not redirected, something went wrong or is still loading.
  // This check covers cases where navigation might not happen immediately or data is truly missing.
  if (!user) {
    return null; // Or a more specific loading/error state if needed
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text mb-2">
          Dashboard do Organizador
        </h1>
        <p className="text-gray-400">
          Bem-vindo, {user.full_name || user.email}! Gerencie seus eventos e solicitações.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gray-900/50 border-cyan-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Eventos Ativos</CardTitle>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{upcomingEvents.length}</div>
            <p className="text-xs text-gray-500">Próximos eventos</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-purple-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total de Participantes</CardTitle>
            <Users className="w-4 h-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalAttendees}</div>
            <p className="text-xs text-gray-500">Em todos os seus eventos</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-green-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Receita Total</CardTitle>
            <DollarSign className="w-4 h-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">R$ {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-gray-500">Estimado (capacidade * preço)</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-yellow-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Solicitações Pendentes</CardTitle>
            <Clock className="w-4 h-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pendingRequests}</div>
            <p className="text-xs text-gray-500">Aguardando aprovação</p>
          </CardContent>
        </Card>
      </div>

      {/* NOVO: Card de Sincronização de Eventos Externos */}
      <Card className="bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border-cyan-500/30 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-300">
            <ExternalLink className="w-5 h-5" />
            Sincronizar Eventos Externos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Importe eventos de plataformas externas como Eventbrite, JamBase, AllEvents e OpenWebNinja diretamente para o SUBLINX.
            </p>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSyncEvents}
                disabled={syncingEvents}
                className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
              >
                {syncingEvents ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Sincronizar Eventos
                  </>
                )}
              </Button>
              
              {syncResult && (
                <Badge 
                  variant={syncResult.success ? "default" : "destructive"}
                  className={syncResult.success ? "bg-green-600" : "bg-red-600"}
                >
                  {syncResult.success ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {syncResult.stats?.successfully_inserted || 0} eventos importados
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Erro: {syncResult.error}
                    </>
                  )}
                </Badge>
              )}
            </div>

            {syncResult?.success && (
              <div className="p-4 bg-black/50 rounded-lg border border-cyan-500/30">
                <h4 className="text-sm font-semibold text-cyan-300 mb-2">Resultado da Sincronização</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500">Total Encontrado</p>
                    <p className="text-white font-semibold">{syncResult.stats.total_found}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Únicos</p>
                    <p className="text-white font-semibold">{syncResult.stats.unique_after_deduplication}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Válidos</p>
                    <p className="text-white font-semibold">{syncResult.stats.valid_after_validation}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Importados</p>
                    <p className="text-green-400 font-semibold">{syncResult.stats.successfully_inserted}</p>
                  </div>
                </div>

                {syncResult.sources && Object.keys(syncResult.sources).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-500 mb-2">Fontes:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(syncResult.sources).map(([source, count]) => (
                        <Badge key={source} variant="outline" className="text-xs border-gray-600 text-gray-300">
                          {source}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-start gap-2 text-xs text-gray-500">
              <Settings className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Configure suas chaves de API em <strong>Configurações {'>'} Integrações</strong> para habilitar todas as fontes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eventos Ativos */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Próximos Eventos</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(createPageUrl("MeusEventos"))}
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              Ver Todos
            </Button>
          </CardHeader>
          <CardContent>
            {loadingEvents ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500 mx-auto"></div>
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 5).map(event => (
                  <div
                    key={event.id}
                    className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-cyan-500/30 transition-all cursor-pointer"
                    onClick={() => navigate(createPageUrl(`EditarEvento?id=${event.id}`))}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">{event.title}</h4>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(event.date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.current_attendees || 0}/{event.max_capacity || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">
                        {event.genre}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">Nenhum evento próximo</p>
                <Button
                  onClick={() => navigate(createPageUrl("CriarEvento"))}
                  className="bg-gradient-to-r from-cyan-600 to-purple-600"
                >
                  Criar Evento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Solicitações Pendentes */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Solicitações Recentes</CardTitle>
            <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-400">
              {pendingRequests} Pendentes
            </Badge>
          </CardHeader>
          <CardContent>
            {loadingRequests ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500 mx-auto"></div>
              </div>
            ) : eventRequests.length > 0 ? (
              <div className="space-y-3">
                {eventRequests.slice(0, 5).map(request => {
                  const event = myEvents.find(e => e.id === request.event_id);
                  return (
                    <div
                      key={request.id}
                      className="p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white text-sm">{event?.title || 'Evento Desconhecido'}</h4>
                          <p className="text-xs text-gray-400 mt-1">
                            Solicitado por: {request.applicant_data?.full_name || 'Usuário'}
                          </p>
                        </div>
                        <Badge
                          variant={
                            request.status === 'approved' ? 'default' :
                            request.status === 'denied' ? 'destructive' : 'secondary'
                          }
                          className={
                            request.status === 'approved' ? 'bg-green-600/40 text-green-300' :
                            request.status === 'denied' ? 'bg-red-600/40 text-red-300' : 'bg-yellow-600/40 text-yellow-300'
                          }
                        >
                          {request.status === 'approved' ? 'Aprovado' :
                           request.status === 'denied' ? 'Negado' : 'Pendente'}
                        </Badge>
                      </div>
                      {request.message && (
                        <p className="text-xs text-gray-500 line-clamp-2">{request.message}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Nenhuma solicitação ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
