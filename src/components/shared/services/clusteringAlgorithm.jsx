/**
 * CLUSTERING ALGORITHM - OTIMIZADO
 * Grid-based DBSCAN para agrupamento espacial eficiente
 */

const CLUSTER_RADIUS_BY_ZOOM = {
  10: 5.0,   // km
  11: 3.0,
  12: 2.0,
  13: 1.5,
  14: 1.0,
  15: 0.5,
  16: 0.3,
  17: 0.15,
  18: 0.08
};

export function clusterEvents(events, zoomLevel = 15, screenDensity = 1) {
  if (!events || events.length === 0) return [];

  const radius = CLUSTER_RADIUS_BY_ZOOM[zoomLevel] || 0.5;
  const minPoints = zoomLevel > 15 ? 1 : 2;

  // Grid espacial para busca O(1)
  const cellSize = radius * 1.5;
  const grid = new Map();

  const getCellKey = (lat, lng) => {
    const x = Math.floor(lng / cellSize);
    const y = Math.floor(lat / cellSize);
    return `${x},${y}`;
  };

  // Popular grid
  events.forEach(event => {
    const key = getCellKey(event.location.lat, event.location.lng);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(event);
  });

  const visited = new Set();
  const clusters = [];

  events.forEach(event => {
    if (visited.has(event.id)) return;

    const cluster = [];
    const queue = [event];
    const cellKey = getCellKey(event.location.lat, event.location.lng);

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current.id)) continue;

      visited.add(current.id);
      cluster.push(current);

      // Buscar nas 9 células vizinhas
      const [cx, cy] = cellKey.split(',').map(Number);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const neighborKey = `${cx + dx},${cy + dy}`;
          const neighbors = grid.get(neighborKey) || [];

          neighbors.forEach(neighbor => {
            if (visited.has(neighbor.id)) return;

            const dist = calculateDistanceKm(
              current.location.lat,
              current.location.lng,
              neighbor.location.lat,
              neighbor.location.lng
            );

            if (dist <= radius) {
              queue.push(neighbor);
            }
          });
        }
      }
    }

    if (cluster.length >= minPoints) {
      clusters.push(buildClusterMetadata(cluster, radius));
    } else {
      // Evento solo
      clusters.push({
        events: cluster,
        center: { lat: cluster[0].location.lat, lng: cluster[0].location.lng },
        isCluster: false,
        density: 0
      });
    }
  });

  return clusters;
}

function buildClusterMetadata(events, radius) {
  // Centróide ponderado
  const totalAttendees = events.reduce((sum, e) => sum + (e.current_attendees || 1), 0);
  
  let centerLat = 0;
  let centerLng = 0;
  
  events.forEach(e => {
    const weight = (e.current_attendees || 1) / totalAttendees;
    centerLat += e.location.lat * weight;
    centerLng += e.location.lng * weight;
  });

  // Densidade (eventos por km²)
  const area = Math.PI * radius * radius;
  const density = events.length / area;

  // Gênero dominante
  const genreCounts = {};
  events.forEach(e => {
    if (e.genre) {
      genreCounts[e.genre] = (genreCounts[e.genre] || 0) + 1;
    }
  });
  const dominantGenre = Object.entries(genreCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

  // Tipo dominante
  const typeCounts = {};
  events.forEach(e => {
    if (e.type) {
      typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
    }
  });
  const dominantType = Object.entries(typeCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

  return {
    events,
    center: { lat: centerLat, lng: centerLng },
    isCluster: events.length > 1,
    density,
    dominantGenre,
    dominantType,
    genreDistribution: genreCounts,
    typeDistribution: typeCounts,
    avgAttendees: events.reduce((sum, e) => sum + (e.current_attendees || 0), 0) / events.length,
    totalCapacity: events.reduce((sum, e) => sum + (e.max_capacity || 0), 0)
  };
}

export function getClusterVisualSize(cluster) {
  const { events, density, isCluster } = cluster;
  
  const isHotspot = density > 10;
  
  if (!isCluster) {
    return {
      pin: 'w-5 h-5',
      glow: '45px',
      fontSize: 'text-xs',
      isHotspot: false
    };
  }

  if (isHotspot) {
    return {
      pin: 'w-8 h-8',
      glow: '100px',
      secondGlow: '130px',
      fontSize: 'text-base',
      isHotspot: true
    };
  }

  if (events.length > 5) {
    return {
      pin: 'w-7 h-7',
      glow: '80px',
      secondGlow: '110px',
      fontSize: 'text-sm',
      isHotspot: false
    };
  }

  return {
    pin: 'w-6 h-6',
    glow: '60px',
    secondGlow: '85px',
    fontSize: 'text-sm',
    isHotspot: false
  };
}

export function getClusterColor(cluster) {
  const { dominantGenre, dominantType, isCluster, density } = cluster;

  // Hotspot = vermelho
  if (density > 10) return 'rgba(239, 68, 68, 0.95)';

  // Por gênero
  const genreColors = {
    'techno': 'rgba(6, 182, 212, 0.9)',
    'house': 'rgba(168, 85, 247, 0.9)',
    'trance': 'rgba(236, 72, 153, 0.9)',
    'funk': 'rgba(251, 191, 36, 0.9)',
    'trap': 'rgba(249, 115, 22, 0.9)',
    'drum_bass': 'rgba(239, 68, 68, 0.9)',
  };

  if (dominantGenre && genreColors[dominantGenre]) {
    return genreColors[dominantGenre];
  }

  // Por tipo
  const typeColors = {
    'rave': 'rgba(236, 72, 153, 0.9)',
    'underground': 'rgba(139, 92, 246, 0.9)',
    'club': 'rgba(20, 184, 166, 0.9)',
    'secret': 'rgba(251, 191, 36, 0.9)',
  };

  if (dominantType && typeColors[dominantType]) {
    return typeColors[dominantType];
  }

  // Default
  return isCluster ? 'rgba(168, 85, 247, 0.9)' : 'rgba(6, 182, 212, 0.9)';
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default { clusterEvents, getClusterVisualSize, getClusterColor };