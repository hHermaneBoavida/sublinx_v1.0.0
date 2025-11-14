import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Heart, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ActivityTimeline({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-12 text-center">
          <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            Nenhuma atividade recente
          </h3>
          <p className="text-gray-500">
            As interações aparecerão aqui
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardContent className="p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          Atividade Recente
        </h3>
        
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {activities.map((activity, index) => (
            <motion.div
              key={`${activity.type}-${activity.data.id}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-cyan-500/30 transition-colors"
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                activity.type === 'like' 
                  ? 'bg-red-600/20' 
                  : 'bg-blue-600/20'
              }`}>
                {activity.type === 'like' ? (
                  <Heart className="w-5 h-5 text-red-400" />
                ) : (
                  <MessageCircle className="w-5 h-5 text-blue-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">
                  {activity.type === 'like' 
                    ? 'Curtiu um evento'
                    : 'Comentou em um evento'}
                </p>
                
                {activity.type === 'comment' && activity.data.content && (
                  <p className="text-gray-400 text-xs mt-1 line-clamp-2 italic">
                    "{activity.data.content}"
                  </p>
                )}
                
                <p className="text-gray-500 text-xs mt-1.5">
                  {format(new Date(activity.timestamp), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              {/* Indicator */}
              <motion.div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  activity.type === 'like' ? 'bg-red-500' : 'bg-blue-500'
                }`}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  boxShadow: activity.type === 'like' 
                    ? '0 0 10px rgba(239, 68, 68, 0.8)'
                    : '0 0 10px rgba(59, 130, 246, 0.8)'
                }}
              />
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}