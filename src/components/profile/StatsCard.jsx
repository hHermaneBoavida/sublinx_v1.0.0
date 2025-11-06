import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const colorClasses = {
  cyan: "from-cyan-900/50 to-cyan-500/10",
  purple: "from-purple-900/50 to-purple-500/10",
  lime: "from-lime-900/50 to-lime-500/10",
  orange: "from-orange-900/50 to-orange-500/10"
};

export default function StatsCard({ icon: Icon, label, value, color }) {
  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color]} border-gray-700`}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-lg bg-black/30`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}