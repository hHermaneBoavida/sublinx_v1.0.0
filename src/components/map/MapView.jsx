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

// SEGURANÇA: escapa valores não confiáveis antes de inserir em HTML bruto (Leaflet divIcon).
// Previne XSS armazenado via campos image_url / title / name manipulados.
function escapeHtmlAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function escapeHtmlText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
// Valida que a URL é http(s) antes de usá-la como src de imagem.
function safeImgSrc(url) {
  const str = String(url ?? '');
  return /^https?:\/\//i.test(str) ? escapeHtmlAttr(str) : '';
}

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

// Event genre colors (retained for event differentiation)
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

/**
 * VENUE CATEGORY CONFIG — semantic iconography per entertainment niche.
 * Eliminates the generic "building/hotel" icon for all venue types.
 */
const CATEGORY_CONFIG = {
  // Nightlife / Clubs / Nightlife
  discoteca:        { icon: '🎧', color: '#a855f7', label: 'Balada' },
  club:             { icon: '🎧', color: '#a855f7', label: 'Club' },
  underground_space:{ icon: '🎵', color: '#ec4899', label: 'Underground' },
  warehouse:        { icon: '🏭', color: '#8b5cf6', label: 'Warehouse' },
  // Bars / Lounges / Pubs
  bar:              { icon: '🍸', color: '#f59e0b', label: 'Bar' },
  lounge_bar:       { icon: '🍷', color: '#f97316', label: 'Lounge' },
  pub:              { icon: '🍺', color: '#eab308', label: 'Pub' },
  // Restaurants / Food
  restaurante:      { icon: '🍽️', color: '#ef4444', label: 'Restaurante' },
  padaria:          { icon: '🥐', color: '#f97316', label: 'Padaria' },
  cafe:             { icon: '☕', color: '#92400e', label: 'Café' },
  // Shows / Theaters / Cultural
  cultural_center:  { icon: '🎭', color: '#3b82f6', label: 'Teatro' },
  gallery:          { icon: '🎨', color: '#06b6d4', label: 'Galeria' },
  studio:           { icon: '🎙️', color: '#10b981', label: 'Studio' },
  rooftop:          { icon: '🌆', color: '#0ea5e9', label: 'Rooftop' },
  hotel:            { icon: '🛏️', color: '#14b8a6', label: 'Hotel' },
};

function getCategoryConfig(type) {
  return CATEGORY_CONFIG[type] || { icon: '📍', color: '#64748b', label: 'Local' };
}

/**
 * EVENT ICON — neon glow is EXCLUSIVE to live/active event markers.
 * Non-live events use a clean circular pin with subtle depth shadow only.
 * Labels are conditionally rendered based on zoom level.
 */
function createEventIcon(event, isLive, showLabel) {
  const color = getGenreColor(event.genre);
  const safeTitle = escapeHtmlText(event.title?.length > 14 ? event.title.slice(0, 12) + '…' : (event.title || ''));
  const safeImg = safeImgSrc(event.image_url);
  const imgHtml = safeImg
    ? `<img src="${safeImg}" onerror="this.style.display='none';this.parentNode.innerHTML='<span style=\\'font-size:16px;\\'>🎵</span>';" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<span style="font-size:16px;">🎵</span>`;

  // Neon glow ONLY for live/active events
  const liveRing = isLive ? `
    <div style="position:absolute;inset:-8px;border-radius:50%;border:2px solid ${color};animation:live-pulse 1.2s ease-in-out infinite;"></div>
    <div style="position:absolute;top:-6px;left:50%;transform:translateX(-50%);background:#ef4444;color:#fff;font-size:7px;font-weight:900;padding:1px 4px;border-radius:4px;white-space:nowrap;letter-spacing:0.5px;">● AO VIVO</div>
  ` : '';

  const shadowStyle = isLive
    ? `box-shadow:0 0 12px ${color}88, 0 4px 12px rgba(0,0,0,0.8);`
    : `box-shadow:0 2px 8px rgba(0,0,0,0.6);`;

  const labelHtml = showLabel ? `
    <div style="
      margin-top:4px;background:rgba(15,23,42,0.92);
      border:1px solid rgba(100,116,139,0.3);border-radius:6px;
      padding:2px 6px;font-size:9px;font-weight:600;color:#e2e8f0;
      white-space:nowrap;max-width:80px;overflow:hidden;text-overflow:ellipsis;
    ">${safeTitle}</div>
  ` : '';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="position:relative;width:40px;height:40px;">
          ${liveRing}
          <div style="
            width:40px;height:40px;border-radius:50%;
            border:2px solid ${isLive ? color : 'rgba(255,255,255,0.7)'};
            ${shadowStyle}
            overflow:hidden;background:#1e293b;
            display:flex;align-items:center;justify-content:center;
            position:relative;z-index:2;
          ">${imgHtml}</div>
        </div>
        ${labelHtml}
      </div>
    `,
    iconSize: showLabel ? [56, 60] : [40, 40],
    iconAnchor: showLabel ? [28, 60] : [20, 40]
  });
}

/**
 * VENUE ICON — category-specific semantic icon, circular pin shape.
 * Subtle background, contrasting border, NO neon glow.
 */
function createVenueIcon(venue, showLabel) {
  const config = getCategoryConfig(venue.type);
  const shortName = escapeHtmlText(venue.name?.length > 14 ? venue.name.slice(0, 12) + '…' : (venue.name || 'Local'));

  const labelHtml = showLabel ? `
    <div style="
      margin-top:3px;background:rgba(15,23,42,0.9);
      border:1px solid rgba(100,116,139,0.2);border-radius:5px;
      padding:1px 5px;font-size:9px;font-weight:500;color:#94a3b8;
      white-space:nowrap;max-width:70px;overflow:hidden;text-overflow:ellipsis;
    ">${shortName}</div>
  ` : '';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="
          width:32px;height:32px;border-radius:50%;
          border:2px solid ${config.color};
          background:rgba(15,23,42,0.85);
          display:flex;align-items:center;justify-content:center;
          position:relative;
          box-shadow:0 2px 6px rgba(0,0,0,0.5);
        ">
          <span style="font-size:14px;">${config.icon}</span>
        </div>
        ${labelHtml}
      </div>
    `,
    iconSize: showLabel ? [50, 50] : [32, 32],
    iconAnchor: showLabel ? [25, 50] : [16, 32]
  });
}

/**
 * CLUSTER ICON — circular badge with count, NO neon glow.
 * Color reflects the dominant (highest-priority) category in the cluster.
 */
function createClusterIcon(count, color = '#06b6d4') {
  const size = Math.min(52, 36 + Math.floor(count / 3) * 4);
  return L.divIcon({
    className: 'custom-cluster',
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${color};
        border:2px solid rgba(255,255,255,0.8);
        display:flex;align-items:center;justify-content:center;
        font-size:14px;font-weight:700;color:#fff;
        box-shadow:0 2px 10px rgba(0,0,0,0.5);
        cursor:pointer;
      ">${count}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

/**
 * SPIDERFY — spreads overlapping venue pins in a small circle so each stays clickable.
 * Venues at the same or near-identical coordinates get a tiny angular offset.
 */
function spreadOverlappingMarkers(markers, threshold = 0.0004) {
  const groups = [];
  const used = new Set();

  markers.forEach((m, i) => {
    if (used.has(i)) return;
    const group = [m];
    used.add(i);
    markers.forEach((other, j) => {
      if (used.has(j)) return;
      const dlat = Math.abs(m.lat - other.lat);
      const dlng = Math.abs(m.lng - other.lng);
      if (dlat < threshold && dlng < threshold) {
        group.push(other);
        used.add(j);
      }
    });
    groups.push(group);
  });

  const result = [];
  groups.forEach((group) => {
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      const spread = 0.0007;
      group.forEach((m, idx) => {
        const angle = (2 * Math.PI * idx) / group.length - Math.PI / 2;
        result.push({
          ...m,
          lat: m.lat + Math.cos(angle) * spread,
          lng: m.lng + Math.sin(angle) * spread,
        });
      });
    }
  });
  return result;
}

/**
 * UNIFIED CLUSTERING — groups both events and venues by pixel proximity.
 * Adaptive threshold shrinks as zoom increases so clusters disperse naturally.
 */
function clusterMarkers(markers, zoomLevel) {
  const threshold = zoomLevel >= 15 ? 0.002 : zoomLevel >= 13 ? 0.008 : zoomLevel >= 11 ? 0.03 : 0.08;
  const clusters = [];
  const used = new Set();

  markers.forEach((marker, i) => {
    if (used.has(i)) return;
    const cluster = [marker];
    used.add(i);

    markers.forEach((other, j) => {
      if (used.has(j)) return;
      const dlat = Math.abs(marker.lat - other.lat);
      const dlng = Math.abs(marker.lng - other.lng);
      if (dlat < threshold && dlng < threshold) {
        cluster.push(other);
        used.add(j);
      }
    });

    const avgLat = cluster.reduce((s, m) => s + m.lat, 0) / cluster.length;
    const avgLng = cluster.reduce((s, m) => s + m.lng, 0) / cluster.length;
    const sorted = [...cluster].sort((a, b) => b.priority - a.priority);
    const dominant = sorted[0];

    clusters.push({
      center: [avgLat, avgLng],
      markers: cluster,
      count: cluster.length,
      dominantColor: dominant.color,
      topMarker: dominant,
    });
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
  filters: externalFilters,
  onFiltersChange,
  suggestedEvents = [],
  onMapReady,
  hideSearch = false
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
  const [localAdvancedFilters, setLocalAdvancedFilters] = useState({
    genre: 'all', type: 'all', dateRange: 'all',
    maxDistance: 50, minAttendees: 0, maxPrice: 500, sortBy: 'distance'
  });
  const advancedFilters = externalFilters || localAdvancedFilters;
  const setAdvancedFilters = (newFilters) => {
    setLocalAdvancedFilters(newFilters);
    if (onFiltersChange) onFiltersChange(newFilters);
  };
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const debounceRef = useRef(null);

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

  useEffect(() => {
    if (events && !Array.isArray(events)) setMapError('Erro ao carregar eventos');
  }, [events]);

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

  // Filter events — localSearch is the single source of truth for search
  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    let filtered = events.filter(event => {
      if (!event?.location?.lat || !event?.location?.lng) return false;

      if (localSearch) {
        const lower = localSearch.toLowerCase();
        const match =
          event.title?.toLowerCase().includes(lower) ||
          event.location?.venue_name?.toLowerCase().includes(lower) ||
          event.genre?.toLowerCase().includes(lower) ||
          event.type?.toLowerCase().includes(lower) ||
          event.location?.city?.toLowerCase().includes(lower);
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
      if (advancedFilters.maxPrice < 500 && (event.price || 0) > advancedFilters.maxPrice) return false;

      return true;
    });

    if (userLocation) {
      filtered = filtered.sort((a, b) => {
        const dA = Math.pow(a.location.lat - userLocation.lat, 2) + Math.pow(a.location.lng - userLocation.lng, 2);
        const dB = Math.pow(b.location.lat - userLocation.lat, 2) + Math.pow(b.location.lng - userLocation.lng, 2);
        return dA - dB;
      });
    }

    return filtered;
  }, [events, localSearch, advancedFilters, userLocation]);

  // All venues are displayed individually — NEVER hidden or removed
  const visibleVenues = useMemo(() => {
    if (!venues || venues.length === 0) return [];
    return venues.filter(v => {
      if (!v?.location?.lat || !v?.location?.lng) return false;
      if (localSearch) {
        const lower = localSearch.toLowerCase();
        return v.name?.toLowerCase().includes(lower) ||
          v.category?.toLowerCase().includes(lower) ||
          v.genres?.some(g => g.toLowerCase().includes(lower));
      }
      return true;
    });
  }, [venues, localSearch]);

  const isEventLive = useCallback((event) => {
    const now = Date.now();
    const start = new Date(event.date).getTime();
    const durationMs = (event.duration_hours || 4) * 60 * 60 * 1000;
    return now >= start && now <= start + durationMs;
  }, []);

  /**
   * UNIFIED MARKER LIST — combines events (high priority) and venues (low priority).
   * Priority: live event (100) > regular event (50) > venue (10).
   * This drives both clustering dominance and Z-index collision resolution.
   */
  // Event markers — these get clustered by proximity
  const eventMarkers = useMemo(() => {
    const markers = [];

    filteredEvents.forEach(event => {
      const live = isEventLive(event);
      markers.push({
        id: event.id,
        kind: 'event',
        data: event,
        lat: event.location.lat,
        lng: event.location.lng,
        category: event.genre || 'event',
        color: getGenreColor(event.genre),
        priority: live ? 100 : 50,
        isLive: live,
      });
    });

    return markers;
  }, [filteredEvents, isEventLive]);

  // Venue markers — always rendered individually (never clustered).
  // Spiderfy: nearby venues (e.g. Sacomã/Heliópolis neighbors) get a small
  // angular offset so overlapping pins remain individually clickable.
  const venueMarkers = useMemo(() => {
    const base = visibleVenues.map(venue => {
      const config = getCategoryConfig(venue.type);
      return {
        id: venue.id,
        kind: 'venue',
        data: venue,
        lat: venue.location.lat,
        lng: venue.location.lng,
        category: venue.type || 'venue',
        color: config.color,
        priority: 10,
        isLive: false,
      };
    });
    return spreadOverlappingMarkers(base);
  }, [visibleVenues]);

  // Cluster only events (venues are always individual pins)
  const eventClusters = useMemo(() => clusterMarkers(eventMarkers, zoomLevel), [eventMarkers, zoomLevel]);

  // Labels visible only at high zoom — reduces cognitive load at wide views
  const showLabels = zoomLevel >= 15;

  const activeFiltersCount = Object.keys(advancedFilters).filter(key => {
    if (key === 'maxDistance') return advancedFilters[key] !== 50;
    if (key === 'maxPrice') return advancedFilters[key] !== 500;
    if (key === 'minAttendees') return advancedFilters[key] !== 0;
    if (key === 'sortBy') return false;
    return advancedFilters[key] !== 'all';
  }).length;

  const eventStats = { total: events.length, filtered: filteredEvents.length };

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-700 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Erro no Mapa</h3>
          <p className="text-gray-300 text-sm mb-4">{mapError}</p>
          <Button onClick={() => window.location.reload()} className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white">
            Recarregar
          </Button>
        </div>
      </div>
    );
  }

  const liveCount = filteredEvents.filter(isEventLive).length;

  // Cluster click — zoom in to disperse (pseudo-spiderfy), or open details for single
  const handleClusterClick = (cluster) => {
    if (cluster.count > 1 && mapRef.current) {
      const targetZoom = Math.min(zoomLevel + 2, 18);
      mapRef.current.flyTo(cluster.center, targetZoom, { duration: 0.5 });
    } else if (cluster.count === 1) {
      const marker = cluster.topMarker;
      if (marker.kind === 'event') {
        onPinDetailsClick?.(marker.data);
      } else {
        onVenueClick?.(marker.data);
      }
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {/* Search Bar — luxury minimalist, NO neon */}
      <div className={`absolute z-[1000] flex gap-2 ${hideSearch ? 'right-3 sm:right-4 justify-end' : 'left-3 right-3 sm:left-4 sm:right-4'}`} style={{ top: hideSearch ? 'calc(env(safe-area-inset-top) + 60px)' : 'max(12px, env(safe-area-inset-top))' }}>
        {!hideSearch && (
          <div className="flex-1 min-w-0 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
            <Input
              placeholder="Buscar eventos, locais, vibe..."
              value={localSearch}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="pl-10 h-10 sm:h-11 bg-gray-900/90 backdrop-blur-md border border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500"
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
        )}
        <Button
          size="icon"
          onClick={() => setShowAdvancedFilters(true)}
          className="h-10 w-10 sm:h-11 sm:w-11 bg-gray-900/90 backdrop-blur-md border border-gray-700 hover:bg-gray-800 hover:border-gray-600 relative flex-shrink-0"
        >
          <Filter className="w-5 h-5 text-gray-300" />
          {activeFiltersCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-gray-700 text-xs text-white font-bold">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        <Button
          size="icon"
          onClick={() => setShowMenu(!showMenu)}
          className="h-10 w-10 sm:h-11 sm:w-11 bg-gray-900/90 backdrop-blur-md border border-gray-700 hover:bg-gray-800 hover:border-gray-600 flex-shrink-0"
        >
          {showMenu ? <X className="w-5 h-5 text-gray-300" /> : <Menu className="w-5 h-5 text-gray-300" />}
        </Button>
      </div>

      {/* Live events badge — clean, NO neon */}
      {liveCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute left-4 z-[1000]" style={{ top: hideSearch ? 'calc(env(safe-area-inset-top) + 112px)' : 'calc(env(safe-area-inset-top) + 64px)' }}
        >
          <Badge className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold cursor-default bg-red-600/90 border border-red-500/50 text-white">
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
            className="absolute right-4 z-[2000] bg-gray-950/95 backdrop-blur-xl border border-gray-700 rounded-xl p-2 min-w-[200px] shadow-lg" style={{ top: hideSearch ? 'calc(env(safe-area-inset-top) + 112px)' : 'calc(env(safe-area-inset-top) + 64px)' }}
          >
            <Button variant="ghost" onClick={() => { onOpenVibe(); setShowMenu(false); }} className="w-full justify-start text-gray-200 hover:bg-gray-800 hover:text-white">
              🎭 Vibe Selector
            </Button>
            <Button variant="ghost" onClick={() => { onOpenUpload(); setShowMenu(false); }} className="w-full justify-start text-gray-200 hover:bg-gray-800 hover:text-white">
              🎬 Upload Reel
            </Button>
            <div className="h-px bg-gray-700 my-2" />
            <Button variant="ghost" onClick={() => navigate(createPageUrl("Feed"))} className="w-full justify-start text-gray-200 hover:bg-gray-800 hover:text-white">
              ⚡ Feed
            </Button>
            <Button variant="ghost" onClick={() => navigate(createPageUrl("Perfil"))} className="w-full justify-start text-gray-200 hover:bg-gray-800 hover:text-white">
              👤 Perfil
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats bar — clean, NO neon */}
      <div className="absolute bottom-44 sm:bottom-32 left-4 z-[999] flex gap-2">
        {filteredEvents.length !== events.length && (
          <Badge className="bg-gray-800/90 backdrop-blur-md border border-gray-700 text-gray-200 text-xs">
            <Zap className="w-3 h-3 mr-1" />
            {filteredEvents.length} eventos
          </Badge>
        )}
        {visibleVenues.length > 0 && (
          <Badge className="bg-gray-800/90 backdrop-blur-md border border-gray-700 text-gray-300 text-xs">
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

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              className: 'user-location-marker',
              html: `<div class="relative"><div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div><div class="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75"></div></div>`,
              iconSize: [16, 16], iconAnchor: [8, 8]
            })}
          >
            <Popup><p className="font-semibold text-sm">Você está aqui</p></Popup>
          </Marker>
        )}

        {/* CLUSTERED EVENT MARKERS (venues are rendered individually below) */}
        {eventClusters.map((cluster, index) => {
          if (!cluster?.center) return null;

          if (cluster.count > 1) {
            return (
              <Marker
                key={`cluster-${index}`}
                position={cluster.center}
                icon={createClusterIcon(cluster.count, cluster.dominantColor)}
                eventHandlers={{
                  click: () => handleClusterClick(cluster)
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[160px]">
                    <p className="font-bold text-sm mb-2">{cluster.count} eventos nesta área</p>
                    {cluster.markers.slice(0, 5).map(m => (
                      <div
                        key={m.id}
                        className="text-xs text-gray-600 py-1 border-b border-gray-100 last:border-0 cursor-pointer hover:text-cyan-600"
                        onClick={() => onPinDetailsClick?.(m.data)}
                      >
                        {m.data.title}
                      </div>
                    ))}
                    {cluster.markers.length > 5 && (
                      <p className="text-xs text-gray-400 text-center mt-1">+{cluster.markers.length - 5} mais</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          }

          // Single event marker — Z-index based on priority (live > regular event)
          const marker = cluster.topMarker;
          const event = marker.data;
          const live = marker.isLive;
          return (
            <Marker
              key={`event-${event.id || index}`}
              position={cluster.center}
              icon={createEventIcon(event, live, showLabels)}
              zIndexOffset={marker.priority}
              eventHandlers={{
                click: () => onPinDetailsClick?.(event)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-sm mb-1">{event.title}</h3>
                  <p className="text-xs text-gray-500 mb-2">{event.location?.venue_name || 'Local não informado'}</p>
                  {live && <Badge className="bg-red-100 text-red-700 text-[10px] mb-2">🔴 Ao Vivo</Badge>}
                  <Button size="sm" onClick={() => onPinDetailsClick?.(event)} className="w-full bg-gray-800 hover:bg-gray-700 text-white text-xs border border-gray-600">
                    Ver Detalhes
                  </Button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* INDIVIDUAL VENUE MARKERS — each at its own location/address, never clustered */}
        {venueMarkers.map((marker, index) => {
          const venue = marker.data;
          const config = getCategoryConfig(venue.type);
          return (
            <Marker
              key={`venue-${venue.id || index}`}
              position={[marker.lat, marker.lng]}
              icon={createVenueIcon(venue, showLabels)}
              zIndexOffset={marker.priority}
              eventHandlers={{
                click: () => onVenueClick?.(venue)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[180px]">
                  <h3 className="font-bold text-sm mb-1">{venue.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{config.label}</p>
                  {venue.location?.address && (
                    <p className="text-xs text-gray-500 mb-2">📍 {venue.location.address}{venue.location?.city ? `, ${venue.location.city}` : ''}</p>
                  )}
                  {venue.rating > 0 && (
                    <Badge className="bg-gray-100 text-gray-700 text-[10px] mr-1">★ {venue.rating}</Badge>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Empty state */}
      {eventMarkers.length === 0 && venueMarkers.length === 0 && (
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
        @keyframes live-pulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.3); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}