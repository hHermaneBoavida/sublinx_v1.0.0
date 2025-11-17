import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Algoritmo de clustering simples e eficiente
function clusterMarkers(events, zoom) {
  if (zoom >= 14) return events.map(e => ({ events: [e], center: e.location }));

  const clusters = [];
  const processed = new Set();
  const clusterRadius = zoom < 10 ? 0.5 : zoom < 12 ? 0.2 : 0.1;

  events.forEach((event, i) => {
    if (processed.has(i)) return;

    const cluster = {
      events: [event],
      center: { lat: event.location.lat, lng: event.location.lng }
    };

    events.forEach((other, j) => {
      if (i === j || processed.has(j)) return;

      const distance = Math.sqrt(
        Math.pow(event.location.lat - other.location.lat, 2) +
        Math.pow(event.location.lng - other.location.lng, 2)
      );

      if (distance < clusterRadius) {
        cluster.events.push(other);
        processed.add(j);
      }
    });

    processed.add(i);
    clusters.push(cluster);
  });

  return clusters;
}

export default function MarkerCluster({ events, zoom, getGenreColor, onPinClick, onPinDetailsClick }) {
  const clusters = useMemo(() => clusterMarkers(events, zoom), [events, zoom]);

  return (
    <>
      {clusters.map((cluster, idx) => {
        const isCluster = cluster.events.length > 1;
        const event = cluster.events[0];

        if (isCluster) {
          return (
            <Marker
              key={`cluster-${idx}`}
              position={[cluster.center.lat, cluster.center.lng]}
              icon={L.divIcon({
                className: 'cluster-marker',
                html: `
                  <div class="w-12 h-12 rounded-full bg-cyan-600 border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm animate-pulse">
                    ${cluster.events.length}
                  </div>
                `,
                iconSize: [48, 48],
                iconAnchor: [24, 24]
              })}
            >
              <Popup>
                <div className="max-w-[240px]">
                  <h3 className="font-bold mb-2">{cluster.events.length} eventos aqui</h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {cluster.events.slice(0, 5).map(e => (
                      <div
                        key={e.id}
                        className="p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                        onClick={() => onPinDetailsClick(e)}
                      >
                        <p className="font-semibold text-sm">{e.title}</p>
                        <p className="text-xs text-gray-600">{e.location?.venue_name}</p>
                      </div>
                    ))}
                    {cluster.events.length > 5 && (
                      <p className="text-xs text-gray-500 text-center">+{cluster.events.length - 5} mais</p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        }

        return (
          <Marker
            key={event.id}
            position={[event.location.lat, event.location.lng]}
            icon={L.divIcon({
              className: 'custom-marker',
              html: `
                <div class="relative flex flex-col items-center">
                  <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg transition-all duration-300 hover:scale-125" 
                       style="background-color: ${getGenreColor(event.genre)}; box-shadow: 0 0 15px ${getGenreColor(event.genre)}">
                  </div>
                  <div class="w-px h-3 bg-white/30"></div>
                </div>
              `,
              iconSize: [26, 39],
              iconAnchor: [13, 39],
              popupAnchor: [0, -39]
            })}
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
                    loading="lazy"
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
    </>
  );
}