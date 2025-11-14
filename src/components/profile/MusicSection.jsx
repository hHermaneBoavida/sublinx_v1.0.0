import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Music, TrendingUp, Star, Play } from "lucide-react";
import { motion } from "framer-motion";

export default function MusicSection({ favoriteGenres, totalEvents, isOrganizer }) {
  return (
    <div className="space-y-4">
      {/* Gêneros Favoritos */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Music className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Gêneros Favoritos</h3>
          </div>
          
          {favoriteGenres.length > 0 ? (
            <div className="space-y-3">
              {favoriteGenres.map((item, index) => (
                <motion.div
                  key={item.genre}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center ${
                      index === 0 ? 'from-yellow-500 to-orange-500' :
                      index === 1 ? 'from-purple-500 to-pink-500' :
                      'from-cyan-500 to-blue-500'
                    }`}>
                      <span className="text-white font-bold text-sm">#{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white capitalize">{item.genre}</p>
                      <p className="text-xs text-gray-400">{item.count} evento{item.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="w-24">
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.count / totalEvents) * 100}%` }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">
              Nenhum dado musical disponível ainda
            </p>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas Musicais */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-xs text-gray-400 mb-1">Gênero Principal</p>
            <p className="font-bold text-white text-sm capitalize">
              {favoriteGenres[0]?.genre || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-xs text-gray-400 mb-1">Diversidade</p>
            <p className="font-bold text-white text-sm">
              {favoriteGenres.length} gêneros
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Playlists (placeholder) */}
      {isOrganizer && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-cyan-400" />
                Playlists dos Eventos
              </h3>
            </div>
            <div className="text-center py-8 bg-gray-800/30 rounded-lg border border-gray-700">
              <Music className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                🎵 Integração com Spotify em breve!
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Conecte sua conta para compartilhar playlists
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}