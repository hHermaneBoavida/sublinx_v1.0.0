import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, Users, Search, SlidersHorizontal, Sparkles, Upload, Menu, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

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

export default function MapView({ 
  events, 
  userLocation, 
  onPinClick, 
  onPinDetailsClick,
  onSwipeUp,
  onOpenFilters,
  onOpenVibe,
  onOpenUpload,
  searchTerm,
  onSearchChange,
  activeVibe,
  suggestedEvents = [] 
}) {
  const mapRef = useRef(null);
  const navigate = useNavigate();
  const [mapReady, setMapReady] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const center = userLocation ? [userLocation.lat, userLocation.lng] : [-23.5505, -46.6333];
  const zoom = userLocation ? 13 : 11;

  const getGenreColor = (genre) => {
    const colors = {
      techno: '#06b6d4', house: '#10b981', trance: '#8b5cf6',
      drum_bass: '#f59e0b', minimal: '#ec4899', progressive: '#84cc16',
      deep_house: '#3b82f6', industrial: '#ef4444', funk: '#f97316',
      trap: '#eab308', hip_hop: '#a855f7', reggae: '#22c55e'
    };
    return colors[genre] || '#a855f7';
  };

  const createCustomIcon = (event) => {
    const color = getGenreColor(event.genre);
    const isSuggested = suggestedEvents.some(s => s.id === event.id);
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="relative flex flex-col items-center">
          <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg transition-all duration-300 hover:scale-125 ${isSuggested ? 'animate-pulse' : ''}" 
               style="background-color: ${color}; box-shadow: 0 0 15px ${color}">
          </div>
          <div class="w-px h-3 bg-white/30"></div>
          ${isSuggested ? `<div class="absolute inset-0 -m-1 rounded-full animate-ping" style="background-color: ${color}; opacity: 0.5"></div>` : ''}
        </div>
      `,
      iconSize: [26, 39],
      iconAnchor: [13, 39],
      popupAnchor: [0, -39]
    });
  };

  return (
    <div className="w-full h-full relative">
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
          onClick={() => setShowMenu(!showMenu)}
          className="bg-black/80 backdrop-blur-xl border border-gray-700 hover:bg-gray-900"
        >
          {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Menu Dropdown */}
      {showMenu && (
        <div className="absolute top-20 right-4 z-[1000] bg-black/95 backdrop-blur-xl border border-gray-700 rounded-xl p-2 min-w-[200px] shadow-2xl">
          <Button
            variant="ghost"
            onClick={() => {
              onOpenFilters();
              setShowMenu(false);
            }}
            className="w-full justify-start text-white hover:bg-gray-800"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              onOpenVibe();
              setShowMenu(false);
            }}
            className="w-full justify-start text-white hover:bg-gray-800"
          >
            <Sparkles className="w-4 h-4 mr-2" />
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
            <Upload className="w-4 h-4 mr-2" />
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

      {/* Active Vibe Badge */}
      {activeVibe && activeVibe !== 'all' && (
        <div className="absolute top-20 left-4 z-[1000]">
          <Badge className="bg-purple-600/90 backdrop-blur-xl border-purple-500/50 text-white">
            <Sparkles className="w-3 h-3 mr-1" />
            {activeVibe}
          </Badge>
        </div>
      )}

      {/* Swipe Up Indicator */}
      <div 
        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[999] cursor-pointer"
        onClick={onSwipeUp}
      >
        <div className="bg-black/80 backdrop-blur-xl border border-gray-700 rounded-full px-4 py-2 flex items-center gap-2 animate-bounce">
          <span className="text-white text-sm">Deslizar para Reels</span>
          <div className="text-white">⬆️</div>
        </div>
      </div>

      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        className="w-full h-full"
        style={{ background: '#1a1a2e' }}
        zoomControl={false}
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        <ZoomControl position="bottomright" />
        <MapUpdater center={center} zoom={zoom} />

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

        {events.map((event) => {
          if (!event.location?.lat || !event.location?.lng) return null;

          return (
            <Marker
              key={event.id}
              position={[event.location.lat, event.location.lng]}
              icon={createCustomIcon(event)}
              eventHandlers={{
                click: () => onPinDetailsClick(event)
              }}
            >
              <Popup>
                <div className="min-w-[200px] max-w-[280px]">
                  {event.image_url && (
                    <img 
                      src={event.image_url} 
                      alt={event.title}
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                  )}
                  <h3 className="font-bold text-base mb-1">{event.title}</h3>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(event.date), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>{event.location.venue_name || event.location.address}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge className="text-[9px]" style={{ backgroundColor: getGenreColor(event.genre) }}>
                      {event.genre}
                    </Badge>
                    {event.type && (
                      <Badge variant="outline" className="text-[9px]">
                        {event.type}
                      </Badge>
                    )}
                  </div>

                  {event.current_attendees !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                      <Users className="w-3 h-3" />
                      <span>{event.current_attendees} participantes</span>
                    </div>
                  )}

                  <Button 
                    onClick={() => onPinClick(event.id)}
                    size="sm"
                    className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 text-xs"
                  >
                    Ver Reels
                  </Button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {events.length === 0 && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[1000] pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Procurando eventos próximos...</p>
          </div>
        </div>
      )}

      <style>{`
        .custom-marker {
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