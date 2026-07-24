import React, { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, MapPin, Calendar, X } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useSearch } from "./SearchContext";

export default function GlobalSearch({ onSelectEvent, onSelectVenue }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { searchQuery, setSearchQuery, clearSearch } = useSearch();
  const [showResults, setShowResults] = useState(false);

  const isFeedPage = location.pathname === createPageUrl("Feed");

  const { data: venues = [], isLoading: loadingVenues } = useQuery({
    queryKey: ['globalSearchVenues'],
    queryFn: async () => await base44.entities.Venue.list('-rating', 200),
    staleTime: 60000,
  });

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['globalSearchEvents'],
    queryFn: async () => await base44.entities.Event.list('-date', 200),
    staleTime: 60000,
  });

  const results = useMemo(() => {
    if (!searchQuery.trim()) return { venues: [], events: [] };
    const q = searchQuery.toLowerCase().trim();
    return {
      venues: venues
        .filter(v =>
          v.name?.toLowerCase().includes(q) ||
          v.location?.city?.toLowerCase().includes(q) ||
          v.location?.neighborhood?.toLowerCase().includes(q) ||
          v.type?.toLowerCase().includes(q) ||
          v.genres?.some(g => g?.toLowerCase().includes(q))
        )
        .slice(0, 5),
      events: events
        .filter(e =>
          e.title?.toLowerCase().includes(q) ||
          e.genre?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q) ||
          e.location?.city?.toLowerCase().includes(q) ||
          e.location?.venue_name?.toLowerCase().includes(q) ||
          e.location?.address?.toLowerCase().includes(q) ||
          e.organizer?.toLowerCase().includes(q)
        )
        .slice(0, 5),
    };
  }, [searchQuery, venues, events]);

  const hasResults = results.venues.length > 0 || results.events.length > 0;
  const isLoading = loadingVenues || loadingEvents;

  const handleSelectEvent = (event) => {
    setShowResults(false);
    if (onSelectEvent) {
      onSelectEvent(event);
    } else {
      navigate(createPageUrl("Mapa"));
    }
  };

  const handleSelectVenue = (venue) => {
    setShowResults(false);
    if (onSelectVenue) {
      onSelectVenue(venue);
    } else {
      navigate(createPageUrl("Mapa"));
    }
  };

  const handleChange = (e) => {
    setSearchQuery(e.target.value);
    if (!isFeedPage) setShowResults(true);
  };

  const handleClear = () => {
    clearSearch();
    setShowResults(false);
  };

  const showDropdown = !isFeedPage && showResults && searchQuery.trim();

  return (
    <div className="relative px-3 sm:px-4 py-2 z-20">
      <div className="relative max-w-3xl mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleChange}
          onFocus={() => !isFeedPage && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="Buscar eventos e locais..."
          className="w-full h-10 pl-10 pr-10 rounded-xl bg-black/60 border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-gray-500 hover:text-white" />
          </button>
        )}

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-black/95 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 text-sm">Carregando...</div>
            ) : !hasResults ? (
              <div className="p-4 text-center text-gray-500 text-sm">Nenhum resultado encontrado</div>
            ) : (
              <>
                {results.events.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Eventos</div>
                    {results.events.map(event => (
                      <button
                        key={event.id}
                        onClick={() => handleSelectEvent(event)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                      >
                        <Calendar className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-white truncate">{event.title}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {event.genre}{event.location?.city ? ` · ${event.location.city}` : ''}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {results.venues.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t border-white/5">Locais</div>
                    {results.venues.map(venue => (
                      <button
                        key={venue.id}
                        onClick={() => handleSelectVenue(venue)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                      >
                        <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-white truncate">{venue.name}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {venue.type}{venue.location?.city ? ` · ${venue.location.city}` : ''}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}