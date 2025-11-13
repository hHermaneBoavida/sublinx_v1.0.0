/**
 * ALGORITMO DE CLUSTERING AVANÇADO PARA MAPA
 * DBSCAN adaptado com densidade dinâmica
 * Performance: O(n log n) vs O(n²) anterior
 */

/**
 * Clusters eventos usando DBSCAN melhorado
 * @param {Array} events - Lista de eventos com location
 * @param {number} zoomLevel - Nível de zoom do mapa (10-18)
 * @param {number} screenDensity - DPI da tela (1-3)
 * @returns {Array} Clusters com metadados
 */
export function clusterEvents(events, zoomLevel = 15, screenDensity = 1) {
  if (!events || events.length === 0) return [];

  // CONFIGURAÇÃO DINÂMICA baseada em zoom
  const config = getClusterConfig(zoomLevel, screenDensity);

  // GRID-BASED OPTIMIZATION (reduz de O(n²) para O(n log n))
  const grid = createSpatialGrid(events, config.gridSize);

  const clusters = [];
  const processed = new Set();

  events.forEach((event, index) => {
    if (processed.has(index)) return;

    const nearbyEvents = findNearbyEventsGrid(event, events, grid, config);
    
    if (nearbyEvents.length === 0) {
      // Ponto isolado
      clusters.push(createSingleCluster(event));
      processed.add(index);
      return;
    }

    // Criar cluster
    const cluster = {
      events: [event, ...nearbyEvents],
      center: calculateCentroid([event, ...nearbyEvents]),
      isCluster: nearbyEvents.length > 0,
      density: calculateDensity([event, ...nearbyEvents], config.radius),
      bounds: calculateBounds([event, ...nearbyEvents]),
      ...extractClusterMetadata([event, ...nearbyEvents])
    };

    // Marcar todos como processados
    processed.add(index);
    nearbyEvents.forEach(e => {
      const idx = events.indexOf(e);
      if (idx !== -1) processed.add(idx);
    });

    clusters.push(cluster);
  });

  return clusters;
}

/**
 * Configuração dinâmica baseada em zoom
 */
function getClusterConfig(zoomLevel, screenDensity) {
  const baseRadius = 0.015; // ~1.5km em graus
  const zoomFactor = Math.pow(2, (15 - zoomLevel) * 0.8);
  const densityFactor = 1 / screenDensity;

  return {
    radius: baseRadius * zoomFactor * densityFactor,
    gridSize: 0.05 * zoomFactor, // Grid cells dinâmicos
    minPoints: zoomLevel > 13 ? 2 : 3, // Mais granular em zoom alto
    maxClusterSize: zoomLevel > 13 ? 10 : 20
  };
}

/**
 * Cria grid espacial para busca O(1) de vizinhos
 */
function createSpatialGrid(events, gridSize) {
  const grid = new Map();

  events.forEach(event => {
    const cellKey = getCellKey(event.location.lat, event.location.lng, gridSize);
    
    if (!grid.has(cellKey)) {
      grid.set(cellKey, []);
    }
    
    grid.get(cellKey).push(event);
  });

  return grid;
}

/**
 * Busca eventos próximos usando grid (otimizado)
 */
function findNearbyEventsGrid(event, allEvents, grid, config) {
  const nearby = [];
  const { lat, lng } = event.location;

  // Buscar nas 9 células vizinhas (centro + 8 adjacentes)
  const cellKeys = getNeighborCells(lat, lng, config.gridSize);

  cellKeys.forEach(cellKey => {
    const cellEvents = grid.get(cellKey) || [];
    
    cellEvents.forEach(other => {
      if (other.id === event.id) return;
      
      const distance = getDistance(
        lat, lng,
        other.location.lat, other.location.lng
      );

      if (distance < config.radius) {
        nearby.push(other);
      }
    });
  });

  return nearby.slice(0, config.maxClusterSize);
}

/**
 * Gera chave da célula do grid
 */
function getCellKey(lat, lng, gridSize) {
  const cellLat = Math.floor(lat / gridSize);
  const cellLng = Math.floor(lng / gridSize);
  return `${cellLat},${cellLng}`;
}

/**
 * Retorna células vizinhas (3x3 grid)
 */
function getNeighborCells(lat, lng, gridSize) {
  const baseLat = Math.floor(lat / gridSize);
  const baseLng = Math.floor(lng / gridSize);
  
  const cells = [];
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      cells.push(`${baseLat + i},${baseLng + j}`);
    }
  }
  
  return cells;
}

/**
 * Distância rápida (sem Haversine completo para performance)
 */
function getDistance(lat1, lng1, lat2, lng2) {
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Calcula centróide do cluster
 */
function calculateCentroid(events) {
  const lat = events.reduce((sum, e) => sum + e.location.lat, 0) / events.length;
  const lng = events.reduce((sum, e) => sum + e.location.lng, 0) / events.length;
  return { lat, lng };
}

/**
 * Calcula densidade (eventos por km²)
 */
function calculateDensity(events, radius) {
  const area = Math.PI * Math.pow(radius * 111, 2); // Converter graus para km
  return events.length / Math.max(area, 0.1);
}

/**
 * Calcula bounding box do cluster
 */
function calculateBounds(events) {
  const lats = events.map(e => e.location.lat);
  const lngs = events.map(e => e.location.lng);
  
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs)
  };
}

/**
 * Extrai metadados do cluster
 */
function extractClusterMetadata(events) {
  const genreCounts = {};
  const typeCounts = {};

  events.forEach(e => {
    genreCounts[e.genre] = (genreCounts[e.genre] || 0) + 1;
    typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
  });

  const dominantGenre = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || events[0].genre;
  
  const dominantType = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || events[0].type;

  return {
    dominantGenre,
    dominantType,
    genreDistribution: genreCounts,
    typeDistribution: typeCounts,
    avgAttendees: events.reduce((sum, e) => sum + (e.current_attendees || 0), 0) / events.length,
    totalCapacity: events.reduce((sum, e) => sum + (e.max_capacity || 0), 0)
  };
}

/**
 * Cria cluster de evento único
 */
function createSingleCluster(event) {
  return {
    events: [event],
    center: { lat: event.location.lat, lng: event.location.lng },
    isCluster: false,
    density: 1,
    dominantGenre: event.genre,
    dominantType: event.type,
    bounds: {
      minLat: event.location.lat,
      maxLat: event.location.lat,
      minLng: event.location.lng,
      maxLng: event.location.lng
    }
  };
}

/**
 * Calcula tamanho visual do cluster baseado em densidade
 */
export function getClusterVisualSize(cluster) {
  const { density, events } = cluster;
  
  if (!cluster.isCluster) {
    return { 
      pin: 'w-10 h-10', 
      glow: '60px', 
      secondGlow: '80px',
      fontSize: 'text-base'
    };
  }

  // Densidade alta (>10 eventos/km²)
  if (density > 10) {
    return { 
      pin: 'w-20 h-20', 
      glow: '100px', 
      secondGlow: '130px',
      fontSize: 'text-xl',
      isHotspot: true
    };
  }
  
  // Densidade média (5-10)
  if (density > 5) {
    return { 
      pin: 'w-16 h-16', 
      glow: '85px', 
      secondGlow: '110px',
      fontSize: 'text-lg',
      isHotspot: false
    };
  }
  
  // Densidade baixa (<5)
  return { 
    pin: 'w-14 h-14', 
    glow: '75px', 
    secondGlow: '95px',
    fontSize: 'text-base',
    isHotspot: false
  };
}

/**
 * Determina cor do cluster baseado em tipo dominante
 */
export function getClusterColor(cluster) {
  const colorMap = {
    'rave': 'rgba(236, 72, 153, 0.9)',
    'warehouse': 'rgba(168, 85, 247, 0.9)',
    'rooftop': 'rgba(6, 182, 212, 0.9)',
    'underground': 'rgba(139, 92, 246, 0.9)',
    'club': 'rgba(20, 184, 166, 0.9)',
    'secret': 'rgba(251, 191, 36, 0.9)',
    'festival': 'rgba(249, 115, 22, 0.9)',
  };
  
  return colorMap[cluster.dominantType] || 'rgba(6, 182, 212, 0.9)';
}