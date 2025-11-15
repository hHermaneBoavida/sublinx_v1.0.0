import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getUserDisplayName, getUserAvatar } from "../shared/userHelpers";

export default function ReviewsList({ reviews, users = [] }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Star className="w-12 h-12 mx-auto mb-3 text-gray-600" />
        <p className="text-sm">Nenhuma avaliação ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review, index) => {
        const reviewer = users.find(u => u.id === review.user_id);
        
        return (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={getUserAvatar(reviewer)}
                    alt={getUserDisplayName(reviewer)}
                    className="w-10 h-10 rounded-full border-2 border-gray-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-white text-sm truncate">
                        {getUserDisplayName(reviewer)}
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.overall_rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(review.created_date), "dd 'de' MMMM", { locale: ptBR })}
                    </div>
                  </div>
                </div>

                {review.review_text && (
                  <p className="text-sm text-gray-300 mb-3">{review.review_text}</p>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  {review.music_rating && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-gray-400">Música:</span>
                      <div className="flex">
                        {[...Array(review.music_rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-cyan-400 text-cyan-400" />
                        ))}
                      </div>
                    </div>
                  )}
                  {review.atmosphere_rating && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-gray-400">Ambiente:</span>
                      <div className="flex">
                        {[...Array(review.atmosphere_rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-purple-400 text-purple-400" />
                        ))}
                      </div>
                    </div>
                  )}
                  {review.recommended && (
                    <Badge className="bg-green-600/20 border-green-500/30 text-green-300 text-xs">
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      Recomenda
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}