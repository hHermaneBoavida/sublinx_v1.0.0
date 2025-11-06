
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, Calendar, Users, Heart, MessageCircle, Share2,
  Star, Zap, Gift, Target, Award, Trophy
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const actionIcons = {
  event_attendance: Calendar,
  photo_share: Share2,
  video_share: Share2,
  event_checkin: Target,
  review_write: MessageCircle,
  referral: Users,
  vibe_share: Zap,
  like_event: Heart,
  comment_event: MessageCircle
};

export default function HistoricoPontos() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      navigate(createPageUrl("BemVindo"));
    } finally {
      setLoading(false);
    }
  };

  // Buscar histórico de pontos
  const { data: pointsHistory = [] } = useQuery({
    queryKey: ['pointsHistory', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.PointsHistory.filter({ user_id: user.id }, "-created_date", 50);
    },
    enabled: !!user,
    initialData: [],
  });

  // Buscar badges do usuário
  const { data: userBadges = [] } = useQuery({
    queryKey: ['userBadges', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.UserBadge.filter({ user_id: user.id }, "-earned_at");
    },
    enabled: !!user,
    initialData: [],
  });

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const totalPointsEarned = pointsHistory.reduce((sum, h) => sum + (h.points || 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text mb-2">
            Histórico de Pontos
          </h1>
          <p className="text-gray-400">Acompanhe sua evolução na plataforma</p>
        </div>
        <Button
          onClick={() => navigate(createPageUrl("Recompensas"))}
          className="bg-gradient-to-r from-yellow-600 to-orange-600"
        >
          <Star className="w-4 h-4 mr-2" />
          Loja
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-white" fill="white" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Saldo Atual</div>
                <div className="text-2xl font-bold text-white">{user?.experience_points || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Total Ganho</div>
                <div className="text-2xl font-bold text-white">{totalPointsEarned}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Badges</div>
                <div className="text-2xl font-bold text-white">{userBadges.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      {userBadges.length > 0 && (
        <Card className="mb-6 bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="w-5 h-5" />
              Seus Badges ({userBadges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {userBadges.map(badge => (
                <div key={badge.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-white text-sm mb-1">{badge.badge_name}</h4>
                  <p className="text-xs text-gray-400">{badge.badge_description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {pointsHistory.length > 0 ? (
            <div className="space-y-3">
              {pointsHistory.map(history => {
                const Icon = actionIcons[history.action_type] || Star;
                
                return (
                  <div key={history.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{history.description}</h4>
                        <p className="text-xs text-gray-400">
                          {format(new Date(history.created_date), "PPp", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600">
                        +{history.points} pts
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhuma atividade ainda</p>
              <p className="text-sm text-gray-500 mt-2">
                Comece a interagir para ganhar pontos!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
