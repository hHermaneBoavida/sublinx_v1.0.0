import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function AddReviewModal({ event, user, onClose }) {
  const queryClient = useQueryClient();
  const [ratings, setRatings] = useState({
    overall: 0,
    music: 0,
    atmosphere: 0,
    service: 0
  });
  const [reviewText, setReviewText] = useState("");
  const [recommended, setRecommended] = useState(true);

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      return await base44.entities.EventReview.create(reviewData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['eventReviews']);
      queryClient.invalidateQueries(['organizerStats']);
      onClose();
    }
  });

  const handleSubmit = () => {
    if (ratings.overall === 0) {
      alert("Por favor, avalie o evento!");
      return;
    }

    createReviewMutation.mutate({
      user_id: user.id,
      event_id: event.id,
      overall_rating: ratings.overall,
      music_rating: ratings.music || ratings.overall,
      atmosphere_rating: ratings.atmosphere || ratings.overall,
      service_rating: ratings.service || ratings.overall,
      review_text: reviewText.trim(),
      recommended,
      tags: []
    });
  };

  const StarRating = ({ value, onChange, label }) => (
    <div className="space-y-2">
      <label className="text-sm text-gray-400">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-600 hover:text-yellow-200'
              }`}
            />
          </motion.button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Avaliar {event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <StarRating
            value={ratings.overall}
            onChange={(val) => setRatings(prev => ({ ...prev, overall: val }))}
            label="Avaliação Geral *"
          />

          <div className="grid grid-cols-2 gap-4">
            <StarRating
              value={ratings.music}
              onChange={(val) => setRatings(prev => ({ ...prev, music: val }))}
              label="Música"
            />
            <StarRating
              value={ratings.atmosphere}
              onChange={(val) => setRatings(prev => ({ ...prev, atmosphere: val }))}
              label="Ambiente"
            />
          </div>

          <StarRating
            value={ratings.service}
            onChange={(val) => setRatings(prev => ({ ...prev, service: val }))}
            label="Atendimento"
          />

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Sua Opinião (opcional)</label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="O que você achou do evento?"
              className="bg-gray-800 border-gray-700 text-white h-24"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{reviewText.length}/500</p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <input
              type="checkbox"
              id="recommend"
              checked={recommended}
              onChange={(e) => setRecommended(e.target.checked)}
              className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
            />
            <label htmlFor="recommend" className="text-sm text-white cursor-pointer">
              Eu recomendaria este evento
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-gray-700 text-gray-300"
            disabled={createReviewMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createReviewMutation.isPending || ratings.overall === 0}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600"
          >
            {createReviewMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Enviando...</>
            ) : (
              "Publicar Avaliação"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}