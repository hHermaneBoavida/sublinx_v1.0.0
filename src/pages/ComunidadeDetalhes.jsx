import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, ArrowLeft, UserPlus, Settings, Crown, Lock, 
  MessageCircle, Sparkles, Loader2, Share2
} from "lucide-react";
import { motion } from "framer-motion";
import CommunityFeed from "../components/community/CommunityFeed";
import CommunityChat from "../components/community/CommunityChat";
import InviteFriendsModal from "../components/community/InviteFriendsModal";

export default function ComunidadeDetalhes() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(location.search);
  const communityId = searchParams.get('id');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        navigate(createPageUrl("BemVindo"));
        return null;
      }
    },
    retry: false,
  });

  const { data: community, isLoading } = useQuery({
    queryKey: ['community', communityId],
    queryFn: async () => {
      const communities = await base44.entities.Community.filter({ id: communityId });
      if (communities.length === 0) throw new Error("Comunidade não encontrada");
      return communities[0];
    },
    enabled: !!communityId,
  });

  const { data: membership } = useQuery({
    queryKey: ['communityMembership', communityId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const members = await base44.entities.CommunityMember.filter({
        community_id: communityId,
        user_id: user.id
      });
      return members[0] || null;
    },
    enabled: !!communityId && !!user,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['communityMembers', communityId],
    queryFn: async () => {
      return await base44.entities.CommunityMember.filter({ 
        community_id: communityId,
        is_active: true 
      });
    },
    enabled: !!communityId,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const newMember = await base44.entities.CommunityMember.create({
        community_id: communityId,
        user_id: user.id,
        role: 'member',
        is_active: true
      });

      await base44.entities.Community.update(communityId, {
        member_count: (community.member_count || 0) + 1
      });

      return newMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communityMembership', communityId, user?.id]);
      queryClient.invalidateQueries(['community', communityId]);
      alert("✅ Você entrou na comunidade!");
    }
  });

  const handleJoin = () => {
    if (!user) {
      navigate(createPageUrl("BemVindo"));
      return;
    }
    joinMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-16 h-16 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Comunidade não encontrada</p>
          <Button onClick={() => navigate(createPageUrl("Comunidade"))}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const isMember = !!membership;
  const isAdmin = membership?.role === 'admin';

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            onClick={() => navigate(createPageUrl("Comunidade"))}
            variant="ghost"
            className="mb-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          {/* Cover Image */}
          {community.cover_image_url && (
            <div className="relative h-48 rounded-xl overflow-hidden mb-4">
              <img
                src={community.cover_image_url}
                alt={community.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {community.name}
                </h1>
                {community.is_private && (
                  <Badge className="bg-purple-600/20 border-purple-500/30 text-purple-300">
                    <Lock className="w-3 h-3 mr-1" />
                    Privada
                  </Badge>
                )}
              </div>
              <p className="text-gray-400 mb-3">{community.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {community.member_count || 0} membros
                </span>
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-300">
                  {community.type}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              {isMember ? (
                <>
                  <Button
                    onClick={() => setShowInviteModal(true)}
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-400"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Convidar
                  </Button>
                  {isAdmin && (
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurações
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  onClick={handleJoin}
                  disabled={joinMutation.isPending}
                  className="bg-gradient-to-r from-cyan-600 to-purple-600"
                >
                  {joinMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  {community.is_private ? 'Solicitar Entrada' : 'Entrar'}
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Content */}
        {isMember ? (
          <Tabs defaultValue="feed" className="space-y-6">
            <TabsList className="bg-gray-800 border border-gray-700">
              <TabsTrigger value="feed" className="data-[state=active]:bg-cyan-600">
                <Sparkles className="w-4 h-4 mr-2" />
                Feed
              </TabsTrigger>
              <TabsTrigger value="chat" className="data-[state=active]:bg-purple-600">
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-pink-600">
                <Users className="w-4 h-4 mr-2" />
                Membros ({members.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed">
              <CommunityFeed communityId={communityId} user={user} />
            </TabsContent>

            <TabsContent value="chat">
              <CommunityChat communityId={communityId} user={user} />
            </TabsContent>

            <TabsContent value="members">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member, idx) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg"
                      >
                        <img
                          src={`https://i.pravatar.cc/48?u=${member.user_id}`}
                          alt="Member"
                          className="w-12 h-12 rounded-full border-2 border-cyan-500/30"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-white text-sm">Membro</p>
                          {member.role === 'admin' && (
                            <Badge className="bg-yellow-600/20 text-yellow-300 text-xs">
                              <Crown className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="py-16 text-center">
              <Lock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                {community.is_private ? 'Comunidade Privada' : 'Entre para Participar'}
              </h3>
              <p className="text-gray-400 mb-6">
                {community.is_private 
                  ? 'Solicite acesso para ver o conteúdo desta comunidade'
                  : 'Junte-se à comunidade para acessar o feed, chat e eventos'}
              </p>
              <Button
                onClick={handleJoin}
                disabled={joinMutation.isPending}
                className="bg-gradient-to-r from-cyan-600 to-purple-600"
              >
                {joinMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {community.is_private ? 'Solicitar Acesso' : 'Entrar na Comunidade'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

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