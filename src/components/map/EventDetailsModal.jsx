import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  X, MapPin, Calendar, Users, DollarSign,
  Navigation, Share2, Zap, CalendarPlus, MessageSquare,
  Music2, ExternalLink, User, Instagram, Twitter, Star
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GenreBadge } from "../shared/EventBadge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "../shared/useCurrentUser";
import EventRatingDisplay from "../reviews/EventRatingDisplay";
import ReviewsList from "../reviews/ReviewsList";
import AddReviewModal from "../reviews/AddReviewModal";
import GuestListStatus from "../guestlist/GuestListStatus";
import SponsorsSection from "../events/SponsorsSection";
import EventActionButtons from "../events/EventActionButtons";
import EventVerificationBadge from "../events/EventVerificationBadge";
import { FALLBACK_EVENT_IMAGE } from "../shared/eventImageFallback";

export default function EventDetailsModal({ event, onClose }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [shareComment, setShareComment] = useState("");
  const [showShareComment, setShowShareComment] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  const { data: eventReviews = [] } = useQuery({
    queryKey: ['eventReviews', event.id],
    queryFn: () => base44.entities.EventReview.filter({ event_id: event.id }),
  });

  const { data: reviewUsers = [] } = useQuery({
    queryKey: ['reviewUsers', eventReviews.length],
    queryFn: async () => {
      if (eventReviews.length === 0) return [];
      const userIds = [...new Set(eventReviews.map(r => r.user_id))];
      return await base44.entities.User.filter({ id: { $in: userIds } });
    },
    enabled: eventReviews.length > 0,
  });

  const { data: userTickets = [] } = useQuery({
    queryKey: ['userTickets', user?.id, event.id],
    queryFn: () => base44.entities.Ticket.filter({
      user_id: user.id,
      event_id: event.id,
      status: 'valid'
    }),
    enabled: !!user?.id,
  });

  const { data: sponsors = [] } = useQuery({
    queryKey: ['eventSponsors', event.id],
    queryFn: async () => {
      return await base44.entities.EventSponsor.filter({ 
        event_id: event.id, 
        is_visible: true 
      }, 'display_order');
    },
    enabled: !!event,
    initialData: [],
  });

  // Verificar se já fez solicitação
  const { data: existingRequest } = useQuery({
    queryKey: ['eventRequest', user?.id, event.id],
    queryFn: () => base44.entities.EventRequest.filter({ user_id: user.id, event_id: event.id }),
    enabled: !!user?.id,
    initialData: [],
  });

  const alreadyRequested = existingRequest?.length > 0;

  const hasTicket = userTickets.length > 0;
  const hasReviewed = eventReviews.some(r => r.user_id === user?.id);

  // Mock DJs/Artists (em produção, viria do evento)
  const artists = event.artists || [
    { name: "DJ Shadow", role: "Headliner", instagram: "@djshadow", avatar: "https://i.pravatar.cc/80?img=1" },
    { name: "MC Flow", role: "MC", twitter: "@mcflow", avatar: "https://i.pravatar.cc/80?img=2" }
  ];

  const likeMutation = useMutation({
    mutationFn: async () => {
      const existing = await base44.entities.Like.filter({
        user_id: user.id,
        event_id: event.id
      });

      if (existing && existing.length > 0) {
        await base44.entities.Like.delete(existing[0].id);
        return 'unliked';
      } else {
        await base44.entities.Like.create({
          user_id: user.id,
          event_id: event.id
        });
        return 'liked';
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['feedInteractions']);
    }
  });

  // Integração Google Maps
  const handleGetDirections = () => {
    if (!event.location?.lat || !event.location?.lng) return;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${event.location.lat},${event.location.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // Visualizar no Waze
  const handleOpenWaze = () => {
    if (!event.location?.lat || !event.location?.lng) return;

    const url = `https://waze.com/ul?ll=${event.location.lat},${event.location.lng}&navigate=yes`;
    window.open(url, '_blank');
  };

  // Adicionar ao Google Calendar
  const handleAddToCalendar = () => {
    const startDate = new Date(event.date);
    const endDate = new Date(startDate.getTime() + (event.duration_hours || 4) * 60 * 60 * 1000);

    const formatGoogleDate = (date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const details = `${event.description || ''}\n\nLocal: ${event.location?.venue_name || 'A definir'}\nOrganizador: ${event.organizer}`;

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(event.location?.address || event.location?.venue_name || '')}&sf=true&output=xml`;

    window.open(googleCalendarUrl, '_blank');
  };

  // Compartilhamento avançado
  const handleShare = async () => {
    const shareText = shareComment
      ? `${shareComment}\n\n${event.title}`
      : `Confira esse evento: ${event.title}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: shareText,
          url: window.location.href
        });
        setShowShareComment(false);
        setShareComment("");
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copiar link
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado!');
    }
  };

  const occupancy = event.max_capacity > 0
    ? (event.current_attendees / event.max_capacity) * 100
    : 0;

  const occupancyColor =
    occupancy >= 90 ? 'text-red-400' :
    occupancy >= 70 ? 'text-yellow-400' :
    'text-green-400';

  const ticketPrice = event.price || event.ticket_types?.[0]?.price || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="max-w-2xl mx-auto min-h-screen flex items-center p-3 sm:p-4 safe-area-top" style={{ minHeight: '100dvh' }} onClick={(e) => e.stopPropagation()}>
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full"
        >
          <Card className="bg-gray-900 border-2 border-cyan-500/30 overflow-hidden shadow-2xl">
            {/* Image Header */}
            <div className="relative h-64 sm:h-80 overflow-hidden">
              <img
                src={event.image_url || FALLBACK_EVENT_IMAGE}
                alt={event.title}
                className={`w-full h-full object-cover transition-all duration-500 ${
                  imageLoaded ? 'scale-100 blur-0' : 'scale-110 blur-sm'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_EVENT_IMAGE;
                  setImageLoaded(true);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-3 right-3 bg-black/60 backdrop-blur-xl border border-white/20 text-white hover:bg-black/80 h-10 w-10 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>

              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3 drop-shadow-lg break-words">
                  {event.title}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <GenreBadge genre={event.genre} />
                  <Badge className="bg-purple-600/80 border-purple-500/50 text-white backdrop-blur-sm">
                    {event.type}
                  </Badge>
                  {event.is_secret && (
                    <Badge className="bg-yellow-600/80 border-yellow-500/50 text-white backdrop-blur-sm">
                      🔒 Secreto
                    </Badge>
                  )}
                  <EventVerificationBadge status={event.verification_status} score={event.verification_score} />
                </div>
              </div>
            </div>

            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Guest List Status */}
              <GuestListStatus event={event} user={user} />

              {/* Reviews Section */}
              {eventReviews.length > 0 && (
                <div>
                  <EventRatingDisplay reviews={eventReviews} />

                  <Button
                    onClick={() => setShowReviews(!showReviews)}
                    variant="outline"
                    className="w-full mt-3 border-yellow-500/30 text-yellow-400 hover:bg-yellow-600/10"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    {showReviews ? 'Ocultar' : 'Ver'} Avaliações ({eventReviews.length})
                  </Button>

                  {showReviews && (
                    <div className="mt-4">
                      <ReviewsList reviews={eventReviews} users={reviewUsers} />
                    </div>
                  )}
                </div>
              )}

              {hasTicket && !hasReviewed && (
                <Button
                  onClick={() => setShowAddReview(true)}
                  className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Avaliar Este Evento
                </Button>
              )}

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-700">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-cyan-600/20 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Data</div>
                      <div className="text-sm font-semibold text-white">
                        {format(new Date(event.date), "dd/MM", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300">
                    {format(new Date(event.date), "EEEE 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-700">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400">Local</div>
                      <div className="text-sm font-semibold text-white truncate">
                        {event.location?.venue_name || 'Secreto'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 truncate">
                    {event.location?.city || 'São Paulo'}
                  </div>
                </div>
              </div>

              {/* Artists/DJs */}
              {artists && artists.length > 0 && (
                <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Music2 className="w-4 h-4 text-purple-400" />
                    Line-up Confirmado
                  </h3>
                  <div className="space-y-3">
                    {artists.map((artist, index) => (
                      <div key={index} className="flex items-center gap-3 bg-black/30 rounded-lg p-3">
                        <img
                          src={artist.avatar}
                          alt={artist.name}
                          className="w-10 h-10 rounded-full border-2 border-purple-500/50"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white text-sm">{artist.name}</div>
                          <div className="text-xs text-gray-400">{artist.role}</div>
                        </div>
                        <div className="flex gap-2">
                          {artist.instagram && (
                            <a
                              href={`https://instagram.com/${artist.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-pink-400 hover:text-pink-300"
                            >
                              <Instagram className="w-4 h-4" />
                            </a>
                          )}
                          {artist.twitter && (
                            <a
                              href={`https://twitter.com/${artist.twitter.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Twitter className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attendance */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-semibold text-white">Presença</span>
                  </div>
                  <span className={`text-sm font-bold ${occupancyColor}`}>
                    {occupancy.toFixed(0)}%
                  </span>
                </div>

                <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${occupancy}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 relative"
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/30"
                      animate={{
                        x: ['-100%', '200%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </motion.div>
                </div>

                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>{event.current_attendees || 0} confirmados</span>
                  <span>{event.max_capacity || 0} max</span>
                </div>
              </div>

              {/* Price */}
              {ticketPrice > 0 && (
                <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-600/20 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-xs text-yellow-300">Entrada</div>
                        <div className="text-2xl font-bold text-yellow-400">
                          R$ {parseFloat(ticketPrice).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {event.ticket_types && event.ticket_types.length > 1 && (
                      <Badge className="bg-yellow-600/20 border-yellow-500/30 text-yellow-300 text-xs">
                        +{event.ticket_types.length - 1} tipo{event.ticket_types.length > 2 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    Sobre o Evento
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Organizer */}
              <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <img
                  src={event.organizer_avatar || "https://i.pravatar.cc/80?u=organizer"}
                  alt={event.organizer}
                  className="w-12 h-12 rounded-full border-2 border-cyan-500/30 cursor-pointer hover:border-cyan-400/50 transition-colors"
                  onClick={() => {
                    if (event.organizer_id) {
                      navigate(createPageUrl("PerfilUsuario") + `?id=${event.organizer_id}`);
                    }
                  }}
                />
                <div className="flex-1">
                  <div className="text-xs text-gray-400">Organizado por</div>
                  <div
                    className="text-sm font-semibold text-white cursor-pointer hover:text-cyan-400 transition-colors"
                    onClick={() => {
                      if (event.organizer_id) {
                        navigate(createPageUrl("PerfilUsuario") + `?id=${event.organizer_id}`);
                      }
                    }}
                  >
                    {event.organizer}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-600/10"
                  onClick={() => {
                    if (event.organizer_id) {
                      navigate(createPageUrl("PerfilUsuario") + `?id=${event.organizer_id}`);
                    }
                  }}
                >
                  Ver Perfil
                </Button>
              </div>

              {/* Navigation Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleGetDirections}
                  variant="outline"
                  className="h-11 border-green-500/30 text-green-400 hover:bg-green-600/10"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Google Maps
                </Button>

                <Button
                  onClick={handleOpenWaze}
                  variant="outline"
                  className="h-11 border-blue-500/30 text-blue-400 hover:bg-blue-600/10"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Waze
                </Button>
              </div>

              {/* Calendar & Share */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleAddToCalendar}
                  variant="outline"
                  className="h-11 border-purple-500/30 text-purple-400 hover:bg-purple-600/10"
                >
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>

                <Button
                  onClick={() => setShowShareComment(!showShareComment)}
                  variant="outline"
                  className="h-11 border-pink-500/30 text-pink-400 hover:bg-pink-600/10"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              </div>

              {/* Share Comment Box */}
              {showShareComment && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-800/50 rounded-xl p-4 border border-pink-500/30"
                >
                  <textarea
                    placeholder="Adicione um comentário pessoal (opcional)..."
                    value={shareComment}
                    onChange={(e) => setShareComment(e.target.value)}
                    className="w-full bg-gray-900 text-white rounded-lg p-3 text-sm border border-gray-700 focus:border-pink-500/50 focus:outline-none resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={handleShare}
                      className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar
                    </Button>
                    <Button
                      onClick={() => {
                        setShowShareComment(false);
                        setShareComment("");
                      }}
                      variant="outline"
                      className="border-gray-600 text-gray-400"
                    >
                      Cancelar
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Patrocinadores */}
              {sponsors.length > 0 && (
                <SponsorsSection sponsors={sponsors} showTitle={true} />
              )}

              {/* Main CTA — Compra / Reserva / Detalhes */}
              <EventActionButtons event={event} user={user} />

              {/* Solicitar Acesso (eventos secretos) */}
              {event.requires_approval && !alreadyRequested && !requestSent && (
                <Button
                  disabled={requesting}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!user) {
                      toast.error('Faça login para solicitar acesso');
                      return;
                    }
                    setRequesting(true);
                    try {
                      await base44.entities.EventRequest.create({
                        user_id: user.id,
                        event_id: event.id,
                        organizer_id: event.organizer_id,
                        status: 'pending',
                        applicant_data: {
                          full_name: user.full_name || user.email,
                          email: user.email,
                        }
                      });
                      await base44.entities.Notification.create({
                        user_id: event.organizer_id,
                        type: 'reservation_request',
                        title: 'Nova Solicitação',
                        message: `${user.full_name || user.email} quer participar de "${event.title}"`,
                        event_id: event.id,
                        is_read: false,
                      });
                      setRequestSent(true);
                      queryClient.invalidateQueries(['eventRequest', user.id, event.id]);
                      toast.success('Solicitação enviada! O organizador foi notificado.');
                    } catch (err) {
                      toast.error('Erro ao enviar solicitação. Tente novamente.');
                    } finally {
                      setRequesting(false);
                    }
                  }}
                  className="w-full h-12 border border-purple-500/40 text-purple-300 hover:bg-purple-600/10 font-bold"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {requesting ? 'Enviando...' : 'Solicitar Acesso'}
                </Button>
              )}
              {(alreadyRequested || requestSent) && event.requires_approval && (
                <div className="text-center text-sm text-purple-300 py-2 font-semibold">
                  Solicitação Enviada
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      {showAddReview && (
        <AddReviewModal
          event={event}
          user={user}
          onClose={() => {
            setShowAddReview(false);
            queryClient.invalidateQueries(['eventReviews', event.id]);
            queryClient.invalidateQueries(['feedInteractions']); // To update event rating on feed
          }}
        />
      )}
    </motion.div>
  );
}