import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, Activity, Database, Zap, Globe } from 'lucide-react';
import { API_SOURCES } from '@/lib/aggregation';

const STAT_CARDS = [
  { key: 'total', label: 'Total de Eventos', icon: Database, iconClass: 'text-cyan-400' },
  { key: 'published', label: 'Publicados', icon: CheckCircle, iconClass: 'text-green-400' },
  { key: 'pending', label: 'Aguardando', icon: AlertTriangle, iconClass: 'text-yellow-400' },
  { key: 'duplicates', label: 'Duplicados', icon: Activity, iconClass: 'text-purple-400' },
];

export default function SyncDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');

  const { data: events, isLoading } = useQuery({
    queryKey: ['sync-dashboard-events'],
    queryFn: async () => {
      return await base44.entities.Event.list('-created_date', 500);
    },
  });

  const { data: logs } = useQuery({
    queryKey: ['sync-logs'],
    queryFn: async () => {
      return await base44.entities.SyncLog.list('-created_date', 20);
    },
  });

  const { data: organizers } = useQuery({
    queryKey: ['external-organizers'],
    queryFn: async () => {
      return await base44.entities.ExternalOrganizer.list('-created_date', 100);
    },
  });

  const stats = useMemo(() => {
    if (!events) return { total: 0, published: 0, pending: 0, duplicates: 0 };
    return {
      total: events.length,
      published: events.filter(e => e.is_published).length,
      pending: events.filter(e => !e.is_published && !e.is_expired).length,
      duplicates: 0,
    };
  }, [events]);

  const sourceBreakdown = useMemo(() => {
    if (!events) return {};
    return events.reduce((acc, e) => {
      acc[e.source] = (acc[e.source] || 0) + 1;
      return acc;
    }, {});
  }, [events]);

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const allEvents = await base44.entities.Event.list('-created_date', 1000);
      const invalidIds = [];
      let removed = 0;

      for (const e of allEvents) {
        if (!e.title?.trim() || !e.date || !e.organizer_id || !e.source ||
            !e.location?.lat || !e.location?.lng || !e.genre || !e.type) {
          invalidIds.push(e.id);
        }
      }

      for (let i = 0; i < invalidIds.length; i += 50) {
        const batch = invalidIds.slice(i, i + 50);
        await base44.entities.Event.deleteMany({ id: { $in: batch } });
        removed += batch.length;
      }

      await base44.entities.SyncLog.create({
        sync_type: 'cleanup',
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        events_removed: removed,
        duration_seconds: 0,
        summary: `Limpeza manual: ${removed} eventos inválidos removidos.`,
      });

      return { removed, total: allEvents.length };
    },
  });

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Agregador Inteligente
            </h1>
            <p className="text-sm text-gray-400 mt-1">Sistema global de coleta e sincronização de eventos</p>
          </div>
          <Button
            onClick={() => cleanupMutation.mutate()}
            disabled={cleanupMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {cleanupMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Limpar Base
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {STAT_CARDS.map(({ key, label, icon: Icon, iconClass }) => (
            <Card key={key} className="bg-gray-900/80 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-2xl font-bold mt-1">
                      {isLoading ? '...' : stats[key]}
                    </p>
                  </div>
                  <Icon className={`w-8 h-8 ${iconClass}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {['overview', 'sources', 'logs', 'organizers'].map(tab => (
            <Button
              key={tab}
              size="sm"
              variant={selectedTab === tab ? 'default' : 'ghost'}
              onClick={() => setSelectedTab(tab)}
              className={selectedTab === tab ? 'bg-cyan-600' : 'text-gray-400'}
            >
              {tab === 'overview' && 'Visão Geral'}
              {tab === 'sources' && 'Fontes API'}
              {tab === 'logs' && 'Logs'}
              {tab === 'organizers' && 'Organizadores'}
            </Button>
          ))}
        </div>

        {/* Overview */}
        {selectedTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="bg-gray-900/80 border-gray-800">
              <CardHeader>
                <CardTitle className="text-sm text-gray-300">Eventos por Fonte</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(sourceBreakdown).length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum dado disponível</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(sourceBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([source, count]) => (
                        <div key={source} className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">{source}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900/80 border-gray-800">
              <CardHeader>
                <CardTitle className="text-sm text-gray-300">Status da Base</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total na base</span>
                    <span className="font-bold">{stats.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Publicados</span>
                    <span className="font-bold text-green-400">{stats.published}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Aguardando validação</span>
                    <span className="font-bold text-yellow-400">{stats.pending}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Organizadores externos</span>
                    <span className="font-bold text-cyan-400">{organizers?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sources */}
        {selectedTab === 'sources' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {API_SOURCES.map(source => (
              <Card key={source.id} className="bg-gray-900/80 border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-sm">{source.name}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {source.scope === 'global' ? <Globe className="w-3 h-3 mr-1" /> : 'BR'}
                        {source.scope}
                      </Badge>
                    </div>
                    <Badge className={source.enabled ? 'bg-green-600' : 'bg-gray-700'}>
                      {source.enabled ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {sourceBreakdown[source.id] || 0} eventos
                    </span>
                    <Zap className="w-4 h-4 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Logs */}
        {selectedTab === 'logs' && (
          <Card className="bg-gray-900/80 border-gray-800">
            <CardHeader>
              <CardTitle className="text-sm text-gray-300">Histórico de Sincronizações</CardTitle>
            </CardHeader>
            <CardContent>
              {!logs?.length ? (
                <p className="text-sm text-gray-500">Nenhum log registrado</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <Badge className={
                          log.status === 'completed' ? 'bg-green-600' :
                          log.status === 'failed' ? 'bg-red-600' :
                          log.status === 'partial' ? 'bg-yellow-600' : 'bg-blue-600'
                        }>
                          {log.status}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">{log.sync_type}</p>
                          <p className="text-xs text-gray-500">{log.summary}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {log.completed_at ? new Date(log.completed_at).toLocaleString('pt-BR') : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Organizers */}
        {selectedTab === 'organizers' && (
          <Card className="bg-gray-900/80 border-gray-800">
            <CardHeader>
              <CardTitle className="text-sm text-gray-300">Organizadores Externos</CardTitle>
            </CardHeader>
            <CardContent>
              {!organizers?.length ? (
                <p className="text-sm text-gray-500">Nenhum organizador externo cadastrado</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {organizers.map(org => (
                    <div key={org.id} className="p-3 rounded-lg bg-gray-800/50">
                      <p className="font-bold text-sm truncate">{org.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{org.source}</Badge>
                        <span className="text-xs text-gray-500">{org.events_count || 0} eventos</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {cleanupMutation.isSuccess && (
          <div className="fixed bottom-4 right-4 p-4 rounded-lg bg-green-600 text-white shadow-lg z-50">
            <CheckCircle className="w-5 h-5 inline mr-2" />
            {cleanupMutation.data.removed} eventos inválidos removidos.
          </div>
        )}
      </div>
    </div>
  );
}