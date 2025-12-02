import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Lightbulb, Target, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrendsAnalysis({ user }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const loadTrends = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('analyzeTrends');
      if (data.success) {
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Error loading trends:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_organizer) {
      loadTrends();
    }
  }, [user]);

  if (!user?.is_organizer) return null;

  return (
    <Card className="bg-gradient-to-br from-orange-900/20 via-black to-pink-900/20 border-2 border-orange-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-transparent bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            Análise de Tendências IA
          </CardTitle>
          <Button
            size="icon"
            variant="ghost"
            onClick={loadTrends}
            disabled={loading}
            className="h-8 w-8 hover:bg-orange-600/20"
          >
            <RefreshCw className={`w-4 h-4 text-orange-400 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
        ) : analysis ? (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Resumo de Dados */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-900/50 rounded-lg border border-orange-500/20">
                  <p className="text-xs text-gray-400">Total de Eventos</p>
                  <p className="text-2xl font-bold text-white">{analysis.data_summary.total_events}</p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg border border-pink-500/20">
                  <p className="text-xs text-gray-400">Gênero Mais Engajado</p>
                  <p className="text-sm font-bold text-pink-300">
                    {analysis.data_summary.most_engaged_genre?.[0]}
                  </p>
                </div>
              </div>

              {/* Tendências Principais */}
              {analysis.ai_analysis.main_trends?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-orange-300 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Tendências Principais
                  </h4>
                  <div className="space-y-2">
                    {analysis.ai_analysis.main_trends.map((trend, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-3 bg-gray-900/50 rounded-lg border border-orange-500/20"
                      >
                        <h5 className="font-semibold text-white text-sm mb-1">{trend.title}</h5>
                        <p className="text-xs text-gray-400">{trend.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nichos Emergentes */}
              {analysis.ai_analysis.emerging_niches?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-pink-300 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Nichos para Explorar
                  </h4>
                  <div className="space-y-2">
                    {analysis.ai_analysis.emerging_niches.map((niche, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + idx * 0.1 }}
                        className="p-3 bg-gray-900/50 rounded-lg border border-pink-500/20"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h5 className="font-semibold text-white text-sm mb-1">{niche.niche}</h5>
                            <p className="text-xs text-gray-400 mb-2">{niche.potential}</p>
                            <Badge className="bg-pink-600/20 border-pink-500/30 text-pink-300 text-xs">
                              <Target className="w-3 h-3 mr-1" />
                              {niche.target_audience}
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Combinações Inovadoras */}
              {analysis.ai_analysis.innovative_combinations?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Combinações Inovadoras
                  </h4>
                  <div className="space-y-2">
                    {analysis.ai_analysis.innovative_combinations.map((combo, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + idx * 0.1 }}
                        className="p-3 bg-gray-900/50 rounded-lg border border-cyan-500/20"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-purple-600/20 border-purple-500/30 text-purple-300 text-xs">
                            {combo.genre}
                          </Badge>
                          <span className="text-gray-500">+</span>
                          <Badge className="bg-cyan-600/20 border-cyan-500/30 text-cyan-300 text-xs">
                            {combo.event_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400">{combo.rationale}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Insights do Público */}
              {analysis.ai_analysis.audience_insights?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Insights do Público
                  </h4>
                  <ul className="space-y-2">
                    {analysis.ai_analysis.audience_insights.map((insight, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 + idx * 0.1 }}
                        className="text-xs text-gray-300 flex items-start gap-2"
                      >
                        <span className="text-green-400 mt-0.5">💡</span>
                        <span>{insight}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700/50">
                Atualizado: {new Date(analysis.timestamp).toLocaleString('pt-BR')}
              </p>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhuma análise carregada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}