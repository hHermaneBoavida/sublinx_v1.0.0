import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Heart, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getUserDisplayName, getUserAvatar } from "../shared/userHelpers";

export default function SocialRecommendations({ user }) {
  const navigate = useNavigate();

  // Buscar quem o usuário segue
  const { data: following = [] } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: () => base44.entities.Follow.filter({ follower_id: user.id }),
    enabled: !!user?.id,
  });

  // Buscar eventos futuros
  const { data: allEvents = [] } = useQuery({
    queryKey: ['allEvents'],
    queryFn: () => base44.entities.Event.list("-date", 50),
  });

  // Buscar tickets dos amigos
  const { data: friendsTickets = [] } = useQuery({
    queryKey: ['friendsTickets', following.length],
    queryFn: async () => {
      if (following.length === 0) return [];
      const friendIds = following.map(f => f.following_id);
      return await base44.entities.Ticket.filter({ 
        user_id: { $in: friendIds },
        status: 'valid'
      });
    },
    enabled: following.length > 0,
  });

  // Buscar usuários (amigos)
  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list("", 100),
  });

  // Recomendar eventos baseado em amigos
  const recommendedEvents = React.useMemo(() => {
    if (!friendsTickets.length || !allEvents.length) return [];

    // Contar quantos amigos vão para cada evento
    const eventCounts = friendsTickets.reduce((acc, ticket) => {
      acc[ticket.event_id] = (acc[ticket.event_id] || 0) + 1;
      return acc;
    }, {});

    // Filtrar eventos futuros que amigos vão
    const futureEvents = allEvents
      .filter(event => new Date(event.date) > new Date())
      .filter(event => eventCounts[event.id])
      .map(event => ({
        ...event,
        friendsGoing: eventCounts[event.id],
        friendsList: friendsTickets
          .filter(t => t.event_id === event.id)
          .map(t => allUsers.find(u => u.id === t.user_id))
          .filter(Boolean)
      }))
      .sort((a, b) => b.friendsGoing - a.friendsGoing)
      .slice(0, 5);

    return futureEvents;
  }, [friendsTickets, allEvents, allUsers]);

  if (!user || recommendedEvents.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4 px-3 sm:px-4">
        <Users className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-bold text-white">Seus Amigos Vão</h2>
        <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300 text-xs">
          {recommendedEvents.length}
        </Badge>
      </div>

      <div className="space-y-3 px-3 sm:px-4">
        {recommendedEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              onClick={() => navigate(createPageUrl("ComprarIngresso") + `?eventId=${event.id}`)}
              className="bg-gradient-to-br from-cyan-900/20 via-gray-900/80 to-purple-900/20 border-cyan-500/30 cursor-pointer hover:border-cyan-500/50 transition-all"
            >
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {event.image_url && (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm line-clamp-1 mb-1">
                      {event.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{event.location?.venue_name || 'Local'}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-green-600/20 border-green-500/30 text-green-300 text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {event.friendsGoing} {event.friendsGoing === 1 ? 'amigo' : 'amigos'}
                      </Badge>

                      <div className="flex -space-x-2">
                        {event.friendsList.slice(0, 3).map((friend, idx) => (
                          <img
                            key={idx}
                            src={getUserAvatar(friend)}
                            alt={getUserDisplayName(friend)}
                            className="w-6 h-6 rounded-full border-2 border-gray-900"
                            title={getUserDisplayName(friend)}
                          />
                        ))}
                        {event.friendsList.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-[10px] text-white">
                            +{event.friendsList.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}