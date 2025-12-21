import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, Shield, Ban, CheckCircle, XCircle, 
  Eye, Clock, TrendingUp, UserX, MessageSquare, Flag 
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ModerationPanel({ community, user }) {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState(null);
  const [banReason, setBanReason] = useState("");

  // Reports pendentes
  const { data: reports = [] } = useQuery({
    queryKey: ['communityReports', community.id],
    queryFn: async () => {
      return await base44.entities.CommunityReport.filter(
        { community_id: community.id },
        '-created_date',
        100
      );
    },
    refetchInterval: 30000
  });

  // Usuários banidos
  const { data: bans = [] } = useQuery({
    queryKey: ['communityBans', community.id],
    queryFn: async () => {
      return await base44.entities.CommunityBan.filter(
        { community_id: community.id, is_active: true },
        '-created_date'
      );
    }
  });

  // Atualizar report
  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, status, action }) => {
      return await base44.entities.CommunityReport.update(reportId, {
        status,
        action_taken: action,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communityReports', community.id]);
      setSelectedReport(null);
    }
  });

  // Banir usuário
  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason, duration }) => {
      const expiresAt = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString() : null;
      
      return await base44.entities.CommunityBan.create({
        community_id: community.id,
        banned_user_id: userId,
        banned_by: user.id,
        reason,
        ban_type: duration ? 'temporary' : 'permanent',
        expires_at: expiresAt,
        is_active: true,
        notes: banReason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communityBans', community.id]);
      setBanReason("");
    }
  });

  // Remover banimento
  const unbanMutation = useMutation({
    mutationFn: async (banId) => {
      return await base44.entities.CommunityBan.update(banId, {
        is_active: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communityBans', community.id]);
    }
  });

  const pendingReports = reports.filter(r => r.status === 'pending');
  const reviewedReports = reports.filter(r => r.status !== 'pending');

  const severityColors = {
    low: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    critical: 'bg-red-500/20 text-red-300 border-red-500/30'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-cyan-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Painel de Moderação</h2>
          <p className="text-gray-400 text-sm">{community.name}</p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gray-800/50 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Reports Pendentes</p>
                <p className="text-2xl font-bold text-yellow-300">{pendingReports.length}</p>
              </div>
              <Flag className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Usuários Banidos</p>
                <p className="text-2xl font-bold text-red-300">{bans.length}</p>
              </div>
              <Ban className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Resolvidos</p>
                <p className="text-2xl font-bold text-green-300">{reviewedReports.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="bg-gray-800 border border-gray-700">
          <TabsTrigger value="reports" className="data-[state=active]:bg-cyan-600">
            <Flag className="w-4 h-4 mr-2" />
            Reports ({pendingReports.length})
          </TabsTrigger>
          <TabsTrigger value="bans" className="data-[state=active]:bg-red-600">
            <Ban className="w-4 h-4 mr-2" />
            Banimentos ({bans.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Reports */}
        <TabsContent value="reports" className="space-y-3 mt-4">
          {pendingReports.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Nenhum report pendente</h3>
                <p className="text-gray-500">Tudo limpo por enquanto!</p>
              </CardContent>
            </Card>
          ) : (
            pendingReports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-gray-800/50 border-gray-700 hover:border-cyan-500/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={severityColors[report.severity]}>
                            {report.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{report.content_type}</Badge>
                          <Badge variant="outline">{report.reason}</Badge>
                        </div>
                        <p className="text-sm text-gray-400">
                          Reportado em {format(new Date(report.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <p className="text-sm text-gray-300">{report.description}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateReportMutation.mutate({
                          reportId: report.id,
                          status: 'action_taken',
                          action: 'Conteúdo removido'
                        })}
                        disabled={updateReportMutation.isPending}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Remover Conteúdo
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => {
                          if (report.reported_user_id && report.reported_user_id !== 'system') {
                            banUserMutation.mutate({
                              userId: report.reported_user_id,
                              reason: report.reason,
                              duration: 7
                            });
                          }
                          updateReportMutation.mutate({
                            reportId: report.id,
                            status: 'action_taken',
                            action: 'Usuário banido'
                          });
                        }}
                        disabled={updateReportMutation.isPending || !report.reported_user_id || report.reported_user_id === 'system'}
                        variant="outline"
                        className="border-orange-500/50 text-orange-300"
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Banir Usuário (7d)
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => updateReportMutation.mutate({
                          reportId: report.id,
                          status: 'dismissed',
                          action: 'Sem violação'
                        })}
                        disabled={updateReportMutation.isPending}
                        variant="outline"
                        className="border-green-500/50 text-green-300"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Dispensar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* Tab: Banimentos */}
        <TabsContent value="bans" className="space-y-3 mt-4">
          {bans.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-12 text-center">
                <UserX className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Nenhum banimento ativo</h3>
              </CardContent>
            </Card>
          ) : (
            bans.map((ban) => (
              <Card key={ban.id} className="bg-gray-800/50 border-red-500/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-red-600">{ban.ban_type}</Badge>
                        <span className="text-sm text-gray-400">
                          Banido em {format(new Date(ban.created_date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">
                        <strong>Razão:</strong> {ban.reason}
                      </p>
                      {ban.expires_at && (
                        <p className="text-xs text-gray-500">
                          Expira em {format(new Date(ban.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => unbanMutation.mutate(ban.id)}
                      disabled={unbanMutation.isPending}
                      className="border-green-500/50 text-green-300"
                    >
                      Remover Ban
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}