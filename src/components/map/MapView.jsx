import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function MapView({ events, center, onEventSelect, suggestedEvents = [] }) {
  const getMapBounds = () => {
    if (!events || events.length === 0) {
      return {
        minLat: center.lat - 0.1, maxLat: center.lat + 0.1,
        minLng: center.lng - 0.1, maxLng: center.lng + 0.1,
      };
    }
    const lats = events.map(e => e.location.lat);
    const lngs = events.map(e => e.location.lng);
    return {
      minLat: Math.min(...lats) - 0.05, maxLat: Math.max(...lats) + 0.05,
      minLng: Math.min(...lngs) - 0.05, maxLng: Math.max(...lngs) + 0.05,
    };
  };

  const mapBounds = getMapBounds();
  const bbox = `${mapBounds.minLng},${mapBounds.minLat},${mapBounds.maxLng},${mapBounds.maxLat}`;

  const coordToPosition = (lat, lng) => {
    const x = ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100;
    const y = ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * 100;
    return { x, y };
  };

  const getGenreColor = (genre) => {
    const colors = {
      techno: '#06b6d4', house: '#10b981', trance: '#8b5cf6',
      drum_bass: '#f59e0b', minimal: '#ec4899', progressive: '#84cc16',
      deep_house: '#3b82f6', industrial: '#ef4444'
    };
    return colors[genre] || '#a855f7';
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-gray-900">
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight="0"
        marginWidth="0"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`}
        style={{ filter: 'grayscale(100%) invert(90%) sepia(20%) brightness(0.7) contrast(1.2)' }}
      ></iframe>

      <div className="absolute inset-0 pointer-events-none">
        {events.map((event) => {
          if (!event.location?.lat || !event.location?.lng) return null;
          const position = coordToPosition(event.location.lat, event.location.lng);
          const isSuggested = suggestedEvents.some(suggested => suggested.id === event.id);
          const color = getGenreColor(event.genre);

          return (
            <div
              key={event.id}
              className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer group pointer-events-auto"
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              onClick={() => onEventSelect(event)}
            >
              <div className="relative flex flex-col items-center">
                <div
                  className={`w-5 h-5 rounded-full border-2 border-white/50 shadow-lg transition-all duration-300 group-hover:scale-125 ${isSuggested ? 'animate-pulse' : ''}`}
                  style={{ backgroundColor: color, boxShadow: `0 0 15px ${color}` }}
                />
                <div className="w-px h-3 bg-white/30" />
                {isSuggested && (
                  <div className="absolute inset-0 -m-1 rounded-full animate-ping" style={{ backgroundColor: color, opacity: 0.5 }} />
                )}
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-1.5 bg-black/80 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-50">
                {event.title}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80" />
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Procurando eventos próximos...</p>
          </div>
        </div>
      )}
    </div>
  );
}