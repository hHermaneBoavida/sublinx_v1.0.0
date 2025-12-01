import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Music, Sparkles, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const MUSIC_GENRES = [
  { id: 'techno', name: 'Techno', emoji: '🎵', color: 'cyan' },
  { id: 'house', name: 'House', emoji: '🏠', color: 'green' },
  { id: 'trance', name: 'Trance', emoji: '🌀', color: 'purple' },
  { id: 'drum_bass', name: 'Drum & Bass', emoji: '🥁', color: 'orange' },
  { id: 'dubstep', name: 'Dubstep', emoji: '🔊', color: 'pink' },
  { id: 'minimal', name: 'Minimal', emoji: '⚡', color: 'blue' },
  { id: 'funk', name: 'Funk', emoji: '🎺', color: 'yellow' },
  { id: 'trap', name: 'Trap', emoji: '🔥', color: 'red' },
  { id: 'hip_hop', name: 'Hip Hop', emoji: '🎤', color: 'amber' },
  { id: 'reggae', name: 'Reggae', emoji: '🌴', color: 'lime' },
];

const EVENT_TYPES = [
  { id: 'rave', name: 'Rave', emoji: '🎉' },
  { id: 'warehouse', name: 'Warehouse', emoji: '🏭' },
  { id: 'rooftop', name: 'Rooftop', emoji: '🌃' },
  { id: 'underground', name: 'Underground', emoji: '🚇' },
  { id: 'festival', name: 'Festival', emoji: '🎪' },
  { id: 'club', name: 'Club', emoji: '🕺' },
];

export default function MusicPreferencesModal({ user, onClose, onSave }) {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [priceRange, setPriceRange] = useState('any');
  const [crowdSize, setCrowdSize] = useState('qualquer');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    try {
      // Carregar preferências existentes
      const [userGenres, userPrefs] = await Promise.all([
        base44.entities.UserGenre.filter({ user_id: user.id }),
        base44.entities.UserPreferences.filter({ user_id: user.id })
      ]);

      if (userGenres.length > 0) {
        setSelectedGenres(userGenres.map(g => g.genre));
      }

      if (userPrefs.length > 0) {
        const prefs = userPrefs[0];
        setPriceRange(prefs.price_range || 'any');
        setCrowdSize(prefs.crowd_preference || 'qualquer');
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
    }
  };

  const toggleGenre = (genreId) => {
    setSelectedGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(g => g !== genreId)
        : [...prev, genreId]
    );
  };

  const toggleType = (typeId) => {
    setSelectedTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Deletar gêneros antigos
      const oldGenres = await base44.entities.UserGenre.filter({ user_id: user.id });
      await Promise.all(oldGenres.map(g => base44.entities.UserGenre.delete(g.id)));

      // Salvar novos gêneros
      await Promise.all(
        selectedGenres.map(genre => 
          base44.entities.UserGenre.create({ user_id: user.id, genre })
        )
      );

      // Salvar preferências gerais
      const existingPrefs = await base44.entities.UserPreferences.filter({ user_id: user.id });
      const prefsData = {
        user_id: user.id,
        price_range: priceRange,
        crowd_preference: crowdSize,
      };

      if (existingPrefs.length > 0) {
        await base44.entities.UserPreferences.update(existingPrefs[0].id, prefsData);
      } else {
        await base44.entities.UserPreferences.create(prefsData);
      }

      toast.success('✨ Preferências salvas com sucesso!');
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      toast.error('Erro ao salvar preferências');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-gray-900 to-black border-2 border-cyan-500/30 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
          style={{
            boxShadow: '0 0 40px rgba(6, 182, 212, 0.3)'
          }}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-black p-6 border-b border-cyan-500/20 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Music className="w-8 h-8 text-cyan-400" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Preferências Musicais</h2>
                  <p className="text-gray-400 text-sm">Personalize seu feed</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Gêneros Musicais */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Gêneros Favoritos
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {MUSIC_GENRES.map((genre) => {
                  const isSelected = selectedGenres.includes(genre.id);
                  return (
                    <motion.button
                      key={genre.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleGenre(genre.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/20'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-3xl mb-2">{genre.emoji}</div>
                      <div className="text-sm font-medium text-white">{genre.name}</div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Faixa de Preço */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Faixa de Preço</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {['free', 'budget', 'moderate', 'premium', 'any'].map((range) => (
                  <Button
                    key={range}
                    variant={priceRange === range ? 'default' : 'outline'}
                    onClick={() => setPriceRange(range)}
                    className={priceRange === range ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    {range === 'free' && '💸 Grátis'}
                    {range === 'budget' && '💰 Econômico'}
                    {range === 'moderate' && '💳 Moderado'}
                    {range === 'premium' && '👑 Premium'}
                    {range === 'any' && '✨ Qualquer'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tamanho do Público */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Tamanho do Evento</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'intimista', label: '🔥 Intimista' },
                  { id: 'moderado', label: '🎉 Moderado' },
                  { id: 'lotado', label: '🎊 Lotado' },
                  { id: 'qualquer', label: '✨ Qualquer' },
                ].map((crowd) => (
                  <Button
                    key={crowd.id}
                    variant={crowdSize === crowd.id ? 'default' : 'outline'}
                    onClick={() => setCrowdSize(crowd.id)}
                    className={crowdSize === crowd.id ? 'bg-pink-600 hover:bg-pink-700' : ''}
                  >
                    {crowd.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gradient-to-t from-gray-900 to-transparent p-6 border-t border-cyan-500/20">
            <Button
              onClick={handleSave}
              disabled={saving || selectedGenres.length === 0}
              className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 h-12 text-lg font-semibold"
            >
              {saving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Salvar Preferências
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}