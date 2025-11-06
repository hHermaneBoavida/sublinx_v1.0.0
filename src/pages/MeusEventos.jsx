
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Users, 
  Calendar, 
  Plus, 
  Check, 
  X, 
  Clock, 
  Download, 
  Mail, 
  Phone, 
  Edit,
  Trash2,
  Heart,
  MessageCircle,
  Search,
  Eye,
  MapPin,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

// MODAL: Lista de Convidados Aprovados com Exportação
const ApprovedAttendeesModal = ({ event, onClose }) => {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  React.useEffect(() => {
    const fetchApprovedAttendees = async () => {
      setLoading(true);
      try {
        const approvedRequests = await base44.entities.EventRequest.filter({ 
          event_id: event.id, 
          status: 'approved' 
        });
        
        if (approvedRequests.length === 0) {
          setAttendees([]);
          setLoading(false);
          return;
        }

        const userIds = [...new Set(approvedRequests.map(r => r.user_id))];
        
        const usersData = await Promise.all(
          userIds.map(async id => {
            try {
              const users = await base44.entities.User.filter({ id });
              return users[0] || null;
            } catch {
              return null;
            }
          })
        );
        
        const attendeesData = approvedRequests.map(request => {
          const user = usersData.find(u => u && u.id === request.user_id);
          const applicantData = request.applicant_data || {};
          
          return {
            id: request.id,
            user_id: request.user_id,
            full_name: applicantData.full_name || user?.full_name || 'Nome não informado',
            email: applicantData.email || user?.email || 'Email não informado',
            phone: applicantData.phone || user?.phone || 'Telefone não informado',
            emergency_contact: applicantData.emergency_contact || '',
            dietary_restrictions: applicantData.dietary_restrictions || '',
            special_needs: applicantData.special_needs || '',
            avatar_url: user?.avatar_url || '',
            approved_at: request.updated_date
          };
        });
        
        setAttendees(attendeesData);
      } catch (error) {
        console.error("Erro ao buscar convidados:", error);
        alert("❌ Erro ao carregar convidados. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    fetchApprovedAttendees();
  }, [event]);

  const filteredAttendees = attendees.filter(a =>
    a.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    if (attendees.length === 0) {
      alert("❌ Nenhum convidado para exportar");
      return;
    }

    const csvHeader = 'Nome,Email,Telefone,Contato Emergência,Restrições,Necessidades,Aprovado em\n';
    const csvRows = attendees.map(a => 
      `"${a.full_name}","${a.email}","${a.phone}","${a.emergency_contact || 'N/A'}","${a.dietary_restrictions || 'Nenhuma'}","${a.special_needs || 'Nenhuma'}","${format(new Date(a.approved_at), 'dd/MM/yyyy HH:mm')}"`
    ).join('\n');
    
    const csv = csvHeader + csvRows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `convidados_${event.title.replace(/\s+/g, '_')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    alert(`✅ ${attendees.length} convidado(s) exportado(s)!`);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-green-500 text-white max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Users className="w-6 h-6 text-green-400" />
            Lista de Convidados - {event.title}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {filteredAttendees.length} convidado(s) confirmado(s)
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 border-gray-600 pl-11 text-white"
            />
          </div>
          <Button 
            onClick={handleExportCSV}
            className="bg-green-600 hover:bg-green-700 px-6 whitespace-nowrap"
            disabled={attendees.length === 0}
          >
            <Download className="w-5 h-5 mr-2" />
            Exportar CSV
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 text-green-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-300">Carregando...</p>
            </div>
          ) : filteredAttendees.length > 0 ? (
            filteredAttendees.map(attendee => (
              <div key={attendee.id} className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <img 
                  src={attendee.avatar_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5048ab8ec_perfil.png"} 
                  alt="avatar" 
                  className="w-12 h-12 rounded-full border-2 border-green-500/50"
                />
                <div className="flex-1">
                  <p className="font-bold text-white">{attendee.full_name}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {attendee.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {attendee.phone}
                    </span>
                  </div>
                </div>
                <Badge className="bg-green-600">
                  <Check className="w-3 h-3 mr-1" />
                  Confirmado
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchTerm ? 'Nenhum convidado encontrado' : 'Nenhum convidado confirmado'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// MODAL: Detalhes do Evento
const EventDetailsModal = ({ event, stats, onClose, onEdit, onDelete }) => (
  <Dialog open={true} onOpenChange={onClose}>
    <DialogContent className="bg-gray-900 border-cyan-500 text-white max-w-2xl">
      <DialogHeader>
        <DialogTitle className="text-2xl">{event.title}</DialogTitle>
        <DialogDescription className="text-gray-400">
          Detalhes completos do evento
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {event.image_url && (
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-48 object-cover rounded-lg"
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Data e Hora</p>
            <p className="text-white font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              {format(new Date(event.date), "PPP 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Local</p>
            <p className="text-white font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-400" />
              {event.location?.venue_name || 'Local não informado'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 p-4 bg-gray-800/30 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Heart className="w-4 h-4 text-pink-400" />
              <span className="text-xl font-bold text-white">{stats.likes}</span>
            </div>
            <p className="text-xs text-gray-400">Curtidas</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MessageCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-xl font-bold text-white">{stats.comments}</span>
            </div>
            <p className="text-xs text-gray-400">Comentários</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-xl font-bold text-white">{stats.requests}</span>
            </div>
            <p className="text-xs text-gray-400">Pendentes</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-xl font-bold text-white">{stats.approved}</span>
            </div>
            <p className="text-xs text-gray-400">Confirmados</p>
          </div>
        </div>

        {event.description && (
          <div className="bg-gray-800/30 p-4 rounded-lg">
            <p className="text-xs text-gray-400 mb-2">Descrição</p>
            <p className="text-gray-300 text-sm">{event.description}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            onClick={onEdit}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar Evento
          </Button>
          <Button
            onClick={onDelete}
            variant="outline"
            className="flex-1 border-red-500 text-red-400 hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Deletar Evento
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default function MeusEventos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const userData = await base44.auth.me();
        if (!userData.is_organizer) {
          navigate(createPageUrl("Planos"));
          return null;
        }
        return userData;
      } catch (error) {
        console.error("Erro de autenticação:", error);
        navigate(createPageUrl("BemVindo"));
        return null;
      }
    },
    retry: false,
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['organizerEvents', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const data = await base44.entities.Event.filter({ organizer_id: user.id }, "-date");
      return data || [];
    },
    enabled: !!user?.id,
    initialData: [],
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['eventRequests', user?.id, events],
    queryFn: async () => {
      if (!user?.id || !events || events.length === 0) return [];
      
      const eventIds = events.map(e => e.id);
      
      try {
        const allRequests = await base44.entities.EventRequest.filter({ 
          event_id: { $in: eventIds },
          status: "pending" 
        });
        
        return (allRequests || []).sort((a, b) => 
          new Date(b.created_date) - new Date(a.created_date)
        );
      } catch (error) {
        console.error("Erro ao carregar solicitações:", error);
        return [];
      }
    },
    enabled: !!user?.id && !!events && events.length > 0,
    initialData: [],
  });

  const { data: eventStats } = useQuery({
    queryKey: ['eventStats', events],
    queryFn: async () => {
      if (!events || events.length === 0) return {};
      
      const eventIds = events.map(e => e.id);
      
      try {
        const [likesData, commentsData, requestsData] = await Promise.all([
          base44.entities.Like.filter({ event_id: { $in: eventIds } }),
          base44.entities.Comment.filter({ event_id: { $in: eventIds } }),
          base44.entities.EventRequest.filter({ event_id: { $in: eventIds } })
        ]);

        const stats = {};
        events.forEach(event => {
          stats[event.id] = {
            likes: likesData.filter(l => l.event_id === event.id).length,
            comments: commentsData.filter(c => c.event_id === event.id).length,
            requests: requestsData.filter(r => r.event_id === event.id && r.status === 'pending').length,
            approved: requestsData.filter(r => r.event_id === event.id && r.status === 'approved').length
          };
        });

        return stats;
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
        return {};
      }
    },
    enabled: !!events && events.length > 0,
    initialData: {},
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId) => {
      await base44.entities.Event.delete(eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['organizerEvents']);
      queryClient.invalidateQueries(['eventStats']);
      alert("✅ Evento deletado com sucesso!");
      setEventToDelete(null);
    },
    onError: (error) => {
      console.error("Erro ao deletar evento:", error);
      alert("❌ Erro ao deletar evento.");
    }
  });

  // CORREÇÃO: Mutation para aprovar/negar com validação robusta
  const requestMutation = useMutation({
    mutationFn: async ({ requestId, action }) => {
      console.log(`📤 Processando solicitação ${requestId} - Ação: ${action}`);
      
      // Validar requestId
      if (!requestId) {
        throw new Error('ID da solicitação não fornecido');
      }

      // Validar action
      if (!['approved', 'denied'].includes(action)) {
        throw new Error('Ação inválida. Use "approved" ou "denied"');
      }

      // Buscar solicitação atual para validar
      try {
        const existingRequests = await base44.entities.EventRequest.filter({ id: requestId });
        if (!existingRequests || existingRequests.length === 0) {
          throw new Error('Solicitação não encontrada');
        }

        const currentRequest = existingRequests[0];
        if (currentRequest.status !== 'pending') {
          throw new Error(`Solicitação já foi processada (status: ${currentRequest.status})`);
        }
      } catch (error) {
        if (error.message.includes('já foi processada') || error.message.includes('não encontrada')) {
          throw error;
        }
        console.warn('⚠️ Não foi possível validar solicitação, continuando...', error);
      }

      // Atualizar status
      const result = await base44.entities.EventRequest.update(requestId, { status: action });
      console.log('✅ Solicitação atualizada:', result);
      
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['eventRequests']);
      queryClient.invalidateQueries(['eventStats']);
      
      const actionText = variables.action === 'approved' ? 'aprovada' : 'negada';
      alert(`✅ Solicitação ${actionText} com sucesso!`);
    },
    onError: (error) => {
      console.error("❌ Erro ao processar solicitação:", error);
      
      let errorMessage = 'Erro ao processar solicitação. Tente novamente.';
      if (error.message.includes('já foi processada')) {
        errorMessage = 'Esta solicitação já foi processada anteriormente.';
      } else if (error.message.includes('não encontrada')) {
        errorMessage = 'Solicitação não encontrada. A página será recarregada.';
        setTimeout(() => queryClient.invalidateQueries(['eventRequests']), 1000);
      }
      
      alert(`❌ ${errorMessage}`);
    }
  });

  const handleRequestAction = async (requestId, action) => {
    // Validação extra antes de enviar
    if (!requestId) {
      alert("❌ Erro: ID da solicitação inválido");
      return;
    }

    if (!['approved', 'denied'].includes(action)) {
      alert("❌ Erro: Ação inválida");
      return;
    }

    // Confirmar ação com o usuário
    const actionText = action === 'approved' ? 'aprovar' : 'negar';
    const confirmMessage = `Tem certeza que deseja ${actionText} esta solicitação?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    // Executar mutation
    requestMutation.mutate({ requestId, action });
  };

  const totalApproved = events?.reduce((sum, event) => sum + (eventStats[event.id]?.approved || 0), 0) || 0;

  const loading = eventsLoading || requestsLoading;

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-16 h-16 text-cyan-500 animate-spin" />
          <p className="text-gray-300">Carregando seus eventos...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Modals */}
      {showAttendeesModal && selectedEvent && (
        <ApprovedAttendeesModal 
          event={selectedEvent} 
          onClose={() => {
            setShowAttendeesModal(false);
            setSelectedEvent(null);
          }} 
        />
      )}

      {showEventDetails && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          stats={eventStats[selectedEvent.id] || {}}
          onClose={() => {
            setShowEventDetails(false);
            setSelectedEvent(null);
          }}
          onEdit={() => {
            navigate(createPageUrl(`EditarEvento?id=${selectedEvent.id}`));
          }}
          onDelete={() => {
            setShowEventDetails(false);
            setEventToDelete(selectedEvent);
          }}
        />
      )}

      {eventToDelete && (
        <AlertDialog open={true} onOpenChange={() => setEventToDelete(null)}>
          <AlertDialogContent className="bg-gray-900 border-red-500 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Confirmar Exclusão
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                Tem certeza que deseja deletar "<strong>{eventToDelete.title}</strong>"?
                <br/>
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-800 border-gray-600 hover:bg-gray-700">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteEventMutation.mutate(eventToDelete.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Deletar Evento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text mb-2">
            <Settings className="w-8 h-8" />
            Meus Eventos
          </h1>
          <p className="text-gray-400">
            Gerencie seus eventos e solicitações
          </p>
        </div>
        <Button
          onClick={() => navigate(createPageUrl("CriarEvento"))}
          className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Eventos Criados</CardTitle>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{events?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Solicitações Pendentes</CardTitle>
            <Clock className="w-4 h-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{requests?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total de Convidados</CardTitle>
            <Users className="w-4 h-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalApproved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="eventos" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
          <TabsTrigger value="eventos" className="data-[state=active]:bg-cyan-600">
            Eventos ({events?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="solicitacoes" className="data-[state=active]:bg-yellow-600">
            Solicitações ({requests?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="convidados" className="data-[state=active]:bg-green-600">
            Convidados ({totalApproved})
          </TabsTrigger>
        </TabsList>

        {/* TAB: EVENTOS */}
        <TabsContent value="eventos" className="mt-6">
          {events && events.length > 0 ? (
            <div className="grid gap-4">
              {events.map((event) => {
                const stats = eventStats[event.id] || { likes: 0, comments: 0, requests: 0, approved: 0 };
                
                return (
                  <Card key={event.id} className="bg-gray-900/50 border-gray-700 hover:border-cyan-500/50 transition-colors">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-white">{event.title}</CardTitle>
                            {event.is_secret && (
                              <Badge className="bg-purple-600 text-xs">Secreto</Badge>
                            )}
                            <Badge variant="outline" className="text-cyan-400 border-cyan-400 text-xs">
                              {event.genre}
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-sm">
                            {format(new Date(event.date), "PPP 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Estatísticas Rápidas */}
                      <div className="grid grid-cols-4 gap-3 p-3 bg-gray-800/30 rounded-lg">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Heart className="w-4 h-4 text-pink-400" />
                            <span className="text-lg font-bold text-white">{stats.likes}</span>
                          </div>
                          <p className="text-xs text-gray-400">Curtidas</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <MessageCircle className="w-4 h-4 text-cyan-400" />
                            <span className="text-lg font-bold text-white">{stats.comments}</span>
                          </div>
                          <p className="text-xs text-gray-400">Comentários</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Clock className="w-4 h-4 text-yellow-400" />
                            <span className="text-lg font-bold text-white">{stats.requests}</span>
                          </div>
                          <p className="text-xs text-gray-400">Pendentes</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Users className="w-4 h-4 text-green-400" />
                            <span className="text-lg font-bold text-white">{stats.approved}</span>
                          </div>
                          <p className="text-xs text-gray-400">Confirmados</p>
                        </div>
                      </div>

                      {/* Botões de Ação - VISÍVEIS E GRANDES */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEventDetails(true);
                          }}
                          variant="outline"
                          className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-900/20"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowAttendeesModal(true);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Lista ({stats.approved})
                        </Button>
                        <Button
                          onClick={() => navigate(createPageUrl(`EditarEvento?id=${event.id}`))}
                          variant="outline"
                          className="border-blue-500/50 text-blue-400 hover:bg-blue-900/20"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          onClick={() => setEventToDelete(event)}
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Deletar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-700">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                Nenhum evento criado
              </h3>
              <p className="text-gray-500 mb-6">
                Crie seu primeiro evento para começar
              </p>
              <Button
                onClick={() => navigate(createPageUrl("CriarEvento"))}
                className="bg-gradient-to-r from-cyan-600 to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Evento
              </Button>
            </div>
          )}
        </TabsContent>

        {/* TAB: SOLICITAÇÕES */}
        <TabsContent value="solicitacoes" className="mt-6">
          {requests && requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => {
                const event = events?.find(e => e.id === request.event_id);
                const applicantData = request.applicant_data || {};
                
                // CORREÇÃO: Validar se dados essenciais existem
                if (!event) {
                  console.warn('⚠️ Evento não encontrado para request:', request.id);
                  return null;
                }
                
                return (
                  <Card key={request.id} className="bg-gray-900/50 border-gray-700">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-lg mb-3">
                            📋 {event.title}
                          </h3>
                          
                          <div className="bg-gray-800/50 p-4 rounded-lg space-y-2 mb-3">
                            <p className="text-white font-semibold">
                              👤 {applicantData.full_name || 'Sem nome'}
                            </p>
                            <p className="text-sm text-gray-300">
                              📧 {applicantData.email || 'Sem email'}
                            </p>
                            <p className="text-sm text-gray-300">
                              📞 {applicantData.phone || 'Sem telefone'}
                            </p>
                            {applicantData.emergency_contact && (
                              <p className="text-sm text-gray-400">
                                🚨 Emergência: {applicantData.emergency_contact}
                              </p>
                            )}
                            {applicantData.dietary_restrictions && (
                              <p className="text-sm text-gray-400">
                                🍽️ Restrições: {applicantData.dietary_restrictions}
                              </p>
                            )}
                            {applicantData.special_needs && (
                              <p className="text-sm text-gray-400">
                                ♿ Necessidades: {applicantData.special_needs}
                              </p>
                            )}
                          </div>

                          {request.message && (
                            <div className="bg-gray-800/30 p-3 rounded mb-3">
                              <p className="text-xs text-gray-400 mb-1">💬 Mensagem:</p>
                              <p className="text-sm text-gray-300">"{request.message}"</p>
                            </div>
                          )}

                          <p className="text-xs text-gray-500">
                            🕒 {format(new Date(request.created_date), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleRequestAction(request.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={requestMutation.isPending}
                          >
                            {requestMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Aprovar
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRequestAction(request.id, 'denied')}
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                            disabled={requestMutation.isPending}
                          >
                            {requestMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-1" />
                                Negar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-700">
              <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                Nenhuma solicitação pendente
              </h3>
              <p className="text-gray-500">
                As solicitações aparecerão aqui
              </p>
            </div>
          )}
        </TabsContent>

        {/* TAB: CONVIDADOS */}
        <TabsContent value="convidados" className="mt-6">
          {events && events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => {
                const stats = eventStats[event.id] || { approved: 0 };
                
                if (stats.approved === 0) return null;
                
                return (
                  <Card key={event.id} className="bg-gray-900/50 border-gray-700">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-white">{event.title}</CardTitle>
                          <p className="text-sm text-gray-400 mt-1">
                            {stats.approved} convidado(s) confirmado(s)
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowAttendeesModal(true);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Ver e Exportar
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-700">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                Nenhum convidado ainda
              </h3>
              <p className="text-gray-500">
                Aprove solicitações para ver convidados aqui
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
