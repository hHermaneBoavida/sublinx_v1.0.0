import React from "react";
import { Star, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function EventRatingDisplay({ reviews, compact = false }) {
  if (!reviews || reviews.length === 0) return null;

  const avgRating = (reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length).toFixed(1);
  const recommendPercentage = Math.round((reviews.filter(r => r.recommended).length / reviews.length) * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        <span className="text-xs font-bold text-white">{avgRating}</span>
        <span className="text-xs text-gray-400">({reviews.length})</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl font-bold text-yellow-400">{avgRating}</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.round(avgRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400">{reviews.length} avaliação{reviews.length !== 1 ? 'ões' : ''}</p>
        </div>
        
        {recommendPercentage >= 70 && (
          <Badge className="bg-green-600/20 border-green-500/30 text-green-300">
            <TrendingUp className="w-3 h-3 mr-1" />
            {recommendPercentage}% recomendam
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = reviews.filter(r => Math.round(r.overall_rating) === star).length;
          const percentage = (count / reviews.length) * 100;
          
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-8">{star}★</span>
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}