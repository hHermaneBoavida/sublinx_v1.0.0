import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { MapPin, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const REGIONS = [
  {
    key: "vila_mariana", label: "Vila Mariana", color: "#06b6d4",
    match: (v) => (v.location?.neighborhood || "").toLowerCase().includes("vila mariana"),
  },
  {
    key: "sacoma", label: "Sacomã", color: "#8b5cf6",
    match: (v) => (v.location?.neighborhood || "").toLowerCase().includes("sacom"),
  },
  {
    key: "heliopolis", label: "Heliópolis", color: "#ec4899",
    match: (v) => (v.location?.neighborhood || "").toLowerCase().includes("heli"),
  },
  {
    key: "sao_caetano", label: "São Caetano", color: "#f59e0b",
    match: (v) =>
      (v.location?.city || "").toLowerCase().includes("são caetano") ||
      (v.location?.neighborhood || "").toLowerCase().includes("são caetano"),
  },
];

export default function RegionalGrowthPanel() {
  const { data: venues = [], isLoading: loadingVenues } = useQuery({
    queryKey: ["regional-venues"],
    queryFn: async () => await base44.entities.Venue.list("-created_date", 500),
    staleTime: 60000,
  });

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ["regional-events"],
    queryFn: async () => await base44.entities.Event.list("-date", 500),
    staleTime: 60000,
  });

  const { regionStats, monthlyData } = useMemo(() => {
    const venuesByRegion = {};
    REGIONS.forEach((r) => { venuesByRegion[r.key] = []; });

    venues.forEach((v) => {
      REGIONS.forEach((r) => {
        if (r.match(v)) venuesByRegion[r.key].push(v);
      });
    });

    const venueNameSets = {};
    REGIONS.forEach((r) => {
      venueNameSets[r.key] = new Set(
        venuesByRegion[r.key].map((v) => (v.name || "").toLowerCase().trim())
      );
    });

    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      months.push({ key: format(d, "yyyy-MM"), label: format(d, "MMM", { locale: ptBR }) });
    }

    const monthlyDataMap = months.map((m) => ({
      month: m.label,
      ...Object.fromEntries(REGIONS.map((r) => [r.key, 0])),
    }));

    const regionStats = REGIONS.map((r) => ({
      ...r,
      venueCount: venuesByRegion[r.key].length,
      eventCount: 0,
      totalAttendees: 0,
      newEventsThisMonth: 0,
    }));
    const regionMap = Object.fromEntries(regionStats.map((r) => [r.key, r]));

    events.forEach((e) => {
      const eventDate = e.date ? new Date(e.date) : null;
      const monthKey = eventDate ? format(eventDate, "yyyy-MM") : null;
      const monthIdx = months.findIndex((m) => m.key === monthKey);
      const attendees = e.current_attendees || 0;
      const venueName = (e.location?.venue_name || "").toLowerCase().trim();

      REGIONS.forEach((r) => {
        let matched = false;
        if (venueName && venueNameSets[r.key].has(venueName)) matched = true;
        if (!matched && e.location?.lat && e.location?.lng) {
          venuesByRegion[r.key].forEach((v) => {
            if (matched) return;
            const dlat = Math.abs(e.location.lat - v.location.lat);
            const dlng = Math.abs(e.location.lng - v.location.lng);
            if (dlat < 0.002 && dlng < 0.002) matched = true;
          });
        }

        if (matched) {
          regionMap[r.key].eventCount++;
          regionMap[r.key].totalAttendees += attendees;
          if (monthIdx >= 0) monthlyDataMap[monthIdx][r.key]++;
          if (monthKey === format(now, "yyyy-MM")) regionMap[r.key].newEventsThisMonth++;
        }
      });
    });

    return { regionStats, monthlyData: monthlyDataMap };
  }, [venues, events]);

  if (loadingVenues || loadingEvents) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards per region */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {regionStats.map((r, i) => (
          <motion.div
            key={r.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="bg-gray-900/50 border-gray-700 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full" style={{ background: r.color }} />
              <CardContent className="p-3 pl-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3 h-3" style={{ color: r.color }} />
                  <h3 className="text-xs font-bold text-white">{r.label}</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] text-gray-400">Locais</p>
                    <p className="text-sm font-bold text-white">{r.venueCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Eventos</p>
                    <p className="text-sm font-bold text-white">{r.eventCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Público</p>
                    <p className="text-sm font-bold text-white">{r.totalAttendees}</p>
                  </div>
                </div>
                {r.newEventsThisMonth > 0 && (
                  <Badge className="mt-2 text-[9px] bg-green-600/20 border-green-500/30 text-green-300">
                    +{r.newEventsThisMonth} este mês
                  </Badge>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Monthly growth chart */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Crescimento de Eventos por Região (6 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
              />
              <Legend />
              {REGIONS.map((r) => (
                <Bar key={r.key} dataKey={r.key} name={r.label} fill={r.color} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}