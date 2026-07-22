import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, addDays, addWeeks,
  addMonths, subMonths, isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft, ChevronRight, AlertTriangle, Loader2, CalendarDays,
} from "lucide-react";
import ReservationStatusBadge from "@/components/calendar/ReservationStatusBadge";
import ReservationDetailSheet from "@/components/calendar/ReservationDetailSheet";
import { useToast } from "@/components/ui/use-toast";

const weekDayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function CalendarioReservas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filterVenue, setFilterVenue] = useState("all");
  const [filterStatus, setFilterStatus] = useState("confirmed");

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => { try { return await base44.auth.me(); } catch { return null; } },
    retry: false,
  });

  useEffect(() => {
    if (user && !user.is_organizer) navigate(createPageUrl("Mapa"));
  }, [user, navigate]);

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["calendarReservations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const all = await base44.entities.Reservation.filter(
        { organizer_id: user.id }, "-reservation_date", 500
      );
      return all || [];
    },
    enabled: !!user?.id,
  });

  const venues = useMemo(() => {
    const map = new Map();
    reservations.forEach((r) => {
      if (r.venue_id && r.venue_name) map.set(r.venue_id, r.venue_name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [reservations]);

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      if (filterVenue !== "all" && r.venue_id !== filterVenue) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      return true;
    });
  }, [reservations, filterVenue, filterStatus]);

  const conflictIds = useMemo(() => {
    const conflicts = new Set();
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.reservation_date) - new Date(b.reservation_date)
    );
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        if (a.venue_id !== b.venue_id) continue;
        const sA = new Date(a.reservation_date);
        const eA = new Date(sA.getTime() + (a.duration_hours || 3) * 3600000);
        const sB = new Date(b.reservation_date);
        if (sB < eA && sB >= sA) {
          conflicts.add(a.id);
          conflicts.add(b.id);
        }
      }
    }
    return conflicts;
  }, [filtered]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { locale: ptBR });
    const end = endOfWeek(endOfMonth(currentDate), { locale: ptBR });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekDaysList = useMemo(() => {
    const start = startOfWeek(currentDate, { locale: ptBR });
    const end = endOfWeek(currentDate, { locale: ptBR });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const getForDay = (day) =>
    filtered.filter((r) => {
      if (!r.reservation_date) return false;
      return isSameDay(new Date(r.reservation_date), day);
    });

  const handleClick = (r) => {
    setSelectedReservation(r);
    setSheetOpen(true);
  };

  const prev = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, -1));
    else setCurrentDate(addDays(currentDate, -1));
  };
  const next = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const title =
    viewMode === "month"
      ? format(currentDate, "MMMM yyyy", { locale: ptBR })
      : viewMode === "week"
      ? `${format(startOfWeek(currentDate, { locale: ptBR }), "dd/MM")} - ${format(endOfWeek(currentDate, { locale: ptBR }), "dd/MM")}`
      : format(currentDate, "dd 'de' MMMM, yyyy", { locale: ptBR });

  const handleStatusChange = async (id, status) => {
    // The backend call is already done by the ReservationDetailSheet via approveReservation.
    // Here we just refresh cache + close the sheet.
    queryClient.invalidateQueries({ queryKey: ["calendarReservations"] });
    queryClient.invalidateQueries({ queryKey: ["organizerReservations"] });
    toast({ title: "Status atualizado", description: `Reserva marcada como ${status}.` });
    setSheetOpen(false);
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Calendário de Reservas</h1>
            <p className="text-sm text-gray-400 mt-1">
              {filtered.length} reserva(s) {filterStatus !== "all" ? `· ${filterStatus}` : "· todos os status"}
            </p>
          </div>
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList className="bg-gray-900">
              <TabsTrigger value="day" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Dia</TabsTrigger>
              <TabsTrigger value="week" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Semana</TabsTrigger>
              <TabsTrigger value="month" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Mês</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Navigation + Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prev} className="border-gray-700 bg-gray-900 hover:bg-gray-800">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[180px] text-center capitalize">{title}</span>
            <Button variant="outline" size="icon" onClick={next} className="border-gray-700 bg-gray-900 hover:bg-gray-800">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}
              className="ml-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800">
              Hoje
            </Button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Select value={filterVenue} onValueChange={setFilterVenue}>
              <SelectTrigger className="w-[160px] md:w-[200px] border-gray-700 bg-gray-900 text-sm text-white">
                <SelectValue placeholder="Local" />
              </SelectTrigger>
              <SelectContent className="bg-gray-950 border-gray-700">
                <SelectItem value="all" className="text-gray-200 focus:bg-gray-800 focus:text-white">Todos os locais</SelectItem>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={v.id} className="text-gray-200 focus:bg-gray-800 focus:text-white">{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] md:w-[160px] border-gray-700 bg-gray-900 text-sm text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-950 border-gray-700">
                <SelectItem value="all" className="text-gray-200 focus:bg-gray-800 focus:text-white">Todos</SelectItem>
                <SelectItem value="pending" className="text-gray-200 focus:bg-gray-800 focus:text-white">Pendente</SelectItem>
                <SelectItem value="confirmed" className="text-gray-200 focus:bg-gray-800 focus:text-white">Confirmado</SelectItem>
                <SelectItem value="cancelled" className="text-gray-200 focus:bg-gray-800 focus:text-white">Cancelado</SelectItem>
                <SelectItem value="completed" className="text-gray-200 focus:bg-gray-800 focus:text-white">Finalizado</SelectItem>
                <SelectItem value="no_show" className="text-gray-200 focus:bg-gray-800 focus:text-white">No-show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <CalendarDays className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">Nenhuma reserva encontrada com os filtros selecionados.</p>
          </div>
        )}

        {/* Month View */}
        {!isLoading && viewMode === "month" && filtered.length > 0 && (
          <div className="rounded-lg border border-gray-800 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-gray-800">
              {weekDayLabels.map((d) => (
                <div key={d} className="p-2 text-center text-xs font-semibold text-gray-400 uppercase">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((day, i) => {
                const dayRes = getForDay(day);
                const inMonth = isSameMonth(day, currentDate);
                return (
                  <div key={i}
                    className={`min-h-[90px] md:min-h-[120px] border-r border-b border-gray-800 p-1.5 ${!inMonth ? "bg-gray-950/50" : ""}`}>
                    <div className={`text-xs mb-1 ${isToday(day) ? "bg-cyan-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold" : "text-gray-400"}`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayRes.slice(0, 3).map((r) => (
                        <button key={r.id} onClick={() => handleClick(r)}
                          className={`w-full text-left text-[10px] px-1.5 py-1 rounded truncate border ${
                            conflictIds.has(r.id) ? "border-red-500/50 bg-red-950/30" : "border-gray-700 bg-gray-800/60"
                          } hover:bg-gray-700/60 transition-colors`}>
                          {format(new Date(r.reservation_date), "HH:mm")} {r.venue_name}
                        </button>
                      ))}
                      {dayRes.length > 3 && (
                        <div className="text-[10px] text-gray-500 px-1">+{dayRes.length - 3} mais</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week View */}
        {!isLoading && viewMode === "week" && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
            {weekDaysList.map((day, i) => {
              const dayRes = getForDay(day);
              return (
                <div key={i} className="rounded-lg border border-gray-800 min-h-[180px]">
                  <div className={`p-2 text-center border-b border-gray-800 ${isToday(day) ? "bg-cyan-950/20" : ""}`}>
                    <div className="text-xs text-gray-400">{weekDayLabels[i]}</div>
                    <div className={`text-lg font-bold ${isToday(day) ? "text-cyan-400" : "text-white"}`}>
                      {format(day, "d")}
                    </div>
                  </div>
                  <div className="p-2 space-y-2">
                    {dayRes.length === 0 && <p className="text-xs text-gray-600 text-center py-4">—</p>}
                    {dayRes.map((r) => (
                      <button key={r.id} onClick={() => handleClick(r)}
                        className={`w-full text-left p-2 rounded border text-xs ${
                          conflictIds.has(r.id) ? "border-red-500/50 bg-red-950/30" : "border-gray-700 bg-gray-800/60"
                        } hover:bg-gray-700/60 transition-colors`}>
                        <div className="font-semibold">{format(new Date(r.reservation_date), "HH:mm")}</div>
                        <div className="text-gray-400 truncate">{r.venue_name}</div>
                        <div className="text-gray-500 mt-1">{r.user_name} · {r.party_size}p</div>
                        <div className="mt-1"><ReservationStatusBadge status={r.status} /></div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Day View */}
        {!isLoading && viewMode === "day" && filtered.length > 0 && (
          <div className="rounded-lg border border-gray-800 divide-y divide-gray-800">
            {getForDay(currentDate).length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhuma reserva para este dia.</p>
              </div>
            )}
            {getForDay(currentDate)
              .sort((a, b) => new Date(a.reservation_date) - new Date(b.reservation_date))
              .map((r) => (
                <button key={r.id} onClick={() => handleClick(r)}
                  className={`w-full flex items-center gap-4 p-4 hover:bg-gray-900/40 transition-colors text-left ${
                    conflictIds.has(r.id) ? "border-l-4 border-l-red-500" : ""
                  }`}>
                  <div className="text-center min-w-[60px]">
                    <div className="text-lg font-bold">{format(new Date(r.reservation_date), "HH:mm")}</div>
                    <div className="text-xs text-gray-500">{r.duration_hours || 3}h</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{r.venue_name}</div>
                    <div className="text-sm text-gray-400">{r.user_name} · {r.party_size} pessoas</div>
                    {r.table_type && <div className="text-xs text-gray-500 capitalize">{r.table_type.replace("_", " ")}</div>}
                  </div>
                  <ReservationStatusBadge status={r.status} />
                  {conflictIds.has(r.id) && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                </button>
              ))}
          </div>
        )}

        {/* Legend */}
        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border border-red-500/50 bg-red-950/30"></span>
              Conflito de horário
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-cyan-600"></span>
              Hoje
            </span>
          </div>
        )}
      </div>

      <ReservationDetailSheet
        reservation={selectedReservation}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        hasConflict={selectedReservation ? conflictIds.has(selectedReservation.id) : false}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}