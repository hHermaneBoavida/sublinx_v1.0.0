import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Users, Eye } from "lucide-react";

export default function LiveEventCard({ stream }) {
  const handleWatchStream = () => {
    // Simular abertura de live
    alert(`Assistindo live: ${stream.title}`);
  };

  return (
    <Card className="min-w-[200px] bg-gradient-to-r from-red-600/80 to-pink-600/80 border-red-500/30 cursor-pointer hover:scale-105 transition-transform">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <Badge className="bg-red-600 text-white text-xs">
            AO VIVO
          </Badge>
        </div>
        
        <h4 className="font-semibold text-white text-sm mb-1 truncate">
          {stream.title}
        </h4>
        
        <div className="flex items-center justify-between text-xs text-gray-200">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{stream.viewer_count}</span>
          </div>
          <button
            onClick={handleWatchStream}
            className="bg-black/30 hover:bg-black/50 rounded-full p-1 transition-colors"
          >
            <Play className="w-3 h-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}