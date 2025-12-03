import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function SponsorsSection({ sponsors, showTitle = true }) {
  if (!sponsors || sponsors.length === 0) return null;

  const tierConfig = {
    diamond: { label: "Diamante", color: "from-cyan-400 to-blue-600", icon: "💎" },
    gold: { label: "Ouro", color: "from-yellow-400 to-yellow-600", icon: "🥇" },
    silver: { label: "Prata", color: "from-gray-300 to-gray-500", icon: "🥈" },
    bronze: { label: "Bronze", color: "from-orange-400 to-orange-600", icon: "🥉" },
    partner: { label: "Parceiro", color: "from-purple-400 to-pink-600", icon: "🤝" }
  };

  const sortedSponsors = [...sponsors].sort((a, b) => {
    const tierOrder = { diamond: 0, gold: 1, silver: 2, bronze: 3, partner: 4 };
    return (tierOrder[a.tier] || 99) - (tierOrder[b.tier] || 99) || a.display_order - b.display_order;
  });

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      {showTitle && (
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Patrocinadores & Parceiros
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {sortedSponsors.map((sponsor, index) => {
          const config = tierConfig[sponsor.tier] || tierConfig.partner;
          
          return (
            <motion.div
              key={sponsor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.name}
                      className="w-20 h-20 object-contain rounded-lg bg-white/10 p-2"
                    />
                    {sponsor.tier !== 'partner' && (
                      <div className={`absolute -top-2 -right-2 text-2xl`}>
                        {config.icon}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{sponsor.name}</h4>
                      <Badge className={`bg-gradient-to-r ${config.color} text-white text-xs`}>
                        {config.label}
                      </Badge>
                    </div>
                    
                    {sponsor.description && (
                      <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                        {sponsor.description}
                      </p>
                    )}

                    {sponsor.website && (
                      <a
                        href={sponsor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Visitar site
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}