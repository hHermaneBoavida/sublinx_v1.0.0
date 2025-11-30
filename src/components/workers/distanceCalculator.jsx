// Web Worker for heavy distance calculations
// Usage: const worker = new Worker(new URL('./distanceCalculator.js', import.meta.url));

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

self.onmessage = function(e) {
  const { events, userLocation, action } = e.data;

  if (action === 'calculateDistances') {
    const eventsWithDistance = events.map(event => {
      if (!event.location?.lat || !event.location?.lng) {
        return { ...event, distance: null };
      }

      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        event.location.lat,
        event.location.lng
      );

      return {
        ...event,
        distance: parseFloat(distance.toFixed(2))
      };
    });

    self.postMessage({ 
      type: 'distances_calculated', 
      events: eventsWithDistance 
    });
  }

  if (action === 'sortByDistance') {
    const sorted = [...events].sort((a, b) => {
      const distA = a.distance ?? Infinity;
      const distB = b.distance ?? Infinity;
      return distA - distB;
    });

    self.postMessage({ 
      type: 'sorted', 
      events: sorted 
    });
  }
};

// Export for inline worker creation
export const distanceWorkerCode = `
  ${calculateDistance.toString()}
  ${self.onmessage.toString()}
`;