import React, { useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CLUSTER_THRESHOLD = 0.01; // ~1km

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function MarkerCluster({ 
  events, 
  onEventClick, 
  getGenreColor,
  visibleBounds 
}) {
  const clusters = useMemo(() => {
    if (!events || events.length === 0) return [];

    // Filtrar eventos visíveis
    const visibleEvents = visibleBounds ? events.filter(event => {
      if (!event.location?.lat || !event.location?.lng) return false;
      return (
        event.location.lat >= visibleBounds.south &&
        event.location.lat <= visibleBounds.north &&
        event.location.lng >= visibleBounds.west &&
        event.location.lng <= visibleBounds.east
      );
    }) : events;

    const clustered = [];
    const processed = new Set();

    visibleEvents.forEach((event, idx) => {
      if (processed.has(idx)) return;
      if (!event.location?.lat || !event.location?.lng) return;

      const cluster = {
        events: [event],
        lat: event.location.lat,
        lng: event.location.lng
      };

      // Encontrar eventos próximos
      visibleEvents.forEach((otherEvent, otherIdx) => {
        if (idx === otherIdx || processed.has(otherIdx)) return;
        if (!otherEvent.location?.lat || !otherEvent.location?.lng) return;

        const dist = getDistance(
          event.location.lat,
          event.location.lng,
          otherEvent.location.lat,
          otherEvent.location.lng
        );

        if (dist < CLUSTER_THRESHOLD) {
          cluster.events.push(otherEvent);
          processed.add(otherIdx);
        }
      });

      processed.add(idx);
      clustered.push(cluster);
    });

    return clustered;
  }, [events, visibleBounds]);

  const createClusterIcon = (cluster) => {
    const count = cluster.events.length;
    
    if (count === 1) {
      const event = cluster.events[0];
      const color = getGenreColor(event.genre);
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="relative flex flex-col items-center">
            <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg transition-all duration-300 hover:scale-125" 
                 style="background-color: ${color}; box-shadow: 0 0 15px ${color}">
            </div>
            <div class="w-px h-3 bg-white/30"></div>
          </div>
        `,
        iconSize: [26, 39],
        iconAnchor: [13, 39],
        popupAnchor: [0, -39]
      });
    }

    const size = Math.min(50 + count * 5, 80);
    return L.divIcon({
      className: 'custom-cluster',
      html: `
        <div class="flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 text-white font-bold shadow-2xl border-2 border-white animate-pulse" 
             style="width: ${size}px; height: ${size}px;">
          ${count}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  };

  return (
    <>
      {clusters.map((cluster, idx) => (
        <Marker
          key={`cluster-${idx}`}
          position={[cluster.lat, cluster.lng]}
          icon={createClusterIcon(cluster)}
        >
          <Popup maxWidth={300}>
            {cluster.events.length === 1 ? (
              <SingleEventPopup event={cluster.events[0]} onEventClick={onEventClick} getGenreColor={getGenreColor} />
            ) : (
              <ClusterPopup events={cluster.events} onEventClick={onEventClick} />
            )}
          </Popup>
        </Marker>
      ))}
    </>
  );
}

function SingleEventPopup({ event, onEventClick, getGenreColor }) {
  return (
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
        onClick={() => onEventClick(event)}
        size="sm"
        className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 text-xs"
      >
        Ver Detalhes
      </Button>
    </div>
  );
}

function ClusterPopup({ events, onEventClick }) {
  return (
    <div className="min-w-[250px] max-w-[320px]">
      <h3 className="font-bold text-base mb-3">
        {events.length} eventos nesta área
      </h3>
      <div className="max-h-64 overflow-y-auto space-y-2">
        {events.map(event => (
          <div 
            key={event.id}
            onClick={() => onEventClick(event)}
            className="p-2 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer transition-colors"
          >
            <p className="font-semibold text-sm line-clamp-1">{event.title}</p>
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(event.date), "dd/MM HH:mm", { locale: ptBR })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}