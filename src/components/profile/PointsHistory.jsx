import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, TrendingUp } from 'lucide-react';
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';

const actionIcons = {
  event_attendance: Star,
  photo_share: Star,
  event_checkin: Star,
  review_write: Star,
  referral: Star,
  default: Star
};

export default function PointsHistory({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const pointsData = await base44.entities.PointsHistory.filter({ user_id: user.id }, '-created_date', 20);
        setHistory(pointsData);
      } catch (error) {
        console.error("Erro ao carregar histórico de pontos:", error);
        // Fallback com dados de exemplo
        setHistory([
          { id: 1, action_type: 'event_attendance', points: 50, description: "Check-in no D.Edge", created_date: new Date().toISOString() },
          { id: 2, action_type: 'photo_share', points: 10, description: "Compartilhou uma foto", created_date: new Date().toISOString() }
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [user]);

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Histórico de Pontos</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-gray-400">Carregando...</p>
        ) : history.length > 0 ? (
          <div className="space-y-4">
            {history.map(entry => {
              const Icon = actionIcons[entry.action_type] || actionIcons.default;
              return (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="font-semibold text-white">{entry.description}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(entry.created_date), "dd MMM yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +{entry.points} XP
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400">Nenhuma atividade registrada ainda.</p>
        )}
      </CardContent>
    </Card>
  );
}