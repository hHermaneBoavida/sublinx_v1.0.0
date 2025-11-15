import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Star, Award, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function OrganizerRating({ organizerId, compact = false }) {
  const { data: stats } = useQuery({
    queryKey: ['organizerStats', organizerId],
    queryFn: async () => {
      const events = await base44.entities.Event.filter({ organizer_id: organizerId });
      const eventIds = events.map(e => e.id);
      
      if (eventIds.length === 0) return null;
      
      const reviews = await base44.entities.EventReview.filter({
        event_id: { $in: eventIds }
      });

      if (reviews.length === 0) return null;

      const avgRating = reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length;
      const totalEvents = events.length;
      const recommendPercentage = (reviews.filter(r => r.recommended).length / reviews.length) * 100;

      return {
        avgRating: avgRating.toFixed(1),
        totalReviews: reviews.length,
        totalEvents,
        recommendPercentage: Math.round(recommendPercentage)
      };
    },
    enabled: !!organizerId,
    staleTime: 60000,
  });

  if (!stats) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-bold text-white">{stats.avgRating}</span>
        </div>
        <span className="text-xs text-gray-400">({stats.totalReviews})</span>
        {stats.avgRating >= 4.5 && (
          <Badge className="bg-yellow-600/20 border-yellow-500/30 text-yellow-300 text-xs">
            <Award className="w-3 h-3 mr-1" />
            Top
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-yellow-600/20 flex items-center justify-center">
            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{stats.avgRating}</span>
              <span className="text-sm text-gray-400">/ 5</span>
            </div>
            <p className="text-xs text-gray-400">{stats.totalReviews} avaliações</p>
          </div>
        </div>

        {stats.avgRating >= 4.5 && (
          <Badge className="bg-yellow-600/20 border-yellow-500/30 text-yellow-300">
            <Award className="w-4 h-4 mr-1" />
            Organizador Top
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Eventos</p>
          <p className="text-lg font-bold text-white">{stats.totalEvents}</p>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Recomendam
          </p>
          <p className="text-lg font-bold text-green-400">{stats.recommendPercentage}%</p>
        </div>
      </div>
    </div>
  );
}