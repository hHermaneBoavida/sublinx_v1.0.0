import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Crown, Star, Zap, Gift, Trophy, Sparkles, Lock,
  CheckCircle, TrendingUp, Award, Flame, Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import PointsEarningActions from "../components/loyalty/PointsEarningActions";
import InviteFriendsModal from "../components/community/InviteFriendsModal";

const categoryIcons = {
  visual: Sparkles,
  acesso: Star,
  desconto: Gift,
  premium: Crown
};

const rarityColors = {
  comum: "from-gray-400 to-gray-600",
  raro: "from-blue-400 to-blue-600",
  épico: "from-purple-400 to-purple-600",
  lendário: "from-yellow-400 to-orange-600"
};

export default function Recompensas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [showInviteModal, setShowInviteModal] = useState(false);

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

  // Buscar recompensas disponíveis
  const { data: rewards = [] } = useQuery({
    queryKey: ['availableRewards'],
    queryFn: async () => {
      return await base44.entities.Reward.filter({ is_active: true }, "-points_cost");
    },
    initialData: [],
  });

  // Buscar recompensas já resgatadas
  const { data: userRewards = [] } = useQuery({
    queryKey: ['userRewards', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.UserReward.filter({ user_id: user.id }, "-redeemed_at");
    },
    enabled: !!user,
    initialData: [],
  });

  // Mutation para resgatar recompensa
  const redeemMutation = useMutation({
    mutationFn: async (reward) => {
      // Criar registro da recompensa
      await base44.entities.UserReward.create({
        user_id: user.id,
        reward_id: reward.id,
        reward_name: reward.name,
        reward_type: reward.type,
        points_spent: reward.points_cost,
        redeemed_at: new Date().toISOString(),
        is_active: true
      });

      // Atualizar pontos do usuário
      const newPoints = (user.experience_points || 0) - reward.points_cost;
      await base44.auth.updateMe({ experience_points: newPoints });

      // Atualizar contador de resgates
      await base44.entities.Reward.update(reward.id, {
        redeemed_count: (reward.redeemed_count || 0) + 1
      });
    },
    onSuccess: () => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#8b5cf6', '#f59e0b']
      });

      queryClient.invalidateQueries(['userRewards']);
      queryClient.invalidateQueries(['currentUser']);
      loadUserData();
      
      alert("🎉 Recompensa resgatada com sucesso!");
      setShowConfirmDialog(false);
      setSelectedReward(null);
    },
    onError: (error) => {
      console.error("Erro ao resgatar:", error);
      alert("❌ Erro ao resgatar recompensa. Tente novamente.");
    }
  });

  const handleRedeemClick = (reward) => {
    if ((user.experience_points || 0) < reward.points_cost) {
      alert("❌ Pontos insuficientes para resgatar esta recompensa.");
      return;
    }

    if (reward.limited_quantity && reward.redeemed_count >= reward.limited_quantity) {
      alert("❌ Esta recompensa está esgotada.");
      return;
    }

    setSelectedReward(reward);
    setShowConfirmDialog(true);
  };

  const confirmRedeem = () => {
    if (selectedReward) {
      redeemMutation.mutate(selectedReward);
    }
  };

  const filteredRewards = filterCategory === "all" 
    ? rewards 
    : rewards.filter(r => r.category === filterCategory);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const userPoints = user?.experience_points || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text mb-2">
            Loja de Recompensas
          </h1>
          <p className="text-gray-400">Troque seus pontos por vantagens exclusivas</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowInviteModal(true)}
            variant="outline"
            className="border-yellow-500/30 text-yellow-400"
          >
            <Gift className="w-4 h-4 mr-2" />
            Convidar Amigos
          </Button>
          <Button
            onClick={() => navigate(createPageUrl("Ranking"))}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Ver Ranking
          </Button>
        </div>
      </div>

      {/* Saldo de Pontos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Star className="w-8 h-8 text-white" fill="white" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Seus Pontos</div>
                  <div className="text-4xl font-bold text-white">{userPoints.toLocaleString()}</div>
                </div>
              </div>
              <div className="text-right">
                <Button
                  onClick={() => navigate(createPageUrl("HistoricoPontos"))}
                  variant="outline"
                  className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Histórico
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <PointsEarningActions />
      </div>

      {/* Filtros por Categoria */}
      <Tabs defaultValue="all" className="mb-6" onValueChange={(value) => setFilterCategory(value)}>
        <TabsList className="grid w-full grid-cols-5 bg-gray-800">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="acesso">Acesso</TabsTrigger>
          <TabsTrigger value="desconto">Descontos</TabsTrigger>
          <TabsTrigger value="premium">Premium</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Grid de Recompensas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <AnimatePresence>
          {filteredRewards.map((reward, index) => {
            const Icon = categoryIcons[reward.category] || Gift;
            const canAfford = userPoints >= reward.points_cost;
            const isRedeemed = userRewards.some(ur => ur.reward_id === reward.id && ur.is_active);
            const isLimitedAndSoldOut = reward.limited_quantity && reward.redeemed_count >= reward.limited_quantity;

            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`relative overflow-hidden transition-all hover:shadow-xl ${
                  canAfford && !isRedeemed && !isLimitedAndSoldOut
                    ? 'hover:border-yellow-500/50 cursor-pointer'
                    : 'opacity-60'
                }`}>
                  {/* Rarity Gradient Border */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${rarityColors[reward.rarity]}`} />

                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${rarityColors[reward.rarity]} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <Badge className={`bg-gradient-to-r ${rarityColors[reward.rarity]}`}>
                        {reward.rarity}
                      </Badge>
                    </div>
                    <CardTitle className="text-white mt-3">{reward.name}</CardTitle>
                  </CardHeader>

                  <CardContent>
                    <p className="text-gray-400 text-sm mb-4">{reward.description}</p>

                    {reward.limited_quantity && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Disponível</span>
                          <span>{Math.max(0, reward.limited_quantity - (reward.redeemed_count || 0))}/{reward.limited_quantity}</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, ((reward.limited_quantity - (reward.redeemed_count || 0)) / reward.limited_quantity) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-400" fill="#facc15" />
                        <span className="text-2xl font-bold text-white">{reward.points_cost}</span>
                      </div>

                      {isRedeemed ? (
                        <Badge className="bg-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Resgatada
                        </Badge>
                      ) : isLimitedAndSoldOut ? (
                        <Badge className="bg-red-600">
                          <Lock className="w-3 h-3 mr-1" />
                          Esgotada
                        </Badge>
                      ) : (
                        <Button
                          onClick={() => handleRedeemClick(reward)}
                          disabled={!canAfford}
                          size="sm"
                          className={`${
                            canAfford
                              ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700'
                              : 'bg-gray-700 cursor-not-allowed'
                          }`}
                        >
                          {canAfford ? (
                            <>
                              <Gift className="w-4 h-4 mr-1" />
                              Resgatar
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 mr-1" />
                              Bloqueado
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Minhas Recompensas */}
      {userRewards.length > 0 && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="w-5 h-5" />
              Minhas Recompensas ({userRewards.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {userRewards.map(reward => (
                <div key={reward.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">{reward.reward_name}</h4>
                    <Badge className="bg-green-600">Ativa</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span>{reward.points_spent} pontos</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-gray-900 border-yellow-500/50 text-white">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Confirmar Resgate
            </DialogTitle>
            <DialogDescription>
              {selectedReward && (
                <div className="space-y-4 mt-4">
                  <p className="text-gray-300">
                    Deseja resgatar <strong className="text-white">{selectedReward.name}</strong>?
                  </p>
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Custo:</span>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400" fill="#facc15" />
                        <span className="text-xl font-bold text-white">{selectedReward.points_cost}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Saldo após resgate:</span>
                      <span className="text-white font-semibold">
                        {(userPoints - selectedReward.points_cost).toLocaleString()} pontos
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => setShowConfirmDialog(false)}
              variant="outline"
              className="flex-1 border-gray-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmRedeem}
              disabled={redeemMutation.isLoading}
              className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
            >
              {redeemMutation.isLoading ? "Resgatando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showInviteModal && (
        <InviteFriendsModal
          event={null}
          user={user}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}