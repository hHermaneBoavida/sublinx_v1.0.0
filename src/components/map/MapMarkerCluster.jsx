import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import L from 'leaflet';

// Função para clusterizar eventos próximos
export function clusterEvents(events, zoomLevel) {
  if (!events || events.length === 0) return [];
  
  // Quanto maior o zoom, menos agrupamento
  const clusterDistance = Math.max(0.01, 0.5 / zoomLevel);
  const clusters = [];
  const processed = new Set();

  events.forEach((event, index) => {
    if (processed.has(index) || !event.location?.lat || !event.location?.lng) return;

    const cluster = {
      events: [event],
      center: { lat: event.location.lat, lng: event.location.lng }
    };

    // Encontrar eventos próximos
    events.forEach((otherEvent, otherIndex) => {
      if (
        otherIndex !== index &&
        !processed.has(otherIndex) &&
        otherEvent.location?.lat &&
        otherEvent.location?.lng
      ) {
        const distance = Math.sqrt(
          Math.pow(event.location.lat - otherEvent.location.lat, 2) +
          Math.pow(event.location.lng - otherEvent.location.lng, 2)
        );

        if (distance < clusterDistance) {
          cluster.events.push(otherEvent);
          processed.add(otherIndex);
        }
      }
    });

    processed.add(index);
    clusters.push(cluster);
  });

  return clusters;
}

export default function MapMarkerCluster({ 
  cluster, 
  onPinClick, 
  onPinDetailsClick, 
  getGenreColor,
  suggestedEvents = []
}) {
  const isCluster = cluster.events.length > 1;
  const mainEvent = cluster.events[0];

  const createClusterIcon = () => {
    const size = Math.min(60, 30 + cluster.events.length * 3);
    return L.divIcon({
      className: 'custom-cluster',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-${size}px h-${size}px rounded-full bg-purple-600/30 animate-ping"></div>
          <div class="relative w-12 h-12 rounded-full border-4 border-white bg-gradient-to-r from-purple-600 to-cyan-600 shadow-2xl flex items-center justify-center">
            <span class="text-white font-bold text-lg">${cluster.events.length}</span>
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      popupAnchor: [0, -24]
    });
  };

  const createSingleIcon = (event) => {
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

  if (isCluster) {
    return (
      <Marker
        position={[cluster.center.lat, cluster.center.lng]}
        icon={createClusterIcon()}
      >
        <Popup maxWidth={300}>
          <div className="max-h-80 overflow-y-auto">
            <h3 className="font-bold text-base mb-3 sticky top-0 bg-white pb-2">
              {cluster.events.length} Eventos nesta área
            </h3>
            <div className="space-y-3">
              {cluster.events.map((event) => (
                <div 
                  key={event.id}
                  className="border border-gray-200 rounded-lg p-2 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onPinDetailsClick(event)}
                >
                  <p className="font-semibold text-sm mb-1">{event.title}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(event.date), "dd/MM", { locale: ptBR })}</span>
                  </div>
                  <Badge 
                    className="text-[9px] mt-1" 
                    style={{ backgroundColor: getGenreColor(event.genre) }}
                  >
                    {event.genre}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </Popup>
      </Marker>
    );
  }

  return (
    <Marker
      position={[mainEvent.location.lat, mainEvent.location.lng]}
      icon={createSingleIcon(mainEvent)}
      eventHandlers={{
        click: () => onPinDetailsClick(mainEvent)
      }}
    >
      <Popup>
        <div className="min-w-[200px] max-w-[280px]">
          {mainEvent.image_url && (
            <img 
              src={mainEvent.image_url} 
              alt={mainEvent.title}
              className="w-full h-32 object-cover rounded-lg mb-2"
            />
          )}
          <h3 className="font-bold text-base mb-1">{mainEvent.title}</h3>
          
          <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(mainEvent.date), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
            <MapPin className="w-3 h-3" />
            <span>{mainEvent.location.venue_name || mainEvent.location.address}</span>
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            <Badge className="text-[9px]" style={{ backgroundColor: getGenreColor(mainEvent.genre) }}>
              {mainEvent.genre}
            </Badge>
            {mainEvent.type && (
              <Badge variant="outline" className="text-[9px]">
                {mainEvent.type}
              </Badge>
            )}
          </div>

          {mainEvent.current_attendees !== undefined && (
            <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
              <Users className="w-3 h-3" />
              <span>{mainEvent.current_attendees} participantes</span>
            </div>
          )}

          <Button 
            onClick={() => onPinClick(mainEvent.id)}
            size="sm"
            className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 text-xs"
          >
            Ver Reels
          </Button>
        </div>
      </Popup>
    </Marker>
  );
}