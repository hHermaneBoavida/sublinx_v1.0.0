import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Lightbulb, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIEventSuggestions({ user, onSelectSuggestion }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('getPersonalizedRecommendations');
      setSuggestions(data);
      setExpanded(true);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      alert('Erro ao gerar sugestões. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20 border-2 border-purple-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Sugestões Personalizadas IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!suggestions ? (
          <Button
            onClick={generateSuggestions}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando perfil...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Sugestões com IA
              </>
            )}
          </Button>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Eventos Personalizados */}
              {suggestions.personalized?.slice(0, 3).map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => onSelectSuggestion?.(event)}
                  className="p-3 bg-gray-900/50 rounded-lg border border-purple-500/20 hover:border-cyan-500/50 cursor-pointer transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-cyan-400 transition-colors">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className="bg-purple-600/20 border-purple-500/30 text-purple-300 text-xs">
                          {event.genre}
                        </Badge>
                        <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300 text-xs">
                          {event.type}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </motion.div>
              ))}

              {/* Trending */}
              {suggestions.trending?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="pt-3 border-t border-gray-700/50"
                >
                  <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Em Alta na Cena
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.trending.slice(0, 3).map((event, idx) => (
                      <Badge
                        key={event.id}
                        onClick={() => onSelectSuggestion?.(event)}
                        className="bg-orange-600/20 border-orange-500/30 text-orange-300 cursor-pointer hover:bg-orange-600/30 transition-colors"
                      >
                        🔥 {event.genre}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              )}

              <Button
                onClick={generateSuggestions}
                variant="outline"
                size="sm"
                className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-600/20"
              >
                <Sparkles className="w-3 h-3 mr-2" />
                Gerar Novas Sugestões
              </Button>
            </motion.div>
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}