import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Plus, Crown, Shield, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import FollowButton from '../components/profile/FollowButton';
import { CACHE_CONFIG } from '../components/shared/helpers';

export default function Comunidade() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    type: 'musica',
    is_private: false,
    tags: []
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    retry: false,
    ...CACHE_CONFIG.STATIC,
  });

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: async () => {
      try {
        const data = await base44.entities.Community.list("-member_count", 50);
        return (data || []).filter(c => c?.id && c?.name);
      } catch (error) {
        console.error('Erro ao buscar comunidades:', error);
        return [];
      }
    },
    initialData: [],
    ...CACHE_CONFIG.LONG,
  });

  const { data: suggestedUsers = [] } = useQuery({
    queryKey: ['suggestedUsers', user?.id],
    queryFn: async () => {
      try {
        const users = await base44.entities.User.list("", 20);
        return (users || [])
          .filter(u => u?.id && u.id !== user?.id)
          .slice(0, 4);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        return [];
      }
    },
    enabled: !!user,
    initialData: [],
    ...CACHE_CONFIG.MEDIUM,
  });

  const createCommunityMutation = useMutation({
    mutationFn: async (communityData) => {
      return await base44.entities.Community.create({
        ...communityData,
        creator_id: user.id,
        member_count: 1
      });
    },
    onSuccess: async (newCommunity) => {
      if (newCommunity?.id) {
        try {
          await base44.entities.CommunityMember.create({
            community_id: newCommunity.id,
            user_id: user.id,
            role: 'admin'
          });
        } catch (error) {
          console.error('Erro ao adicionar membro:', error);
        }
      }
      
      queryClient.invalidateQueries(['communities']);
      setShowCreateModal(false);
      setNewCommunity({ name: '', description: '', type: 'musica', is_private: false, tags: [] });
      alert('✅ Comunidade criada!');
    },
    onError: (error) => {
      console.error('Erro:', error);
      alert('❌ Erro ao criar comunidade');
    }
  });

  const handleCreateCommunity = () => {
    if (!user?.is_organizer) {
      alert('❌ Apenas organizadores podem criar');
      return;
    }

    if (!newCommunity.name.trim() || !newCommunity.description.trim()) {
      alert('❌ Preencha nome e descrição');
      return;
    }

    createCommunityMutation.mutate(newCommunity);
  };

  const handleJoinCommunity = (communityId) => {
    if (!user) {
      navigate(createPageUrl("BemVindo"));
      return;
    }
    alert(`Pedido enviado!`);
  };

  const handleUserClick = (userId) => {
    if (!userId) return;
    navigate(createPageUrl("PerfilUsuario") + `?id=${userId}`);
  };

  const filteredCommunities = communities.filter(community =>
    community?.name && community?.description &&
    (community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text mb-2">
            <Users className="w-8 h-8" />
            Comunidades
          </h1>
          <p className="text-gray-400">
            Conecte-se com pessoas que compartilham sua vibe.
          </p>
        </div>
        
        {user?.is_organizer ? (
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-cyan-600 to-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Comunidade
          </Button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Organizadores podem criar</span>
          </div>
        )}
      </div>
      
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Buscar por nome ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-900/80 border-gray-700 pl-10 text-white placeholder:text-gray-500 focus:border-cyan-500"
        />
      </div>

      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="mb-6 bg-gray-900/50 border-gray-700">
          <TabsTrigger value="connections">Conexões</TabsTrigger>
          <TabsTrigger value="communities">Comunidades ({filteredCommunities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="mt-6">
          <div className="mb-8">
            <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
              Pessoas que você pode conhecer
            </h2>
            {suggestedUsers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedUsers.map(suggestedUser => {
                  if (!suggestedUser?.id) return null;
                  
                  return (
                    <Card key={suggestedUser.id} className="bg-gray-900/50 border-gray-700 hover:border-cyan-500/50 transition-all">
                      <CardContent className="p-4">
                        <div 
                          className="flex flex-col items-center text-center cursor-pointer"
                          onClick={() => handleUserClick(suggestedUser.id)}
                        >
                          <img
                            src={suggestedUser.avatar_url || `https://i.pravatar.cc/80?u=${suggestedUser.id}`}
                            alt={suggestedUser.full_name || 'Usuário'}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-cyan-500/30 mb-3 hover:border-cyan-500 transition-all"
                          />
                          <h3 className="font-semibold text-white text-sm sm:text-base mb-1">
                            {suggestedUser.full_name || 'Usuário'}
                          </h3>
                          {suggestedUser.music_preferences?.length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-center mb-3">
                              {suggestedUser.music_preferences.slice(0, 2).map((genre, idx) => (
                                <Badge key={`${genre}-${idx}`} className="bg-purple-500/20 text-purple-300 text-[10px]">
                                  {genre}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {user && (
                            <FollowButton
                              targetUserId={suggestedUser.id}
                              currentUserId={user.id}
                              size="sm"
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-900/50 rounded-lg">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Nenhuma sugestão no momento</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="communities" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="bg-gray-900/50 border-gray-700 animate-pulse">
                  <div className="h-32 bg-gray-700 rounded-t-lg"></div>
                  <CardContent className="p-4 space-y-3">
                    <div className="h-6 w-3/4 bg-gray-600 rounded"></div>
                    <div className="h-4 w-full bg-gray-700 rounded"></div>
                    <div className="h-4 w-1/2 bg-gray-700 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCommunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCommunities.map(community => {
                if (!community?.id) return null;
                
                return (
                  <Card key={community.id} className="bg-gray-900/50 border-gray-700 overflow-hidden hover:border-cyan-500/50 transition-all">
                    {community.cover_image_url && (
                      <img 
                        src={community.cover_image_url} 
                        alt={community.name || 'Comunidade'} 
                        className="w-full h-32 object-cover" 
                      />
                    )}
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        {community.name || 'Comunidade'}
                        {community.is_private && <Lock className="w-4 h-4 text-purple-400" />}
                      </CardTitle>
                      <div className="flex items-center text-sm text-gray-400 gap-2">
                        <Users className="w-4 h-4" />
                        <span>{community.member_count || 0} membros</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 text-sm mb-4">{community.description || ''}</p>
                      {community.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {community.tags.map((tag, idx) => (
                            <Badge key={`${tag}-${idx}`} variant="outline" className="text-cyan-300 border-cyan-500/30">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <Button 
                        onClick={() => handleJoinCommunity(community.id)} 
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={!user}
                      >
                        {user ? 'Solicitar Entrada' : 'Faça Login'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-900/50 rounded-lg">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">Nenhuma comunidade encontrada</p>
              {user?.is_organizer && (
                <Button onClick={() => setShowCreateModal(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Comunidade
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-gray-900 border-purple-500 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Criar Nova Comunidade
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Como organizador, você será o moderador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Nome *</label>
              <Input
                value={newCommunity.name}
                onChange={(e) => setNewCommunity(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Techno SP"
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Descrição *</label>
              <Textarea
                value={newCommunity.description}
                onChange={(e) => setNewCommunity(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva..."
                className="bg-gray-800 border-gray-700 h-24"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Tipo</label>
              <select
                value={newCommunity.type}
                onChange={(e) => setNewCommunity(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              >
                <option value="musica">Música</option>
                <option value="cidade">Cidade</option>
                <option value="frequencia">Frequência</option>
                <option value="exploradores">Exploradores</option>
                <option value="djs">DJs</option>
                <option value="organizadores">Organizadores</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newCommunity.is_private}
                onChange={(e) => setNewCommunity(prev => ({ ...prev, is_private: e.target.checked }))}
                className="w-4 h-4"
              />
              <label className="text-sm text-gray-400">Privada (requer aprovação)</label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateCommunity} 
              disabled={createCommunityMutation.isPending}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600"
            >
              {createCommunityMutation.isPending ? 'Criando...' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}