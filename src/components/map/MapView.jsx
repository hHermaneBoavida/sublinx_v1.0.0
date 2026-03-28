import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Menu, X, Filter, AlertCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import AdvancedFilters from './AdvancedFilters';
import { AnimatePresence } from 'framer-motion';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

function ZoomTracker({ onZoomChange }) {
  const map = useMap();
  
  useEffect(() => {
    const handleZoom = () => {
      onZoomChange(map.getZoom());
    };
    
    map.on('zoomend', handleZoom);
    return () => map.off('zoomend', handleZoom);
  }, [map, onZoomChange]);
  
  return null;
}

export default function MapView({ 
  events = [], 
  userLocation, 
  onPinClick, 
  onPinDetailsClick,
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
  const [mapKey, setMapKey] = useState(0);
  const [advancedFilters, setAdvancedFilters] = useState({
    genre: 'all',
    type: 'all',
    dateRange: 'all',
    maxDistance: 50,
    minAttendees: 0,
    maxPrice: 500
  });

  const center = userLocation ? [userLocation.lat, userLocation.lng] : [-23.5505, -46.6333];
  const zoom = userLocation ? 13 : 11;

  // Validate events data
  useEffect(() => {
    if (events && !Array.isArray(events)) {
      console.error('Events must be an array, received:', typeof events);
      setMapError('Erro ao carregar eventos');
    }
  }, [events]);

  // Cleanup completo do mapa ao desmontar
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.off();
          mapRef.current.remove();
        } catch (error) {
          console.error('Erro ao limpar mapa:', error);
        } finally {
          mapRef.current = null;
        }
      }
      
      // Limpar container DOM do Leaflet
      if (containerRef.current) {
        const leafletContainer = containerRef.current.querySelector('.leaflet-container');
        if (leafletContainer && leafletContainer._leaflet_id) {
          delete leafletContainer._leaflet_id;
        }
      }
    };
  }, []);

  // Notificar parent sobre cleanup function
  useEffect(() => {
    if (onMapReady && mapReady && mapRef.current) {
      onMapReady(() => {
        if (mapRef.current) {
          try {
            mapRef.current.off();
            mapRef.current.remove();
          } catch (error) {
            console.error('Erro ao limpar mapa:', error);
          } finally {
            mapRef.current = null;
          }
        }
      });
    }
  }, [onMapReady, mapReady]);

  const getGenreColor = (genre) => {
    const colors = {
      techno: '#06b6d4', house: '#10b981', trance: '#8b5cf6',
      drum_bass: '#f59e0b', minimal: '#ec4899', progressive: '#84cc16',
      deep_house: '#3b82f6', industrial: '#ef4444', funk: '#f97316',
      trap: '#eab308', hip_hop: '#a855f7', reggae: '#22c55e'
    };
    return colors[genre] || '#a855f7';
  };

  // Filtrar eventos com filtros avançados
  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    return events.filter(event => {
      if (!event?.location) return false;

      // Busca por texto
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        const searchMatch = 
          event.title?.toLowerCase().includes(lower) ||
          event.location?.venue_name?.toLowerCase().includes(lower) ||
          event.genre?.toLowerCase().includes(lower);
        if (!searchMatch) return false;
      }

      // Filtro de data
      if (advancedFilters.dateRange !== 'all') {
        const eventDate = new Date(event.date);
        const now = new Date();
        
        if (advancedFilters.dateRange === 'today') {
          if (eventDate.toDateString() !== now.toDateString()) return false;
        } else if (advancedFilters.dateRange === 'week') {
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          if (eventDate > weekFromNow) return false;
        } else if (advancedFilters.dateRange === 'month') {
          const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          if (eventDate > monthFromNow) return false;
        }
      }

      // Filtro de popularidade
      if (event.current_attendees < advancedFilters.minAttendees) return false;

      // Filtro de preço
      const eventPrice = event.price || 0;
      if (advancedFilters.maxPrice < 500 && eventPrice > advancedFilters.maxPrice) return false;

      // Filtro de distância
      if (userLocation && event.location?.lat && event.location?.lng) {
        const distance = Math.sqrt(
          Math.pow(userLocation.lat - event.location.lat, 2) +
          Math.pow(userLocation.lng - event.location.lng, 2)
        ) * 111; // Aproximação para km
        
        if (distance > advancedFilters.maxDistance) return false;
      }

      return true;
    });
  }, [events, searchTerm, advancedFilters, userLocation]);

  // Simple clustering by proximity
  const eventClusters = useMemo(() => {
    if (!filteredEvents || filteredEvents.length === 0) return [];
    
    // For now, return events as individual clusters
    // Advanced clustering can be added later if needed
    return filteredEvents.map(event => ({
      center: [event.location.lat, event.location.lng],
      events: [event],
      count: 1
    }));
  }, [filteredEvents]);

  const eventStats = {
    total: events.length,
    filtered: filteredEvents.length
  };

  const activeFiltersCount = Object.keys(advancedFilters).filter(key => {
    if (key === 'maxDistance') return advancedFilters[key] !== 50;
    if (key === 'maxPrice') return advancedFilters[key] !== 500;
    if (key === 'minAttendees') return advancedFilters[key] !== 0;
    return advancedFilters[key] !== 'all';
  }).length;

  // Error state
  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-red-500/30 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Erro no Mapa</h3>
          <p className="text-gray-300 text-sm mb-4">{mapError}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-cyan-600 to-purple-600"
          >
            Recarregar Página
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-black/80 backdrop-blur-xl border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>
        <Button
          size="icon"
          onClick={() => setShowAdvancedFilters(true)}
          className="bg-black/80 backdrop-blur-xl border border-gray-700 hover:bg-gray-900 relative"
        >
          <Filter className="w-5 h-5" />
          {activeFiltersCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-cyan-600 text-[10px]">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        <Button
          size="icon"
          onClick={() => setShowMenu(!showMenu)}
          className="bg-black/80 backdrop-blur-xl border border-gray-700 hover:bg-gray-900"
        >
          {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Menu Dropdown */}
      {showMenu && (
        <div className="absolute top-20 right-4 z-[2000] bg-black/95 backdrop-blur-xl border border-gray-700 rounded-xl p-2 min-w-[200px] shadow-2xl">
          <Button
            variant="ghost"
            onClick={() => {
              onOpenVibe();
              setShowMenu(false);
            }}
            className="w-full justify-start text-white hover:bg-gray-800"
          >
            Vibe Selector
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              onOpenUpload();
              setShowMenu(false);
            }}
            className="w-full justify-start text-white hover:bg-gray-800"
          >
            Upload Reel
          </Button>
          <div className="h-px bg-gray-700 my-2" />
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Feed"))}
            className="w-full justify-start text-white hover:bg-gray-800"
          >
            Feed
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Perfil"))}
            className="w-full justify-start text-white hover:bg-gray-800"
          >
            Perfil
          </Button>
        </div>
      )}

      {/* Event Count */}
      {filteredEvents.length !== events.length && (
        <div className="absolute bottom-28 left-4 z-[999]">
          <Badge className="bg-cyan-600/90 backdrop-blur-xl border-cyan-500/50 text-white">
            {filteredEvents.length} de {events.length} eventos
          </Badge>
        </div>
      )}

      <MapContainer
        key={`map-${mapKey}`}
        ref={mapRef}
        center={center}
        zoom={zoom}
        className="w-full h-full"
        style={{ background: '#1a1a2e' }}
        zoomControl={false}
        whenReady={() => {
          setMapReady(true);
          console.log('✅ Mapa carregado com', filteredEvents.length, 'eventos');
        }}
        whenCreated={(map) => {
          if (mapRef.current && mapRef.current !== map) {
            try {
              mapRef.current.off();
              mapRef.current.remove();
            } catch (e) {
              console.error('Erro ao limpar mapa anterior:', e);
            }
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
        <MapUpdater center={center} zoom={zoom} />
        <ZoomTracker onZoomChange={setZoomLevel} />

        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              className: 'user-location-marker',
              html: `
                <div class="relative">
                  <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
                  <div class="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                </div>
              `,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold">Você está aqui</p>
              </div>
            </Popup>
          </Marker>
        )}

        {eventClusters.map((cluster, index) => {
          if (!cluster?.center || !cluster.events?.[0]) return null;
          
          const event = cluster.events[0];
          const color = getGenreColor(event.genre);
          
          return (
            <Marker
              key={`marker-${event.id || index}`}
              position={cluster.center}
              icon={L.divIcon({
                className: 'custom-marker',
                html: `
                  <div class="relative cursor-pointer transform hover:scale-110 transition-transform">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-2xl border-2 border-white" 
                         style="background: ${color}; box-shadow: 0 0 20px ${color}80;">
                      ${cluster.count}
                    </div>
                  </div>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
              })}
              eventHandlers={{
                click: () => onPinClick(event.id)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-sm mb-1">{event.title}</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {event.location?.venue_name || 'Local não informado'}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => onPinDetailsClick(event)}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {filteredEvents.length === 0 && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[1000] pointer-events-none">
          <div className="text-center bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-700">
            <Search className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-white text-lg mb-2">Nenhum evento encontrado</p>
            <p className="text-gray-400 text-sm">Ajuste os filtros para ver mais eventos</p>
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
          background: none;
          border: none;
        }
        .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 12px;
          padding: 8px;
        }
        .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  );
}