
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Radio, Users, MessageSquare, Image as ImageIcon, Video,
  Bell, TrendingUp, Send, ThumbsUp, Clock, AlertCircle,
  CheckCircle, MapPin, Camera, Upload, BarChart3, Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import EventChatPanel from "../components/chat/EventChatPanel";
import DirectMessageModal from "../components/chat/DirectMessageModal";

export default function EventoAoVivo() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  
  // Estados para features
  const [newQuestion, setNewQuestion] = useState("");
  const [newPost, setNewPost] = useState({ caption: "", media: null, type: "photo" });
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Estados para organizador
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    type: "info",
    is_important: false
  });
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [newPoll, setNewPoll] = useState({
    question: "",
    options: ["", ""],
    allow_multiple: false
  });
  const [showPollDialog, setShowPollDialog] = useState(false);

  // Estados para chat
  const [showDirectMessage, setShowDirectMessage] = useState(false);
  const [selectedUserForDM, setSelectedUserForDM] = useState(null);

  useEffect(() => {
    loadEventData();
  }, []);

  const loadEventData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');

    if (!eventId) {
      alert("❌ ID do evento não fornecido");
      navigate(createPageUrl("Feed"));
      return;
    }

    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const eventsList = await base44.entities.Event.filter({ id: eventId });
      if (!eventsList || eventsList.length === 0) {
        alert("❌ Evento não encontrado");
        navigate(createPageUrl("Feed"));
        return;
      }

      const eventData = eventsList[0];
      setEvent(eventData);
      setIsOrganizer(eventData.organizer_id === userData.id);

      // Verificar se já fez check-in
      const checkIns = await base44.entities.EventCheckIn.filter({
        event_id: eventId,
        user_id: userData.id
      });
      setHasCheckedIn(checkIns.length > 0);

    } catch (error) {
      console.error("Erro ao carregar evento:", error);
      navigate(createPageUrl("BemVindo"));
    } finally {
      setLoading(false);
    }
  };

  // Query: Check-ins em tempo real
  const { data: checkIns = [] } = useQuery({
    queryKey: ['eventCheckIns', event?.id],
    queryFn: async () => {
      if (!event) return [];
      return await base44.entities.EventCheckIn.filter({ 
        event_id: event.id,
        status: { $in: ["arrived", "inside"] }
      }, "-check_in_time");
    },
    enabled: !!event,
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });

  // Query: Perguntas
  const { data: questions = [] } = useQuery({
    queryKey: ['eventQuestions', event?.id],
    queryFn: async () => {
      if (!event) return [];
      return await base44.entities.EventQuestion.filter({ event_id: event.id }, "-votes");
    },
    enabled: !!event,
    refetchInterval: 15000,
  });

  // Query: Votações
  const { data: polls = [] } = useQuery({
    queryKey: ['eventPolls', event?.id],
    queryFn: async () => {
      if (!event) return [];
      return await base44.entities.EventPoll.filter({ 
        event_id: event.id,
        is_active: true
      });
    },
    enabled: !!event,
    refetchInterval: 10000,
  });

  // Query: Posts ao vivo
  const { data: livePosts = [] } = useQuery({
    queryKey: ['eventLivePosts', event?.id],
    queryFn: async () => {
      if (!event) return [];
      return await base44.entities.EventLivePost.filter({ 
        event_id: event.id,
        is_visible: true
      }, "-created_date");
    },
    enabled: !!event && hasCheckedIn,
    refetchInterval: 15000,
  });

  // Query: Anúncios
  const { data: announcements = [] } = useQuery({
    queryKey: ['eventAnnouncements', event?.id],
    queryFn: async () => {
      if (!event) return [];
      return await base44.entities.EventAnnouncement.filter({ event_id: event.id }, "-created_date", 10);
    },
    enabled: !!event,
    refetchInterval: 10000,
  });

  // NOVO: Buscar participantes do evento (que fizeram check-in)
  const { data: attendees = [] } = useQuery({
    queryKey: ['eventAttendees', event?.id],
    queryFn: async () => {
      if (!event) return [];
      
      const checkInsList = await base44.entities.EventCheckIn.filter({ event_id: event.id });
      const userIds = [...new Set(checkInsList.map(c => c.user_id))];
      
      if (userIds.length === 0) return [];
      
      // Buscar dados dos usuários
      const users = await Promise.all(
        userIds.map(async id => {
          try {
            const userData = await base44.entities.User.filter({ id });
            return userData[0] || null;
          } catch {
            return null;
          }
        })
      );
      
      return users.filter(u => u !== null);
    },
    enabled: !!event,
    initialData: [],
    refetchInterval: 10000, // Refresh attendee list every 10 seconds
  });

  // Mutation: Check-in
  const checkInMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.EventCheckIn.create({
        event_id: event.id,
        user_id: user.id,
        user_name: user.full_name || user.email.split('@')[0],
        user_avatar: user.avatar_url,
        check_in_time: new Date().toISOString(),
        status: "arrived"
      });
    },
    onSuccess: () => {
      setHasCheckedIn(true);
      queryClient.invalidateQueries(['eventCheckIns']);
      queryClient.invalidateQueries(['eventAttendees']); // Invalidate attendees list too
      alert("✅ Check-in realizado!");
    },
  });

  // Mutation: Fazer pergunta
  const askQuestionMutation = useMutation({
    mutationFn: async (question) => {
      await base44.entities.EventQuestion.create({
        event_id: event.id,
        user_id: user.id,
        user_name: user.full_name || user.email.split('@')[0],
        question,
        is_anonymous: false,
        votes: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['eventQuestions']);
      setNewQuestion("");
      alert("✅ Pergunta enviada!");
    },
  });

  // Mutation: Votar em pergunta
  const voteQuestionMutation = useMutation({
    mutationFn: async (questionId) => {
      const question = questions.find(q => q.id === questionId);
      await base44.entities.EventQuestion.update(questionId, {
        votes: (question.votes || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['eventQuestions']);
    },
  });

  // Mutation: Criar votação (organizador)
  const createPollMutation = useMutation({
    mutationFn: async (pollData) => {
      await base44.entities.EventPoll.create({
        event_id: event.id,
        organizer_id: user.id,
        question: pollData.question,
        options: pollData.options.map((text, idx) => ({
          id: `opt_${Date.now()}_${idx}`,
          text,
          votes: 0
        })),
        allow_multiple: pollData.allow_multiple,
        is_active: true,
        votes_count: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['eventPolls']);
      setShowPollDialog(false);
      setNewPoll({ question: "", options: ["", ""], allow_multiple: false });
      alert("✅ Votação criada!");
    },
  });

  // Mutation: Votar em poll
  const votePollMutation = useMutation({
    mutationFn: async ({ pollId, optionId }) => {
      // Verificar se já votou
      const existingVotes = await base44.entities.EventPollVote.filter({
        poll_id: pollId,
        user_id: user.id
      });

      if (existingVotes.length > 0) {
        alert("❌ Você já votou nesta enquete");
        return;
      }

      // Registrar voto
      await base44.entities.EventPollVote.create({
        poll_id: pollId,
        user_id: user.id,
        option_id: optionId
      });

      // Atualizar contadores
      const poll = polls.find(p => p.id === pollId);
      const updatedOptions = poll.options.map(opt => 
        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
      );

      await base44.entities.EventPoll.update(pollId, {
        options: updatedOptions,
        votes_count: poll.votes_count + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['eventPolls']);
      alert("✅ Voto registrado!");
    },
  });

  // Mutation: Upload de foto/vídeo
  const uploadMediaMutation = useMutation({
    mutationFn: async (mediaData) => {
      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: mediaData.media });

        await base44.entities.EventLivePost.create({
          event_id: event.id,
          user_id: user.id,
          user_name: user.full_name || user.email.split('@')[0],
          user_avatar: user.avatar_url,
          media_type: mediaData.type,
          media_url: file_url,
          caption: mediaData.caption,
          likes_count: 0
        });
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['eventLivePosts']);
      setShowUploadDialog(false);
      setNewPost({ caption: "", media: null, type: "photo" });
      alert("✅ Post compartilhado!");
    },
  });

  // Mutation: Criar anúncio (organizador)
  const createAnnouncementMutation = useMutation({
    mutationFn: async (announcementData) => {
      const announcement = await base44.entities.EventAnnouncement.create({
        event_id: event.id,
        organizer_id: user.id,
        ...announcementData
      });

      // Se for importante, enviar notificações
      if (announcementData.is_important || announcementData.send_push) {
        // Buscar todos os participantes
        const tickets = await base44.entities.Ticket.filter({ event_id: event.id });
        const attendeeIds = [...new Set(tickets.map(t => t.user_id))];

        // Criar notificações
        for (const attendeeId of attendeeIds) {
          await base44.entities.Notification.create({
            user_id: attendeeId,
            type: announcementData.type === 'schedule_change' ? 'event_alert' : 'new_message',
            title: `${event.title}: ${announcementData.title}`,
            message: announcementData.message,
            event_id: event.id,
            is_read: false
          });
        }
      }

      return announcement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['eventAnnouncements']);
      setShowAnnouncementDialog(false);
      setNewAnnouncement({ title: "", message: "", type: "info", is_important: false });
      alert("✅ Anúncio publicado!");
    },
  });

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setNewPost({ ...newPost, media: file, type });
    }
  };

  const handleOpenDirectMessage = (attendeeUser) => {
    if (!user) {
      alert("❌ Faça login para enviar mensagens");
      return;
    }
    setSelectedUserForDM(attendeeUser);
    setShowDirectMessage(true);
  };


  if (loading || !event) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const attendeeCount = checkIns.length;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <Badge className="bg-red-600 text-white">
              <Radio className="w-3 h-3 mr-1" />
              AO VIVO
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{event.title}</h1>
          <p className="text-gray-400">{event.location?.venue_name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-cyan-900/50 to-gray-900 border-cyan-700/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="w-8 h-8 text-cyan-400" />
              <div>
                <p className="text-2xl font-bold text-white">{attendeeCount}</p>
                <p className="text-xs text-gray-400">Pessoas Presentes</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/50 to-gray-900 border-purple-700/50">
            <CardContent className="p-4 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">{questions.length}</p>
                <p className="text-xs text-gray-400">Perguntas</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-900/50 to-gray-900 border-pink-700/50">
            <CardContent className="p-4 flex items-center gap-3">
              <ImageIcon className="w-8 h-8 text-pink-400" />
              <div>
                <p className="text-2xl font-bold text-white">{livePosts.length}</p>
                <p className="text-xs text-gray-400">Posts</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-900/50 to-gray-900 border-orange-700/50">
            <CardContent className="p-4 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-2xl font-bold text-white">{polls.length}</p>
                <p className="text-xs text-gray-400">Votações Ativas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Check-in Button */}
        {!hasCheckedIn && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-700">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Fazer Check-in</h3>
                  <p className="text-gray-300 text-sm">
                    Faça check-in para acessar o feed ao vivo e interagir!
                  </p>
                </div>
                <Button
                  onClick={() => checkInMutation.mutate()}
                  disabled={checkInMutation.isLoading}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Check-in
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Anúncios Recentes */}
        {announcements.length > 0 && (
          <div className="mb-6 space-y-3">
            {announcements.slice(0, 3).map(announcement => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className={`border-l-4 ${
                  announcement.type === 'urgent' ? 'border-red-500 bg-red-900/20' :
                  announcement.type === 'warning' ? 'border-yellow-500 bg-yellow-900/20' :
                  announcement.type === 'schedule_change' ? 'border-orange-500 bg-orange-900/20' :
                  'border-cyan-500 bg-cyan-900/20'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Bell className={`w-5 h-5 flex-shrink-0 ${
                        announcement.type === 'urgent' ? 'text-red-400' :
                        announcement.type === 'warning' ? 'text-yellow-400' :
                        announcement.type === 'schedule_change' ? 'text-orange-400' :
                        'text-cyan-400'
                      }`} />
                      <div className="flex-1">
                        <h4 className="font-bold text-white mb-1">{announcement.title}</h4>
                        <p className="text-gray-300 text-sm">{announcement.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {format(new Date(announcement.created_date), "HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Organizador Controls */}
        {isOrganizer && (
          <Card className="mb-6 bg-gray-900/80 border-yellow-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                Painel do Organizador
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                onClick={() => setShowAnnouncementDialog(true)}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Bell className="w-4 h-4 mr-2" />
                Novo Anúncio
              </Button>
              <Button
                onClick={() => setShowPollDialog(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Criar Votação
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("MeusEventos"))}
                variant="outline"
                className="border-gray-600"
              >
                <Users className="w-4 h-4 mr-2" />
                Ver Lista
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="feed" className="max-w-7xl mx-auto px-4">
        <TabsList className="grid w-full grid-cols-5 bg-gray-800">
          <TabsTrigger value="feed">
            <ImageIcon className="w-4 h-4 mr-2" />
            Feed
          </TabsTrigger>
          <TabsTrigger value="questions">
            <MessageSquare className="w-4 h-4 mr-2" />
            Q&A ({questions.length})
          </TabsTrigger>
          <TabsTrigger value="polls">
            <BarChart3 className="w-4 h-4 mr-2" />
            Votações ({polls.length})
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="checkins">
            <Users className="w-4 h-4 mr-2" />
            Check-ins ({attendeeCount})
          </TabsTrigger>
        </TabsList>

        {/* TAB: FEED */}
        <TabsContent value="feed" className="mt-6">
          {hasCheckedIn ? (
            <>
              {/* Upload Button */}
              <Card className="mb-6 bg-gray-900/50 border-gray-700">
                <CardContent className="p-4">
                  <Button
                    onClick={() => setShowUploadDialog(true)}
                    className="w-full bg-gradient-to-r from-pink-600 to-purple-600"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Compartilhar Foto/Vídeo
                  </Button>
                </CardContent>
              </Card>

              {/* Posts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {livePosts.map(post => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Card className="bg-gray-900/80 border-gray-700 overflow-hidden">
                        <div className="relative">
                          {post.media_type === 'video' ? (
                            <video
                              src={post.media_url}
                              className="w-full h-64 object-cover"
                              controls
                            />
                          ) : (
                            <img
                              src={post.media_url}
                              alt="Post"
                              className="w-full h-64 object-cover"
                            />
                          )}
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <img
                              src={post.user_avatar}
                              alt={post.user_name}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <p className="font-semibold text-white text-sm">{post.user_name}</p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(post.created_date), "HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          {post.caption && (
                            <p className="text-gray-300 text-sm">{post.caption}</p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {livePosts.length === 0 && (
                <div className="text-center py-12 bg-gray-900/50 rounded-lg">
                  <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">
                    Nenhum post ainda
                  </h3>
                  <p className="text-gray-500">
                    Seja o primeiro a compartilhar!
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-gray-900/50 rounded-lg">
              <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                Faça check-in para ver o feed
              </h3>
              <p className="text-gray-500">
                Apenas participantes presentes podem ver e postar
              </p>
            </div>
          )}
        </TabsContent>

        {/* TAB: Q&A */}
        <TabsContent value="questions" className="mt-6">
          {/* Form para perguntar */}
          {!isOrganizer && hasCheckedIn && (
            <Card className="mb-6 bg-gray-900/50 border-gray-700">
              <CardContent className="p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newQuestion.trim()) {
                      askQuestionMutation.mutate(newQuestion);
                    }
                  }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Faça uma pergunta..."
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    className="bg-gray-800 border-gray-600"
                  />
                  <Button type="submit" disabled={!newQuestion.trim() || askQuestionMutation.isLoading}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Lista de perguntas */}
          <div className="space-y-3">
            {questions.map(question => (
              <Card key={question.id} className={`bg-gray-900/80 ${question.is_answered ? 'border-green-700' : 'border-gray-700'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => voteQuestionMutation.mutate(question.id)}
                      className="flex-col px-2"
                    >
                      <ThumbsUp className="w-4 h-4 mb-1" />
                      <span className="text-xs">{question.votes}</span>
                    </Button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-white text-sm">{question.user_name}</p>
                        {question.is_answered && (
                          <Badge className="bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Respondida
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-300">{question.question}</p>
                      {question.answer && (
                        <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
                          <p className="text-sm text-cyan-400 font-semibold mb-1">Resposta do Organizador:</p>
                          <p className="text-gray-300 text-sm">{question.answer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {questions.length === 0 && (
            <div className="text-center py-12 bg-gray-900/50 rounded-lg">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                Nenhuma pergunta ainda
              </h3>
              <p className="text-gray-500">
                Seja o primeiro a perguntar!
              </p>
            </div>
          )}
        </TabsContent>

        {/* TAB: VOTAÇÕES */}
        <TabsContent value="polls" className="mt-6">
          <div className="space-y-4">
            {polls.map(poll => (
              <Card key={poll.id} className="bg-gray-900/80 border-purple-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">{poll.question}</CardTitle>
                  <p className="text-sm text-gray-400">{poll.votes_count} votos</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {poll.options.map(option => {
                    const percentage = poll.votes_count > 0 
                      ? ((option.votes / poll.votes_count) * 100).toFixed(1)
                      : 0;

                    return (
                      <Button
                        key={option.id}
                        variant="outline"
                        className="w-full justify-between border-gray-600 hover:border-purple-500 relative overflow-hidden"
                        onClick={() => votePollMutation.mutate({ pollId: poll.id, optionId: option.id })}
                      >
                        <div
                          className="absolute left-0 top-0 h-full bg-purple-600/20"
                          style={{ width: `${percentage}%` }}
                        />
                        <span className="relative z-10">{option.text}</span>
                        <span className="relative z-10 text-sm text-gray-400">
                          {option.votes} ({percentage}%)
                        </span>
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>

          {polls.length === 0 && (
            <div className="text-center py-12 bg-gray-900/50 rounded-lg">
              <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                Nenhuma votação ativa
              </h3>
              <p className="text-gray-500">
                O organizador ainda não criou votações
              </p>
            </div>
          )}
        </TabsContent>

        {/* NOVA ABA: Chat */}
        <TabsContent value="chat" className="py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Principal */}
            <div className="lg:col-span-2">
              <EventChatPanel
                event={event}
                currentUser={user} // Renamed user to currentUser for clarity in component
                isOrganizer={isOrganizer}
                hasCheckedIn={hasCheckedIn}
              />
            </div>

            {/* Lista de Participantes */}
            <div>
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    Participantes Online ({attendees.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                  {attendees.length > 0 ? (
                    attendees.map((attendee) => (
                      <div
                        key={attendee.id}
                        className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={attendee.avatar_url || `https://i.pravatar.cc/40?u=${attendee.id}`}
                              alt={attendee.full_name || attendee.email}
                              className="w-10 h-10 rounded-full border-2 border-cyan-500/50"
                            />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm">
                              {attendee.full_name || attendee.email}
                            </p>
                            {attendee.id === event.organizer_id && (
                              <Badge className="bg-purple-600 text-xs mt-0.5">
                                Organizador
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {user && attendee.id !== user.id && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenDirectMessage(attendee)}
                            className="bg-cyan-600 hover:bg-cyan-700"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">
                        Nenhum participante online
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB: CHECK-INS */}
        <TabsContent value="checkins" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {checkIns.map(checkIn => (
              <motion.div
                key={checkIn.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <img
                  src={checkIn.user_avatar}
                  alt={checkIn.user_name}
                  className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-green-500"
                />
                <p className="text-sm text-white truncate">{checkIn.user_name}</p>
                <p className="text-xs text-gray-500">
                  {format(new Date(checkIn.check_in_time), "HH:mm", { locale: ptBR })}
                </p>
              </motion.div>
            ))}
          </div>

          {attendeeCount === 0 && (
            <div className="text-center py-12 bg-gray-900/50 rounded-lg">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                Nenhum check-in ainda
              </h3>
              <p className="text-gray-500">
                Seja o primeiro a fazer check-in!
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Upload de Mídia */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="bg-gray-900 border-purple-500 text-white">
          <DialogHeader>
            <DialogTitle>Compartilhar Foto/Vídeo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="border-cyan-500 text-cyan-400 h-24 flex flex-col"
                onClick={() => document.getElementById('photo-upload').click()}
              >
                <ImageIcon className="w-8 h-8 mb-2" />
                Foto
              </Button>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'photo')}
              />

              <Button
                variant="outline"
                className="border-purple-500 text-purple-400 h-24 flex flex-col"
                onClick={() => document.getElementById('video-upload').click()}
              >
                <Video className="w-8 h-8 mb-2" />
                Vídeo
              </Button>
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'video')}
              />
            </div>

            {newPost.media && (
              <>
                <p className="text-sm text-green-400">✓ Arquivo selecionado</p>
                <Textarea
                  placeholder="Adicione uma legenda..."
                  value={newPost.caption}
                  onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
                  className="bg-gray-800 border-gray-600"
                />
                <Button
                  onClick={() => uploadMediaMutation.mutate(newPost)}
                  disabled={uploading}
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600"
                >
                  {uploading ? "Enviando..." : "Compartilhar"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Criar Anúncio */}
      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent className="bg-gray-900 border-cyan-500 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Anúncio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Título do anúncio"
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              className="bg-gray-800 border-gray-600"
            />
            <Textarea
              placeholder="Mensagem..."
              value={newAnnouncement.message}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
              className="bg-gray-800 border-gray-600 h-24"
            />
            <select
              value={newAnnouncement.type}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
            >
              <option value="info">Informação</option>
              <option value="warning">Aviso</option>
              <option value="urgent">Urgente</option>
              <option value="schedule_change">Mudança de Horário</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newAnnouncement.is_important}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, is_important: e.target.checked, send_push: e.target.checked })}
                className="w-4 h-4"
              />
              Enviar notificação push para todos
            </label>
            <Button
              onClick={() => createAnnouncementMutation.mutate(newAnnouncement)}
              disabled={!newAnnouncement.title || !newAnnouncement.message}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              Publicar Anúncio
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Criar Votação */}
      <Dialog open={showPollDialog} onOpenChange={setShowPollDialog}>
        <DialogContent className="bg-gray-900 border-purple-500 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar Votação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Pergunta"
              value={newPoll.question}
              onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
              className="bg-gray-800 border-gray-600"
            />
            {newPoll.options.map((option, idx) => (
              <Input
                key={idx}
                placeholder={`Opção ${idx + 1}`}
                value={option}
                onChange={(e) => {
                  const updatedOptions = [...newPoll.options];
                  updatedOptions[idx] = e.target.value;
                  setNewPoll({ ...newPoll, options: updatedOptions });
                }}
                className="bg-gray-800 border-gray-600"
              />
            ))}
            <Button
              variant="outline"
              onClick={() => setNewPoll({ ...newPoll, options: [...newPoll.options, ""] })}
              className="w-full border-gray-600"
            >
              + Adicionar Opção
            </Button>
            <Button
              onClick={() => createPollMutation.mutate(newPoll)}
              disabled={!newPoll.question || newPoll.options.some(o => !o.trim())}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Criar Votação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Mensagem Direta */}
      {showDirectMessage && selectedUserForDM && (
        <DirectMessageModal
          recipientUser={selectedUserForDM}
          currentUser={user}
          onClose={() => {
            setShowDirectMessage(false);
            setSelectedUserForDM(null);
          }}
        />
      )}
    </div>
  );
}
