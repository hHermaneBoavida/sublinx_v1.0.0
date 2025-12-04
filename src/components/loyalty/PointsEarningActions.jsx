import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Users, Camera, MessageCircle, Calendar, Zap } from "lucide-react";
import { motion } from "framer-motion";

const POINTS_ACTIONS = [
  { 
    action: 'event_attendance', 
    points: 100, 
    icon: Calendar, 
    label: 'Participar de Evento',
    description: 'Ganhe pontos ao comparecer em eventos'
  },
  { 
    action: 'photo_share', 
    points: 50, 
    icon: Camera, 
    label: 'Compartilhar Foto',
    description: 'Poste fotos de eventos no feed'
  },
  { 
    action: 'review_write', 
    points: 75, 
    icon: MessageCircle, 
    label: 'Avaliar Evento',
    description: 'Deixe uma avaliação detalhada'
  },
  { 
    action: 'referral', 
    points: 200, 
    icon: Users, 
    label: 'Convidar Amigo',
    description: 'Convide amigos e ganhe quando se cadastrarem'
  },
  { 
    action: 'event_checkin', 
    points: 50, 
    icon: CheckCircle, 
    label: 'Check-in no Evento',
    description: 'Faça check-in ao chegar no evento'
  }
];

export default function PointsEarningActions() {
  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Como Ganhar Pontos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {POINTS_ACTIONS.map((action, idx) => {
          const Icon = action.icon;
          
          return (
            <motion.div
              key={action.action}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-yellow-500/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-600 to-orange-600 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">{action.label}</h4>
                  <p className="text-xs text-gray-400">{action.description}</p>
                </div>
              </div>
              <Badge className="bg-yellow-600/20 border-yellow-500/30 text-yellow-300 flex items-center gap-1">
                <Star className="w-3 h-3" fill="#facc15" />
                +{action.points}
              </Badge>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export async function awardPoints(userId, actionType, eventId = null, description = "") {
  try {
    const actionConfig = POINTS_ACTIONS.find(a => a.action === actionType);
    if (!actionConfig) return;

    const user = await base44.auth.me();
    if (!user || user.id !== userId) return;

    await base44.entities.PointsHistory.create({
      user_id: userId,
      action_type: actionType,
      points: actionConfig.points,
      event_id: eventId,
      description: description || actionConfig.description
    });

    const currentPoints = user.experience_points || 0;
    await base44.auth.updateMe({
      experience_points: currentPoints + actionConfig.points
    });

    return actionConfig.points;
  } catch (error) {
    console.error('Erro ao conceder pontos:', error);
    return 0;
  }
}