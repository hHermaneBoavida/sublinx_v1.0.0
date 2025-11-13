
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Grid,
  Heart,
  MessageCircle,
  Crown,
  Calendar,
  MapPin,
  LogOut,
  AlertCircle,
  UserPlus,
  UserMinus,
  Users,
  CheckCircle,
  Clock,
  X,
  BarChart3,
  Music,
  TrendingUp,
  Loader2,
  Camera,
  Save,
  Check // Added Check icon
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import FollowButton from "../components/profile/FollowButton";
import EventHistoryCard from "../components/profile/EventHistoryCard";
import { CACHE_CONFIG, DEFAULT_AVATAR, MUSIC_GENRES } from "../components/shared/helpers";

export default function Perfil() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    bio: "",
    avatar_url: "",
    phone: "",
    address_full: "",
    city: "",
    state: "",
    postal_code: "",
    email: "",
    cpf: "",
    cnpj: "",
    music_preferences: []
  });
  const [nameChangeCount, setNameChangeCount] = useState(0);
  const [originalName, setOriginalName] = useState("");
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // New state for success message
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading: loadingUser, refetch: refetchUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const userData = await base44.auth.me();
        
        console.log('📥 Dados do usuário carregados:', {
          id: userData.id,
          full_name: userData.full_name,
          email: userData.email,
          name_change_count: userData.name_change_count
        });
        
        // Defaults para garantir que os campos existam no objeto
        if (!userData.avatar_url) userData.avatar_url = DEFAULT_AVATAR;
        if (!userData.music_preferences) userData.music_preferences = [];
        if (!userData.stats) {
          userData.stats = {
            events_attended: 0,
            events_organized: 0,
            posts_created: 0,
            photos_shared: 0,
            videos_shared: 0
          };
        }
        
        return userData;
      } catch (error) {
        console.error("❌ Erro ao carregar usuário:", error);
        navigate(createPageUrl("BemVindo"));
        throw error; // Propagate error for react-query to handle
      }
    },
    retry: false, // Don't retry if user is not authenticated
    ...CACHE_CONFIG.SHORT,
  });

  // CORREÇÃO: Inicializar form quando user carregar
  useEffect(() => {
    if (user) {
      console.log('🔄 Inicializando formulário com dados do usuário');
      
      setNameChangeCount(user.name_change_count || 0);
      setOriginalName(user.full_name || "");
      setEditForm({
        full_name: user.full_name || "",
        bio: user.bio || "",
        avatar_url: user.avatar_url || DEFAULT_AVATAR,
        phone: user.phone || "",
        address_full: user.address_full || "",
        city: user.city || "",
        state: user.state || "",
        postal_code: user.postal_code || "",
        email: user.email || "", // Não editável, apenas visualização
        cpf: user.cpf || "",     // Não editável, apenas visualização
        cnpj: user.cnpj || "",   // Não editável, apenas visualização
        music_preferences: user.music_preferences || []
      });
    }
  }, [user]);

  // Buscar dados reais de follows
  const { data: followersData = [] } = useQuery({
    queryKey: ['followers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await base44.entities.Follow.filter({ following_id: user.id });
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
    initialData: [],
    ...CACHE_CONFIG.MEDIUM,
  });

  const { data: followingData = [] } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await base44.entities.Follow.filter({ follower_id: user.id });
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
    initialData: [],
    ...CACHE_CONFIG.MEDIUM,
  });

  // NOVO: Buscar usuários dos seguidores
  const { data: followersUsers = [] } = useQuery({
    queryKey: ['followersUsers', followersData],
    queryFn: async () => {
      if (!followersData || followersData.length === 0) return [];
      const followerIds = followersData.map(f => f.follower_id);
      try {
        const users = await base44.entities.User.filter({ id: { $in: followerIds } });
        return users || [];
      } catch {
        return [];
      }
    },
    enabled: followersData && followersData.length > 0,
    initialData: [],
    ...CACHE_CONFIG.MEDIUM,
  });

  // NOVO: Buscar usuários que está seguindo
  const { data: followingUsers = [] } = useQuery({
    queryKey: ['followingUsers', followingData],
    queryFn: async () => {
      if (!followingData || followingData.length === 0) return [];
      const followingIds = followingData.map(f => f.following_id);
      try {
        const users = await base44.entities.User.filter({ id: { $in: followingIds } });
        return users || [];
      } catch {
        return [];
      }
    },
    enabled: followingData && followingData.length > 0,
    initialData: [],
    ...CACHE_CONFIG.MEDIUM,
  });

  // Buscar eventos criados (para organizadores)
  const { data: createdEvents = [] } = useQuery({
    queryKey: ['createdEvents', user?.id],
    queryFn: async () => {
      if (!user?.id || !user?.is_organizer) return [];
      try {
        return await base44.entities.Event.filter({ organizer_id: user.id }, "-date");
      } catch {
        return [];
      }
    },
    enabled: !!user?.id && !!user?.is_organizer,
    initialData: [],
    ...CACHE_CONFIG.LONG,
  });

  // NOVO: Buscar eventos passados que o usuário participou
  const { data: pastEvents = [] } = useQuery({
    queryKey: ['pastEvents', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        // Buscar tickets do usuário
        const tickets = await base44.entities.Ticket.filter({ user_id: user.id });
        const eventIds = [...new Set(tickets.map(t => t.event_id))];
        
        if (eventIds.length === 0) return [];

        // Buscar os eventos
        const events = await Promise.all(
          eventIds.map(async id => {
            try {
              const eventList = await base44.entities.Event.filter({ id });
              return eventList[0] || null;
            } catch {
              return null;
            }
          })
        );

        // Filtrar eventos passados
        const now = new Date();
        return events
          .filter(e => e !== null && new Date(e.date) < now)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
    initialData: [],
    ...CACHE_CONFIG.LONG,
  });

  // NOVO: Buscar eventos com ingressos (aprovados)
  const { data: myTicketEvents = [] } = useQuery({
    queryKey: ['myTicketEvents', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        // Buscar solicitações aprovadas
        const approvedRequests = await base44.entities.EventRequest.filter({ 
          user_id: user.id,
          status: "approved"
        });
        
        if (approvedRequests.length === 0) return [];

        const eventIds = [...new Set(approvedRequests.map(r => r.event_id))];

        // Buscar os eventos
        const events = await Promise.all(
          eventIds.map(async id => {
            try {
              const eventList = await base44.entities.Event.filter({ id });
              return eventList[0] || null;
            } catch {
              return null;
            }
          })
        );

        // Retornar todos os eventos aprovados (futuros e passados)
        return events
          .filter(e => e !== null)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
    initialData: [],
    ...CACHE_CONFIG.MEDIUM,
  });

  // CORREÇÃO: Separar eventos futuros e passados
  const upcomingTicketEvents = myTicketEvents.filter(e => new Date(e.date) >= new Date());
  const pastTicketEvents = myTicketEvents.filter(e => new Date(e.date) < new Date());

  // Buscar solicitações de eventos (para organizadores)
  const { data: eventRequests = [] } = useQuery({
    queryKey: ['eventRequests', user?.id, createdEvents],
    queryFn: async () => {
      if (!user?.id || !user?.is_organizer || !createdEvents || createdEvents.length === 0) return [];
      try {
        const eventIds = createdEvents.map(e => e.id);
        return await base44.entities.EventRequest.filter({
          event_id: { $in: eventIds },
          status: "pending"
        });
      } catch {
        return [];
      }
    },
    enabled: !!user?.id && !!user?.is_organizer && !!createdEvents && createdEvents.length > 0,
    initialData: [],
    ...CACHE_CONFIG.SHORT,
  });

  // Buscar lista de convidados (solicitações aceitas)
  const { data: guestList = [] } = useQuery({
    queryKey: ['guestList', user?.id, createdEvents],
    queryFn: async () => {
      if (!user?.id || !user?.is_organizer || !createdEvents || createdEvents.length === 0) return [];
      try {
        const eventIds = createdEvents.map(e => e.id);
        return await base44.entities.EventRequest.filter({
          event_id: { $in: eventIds },
          status: "approved"
        });
      } catch {
        return [];
      }
    },
    enabled: !!user?.id && !!user?.is_organizer && !!createdEvents && createdEvents.length > 0,
    initialData: [],
    ...CACHE_CONFIG.MEDIUM,
  });

  // Buscar eventos curtidos (para usuários)
  const { data: likedEvents = [] } = useQuery({
    queryKey: ['likedEvents', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const likes = await base44.entities.Like.filter({ user_id: user.id });
        const eventIds = likes.map(l => l.event_id);
        if (eventIds.length === 0) return [];

        const events = await Promise.all(
          eventIds.map(async id => {
            try {
              const eventList = await base44.entities.Event.filter({ id });
              return eventList[0] || null;
            } catch {
              return null;
            }
          })
        );
        return events.filter(e => e !== null);
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
    initialData: [],
    ...CACHE_CONFIG.LONG,
  });

  // Buscar solicitações feitas (para usuários)
  const { data: myRequests = [] } = useQuery({
    queryKey: ['myRequests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await base44.entities.EventRequest.filter({ user_id: user.id }, "-created_date");
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
    initialData: [],
    ...CACHE_CONFIG.MEDIUM,
  });

  // NOVO: Buscar eventos das solicitações com status e detalhes
  const { data: requestsWithEvents = [] } = useQuery({
    queryKey: ['requestsWithEvents', user?.id, myRequests],
    queryFn: async () => {
      if (!user?.id || !myRequests || myRequests.length === 0) return [];
      try {
        const eventIds = [...new Set(myRequests.map(r => r.event_id))];
        
        const eventsPromises = eventIds.map(async id => {
          try {
            const eventList = await base44.entities.Event.filter({ id });
            return eventList[0] || null;
          } catch {
            return null;
          }
        });

        const events = await Promise.all(eventsPromises);
        
        // Combinar eventos com suas solicitações
        const combined = myRequests.map(request => {
          const event = events.find(e => e && e.id === request.event_id);
          return {
            ...request,
            event: event
          };
        }).filter(item => item.event !== null);

        return combined.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      } catch {
        return [];
      }
    },
    enabled: !!user?.id && !!myRequests && myRequests.length > 0,
    initialData: [],
    ...CACHE_CONFIG.MEDIUM,
  });

  const { data: userTickets = [] } = useQuery({
    queryKey: ['userTickets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await base44.entities.Ticket.filter({ user_id: user.id });
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
    initialData: [],
    ...CACHE_CONFIG.MEDIUM,
  });

  const { data: userReels = [] } = useQuery({
    queryKey: ['userReels', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await base44.entities.Reel.filter({ user_id: user.id });
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
    initialData: [],
    ...CACHE_CONFIG.LONG,
  });

  const followersCount = followersData?.length || 0;
  const followingCount = followingData?.length || 0;

  // CORREÇÃO: Mutation para salvar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      console.log('📤 Enviando atualização de perfil:', data);
      
      try {
        const result = await base44.auth.updateMe(data);
        console.log('✅ Resposta da atualização:', result);
        return result;
      } catch (error) {
        console.error('❌ Erro ao atualizar perfil:', error);
        throw error;
      }
    },
    onSuccess: async (updatedData) => {
      console.log('✅ Perfil atualizado com sucesso:', updatedData);
      
      // Aguardar um pouco antes de refetch para garantir que o backend processou
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Invalidar queries para atualizar UI e refetch o usuário para pegar os dados mais recentes (ex: name_change_count)
      await queryClient.invalidateQueries(['currentUser']);
      await refetchUser(); // Explicitly refetch the current user data after update

      // Se organizador, sincronizar eventos
      if (user?.is_organizer) {
        console.log('🔄 Sincronizando eventos do organizador...');
        try {
          const myEvents = await base44.entities.Event.filter({ organizer_id: user.id });
          
          if (myEvents && myEvents.length > 0) {
            console.log(`🔄 Atualizando ${myEvents.length} evento(s)...`);
            for (const event of myEvents) {
              try {
                await base44.entities.Event.update(event.id, {
                  organizer: editForm.full_name || user.full_name, // Use fallback in case editForm is empty
                  organizer_avatar: editForm.avatar_url || user.avatar_url // Use fallback
                });
              } catch (eventError) {
                console.error(`Erro ao sincronizar evento ${event.id}:`, eventError);
              }
            }
            
            // Invalida o cache dos eventos para forçar a atualização
            queryClient.invalidateQueries(['feedEvents']);
            queryClient.invalidateQueries(['discoverEvents']);
            queryClient.invalidateQueries(['mapEvents']);
            queryClient.invalidateQueries(['createdEvents']);
          }
        } catch (syncError) {
          console.error("Erro ao sincronizar eventos:", syncError);
        }
      }
      
      // Mostrar mensagem de sucesso e fechar modal
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setShowEditModal(false);
      }, 2000); // Hide message and close modal after 2 seconds
    },
    onError: (error) => {
      console.error("❌ Erro na mutation:", error);
      alert("❌ Erro ao atualizar perfil. Tente novamente.");
    }
  });

  const handleSaveProfile = async () => {
    console.log('💾 Iniciando salvamento do perfil...');
    console.log('📝 Dados do formulário:', editForm);
    
    // CORREÇÃO: Validação segura com verificação de undefined
    const trimmedName = (editForm.full_name || "").trim();
    
    if (!trimmedName || trimmedName.length === 0) {
      alert("❌ O nome não pode estar vazio");
      return;
    }

    const nameChanged = trimmedName !== originalName;
    console.log('🔍 Nome mudou?', nameChanged, {
      novo: trimmedName,
      original: originalName
    });

    if (nameChanged && nameChangeCount >= 3) {
      alert("❌ Limite de alterações de nome atingido (3 vezes).");
      return;
    }

    // CORREÇÃO: Criar objeto com valores seguros
    const updateData = {
      full_name: trimmedName,
      bio: editForm.bio || "",
      avatar_url: editForm.avatar_url || DEFAULT_AVATAR,
      phone: editForm.phone || "",
      address_full: editForm.address_full || "",
      city: editForm.city || "",
      state: editForm.state || "",
      postal_code: editForm.postal_code || "",
      music_preferences: editForm.music_preferences || []
    };

    // CORREÇÃO: Adicionar name_change_count APENAS se o nome mudou
    if (nameChanged) {
      updateData.name_change_count = nameChangeCount + 1;
      console.log('📊 Incrementando contador de alterações:', nameChangeCount + 1);
    }

    console.log('📤 Objeto de atualização final:', updateData);

    // Usar mutation para enviar os dados
    updateProfileMutation.mutate(updateData);

    // Atualizar estados locais para feedback imediato na UI (antes do refetch completo)
    if (nameChanged) {
      setNameChangeCount(nameChangeCount + 1); // Atualiza o contador local
      setOriginalName(trimmedName); // Atualiza o nome original para futuras comparações
    }
    // Remove direct alert for success, handled by mutation.onSuccess
  };

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      navigate(createPageUrl("BemVindo"));
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      navigate(createPageUrl("BemVindo"));
      window.location.reload(); // Fallback for hard refresh
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert("❌ Por favor, selecione uma imagem válida.");
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("❌ A imagem deve ter no máximo 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditForm(prev => ({ ...prev, avatar_url: file_url }));
      alert("✅ Imagem carregada com sucesso!");
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("❌ Falha no upload da imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
      e.target.value = null; // Clear the input so same file can be selected again
    }
  };

  const requestMutation = useMutation({
    mutationFn: async ({ requestId, action }) => {
      await base44.entities.EventRequest.update(requestId, { status: action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['eventRequests']);
      queryClient.invalidateQueries(['guestList']);
    }
  });

  const handleRequestAction = async (requestId, action) => {
    try {
      await requestMutation.mutateAsync({ requestId, action });
      alert(`✅ Solicitação ${action === 'approved' ? 'aprovada' : 'negada'}!`);
    } catch (error) {
      console.error("Erro:", error);
      alert("❌ Erro ao processar solicitação.");
    }
  };

  const handleGenreToggle = (genre) => {
    setEditForm(prev => {
      const current = prev.music_preferences || [];
      if (current.includes(genre)) {
        return {
          ...prev,
          music_preferences: current.filter(g => g !== genre)
        };
      } else {
        return {
          ...prev,
          music_preferences: [...current, genre]
        };
      }
    });
  };

  if (loadingUser) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-500 animate-spin" />
          <p className="text-gray-400">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) return null; // Should not happen if navigate in useQuery is effective, but good fallback

  const totalPosts = (user.stats?.photos_shared || 0) + (user.stats?.videos_shared || 0) + (userReels?.length || 0);
  const canChangeName = nameChangeCount < 3;
  const remainingChanges = 3 - nameChangeCount;

  // List of all possible music genres for selection in the edit modal
  const allGenres = MUSIC_GENRES;

  // CORREÇÃO: Verificação segura para comparação de nomes
  const currentNameValue = editForm.full_name || "";
  const isNameChanged = currentNameValue.trim() !== originalName;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 text-white">
      {/* Success Toast */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span className="font-semibold">Perfil atualizado com sucesso!</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-semibold truncate">{user.full_name || user.email?.split('@')[0]}</h1>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("Configuracoes"))}
            className="h-8 w-8 sm:h-10 sm:w-10"
          >
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowLogoutDialog(true)}
            className="h-8 w-8 sm:h-10 sm:w-10 text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </div>
      </div>

      <div className="mb-4 sm:mb-6">
        <div className="flex items-start gap-4 sm:gap-6 mb-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-gray-700">
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex gap-4 sm:gap-8 mb-3 sm:mb-4">
              <div className="text-center">
                <div className="text-base sm:text-xl font-bold">{totalPosts}</div>
                <div className="text-xs sm:text-sm text-gray-400">posts</div>
              </div>
              <div 
                className="text-center cursor-pointer hover:text-gray-300"
                onClick={() => setShowFollowersModal(true)} // Made clickable
              >
                <div className="text-base sm:text-xl font-bold">{followersCount}</div>
                <div className="text-xs sm:text-sm text-gray-400">seguidores</div>
              </div>
              <div 
                className="text-center cursor-pointer hover:text-gray-300"
                onClick={() => setShowFollowingModal(true)} // Made clickable
              >
                <div className="text-base sm:text-xl font-bold">{followingCount}</div>
                <div className="text-xs sm:text-sm text-gray-400">seguindo</div>
              </div>
            </div>

            {/* Desktop Buttons - COM DASHBOARD */}
            <div className="hidden sm:flex gap-2">
              <Button
                onClick={() => setShowEditModal(true)}
                variant="outline"
                className="flex-1 bg-gray-800 border-gray-600 hover:bg-gray-700 text-sm"
              >
                Editar Perfil
              </Button>
              {user.is_organizer && (
                <>
                  <Button
                    onClick={() => navigate(createPageUrl("DashboardOrganizador"))}
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-sm"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button
                    onClick={() => navigate(createPageUrl("MeusEventos"))}
                    className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-sm"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Meus Eventos
                  </Button>
                </>
              )}
              {!user.is_pro_member && (
                <Button
                  onClick={() => navigate(createPageUrl("Planos"))}
                  className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 text-sm"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Pro
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="font-semibold mb-1 text-sm sm:text-base">{user.full_name}</div>
          {user.bio && <div className="text-xs sm:text-sm text-gray-300">{user.bio}</div>}

          <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
            {user.is_pro_member && (
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-[10px] sm:text-xs">
                PRO
              </Badge>
            )}
            {user.is_organizer && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 border-0 text-[10px] sm:text-xs">
                Organizador
              </Badge>
            )}
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-300 text-[10px] sm:text-xs">
              Nível {user.underground_level || 1}
            </Badge>
          </div>

          {/* NOVO: Gêneros Favoritos */}
          {user.music_preferences && user.music_preferences.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <Music className="w-4 h-4 text-purple-400" />
                <span className="text-xs sm:text-sm font-semibold text-purple-300">Gêneros Favoritos</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {user.music_preferences.map(genre => (
                  <Badge 
                    key={genre} 
                    className="bg-purple-500/20 border-purple-500/30 text-purple-300 text-[10px] sm:text-xs"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Buttons */}
        <div className="flex sm:hidden gap-2 mb-4">
          <Button
            onClick={() => setShowEditModal(true)}
            variant="outline"
            className="flex-1 bg-gray-800 border-gray-600 hover:bg-gray-700 h-9 text-xs"
          >
            Editar Perfil
          </Button>
          {user.is_organizer && (
            <>
              <Button
                onClick={() => navigate(createPageUrl("DashboardOrganizador"))}
                className="bg-gradient-to-r from-cyan-600 to-purple-600 h-9 px-3"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("MeusEventos"))}
                className="bg-gradient-to-r from-yellow-600 to-orange-600 h-9 px-3"
              >
                <Calendar className="w-4 h-4" />
              </Button>
            </>
          )}
          {!user.is_pro_member && (
            <Button
              onClick={() => navigate(createPageUrl("Planos"))}
              className="bg-gradient-to-r from-yellow-600 to-orange-600 h-9 px-3"
            >
              <Crown className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-3 sm:gap-4 py-3 border-t border-b border-gray-800 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
            <span className="text-gray-400">{pastEvents.length} eventos</span> {/* Updated to pastEvents */}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
            <span className="text-gray-400">{user.location?.city || user.city || "São Paulo"}</span>
          </div>
        </div>
      </div>

      {/* TABS DIFERENTES PARA ORGANIZADOR E USUÁRIO */}
      {user.is_organizer ? (
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="events">Eventos ({createdEvents?.length || 0})</TabsTrigger>
            <TabsTrigger value="requests">Solicitações ({eventRequests?.length || 0})</TabsTrigger>
            <TabsTrigger value="guests">Convidados ({guestList?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-4">
            {createdEvents && createdEvents.length > 0 ? (
              <div className="grid gap-4">
                {createdEvents.map(event => (
                  <Card key={event.id} className="bg-gray-900/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-sm sm:text-base">{event.title}</CardTitle>
                      <p className="text-xs sm:text-sm text-gray-400">
                        {format(new Date(event.date), "PPP", { locale: ptBR })}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                          <Users className="w-4 h-4" />
                          {event.current_attendees}/{event.max_capacity} participantes
                        </div>
                        <Button
                          onClick={() => navigate(createPageUrl("MeusEventos"))}
                          size="sm"
                          className="bg-cyan-600 hover:bg-cyan-700"
                        >
                          Gerenciar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-900/50 rounded-lg">
                <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-sm sm:text-base mb-4">Nenhum evento criado ainda</p>
                <Button onClick={() => navigate(createPageUrl("CriarEvento"))} className="text-sm">
                  Criar Evento
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-4">
            {eventRequests && eventRequests.length > 0 ? (
              <div className="space-y-4">
                {eventRequests.map(request => (
                  <Card key={request.id} className="bg-gray-900/50 border-gray-700">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-white text-sm sm:text-base">Solicitação para evento</p>
                          <p className="text-xs sm:text-sm text-gray-400">Usuário: {request.user_id}</p>
                          {request.message && (
                            <p className="text-xs sm:text-sm text-gray-300 mt-2 bg-gray-800/50 p-2 rounded">
                              "{request.message}"
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleRequestAction(request.id, 'approved')} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRequestAction(request.id, 'denied')} className="border-red-600 text-red-400">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-900/50 rounded-lg">
                <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-sm sm:text-base">Nenhuma solicitação pendente</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="guests" className="mt-4">
            {guestList && guestList.length > 0 ? (
              <div className="space-y-4">
                {guestList.map(guest => (
                  <Card key={guest.id} className="bg-gray-900/50 border-gray-700">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white text-sm sm:text-base">Convidado aprovado</p>
                          <p className="text-xs sm:text-sm text-gray-400">Usuário: {guest.user_id}</p>
                          <Badge className="mt-2 bg-green-600 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Aprovado
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-900/50 rounded-lg">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-sm sm:text-base">Nenhum convidado ainda</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Tabs defaultValue="tickets" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="tickets">Ingressos ({upcomingTicketEvents.length})</TabsTrigger>
            <TabsTrigger value="past">Histórico</TabsTrigger>
            <TabsTrigger value="connections">Conexões</TabsTrigger>
          </TabsList>

          {/* TAB: Meus Ingressos (Eventos Aprovados Futuros) */}
          <TabsContent value="tickets" className="mt-4">
            {upcomingTicketEvents && upcomingTicketEvents.length > 0 ? (
              <div className="grid gap-4">
                {upcomingTicketEvents.map(event => (
                  <Card key={event.id} className="bg-gray-900/50 border-green-500/30 hover:border-green-500/50 transition-all overflow-hidden">
                    <div className="flex">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
                        <img
                          src={event.image_url || `https://picsum.photos/300/300?random=${event.id}`}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="flex-1 p-3 sm:p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-sm sm:text-base mb-1 line-clamp-1">
                              {event.title}
                            </h3>
                            <Badge className="bg-green-600/20 border-green-500/30 text-green-300 text-[10px]">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Aprovado
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-xs sm:text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                            <span>{format(new Date(event.date), "PPP 'às' HH:mm", { locale: ptBR })}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                            <span className="truncate">{event.location?.venue_name || event.location?.city}</span>
                          </div>
                        </div>

                        <Button 
                          onClick={() => navigate(createPageUrl("Feed"))}
                          size="sm"
                          className="w-full mt-3 bg-green-600 hover:bg-green-700 text-xs"
                        >
                          Ver Ingresso
                        </Button>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-900/50 rounded-lg">
                <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-2">
                  Nenhum ingresso aprovado
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 px-4 mb-4">
                  Solicite acesso a eventos secretos para receber ingressos
                </p>
                <Button onClick={() => navigate(createPageUrl("Feed"))} className="text-sm">
                  Explorar Eventos
                </Button>
              </div>
            )}
          </TabsContent>

          {/* TAB: Histórico - MELHORADO COM SUB-TABS */}
          <TabsContent value="past" className="mt-4">
            <Tabs defaultValue="participated" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
                <TabsTrigger value="participated" className="text-xs sm:text-sm">
                  Participados ({pastTicketEvents.length})
                </TabsTrigger>
                <TabsTrigger value="liked" className="text-xs sm:text-sm">
                  Curtidos ({likedEvents.length})
                </TabsTrigger>
                <TabsTrigger value="requested" className="text-xs sm:text-sm">
                  Solicitados ({myRequests.length})
                </TabsTrigger>
              </TabsList>

              {/* SUB-TAB: Eventos Participados */}
              <TabsContent value="participated" className="mt-4">
                {pastTicketEvents && pastTicketEvents.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-base sm:text-lg font-semibold">Eventos que você participou</h3>
                    </div>
                    <div className="grid gap-3">
                      {pastTicketEvents.map(event => (
                        <EventHistoryCard key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-700">
                    <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-2">
                      Nenhum evento participado
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 px-4 mb-4">
                      Quando você participar de eventos, eles aparecerão aqui
                    </p>
                    <Button onClick={() => navigate(createPageUrl("Feed"))} className="text-sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      Explorar Eventos
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* SUB-TAB: Eventos Curtidos */}
              <TabsContent value="liked" className="mt-4">
                {likedEvents && likedEvents.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="w-5 h-5 text-pink-400" />
                      <h3 className="text-base sm:text-lg font-semibold">Eventos que você curtiu</h3>
                    </div>
                    <div className="grid gap-3">
                      {likedEvents.map(event => (
                        <Card key={event.id} className="bg-gray-900/50 border-gray-700 hover:border-pink-500/50 transition-all overflow-hidden group">
                          <div className="flex">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 relative overflow-hidden">
                              <img
                                src={event.image_url || `https://picsum.photos/300/300?random=${event.id}`}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute top-2 right-2 bg-pink-600 rounded-full p-1.5">
                                <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-white fill-white" />
                              </div>
                            </div>
                            <CardContent className="flex-1 p-3 sm:p-4">
                              <h3 className="font-semibold text-white text-sm sm:text-base mb-2 line-clamp-1 group-hover:text-pink-400 transition-colors">
                                {event.title}
                              </h3>
                              
                              <div className="space-y-1 text-xs sm:text-sm text-gray-400">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                                  <span>{format(new Date(event.date), "PPP 'às' HH:mm", { locale: ptBR })}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                                  <span className="truncate">{event.location?.venue_name || event.location?.city}</span>
                                </div>

                                {event.genre && (
                                  <div className="flex items-center gap-2">
                                    <Music className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                                    <Badge variant="outline" className="border-green-500/30 text-green-300 text-[10px]">
                                      {event.genre}
                                    </Badge>
                                  </div>
                                )}
                              </div>

                              <Button 
                                onClick={() => navigate(createPageUrl(`Mapa`))}
                                size="sm"
                                variant="outline"
                                className="w-full mt-3 border-pink-500/30 text-pink-400 hover:bg-pink-500/10 text-xs"
                              >
                                Ver Detalhes
                              </Button>
                            </CardContent>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-700">
                    <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-2">
                      Nenhum evento curtido
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 px-4 mb-4">
                      Curta eventos para salvá-los e acompanhar as novidades
                    </p>
                    <Button onClick={() => navigate(createPageUrl("Feed"))} className="text-sm">
                      <Heart className="w-4 h-4 mr-2" />
                      Explorar Eventos
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* SUB-TAB: Eventos Solicitados */}
              <TabsContent value="requested" className="mt-4">
                {requestsWithEvents && requestsWithEvents.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-yellow-400" />
                      <h3 className="text-base sm:text-lg font-semibold">Solicitações de acesso</h3>
                    </div>
                    <div className="grid gap-3">
                      {requestsWithEvents.map(item => (
                        <Card 
                          key={item.id} 
                          className={`bg-gray-900/50 border-gray-700 hover:border-opacity-100 transition-all overflow-hidden group ${
                            item.status === 'approved' ? 'border-green-500/30' : 
                            item.status === 'denied' ? 'border-red-500/30' : 
                            'border-yellow-500/30'
                          }`}
                        >
                          <div className="flex">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 relative overflow-hidden">
                              <img
                                src={item.event.image_url || `https://picsum.photos/300/300?random=${item.event.id}`}
                                alt={item.event.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              {/* Status Badge no canto */}
                              <div className={`absolute top-2 right-2 rounded-full p-1.5 ${
                                item.status === 'approved' ? 'bg-green-600' : 
                                item.status === 'denied' ? 'bg-red-600' : 
                                'bg-yellow-600'
                              }`}>
                                {item.status === 'approved' ? (
                                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                ) : item.status === 'denied' ? (
                                  <X className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                ) : (
                                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                )}
                              </div>
                            </div>
                            <CardContent className="flex-1 p-3 sm:p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-white text-sm sm:text-base line-clamp-1 flex-1">
                                  {item.event.title}
                                </h3>
                                <Badge className={`ml-2 text-[10px] ${
                                  item.status === 'approved' ? 'bg-green-600/20 border-green-500/30 text-green-300' : 
                                  item.status === 'denied' ? 'bg-red-600/20 border-red-500/30 text-red-300' : 
                                  'bg-yellow-600/20 border-yellow-500/30 text-yellow-300'
                                }`}>
                                  {item.status === 'approved' ? 'Aprovado' : 
                                   item.status === 'denied' ? 'Negado' : 
                                   'Pendente'}
                                </Badge>
                              </div>
                              
                              <div className="space-y-1 text-xs sm:text-sm text-gray-400 mb-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                                  <span>{format(new Date(item.event.date), "PPP 'às' HH:mm", { locale: ptBR })}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                                  <span className="truncate">{item.event.location?.venue_name || item.event.location?.city}</span>
                                </div>
                              </div>

                              {/* Mensagem enviada */}
                              {item.message && (
                                <div className="bg-gray-800/50 rounded p-2 mb-2">
                                  <p className="text-xs text-gray-400 mb-1">Sua mensagem:</p>
                                  <p className="text-xs text-gray-300 italic">"{item.message}"</p>
                                </div>
                              )}

                              {/* Resposta do organizador */}
                              {item.organizer_response && (
                                <div className={`rounded p-2 mb-2 ${
                                  item.status === 'approved' ? 'bg-green-900/20' : 'bg-red-900/20'
                                }`}>
                                  <p className={`text-xs mb-1 ${
                                    item.status === 'approved' ? 'text-green-400' : 'text-red-400'
                                  }`}>
                                    Resposta do organizador:
                                  </p>
                                  <p className="text-xs text-gray-300 italic">"{item.organizer_response}"</p>
                                </div>
                              )}

                              {/* Botões de ação baseados no status */}
                              {item.status === 'approved' ? (
                                <Button 
                                  onClick={() => navigate(createPageUrl("Feed"))}
                                  size="sm"
                                  className="w-full bg-green-600 hover:bg-green-700 text-xs"
                                >
                                  <CheckCircle className="w-3 h-3 mr-2" />
                                  Ver Ingresso
                                </Button>
                              ) : item.status === 'pending' ? (
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 text-xs"
                                    disabled
                                  >
                                    <Clock className="w-3 h-3 mr-2" />
                                    Aguardando
                                  </Button>
                                  <Button 
                                    onClick={() => navigate(createPageUrl("Mapa"))}
                                    size="sm"
                                    variant="outline"
                                    className="border-gray-600 text-xs"
                                  >
                                    Ver Evento
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  onClick={() => navigate(createPageUrl("Feed"))}
                                  size="sm"
                                  variant="outline"
                                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                                >
                                  Explorar Outros Eventos
                                </Button>
                              )}

                              <div className="mt-2 text-[10px] text-gray-500 text-center">
                                Solicitado em {format(new Date(item.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </div>
                            </CardContent>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-700">
                    <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-2">
                      Nenhuma solicitação feita
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 px-4 mb-4">
                      Solicite acesso a eventos secretos e acompanhe aqui o status
                    </p>
                    <Button onClick={() => navigate(createPageUrl("Feed"))} className="text-sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      Explorar Eventos Secretos
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* TAB: Conexões Sociais */}
          <TabsContent value="connections" className="mt-4">
            <div className="space-y-6">
              {/* Seguidores */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    Seguidores ({followersCount})
                  </h3>
                  {followersCount > 3 && ( // Only show "Ver Todos" if more than 3
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowFollowersModal(true)}
                      className="text-cyan-400"
                    >
                      Ver Todos
                    </Button>
                  )}
                </div>
                {followersUsers && followersUsers.length > 0 ? (
                  <div className="grid gap-3">
                    {followersUsers.slice(0, 3).map(follower => ( // Display max 3
                      <Card key={follower.id} className="bg-gray-900/50 border-gray-700">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img 
                              src={follower.avatar_url || DEFAULT_AVATAR}
                              alt={follower.full_name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500/30"
                            />
                            <div>
                              <p className="font-semibold text-white">{follower.full_name}</p>
                              <p className="text-sm text-gray-400">
                                {follower.music_preferences?.slice(0, 2).join(', ') || 'Sem gêneros'}
                              </p>
                            </div>
                          </div>
                          <FollowButton 
                            targetUserId={follower.id}
                            currentUserId={user.id}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-900/50 rounded-lg border border-gray-700">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Nenhum seguidor ainda</p>
                  </div>
                )}
              </div>

              {/* Seguindo */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    Seguindo ({followingCount})
                  </h3>
                  {followingCount > 3 && ( // Only show "Ver Todos" if more than 3
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowFollowingModal(true)}
                      className="text-purple-400"
                    >
                      Ver Todos
                    </Button>
                  )}
                </div>
                {followingUsers && followingUsers.length > 0 ? (
                  <div className="grid gap-3">
                    {followingUsers.slice(0, 3).map(following => ( // Display max 3
                      <Card key={following.id} className="bg-gray-900/50 border-gray-700">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img 
                              src={following.avatar_url || DEFAULT_AVATAR}
                              alt={following.full_name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/30"
                            />
                            <div>
                              <p className="font-semibold text-white">{following.full_name}</p>
                              <p className="text-sm text-gray-400">
                                {following.music_preferences?.slice(0, 2).join(', ') || 'Sem gêneros'}
                              </p>
                            </div>
                          </div>
                          <FollowButton 
                            targetUserId={following.id}
                            currentUserId={user.id}
                            isFollowing={true} // Assume they are following if in this list
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-900/50 rounded-lg border border-gray-700">
                    <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Você não está seguindo ninguém</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Edit Profile Modal - MELHORADO */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-gray-900 border-purple-500 text-white max-w-md max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              Editar Perfil
              {updateProfileMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Avatar com Preview */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-600">
                  {isUploading ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                    </div>
                  ) : (
                    <img
                      src={editForm.avatar_url || DEFAULT_AVATAR}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute bottom-0 right-0 bg-cyan-600 hover:bg-cyan-700 rounded-full p-2 cursor-pointer transition-colors"
                >
                  <Camera className="w-4 h-4 text-white" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUploading || updateProfileMutation.isPending}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Clique na câmera para alterar (máx 5MB)</p>
            </div>

            {/* Nome com contador */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs sm:text-sm text-gray-400 block">Nome Completo *</label>
                {!canChangeName ? (
                  <span className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Limite atingido (3/3)
                  </span>
                ) : (
                  <span className="text-xs text-cyan-400">
                    Alterações restantes: {remainingChanges}/3
                  </span>
                )}
              </div>
              <Input
                value={currentNameValue}
                onChange={(e) => {
                  console.log('✏️ Nome alterado para:', e.target.value);
                  setEditForm(prev => ({ ...prev, full_name: e.target.value }));
                }}
                className="bg-gray-800 border-gray-600 text-sm"
                disabled={!canChangeName || updateProfileMutation.isPending}
                placeholder="Seu nome completo"
              />
              {isNameChanged && canChangeName && (
                <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded">
                  <p className="text-xs text-yellow-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>
                      Nome será alterado de "<strong>{originalName || '(vazio)'}</strong>" para "<strong>{currentNameValue}</strong>"
                    </span>
                  </p>
                  <p className="text-xs text-yellow-300 mt-1">
                    Esta alteração será permanente e contará como 1 das 3 alterações permitidas.
                  </p>
                </div>
              )}
              
              {/* Debug Info */}
              {/* <div className="mt-2 p-2 bg-gray-800/50 rounded text-xs text-gray-500">
                <p>🔍 Debug:</p>
                <p>Original: {originalName || '(vazio)'}</p>
                <p>Atual: {currentNameValue || '(vazio)'}</p>
                <p>Mudou: {isNameChanged ? 'SIM ✅' : 'NÃO'}</p>
                <p>Contador: {nameChangeCount}/3</p>
              </div> */}
            </div>

            {/* Bio com contador de caracteres */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs sm:text-sm text-gray-400 block">Bio</label>
                <span className="text-xs text-gray-500">
                  {(editForm.bio || '').length}/200
                </span>
              </div>
              <Textarea
                value={editForm.bio || ""}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                className="bg-gray-800 border-gray-600 h-20 sm:h-24 text-sm resize-none"
                placeholder="Conte sobre você..."
                maxLength={200}
                disabled={updateProfileMutation.isPending}
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="text-xs sm:text-sm text-gray-400 mb-1 block">Telefone</label>
              <Input
                value={editForm.phone || ""}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-sm"
                placeholder="(11) 99999-9999"
                disabled={updateProfileMutation.isPending}
              />
            </div>

            {/* Endereço */}
            <div>
              <label className="text-xs sm:text-sm text-gray-400 mb-1 block">Endereço</label>
              <Input
                value={editForm.address_full || ""}
                onChange={(e) => setEditForm(prev => ({ ...prev, address_full: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-sm"
                placeholder="Rua, número, complemento"
                disabled={updateProfileMutation.isPending}
              />
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs sm:text-sm text-gray-400 mb-1 block">Cidade</label>
                <Input
                  value={editForm.city || ""}
                  onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-sm"
                  placeholder="São Paulo"
                  disabled={updateProfileMutation.isPending}
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm text-gray-400 mb-1 block">Estado</label>
                <Input
                  value={editForm.state || ""}
                  onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-sm"
                  placeholder="SP"
                  maxLength={2}
                  disabled={updateProfileMutation.isPending}
                />
              </div>
            </div>

            {/* CEP */}
            <div>
              <label className="text-xs sm:text-sm text-gray-400 mb-1 block">CEP</label>
              <Input
                value={editForm.postal_code || ""}
                onChange={(e) => setEditForm(prev => ({ ...prev, postal_code: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-sm"
                placeholder="00000-000"
                disabled={updateProfileMutation.isPending}
              />
            </div>

            {/* Gêneros Favoritos */}
            <div>
              <label className="text-xs sm:text-sm text-gray-400 mb-2 block flex items-center gap-2">
                <Music className="w-4 h-4 text-purple-400" />
                Gêneros Favoritos
              </label>
              <div className="flex flex-wrap gap-2">
                {allGenres.map(genre => {
                  const isSelected = (editForm.music_preferences || []).includes(genre);
                  return (
                    <Badge
                      key={genre}
                      onClick={() => !updateProfileMutation.isPending && handleGenreToggle(genre)}
                      className={`cursor-pointer transition-all text-xs ${
                        isSelected
                          ? 'bg-purple-600 hover:bg-purple-700 border-purple-500'
                          : 'bg-gray-800 hover:bg-gray-700 border-gray-600'
                      } ${updateProfileMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSelected && <CheckCircle className="w-3 h-3 mr-1" />}
                      {genre}
                    </Badge>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Selecione seus gêneros favoritos para recomendações personalizadas
              </p>
            </div>

            {/* Divisor */}
            <div className="border-t border-gray-700 my-4"></div>

            {/* Campos NÃO Editáveis */}
            <div className="space-y-3">
              <p className="text-xs text-gray-500 uppercase font-semibold">Dados não editáveis</p>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email</label>
                <Input
                  value={editForm.email || ""}
                  className="bg-gray-800/50 border-gray-700 text-sm text-gray-500"
                  disabled
                />
              </div>

              {editForm.cpf && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">CPF</label>
                  <Input
                    value={editForm.cpf}
                    className="bg-gray-800/50 border-gray-700 text-sm text-gray-500"
                    disabled
                  />
                </div>
              )}

              {user.is_organizer && editForm.cnpj && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">CNPJ</label>
                  <Input
                    value={editForm.cnpj}
                    className="bg-gray-800/50 border-gray-700 text-sm text-gray-500"
                    disabled
                  />
                </div>
              )}
            </div>

            {/* Aviso */}
            {nameChangeCount >= 2 && nameChangeCount < 3 && (
              <Alert className="bg-yellow-900/20 border-yellow-500/50">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-xs text-yellow-200">
                  ⚠️ Atenção: Esta é sua ÚLTIMA alteração de nome disponível!
                </AlertDescription>
              </Alert>
            )}

            {nameChangeCount >= 3 && (
              <Alert className="bg-red-900/20 border-red-500/50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-xs text-red-200">
                  🚫 Você atingiu o limite de 3 alterações de nome.
                </AlertDescription>
              </Alert>
            )}

            {/* Botões */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="flex-1 border-gray-600 text-sm"
                disabled={updateProfileMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveProfile}
                className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 text-sm"
                disabled={updateProfileMutation.isPending || isUploading}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Lista de Seguidores */}
      <Dialog open={showFollowersModal} onOpenChange={setShowFollowersModal}>
        <DialogContent className="bg-gray-900 border-cyan-500 text-white max-w-md max-h-[70vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Seguidores ({followersCount})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {followersUsers && followersUsers.length > 0 ? (
              followersUsers.map(follower => (
                <div key={follower.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img 
                      src={follower.avatar_url || DEFAULT_AVATAR}
                      alt={follower.full_name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-cyan-500/30"
                    />
                    <div>
                      <p className="font-semibold text-white text-sm">{follower.full_name}</p>
                      <p className="text-xs text-gray-400">
                        {follower.music_preferences?.slice(0, 2).join(', ') || 'Sem gêneros'}
                      </p>
                    </div>
                  </div>
                  <FollowButton 
                    targetUserId={follower.id}
                    currentUserId={user.id}
                    size="sm"
                  />
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-8">Nenhum seguidor</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Lista de Seguindo */}
      <Dialog open={showFollowingModal} onOpenChange={setShowFollowingModal}>
        <DialogContent className="bg-gray-900 border-purple-500 text-white max-w-md max-h-[70vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Seguindo ({followingCount})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {followingUsers && followingUsers.length > 0 ? (
              followingUsers.map(following => (
                <div key={following.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img 
                      src={following.avatar_url || DEFAULT_AVATAR}
                      alt={following.full_name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/30"
                    />
                    <div>
                      <p className="font-semibold text-white text-sm">{following.full_name}</p>
                      <p className="text-xs text-gray-400">
                        {following.music_preferences?.slice(0, 2).join(', ') || 'Sem gêneros'}
                      </p>
                    </div>
                  </div>
                  <FollowButton 
                    targetUserId={following.id}
                    currentUserId={user.id}
                    isFollowing={true} // Assume they are following if in this list
                  />
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-8">Você não está seguindo ninguém</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-gray-900 border-red-500/50 text-white max-w-md mx-4 sm:mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Sair da Conta</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-xs sm:text-sm">
              Tem certeza que deseja sair? Você precisará fazer login novamente para acessar sua conta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="bg-gray-800 border-gray-600 hover:bg-gray-700 text-sm w-full sm:w-auto">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-sm w-full sm:w-auto"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
