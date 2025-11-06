import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy, Crown, Medal, Star, TrendingUp, Users, Calendar, Zap, Target, Flame, Award
} from "lucide-react";
import { motion } from "framer-motion";

const podiumColors = {
  1: "from-yellow-400 to-yellow-600",
  2: "from-gray-300 to-gray-500",
  3: "from-orange-400 to-orange-600"
};

const podiumIcons = {
  1: Crown,
  2: Trophy,
  3: Medal
};

export default function Ranking() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rankingType, setRankingType] = useState("points");

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

  // Buscar todos os usuários ordenados por pontos
  const { data: rankedUsers = [] } = useQuery({
    queryKey: ['leaderboard', rankingType],
    queryFn: async () => {
      let sortField = "-experience_points";
      
      if (rankingType === "events") {
        sortField = "-stats.events_attended";
      } else if (rankingType === "vibes") {
        sortField = "-total_vibes_shared";
      } else if (rankingType === "level") {
        sortField = "-underground_level";
      }

      const users = await base44.entities.User.list(sortField, 100);
      return users.filter(u => u.profile_visible !== false);
    },
    initialData: [],
  });

  // Encontrar posição do usuário atual
  const userPosition = rankedUsers.findIndex(u => u.id === user?.id) + 1;
  const userRanking = userPosition > 0 ? userPosition : null;

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const getRankValue = (user, type) => {
    switch(type) {
      case "points":
        return user.experience_points || 0;
      case "events":
        return user.stats?.events_attended || 0;
      case "vibes":
        return user.total_vibes_shared || 0;
      case "level":
        return user.underground_level || 1;
      default:
        return 0;
    }
  };

  const getRankLabel = (type) => {
    switch(type) {
      case "points":
        return "pontos";
      case "events":
        return "eventos";
      case "vibes":
        return "vibes";
      case "level":
        return "nível";
      default:
        return "";
    }
  };

  const topThree = rankedUsers.slice(0, 3);
  const restOfRanking = rankedUsers.slice(3);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text mb-2">
            Ranking Global
          </h1>
          <p className="text-gray-400">Competição entre os melhores da comunidade</p>
        </div>
        <Button
          onClick={() => navigate(createPageUrl("Recompensas"))}
          className="bg-gradient-to-r from-yellow-600 to-orange-600"
        >
          <Star className="w-4 h-4 mr-2" />
          Loja de Recompensas
        </Button>
      </div>

      {/* Sua Posição */}
      {userRanking && (
        <Card className="mb-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500">
                  <img
                    src={user.avatar_url || "https://i.pravatar.cc/64"}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Sua Posição</div>
                  <div className="text-3xl font-bold text-white">#{userRanking}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-1">
                  <Star className="w-5 h-5 text-yellow-400" fill="#facc15" />
                  <span className="text-2xl font-bold text-white">
                    {getRankValue(user, rankingType).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-gray-400">{getRankLabel(rankingType)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros de Ranking */}
      <Tabs defaultValue="points" className="mb-6" onValueChange={(value) => setRankingType(value)}>
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="points">
            <Star className="w-4 h-4 mr-1" />
            Pontos
          </TabsTrigger>
          <TabsTrigger value="events">
            <Calendar className="w-4 h-4 mr-1" />
            Eventos
          </TabsTrigger>
          <TabsTrigger value="vibes">
            <Zap className="w-4 h-4 mr-1" />
            Vibes
          </TabsTrigger>
          <TabsTrigger value="level">
            <TrendingUp className="w-4 h-4 mr-1" />
            Nível
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Pódio - Top 3 */}
      <div className="mb-8">
        <div className="grid grid-cols-3 gap-4 items-end h-80">
          {/* 2º Lugar */}
          {topThree[1] && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-400">
                  <img
                    src={topThree[1].avatar_url || "https://i.pravatar.cc/80"}
                    alt={topThree[1].full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center border-2 border-white">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="font-semibold text-white text-center mb-1">{topThree[1].full_name}</h3>
              <div className="flex items-center gap-1 text-yellow-400 mb-3">
                <Star className="w-4 h-4" fill="#facc15" />
                <span className="font-bold">{getRankValue(topThree[1], rankingType).toLocaleString()}</span>
              </div>
              <div className="w-full bg-gradient-to-t from-gray-300 to-gray-500 rounded-t-lg h-32 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">2</span>
              </div>
            </motion.div>
          )}

          {/* 1º Lugar */}
          {topThree[0] && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-yellow-400 shadow-lg shadow-yellow-500/50">
                  <img
                    src={topThree[0].avatar_url || "https://i.pravatar.cc/96"}
                    alt={topThree[0].full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <Crown className="w-5 h-5 text-white" />
                </div>
              </div>
              <h3 className="font-bold text-white text-lg text-center mb-1">{topThree[0].full_name}</h3>
              <div className="flex items-center gap-1 text-yellow-400 mb-3">
                <Star className="w-5 h-5" fill="#facc15" />
                <span className="text-xl font-bold">{getRankValue(topThree[0], rankingType).toLocaleString()}</span>
              </div>
              <div className="w-full bg-gradient-to-t from-yellow-400 to-yellow-600 rounded-t-lg h-48 flex items-center justify-center shadow-xl">
                <span className="text-5xl font-bold text-white">1</span>
              </div>
            </motion.div>
          )}

          {/* 3º Lugar */}
          {topThree[2] && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-orange-400">
                  <img
                    src={topThree[2].avatar_url || "https://i.pravatar.cc/80"}
                    alt={topThree[2].full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center border-2 border-white">
                  <Medal className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="font-semibold text-white text-center mb-1">{topThree[2].full_name}</h3>
              <div className="flex items-center gap-1 text-yellow-400 mb-3">
                <Star className="w-4 h-4" fill="#facc15" />
                <span className="font-bold">{getRankValue(topThree[2], rankingType).toLocaleString()}</span>
              </div>
              <div className="w-full bg-gradient-to-t from-orange-400 to-orange-600 rounded-t-lg h-24 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Resto do Ranking */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Ranking Completo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {restOfRanking.map((rankedUser, index) => {
              const position = index + 4;
              const isCurrentUser = rankedUser.id === user?.id;

              return (
                <motion.div
                  key={rankedUser.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                    isCurrentUser 
                      ? 'bg-purple-900/30 border border-purple-500/50' 
                      : 'bg-gray-800/50 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center">
                      <span className={`text-lg font-bold ${
                        isCurrentUser ? 'text-purple-400' : 'text-gray-400'
                      }`}>
                        #{position}
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-600">
                      <img
                        src={rankedUser.avatar_url || "https://i.pravatar.cc/48"}
                        alt={rankedUser.full_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{rankedUser.full_name}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-300">
                          Nível {rankedUser.underground_level || 1}
                        </Badge>
                        {rankedUser.is_pro_member && (
                          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600">
                            PRO
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" fill="#facc15" />
                    <span className="text-xl font-bold text-white">
                      {getRankValue(rankedUser, rankingType).toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}