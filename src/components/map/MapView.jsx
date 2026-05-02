import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Menu, X, Filter, AlertCircle, Building2, Zap } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import AdvancedFilters from './AdvancedFilters';
import { AnimatePresence, motion } from 'framer-motion';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapUpdater({ center }) {
  const map = useMap();
  const initializedRef = useRef(false);
  useEffect(() => {
    if (center && !initializedRef.current) {
      initializedRef.current = true;
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

function ZoomTracker({ onZoomChange }) {
  const map = useMap();
  useEffect(() => {
    const handleZoom = () => onZoomChange(map.getZoom());
    map.on('zoomend', handleZoom);
    return () => map.off('zoomend', handleZoom);
  }, [map, onZoomChange]);
  return null;
}

const GENRE_COLORS = {
  techno: '#06b6d4', house: '#10b981', trance: '#8b5cf6',
  drum_bass: '#f59e0b', minimal: '#ec4899', progressive: '#84cc16',
  deep_house: '#3b82f6', industrial: '#ef4444', funk: '#f97316',
  trap: '#eab308', hip_hop: '#a855f7', reggae: '#22c55e',
  ambient: '#64748b', experimental: '#e879f9', acid: '#facc15',
  hardcore: '#dc2626', kuduro: '#fb923c', kizomba: '#f472b6',
  samba: '#4ade80', pagode: '#86efac', rap: '#c084fc',
};

function getGenreColor(genre) {
  return GENRE_COLORS[genre] || '#a855f7';
}

// Cria o ícone de evento (pin principal)
function createEventIcon(event, isLive) {
  const color = getGenreColor(event.genre);
  const shortTitle = event.title?.length > 14 ? event.title.slice(0, 12) + '…' : (event.title || '');
  const imgHtml = event.image_url
    ? `<img src="${event.image_url}" onerror="this.style.display='none';this.parentNode.innerHTML='<span style=\\'font-size:18px;\\'>🎵</span>';" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<span style="font-size:18px;">🎵</span>`;
  const liveRing = isLive ? `
    <div style="position:absolute;inset:-10px;border-radius:50%;border:3px solid ${color};animation:live-pulse 1.2s ease-in-out infinite;"></div>
    <div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:#ef4444;color:#fff;font-size:7px;font-weight:900;padding:1px 4px;border-radius:4px;white-space:nowrap;letter-spacing:0.5px;">● AO VIVO</div>
  ` : `
    <div style="position:absolute;inset:-6px;border-radius:50%;background:${color}33;animation:pulse-ring 2.5s ease-in-out infinite;"></div>
    <div style="position:absolute;inset:-3px;border-radius:50%;border:2px solid ${color}88;animation:pulse-ring 2.5s ease-in-out infinite 0.7s;"></div>
  `;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:drop-shadow(0 4px 12px ${color}66);">
        <div style="position:relative;width:52px;height:52px;">
          ${liveRing}
          <div style="
            width:52px;height:52px;border-radius:50%;
            border:3px solid ${color};
            box-shadow:0 0 18px ${color}cc,0 4px 16px rgba(0,0,0,0.8);
            overflow:hidden;background:#111;
            display:flex;align-items:center;justify-content:center;
            position:relative;z-index:2;
          ">${imgHtml}</div>
        </div>
        <div style="
          margin-top:5px;background:rgba(0,0,0,0.92);
          border:1px solid ${color}88;border-radius:8px;
          padding:2px 7px;font-size:10px;font-weight:700;color:#fff;
          white-space:nowrap;box-shadow:0 0 8px ${color}66;
          max-width:90px;overflow:hidden;text-overflow:ellipsis;
        ">${shortTitle}</div>
      </div>
    `,
    iconSize: [72, 85],
    iconAnchor: [36, 85]
  });
}

// Cria o ícone de venue (mais neutro, menor)
function createVenueIcon(venue) {
  const color = '#475569';
  const accent = '#94a3b8';
  const shortName = venue.name?.length > 14 ? venue.name.slice(0, 12) + '…' : (venue.name || 'Local');

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;opacity:0.85;">
        <div style="
          width:36px;height:36px;border-radius:10px;
          border:2px solid ${accent};
          box-shadow:0 0 8px ${color}88,0 2px 8px rgba(0,0,0,0.7);
          background:#1e293b;
          display:flex;align-items:center;justify-content:center;
          position:relative;
        ">
          <span style="font-size:16px;">🏢</span>
        </div>
        <div style="
          margin-top:4px;background:rgba(15,23,42,0.92);
          border:1px solid ${accent}55;border-radius:6px;
          padding:2px 5px;font-size:9px;font-weight:600;color:${accent};
          white-space:nowrap;max-width:80px;overflow:hidden;text-overflow:ellipsis;
        ">${shortName}</div>
      </div>
    `,
    iconSize: [60, 60],
    iconAnchor: [30, 60]
  });
}

// Ícone de cluster
function createClusterIcon(count, color = '#06b6d4') {
  return L.divIcon({
    className: 'custom-cluster',
    html: `
      <div style="
        width:44px;height:44px;border-radius:50%;
        background:linear-gradient(135deg,${color},${color}88);
        border:3px solid ${color};
        display:flex;align-items:center;justify-content:center;
        font-size:14px;font-weight:900;color:#fff;
        box-shadow:0 0 20px ${color}88;
        cursor:pointer;
      ">${count}</div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });
}

// Agrupa eventos próximos por distância em graus
function clusterEvents(events, zoomLevel) {
  const threshold = zoomLevel >= 14 ? 0.003 : zoomLevel >= 12 ? 0.01 : 0.04;
  const clusters = [];
  const used = new Set();

  events.forEach((event, i) => {
    if (used.has(i)) return;
    const cluster = [event];
    used.add(i);

    events.forEach((other, j) => {
      if (used.has(j)) return;
      const dlat = Math.abs(event.location.lat - other.location.lat);
      const dlng = Math.abs(event.location.lng - other.location.lng);
      if (dlat < threshold && dlng < threshold) {
        cluster.push(other);
        used.add(j);
      }
    });

    const avgLat = cluster.reduce((s, e) => s + e.location.lat, 0) / cluster.length;
    const avgLng = cluster.reduce((s, e) => s + e.location.lng, 0) / cluster.length;
    clusters.push({ center: [avgLat, avgLng], events: cluster, count: cluster.length });
  });

  return clusters;
}

export default function MapView({ 
  events = [],
  venues = [],
  userLocation, 
  onPinClick, 
  onPinDetailsClick,
  onVenueClick,
  onOpenFilters,
  onOpenVibe,
  onOpenUpload,
  searchTerm = "",
  onSearchChange,
  activeVibe,
  suggestedEvents = [],
  onMapReady 
}) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [mapReady, setMapReady] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(13);
  const [mapError, setMapError] = useState(null);
  const [mapKey] = useState(0);
  const [advancedFilters, setAdvancedFilters] = useState({
    genre: 'all', type: 'all', dateRange: 'all',
    maxDistance: 50, minAttendees: 0, maxPrice: 500
  });
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const debounceRef = useRef(null);

  // Debounce busca 300ms
  const handleSearchInput = useCallback((val) => {
    setLocalSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearchChange(val);
    }, 300);
  }, [onSearchChange]);

  useEffect(() => { setLocalSearch(searchTerm); }, [searchTerm]);

  const center = userLocation ? [userLocation.lat, userLocation.lng] : [-23.5505, -46.6333];
  const zoom = userLocation ? 13 : 11;

  // Validate events data
  useEffect(() => {
    if (events && !Array.isArray(events)) setMapError('Erro ao carregar eventos');
  }, [events]);

  // Cleanup mapa ao desmontar
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try { mapRef.current.off(); mapRef.current.remove(); } catch {}
        mapRef.current = null;
      }
      if (containerRef.current) {
        const lc = containerRef.current.querySelector('.leaflet-container');
        if (lc?._leaflet_id) delete lc._leaflet_id;
      }
    };
  }, []);

  useEffect(() => {
    if (onMapReady && mapReady && mapRef.current) {
      onMapReady(() => {
        if (mapRef.current) {
          try { mapRef.current.off(); mapRef.current.remove(); } catch {}
          mapRef.current = null;
        }
      });
    }
  }, [onMapReady, mapReady]);

  // Filtrar eventos com filtros avançados
  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    return events.filter(event => {
      if (!event?.location?.lat || !event?.location?.lng) return false;
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        const match = event.title?.toLowerCase().includes(lower) ||
          event.location?.venue_name?.toLowerCase().includes(lower) ||
          event.genre?.toLowerCase().includes(lower) ||
          event.type?.toLowerCase().includes(lower);
        if (!match) return false;
      }
      if (advancedFilters.dateRange !== 'all') {
        const eventDate = new Date(event.date);
        const now = new Date();
        if (advancedFilters.dateRange === 'today' && eventDate.toDateString() !== now.toDateString()) return false;
        if (advancedFilters.dateRange === 'week') {
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          if (eventDate > weekFromNow) return false;
        }
        if (advancedFilters.dateRange === 'month') {
          const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          if (eventDate > monthFromNow) return false;
        }
      }
      if ((event.current_attendees || 0) < advancedFilters.minAttendees) return false;
      const eventPrice = event.price || 0;
      if (advancedFilters.maxPrice < 500 && eventPrice > advancedFilters.maxPrice) return false;
      return true;
    });
  }, [events, searchTerm, advancedFilters]);

  // IDs de locais que JÁ TÊM evento — para não duplicar pin
  const venueIdsWithEvent = useMemo(() => {
    const ids = new Set();
    filteredEvents.forEach(e => {
      if (e.location?.venue_name) ids.add(e.location.venue_name.toLowerCase().trim());
    });
    return ids;
  }, [filteredEvents]);

  // Venues a exibir (sem evento ativo)
  const visibleVenues = useMemo(() => {
    if (!venues || venues.length === 0) return [];
    return venues.filter(v => {
      if (!v?.location?.lat || !v?.location?.lng) return false;
      const key = (v.name || '').toLowerCase().trim();
      if (venueIdsWithEvent.has(key)) return false;
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        return v.name?.toLowerCase().includes(lower) ||
          v.category?.toLowerCase().includes(lower) ||
          v.vibe_tags?.some(t => t.toLowerCase().includes(lower));
      }
      return true;
    });
  }, [venues, venueIdsWithEvent, searchTerm]);

  // Clustering de eventos
  const eventClusters = useMemo(() => clusterEvents(filteredEvents, zoomLevel), [filteredEvents, zoomLevel]);

  // Verificar se evento está ao vivo
  const isEventLive = useCallback((event) => {
    const now = Date.now();
    const start = new Date(event.date).getTime();
    const durationMs = (event.duration_hours || 4) * 60 * 60 * 1000;
    return now >= start && now <= start + durationMs;
  }, []);

  const activeFiltersCount = Object.keys(advancedFilters).filter(key => {
    if (key === 'maxDistance') return advancedFilters[key] !== 50;
    if (key === 'maxPrice') return advancedFilters[key] !== 500;
    if (key === 'minAttendees') return advancedFilters[key] !== 0;
    return advancedFilters[key] !== 'all';
  }).length;

  const eventStats = { total: events.length, filtered: filteredEvents.length };

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-red-500/30 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Erro no Mapa</h3>
          <p className="text-gray-300 text-sm mb-4">{mapError}</p>
          <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-cyan-600 to-purple-600">
            Recarregar
          </Button>
        </div>
      </div>
    );
  }

  // Live events badge count
  const liveCount = filteredEvents.filter(isEventLive).length;

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {/* Search Bar com debounce */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 z-10" />
          <Input
            placeholder="Buscar eventos, locais, vibe..."
            value={localSearch}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="pl-10 h-11 bg-gray-900 border-2 border-cyan-500/60 text-white placeholder:text-gray-400 focus:border-cyan-400 shadow-lg"
            style={{ boxShadow: '0 0 12px rgba(6,182,212,0.3)' }}
          />
          {localSearch && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              onClick={() => handleSearchInput('')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button
          size="icon"
          onClick={() => setShowAdvancedFilters(true)}
          className="h-11 w-11 bg-gray-900 border-2 border-cyan-500/60 hover:bg-gray-800 hover:border-cyan-400 relative shadow-lg flex-shrink-0"
          style={{ boxShadow: '0 0 12px rgba(6,182,212,0.3)' }}
        >
          <Filter className="w-5 h-5 text-cyan-400" />
          {activeFiltersCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-cyan-500 text-[10px] text-black font-bold">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        <Button
          size="icon"
          onClick={() => setShowMenu(!showMenu)}
          className="h-11 w-11 bg-gray-900 border-2 border-purple-500/60 hover:bg-gray-800 hover:border-purple-400 shadow-lg flex-shrink-0"
          style={{ boxShadow: '0 0 12px rgba(168,85,247,0.3)' }}
        >
          {showMenu ? <X className="w-5 h-5 text-purple-400" /> : <Menu className="w-5 h-5 text-purple-400" />}
        </Button>
      </div>

      {/* Live events badge */}
      {liveCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-20 left-4 z-[1000]"
        >
          <Badge
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold cursor-default"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.9), rgba(220,38,38,0.8))',
              border: '1.5px solid rgba(239,68,68,0.7)',
              boxShadow: '0 0 16px rgba(239,68,68,0.6)',
              color: '#fff'
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block" />
            {liveCount} AO VIVO
          </Badge>
        </motion.div>
      )}

      {/* Menu Dropdown */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            className="absolute top-20 right-4 z-[2000] bg-black/95 backdrop-blur-xl border border-gray-700 rounded-xl p-2 min-w-[200px] shadow-2xl"
          >
            <Button variant="ghost" onClick={() => { onOpenVibe(); setShowMenu(false); }} className="w-full justify-start text-white hover:bg-gray-800">
              🎭 Vibe Selector
            </Button>
            <Button variant="ghost" onClick={() => { onOpenUpload(); setShowMenu(false); }} className="w-full justify-start text-white hover:bg-gray-800">
              🎬 Upload Reel
            </Button>
            <div className="h-px bg-gray-700 my-2" />
            <Button variant="ghost" onClick={() => navigate(createPageUrl("Feed"))} className="w-full justify-start text-white hover:bg-gray-800">
              ⚡ Feed
            </Button>
            <Button variant="ghost" onClick={() => navigate(createPageUrl("Perfil"))} className="w-full justify-start text-white hover:bg-gray-800">
              👤 Perfil
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats bar */}
      <div className="absolute bottom-28 left-4 z-[999] flex gap-2">
        {filteredEvents.length !== events.length && (
          <Badge className="bg-cyan-600/90 backdrop-blur-xl border-cyan-500/50 text-white text-xs">
            <Zap className="w-3 h-3 mr-1" />
            {filteredEvents.length} eventos
          </Badge>
        )}
        {visibleVenues.length > 0 && (
          <Badge className="bg-gray-700/90 backdrop-blur-xl border-gray-600/50 text-gray-300 text-xs">
            <Building2 className="w-3 h-3 mr-1" />
            {visibleVenues.length} locais
          </Badge>
        )}
      </div>

      <MapContainer
        key={`map-${mapKey}`}
        ref={mapRef}
        center={center}
        zoom={zoom}
        className="w-full h-full"
        style={{ background: '#0f172a' }}
        zoomControl={false}
        whenReady={() => setMapReady(true)}
        whenCreated={(map) => {
          if (mapRef.current && mapRef.current !== map) {
            try { mapRef.current.off(); mapRef.current.remove(); } catch {}
          }
          mapRef.current = map;
        }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        />
        <ZoomControl position="bottomright" />
        <MapUpdater center={center} />
        <ZoomTracker onZoomChange={setZoomLevel} />

        {/* Marker de localização do usuário */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              className: 'user-location-marker',
              html: `<div class="relative"><div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div><div class="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75"></div></div>`,
              iconSize: [16, 16], iconAnchor: [8, 8]
            })}
          >
            <Popup><p className="font-semibold text-sm">Você está aqui</p></Popup>
          </Marker>
        )}

        {/* PINS DE VENUES (locais sem evento) */}
        {visibleVenues.map((venue) => (
          <Marker
            key={`venue-${venue.id}`}
            position={[venue.location.lat, venue.location.lng]}
            icon={createVenueIcon(venue)}
            eventHandlers={{
              click: () => onVenueClick && onVenueClick(venue)
            }}
          >
            <Popup>
              <div className="p-2 min-w-[180px]">
                <h3 className="font-bold text-sm mb-1">{venue.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{venue.category || 'Estabelecimento'}</p>
                <Badge className="bg-gray-100 text-gray-700 text-[10px]">Sem evento agora</Badge>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* CLUSTERS / PINS DE EVENTOS */}
        {eventClusters.map((cluster, index) => {
          if (!cluster?.center || !cluster.events?.[0]) return null;

          if (cluster.count > 1) {
            // Cluster com múltiplos eventos
            const topGenre = cluster.events[0].genre;
            const color = getGenreColor(topGenre);
            return (
              <Marker
                key={`cluster-${index}`}
                position={cluster.center}
                icon={createClusterIcon(cluster.count, color)}
                eventHandlers={{
                  click: () => onPinDetailsClick(cluster.events[0])
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[160px]">
                    <p className="font-bold text-sm mb-2">{cluster.count} eventos nesta área</p>
                    {cluster.events.slice(0, 3).map(e => (
                      <div key={e.id} className="text-xs text-gray-600 py-1 border-b border-gray-100 cursor-pointer hover:text-cyan-600" onClick={() => onPinDetailsClick(e)}>
                        {e.title}
                      </div>
                    ))}
                  </div>
                </Popup>
              </Marker>
            );
          }

          // Pin de evento único
          const event = cluster.events[0];
          const live = isEventLive(event);
          return (
            <Marker
              key={`event-${event.id || index}`}
              position={cluster.center}
              icon={createEventIcon(event, live)}
              eventHandlers={{
                click: () => onPinDetailsClick(event)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-sm mb-1">{event.title}</h3>
                  <p className="text-xs text-gray-500 mb-2">{event.location?.venue_name || 'Local não informado'}</p>
                  {live && <Badge className="bg-red-100 text-red-700 text-[10px] mb-2">🔴 Ao Vivo</Badge>}
                  <Button size="sm" onClick={() => onPinDetailsClick(event)} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs">
                    Ver Detalhes
                  </Button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Empty state */}
      {filteredEvents.length === 0 && visibleVenues.length === 0 && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[1000] pointer-events-none">
          <div className="text-center bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-700">
            <Search className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-white text-lg mb-2">Nenhum resultado</p>
            <p className="text-gray-400 text-sm">Ajuste os filtros para ver mais</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAdvancedFilters && (
          <AdvancedFilters
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            onClose={() => setShowAdvancedFilters(false)}
            eventStats={eventStats}
          />
        )}
      </AnimatePresence>

      <style>{`
        .custom-marker, .custom-cluster {
          background: none !important;
          border: none !important;
        }
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes live-pulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.4); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}