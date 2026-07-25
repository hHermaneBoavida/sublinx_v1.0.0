import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Gift, Star, Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function GuestListStatus({ event, user }) {
  const navigate = useNavigate();

  const { data: guestStatus } = useQuery({
    queryKey: ['guestStatus', event.id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const guests = await base44.entities.GuestList.filter({
        event_id: event.id,
        guest_user_id: user.id
      });
      return guests[0] || null;
    },
    enabled: !!user && !!event.id,
  });

  if (!guestStatus) return null;

  const getVipInfo = () => {
    switch (guestStatus.vip_type) {
      case 'free':
        return {
          icon: Gift,
          label: "Entrada Gratuita",
          color: "from-green-900/30 to-emerald-900/30",
          borderColor: "border-green-500/50",
          textColor: "text-green-300"
        };
      case 'discount_50':
        return {
          icon: Gift,
          label: "50% de Desconto",
          color: "from-blue-900/30 to-cyan-900/30",
          borderColor: "border-blue-500/50",
          textColor: "text-blue-300"
        };
      case 'discount_75':
        return {
          icon: Gift,
          label: "75% de Desconto",
          color: "from-purple-900/30 to-pink-900/30",
          borderColor: "border-purple-500/50",
          textColor: "text-purple-300"
        };
      case 'influencer':
        return {
          icon: Star,
          label: "Convidado Influencer",
          color: "from-pink-900/30 to-rose-900/30",
          borderColor: "border-pink-500/50",
          textColor: "text-pink-300"
        };
      case 'vip_exclusive':
        return {
          icon: Crown,
          label: "VIP Exclusivo",
          color: "from-yellow-900/30 to-orange-900/30",
          borderColor: "border-yellow-500/50",
          textColor: "text-yellow-300"
        };
      default:
        return {
          icon: Crown,
          label: "Guest List",
          color: "from-purple-900/30 to-pink-900/30",
          borderColor: "border-purple-500/50",
          textColor: "text-purple-300"
        };
    }
  };

  const vipInfo = getVipInfo();
  const Icon = vipInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mb-4"
    >
      <Card className={`bg-gradient-to-br ${vipInfo.color} border-2 ${vipInfo.borderColor} relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />
        
        <CardContent className="p-4 relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Icon className={`w-6 h-6 ${vipInfo.textColor}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-4 h-4 ${vipInfo.textColor}`} />
                <p className={`font-bold ${vipInfo.textColor}`}>Você está na Guest List VIP!</p>
              </div>
              <p className="text-sm text-white/80">{vipInfo.label}</p>
            </div>
            {guestStatus.status === 'accepted' && (
              <Check className="w-6 h-6 text-green-400" />
            )}
          </div>

          {guestStatus.special_access && (
            <Badge className="bg-cyan-600/30 border-cyan-500/50 text-cyan-300 mb-2">
              🎭 Acesso Backstage Incluso
            </Badge>
          )}

          {guestStatus.plus_ones > 0 && (
            <Badge className="bg-blue-600/30 border-blue-500/50 text-blue-300 mb-2 ml-2">
              👥 +{guestStatus.plus_ones} Acompanhante{guestStatus.plus_ones > 1 ? 's' : ''}
            </Badge>
          )}

          {guestStatus.status === 'pending' && (
            <p className="text-xs text-white/60 mb-3">
              Aguardando confirmação do organizador
            </p>
          )}

          {guestStatus.status === 'accepted' && guestStatus.status !== 'used' && (
            <Button
              onClick={(e) => { e.stopPropagation(); const url = event.ticket_url || event.purchase_url; window.open(url && url.startsWith('http') ? url : 'https://www.sympla.com.br/eventos/sao-paulo-sp', '_blank', 'noopener,noreferrer'); }}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-bold"
            >
              <Crown className="w-4 h-4 mr-2" />
              Confirmar Presença VIP
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}