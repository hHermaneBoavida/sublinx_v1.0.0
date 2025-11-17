import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sparkles, Save, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const GENRES = [
  "techno", "house", "trance", "drum_bass", "dubstep", "ambient",
  "experimental", "acid", "minimal", "hardcore", "funk", "trap",
  "kuduro", "kizomba", "samba", "pagode", "rap", "hip_hop", "reggae"
];

const EVENT_TYPES = [
  "rave", "warehouse", "rooftop", "underground", "festival", "club", "secret"
];

const PRICE_RANGES = [
  { value: "free", label: "Gratuito" },
  { value: "budget", label: "Econômico (até R$50)" },
  { value: "moderate", label: "Moderado (R$50-150)" },
  { value: "premium", label: "Premium (R$150+)" },
  { value: "any", label: "Qualquer valor" }
];

const CROWD_PREFS = [
  { value: "intimista", label: "Intimista (<100)" },
  { value: "moderado", label: "Moderado (100-500)" },
  { value: "lotado", label: "Grande (500+)" },
  { value: "qualquer", label: "Qualquer" }
];

export default function PreferencesModal({ user, onClose }) {
  const queryClient = useQueryClient();
  const [selectedGenres, setSelectedGenres] = useState(user?.favorite_genres || []);
  const [selectedTypes, setSelectedTypes] = useState(user?.preferred_event_types || []);
  const [priceRange, setPriceRange] = useState(user?.price_range || "any");
  const [crowdPref, setCrowdPref] = useState(user?.crowd_preference || "qualquer");

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['aiRecommendations']);
      alert('✅ Preferências salvas!');
      onClose();
    },
    onError: () => {
      alert('❌ Erro ao salvar preferências');
    }
  });

  const toggleGenre = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const toggleType = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleSave = () => {
    updatePreferencesMutation.mutate({
      favorite_genres: selectedGenres,
      preferred_event_types: selectedTypes,
      price_range: priceRange,
      crowd_preference: crowdPref
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-purple-500/50 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Minhas Preferências
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Personalize suas recomendações de eventos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Gêneros Favoritos */}
          <div>
            <Label className="text-white text-sm mb-3 block font-semibold">
              Gêneros Musicais Favoritos
            </Label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => (
                <Badge
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`cursor-pointer transition-all ${
                    selectedGenres.includes(genre)
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-purple-500/50'
                  }`}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tipos de Eventos */}
          <div>
            <Label className="text-white text-sm mb-3 block font-semibold">
              Tipos de Eventos Preferidos
            </Label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((type) => (
                <Badge
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`cursor-pointer transition-all ${
                    selectedTypes.includes(type)
                      ? 'bg-cyan-600 text-white border-cyan-400'
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-cyan-500/50'
                  }`}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          {/* Faixa de Preço */}
          <div>
            <Label className="text-white text-sm mb-3 block font-semibold">
              Faixa de Preço
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {PRICE_RANGES.map((range) => (
                <Button
                  key={range.value}
                  onClick={() => setPriceRange(range.value)}
                  variant="outline"
                  className={`${
                    priceRange === range.value
                      ? 'bg-green-600/20 border-green-500 text-green-300'
                      : 'border-gray-700 text-gray-400 hover:border-green-500/50'
                  }`}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Preferência de Público */}
          <div>
            <Label className="text-white text-sm mb-3 block font-semibold">
              Tamanho do Evento
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {CROWD_PREFS.map((pref) => (
                <Button
                  key={pref.value}
                  onClick={() => setCrowdPref(pref.value)}
                  variant="outline"
                  className={`${
                    crowdPref === pref.value
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'border-gray-700 text-gray-400 hover:border-blue-500/50'
                  }`}
                >
                  {pref.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-gray-600"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={updatePreferencesMutation.isPending}
            className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600"
          >
            {updatePreferencesMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Preferências
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}