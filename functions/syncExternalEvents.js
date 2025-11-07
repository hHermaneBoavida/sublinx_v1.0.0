import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// ==================== CONFIGURAÇÕES DAS APIS ====================

const API_CONFIGS = {
  eventbrite: {
    baseUrl: 'https://www.eventbriteapi.com/v3',
    requiresAuth: true,
    categories: ['103', '110', '113'], // Music, Nightlife, Performing Arts
    timeout: 10000
  },
  jambase: {
    baseUrl: 'https://api.jambase.com/v3',
    requiresAuth: true,
    timeout: 10000
  },
  allevents: {
    baseUrl: 'https://allevents.in/api/events',
    requiresAuth: false,
    timeout: 8000
  },
  openwebninja: {
    baseUrl: 'https://real-time-events-search.p.rapidapi.com',
    requiresAuth: true,
    rapidApiKey: Deno.env.get('RAPIDAPI_KEY'),
    timeout: 12000
  }
};

// ==================== MAPEAMENTOS OTIMIZADOS ====================

const GENRE_MAPPING = {
  'electronic': 'techno',
  'edm': 'house',
  'techno': 'techno',
  'house': 'house',
  'trance': 'trance',
  'drum and bass': 'drum_bass',
  'drum & bass': 'drum_bass',
  'dnb': 'drum_bass',
  'dubstep': 'dubstep',
  'hip hop': 'rap',
  'hip-hop': 'rap',
  'rap': 'rap',
  'funk': 'funk',
  'trap': 'trap',
  'reggae': 'reggae',
  'samba': 'samba',
  'pagode': 'pagode',
  'rock': 'experimental',
  'indie': 'experimental',
  'alternative': 'experimental',
  'jazz': 'ambient',
  'blues': 'ambient',
  'ambient': 'ambient',
  'soul': 'funk',
  'r&b': 'funk',
  'kizomba': 'kizomba',
  'kuduro': 'kuduro',
  'afrobeats': 'kuduro',
  'default': 'house'
};

const UNDERGROUND_KEYWORDS = [
  'party', 'rave', 'balada', 'festa', 'noite', 'night', 'show', 'dj', 'djs',
  'música', 'music', 'dance', 'dança', 'eletrônica', 'electronic', 'techno', 
  'house', 'trance', 'underground', 'club', 'nightlife', 'live music', 'concert',
  'festival', 'warehouse', 'rooftop', 'after', 'afterparty', 'soundsystem',
  'pista', 'set', 'lineup', 'performance', 'bass', 'beats', 'mixing'
];

const EXCLUDED_KEYWORDS = [
  'corporate', 'empresa', 'business', 'negócio', 'palestra', 'lecture', 'curso',
  'workshop', 'training', 'seminário', 'seminar', 'conferência', 'conference',
  'treinamento', 'igreja', 'church', 'culto', 'worship', 'religioso', 'religious',
  'gospel', 'evangélico', 'meeting', 'reunião', 'webinar', 'curso online',
  'educational', 'educacional', 'academy', 'school', 'universidade', 'college'
];

// ==================== VALIDAÇÕES APRIMORADAS ====================

const isUndergroundEvent = (event) => {
  const text = `${event.title} ${event.description}`.toLowerCase();
  
  // Rejeitar se contém palavras excluídas
  const hasExcluded = EXCLUDED_KEYWORDS.some(keyword => text.includes(keyword));
  if (hasExcluded) return false;
  
  // Aceitar se contém palavras-chave underground
  return UNDERGROUND_KEYWORDS.some(keyword => text.includes(keyword));
};

const mapGenre = (category, name, description = '') => {
  const text = `${category} ${name} ${description}`.toLowerCase();
  
  for (const [key, value] of Object.entries(GENRE_MAPPING)) {
    if (text.includes(key)) return value;
  }
  
  return GENRE_MAPPING.default;
};

const determineEventType = (title, description, venue) => {
  const text = `${title} ${description} ${venue}`.toLowerCase();
  
  if (text.includes('rave') || text.includes('warehouse')) return 'rave';
  if (text.includes('rooftop') || text.includes('terraço') || text.includes('terrace')) return 'rooftop';
  if (text.includes('underground') || text.includes('secreto') || text.includes('secret')) return 'underground';
  if (text.includes('festival') || text.includes('fest')) return 'festival';
  if (text.includes('club') || text.includes('balada') || text.includes('nightclub')) return 'club';
  
  return 'club';
};

const validateEvent = (event) => {
  const now = new Date();
  const eventDate = new Date(event.date);
  
  // Validações de data
  if (isNaN(eventDate.getTime())) return { valid: false, reason: 'Data inválida' };
  if (eventDate < now) return { valid: false, reason: 'Data no passado' };
  
  // Validações de campos obrigatórios
  if (!event.title || event.title.trim().length < 3) {
    return { valid: false, reason: 'Título muito curto ou ausente' };
  }
  
  // Validações de localização PRECISAS
  if (!event.location || typeof event.location !== 'object') {
    return { valid: false, reason: 'Objeto location ausente' };
  }
  
  const { lat, lng, venue_name, address } = event.location;
  
  // CRÍTICO: Validar coordenadas
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { valid: false, reason: 'Coordenadas não são números' };
  }
  
  if (isNaN(lat) || isNaN(lng)) {
    return { valid: false, reason: 'Coordenadas são NaN' };
  }
  
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { valid: false, reason: 'Coordenadas fora dos limites válidos' };
  }
  
  // Validar que não são coordenadas padrão/placeholder
  if (lat === 0 && lng === 0) {
    return { valid: false, reason: 'Coordenadas são (0,0) - placeholder' };
  }
  
  // Validar nome do local
  if (!venue_name || venue_name.trim().length < 2) {
    return { valid: false, reason: 'Nome do local muito curto ou ausente' };
  }
  
  // Validar endereço
  if (!address || address.trim().length < 5) {
    return { valid: false, reason: 'Endereço muito curto ou ausente' };
  }
  
  // Validações de preço e duração
  if (typeof event.price !== 'number' || event.price < 0) {
    return { valid: false, reason: 'Preço inválido' };
  }
  
  if (typeof event.duration_hours !== 'number' || event.duration_hours < 1 || event.duration_hours > 24) {
    return { valid: false, reason: 'Duração inválida (deve ser entre 1-24h)' };
  }
  
  return { valid: true };
};

const removeDuplicates = (events, existingEvents) => {
  const existingMap = new Map();
  
  // Mapear eventos existentes por múltiplos critérios
  existingEvents.forEach(e => {
    // Chave por título + data + local
    const titleKey = `${e.title.toLowerCase().trim()}_${new Date(e.date).getTime()}_${e.location.venue_name?.toLowerCase().trim() || ''}`;
    existingMap.set(titleKey, true);
    
    // Chave por fonte externa
    if (e.external_source && e.external_id) {
      existingMap.set(`${e.external_source}_${e.external_id}`, true);
    }
    
    // Chave por coordenadas + data (eventos no mesmo local e hora)
    const coordKey = `${e.location.lat.toFixed(4)}_${e.location.lng.toFixed(4)}_${new Date(e.date).getTime()}`;
    existingMap.set(coordKey, true);
  });
  
  return events.filter(event => {
    // Verificar título + data + local
    const titleKey = `${event.title.toLowerCase().trim()}_${new Date(event.date).getTime()}_${event.location.venue_name?.toLowerCase().trim() || ''}`;
    if (existingMap.has(titleKey)) return false;
    
    // Verificar fonte externa
    const externalKey = `${event.external_source}_${event.external_id}`;
    if (existingMap.has(externalKey)) return false;
    
    // Verificar coordenadas + data
    const coordKey = `${event.location.lat.toFixed(4)}_${event.location.lng.toFixed(4)}_${new Date(event.date).getTime()}`;
    return !existingMap.has(coordKey);
  });
};

// ==================== NORMALIZADORES OTIMIZADOS ====================

const normalizeEventbriteEvent = (event) => {
  if (!event.start?.local || !event.venue) return null;
  
  const lat = parseFloat(event.venue.latitude);
  const lng = parseFloat(event.venue.longitude);
  
  // Validação de coordenadas durante normalização
  if (isNaN(lat) || isNaN(lng) || lat === 0 && lng === 0) {
    console.warn(`⚠️ Eventbrite: ${event.name?.text} - coordenadas inválidas`);
    return null;
  }
  
  const startDate = new Date(event.start.local);
  const endDate = event.end?.local ? new Date(event.end.local) : new Date(startDate.getTime() + 4 * 60 * 60 * 1000);
  
  return {
    title: event.name?.text || 'Evento sem título',
    description: (event.description?.text || event.summary || 'Sem descrição').slice(0, 500),
    genre: mapGenre(event.category?.name || '', event.name?.text || '', event.description?.text || ''),
    type: determineEventType(event.name?.text || '', event.description?.text || '', event.venue?.name || ''),
    location: {
      lat: lat,
      lng: lng,
      address: event.venue.address?.localized_address_display || event.venue.name || 'Endereço não especificado',
      venue_name: event.venue.name || 'Local não especificado',
      city: event.venue.address?.city || '',
      is_secret: false
    },
    date: startDate.toISOString(),
    duration_hours: Math.min(Math.max(Math.round((endDate - startDate) / (1000 * 60 * 60)), 2), 12) || 4,
    price: parseFloat(event.ticket_availability?.minimum_ticket_price?.major_value) || 0,
    is_secret: false,
    organizer: event.organizer?.name || 'Organizador Externo',
    organizer_id: 'external_eventbrite',
    max_capacity: parseInt(event.capacity) || 100,
    current_attendees: 0,
    image_url: event.logo?.url || event.logo?.original?.url || `https://picsum.photos/800/400?random=${event.id}`,
    vibe_tags: ['music', 'party', 'external'],
    requires_approval: false,
    minimum_level: 1,
    external_source: 'eventbrite',
    external_id: event.id,
    external_url: event.url,
    verified_sublinx: false,
    sync_date: new Date().toISOString()
  };
};

const normalizeJamBaseEvent = (event) => {
  if (!event.startDate || !event.location?.latitude) return null;
  
  const lat = parseFloat(event.location.latitude);
  const lng = parseFloat(event.location.longitude);
  
  if (isNaN(lat) || isNaN(lng) || lat === 0 && lng === 0) {
    console.warn(`⚠️ JamBase: ${event.name} - coordenadas inválidas`);
    return null;
  }
  
  return {
    title: event.name || 'Evento sem título',
    description: (event.description || 'Show ao vivo').slice(0, 500),
    genre: mapGenre('music', event.name, event.description || ''),
    type: determineEventType(event.name, event.description || '', event.location?.name || ''),
    location: {
      lat: lat,
      lng: lng,
      address: event.location.address || event.location.name || 'Endereço não especificado',
      venue_name: event.location.name || 'Venue',
      city: event.location.city || '',
      is_secret: false
    },
    date: new Date(event.startDate).toISOString(),
    duration_hours: 3,
    price: 0,
    is_secret: false,
    organizer: event.offers?.[0]?.seller?.name || 'Organizador Externo',
    organizer_id: 'external_jambase',
    max_capacity: 100,
    current_attendees: 0,
    image_url: event.image || `https://picsum.photos/800/400?random=${event.identifier}`,
    vibe_tags: ['live', 'music', 'external'],
    requires_approval: false,
    minimum_level: 1,
    external_source: 'jambase',
    external_id: event.identifier,
    external_url: event.url || event.offers?.[0]?.url,
    verified_sublinx: false,
    sync_date: new Date().toISOString()
  };
};

const normalizeAllEventsEvent = (event) => {
  if (!event.start_time || !event.venue?.latitude) return null;
  
  const lat = parseFloat(event.venue.latitude);
  const lng = parseFloat(event.venue.longitude);
  
  if (isNaN(lat) || isNaN(lng) || lat === 0 && lng === 0) {
    console.warn(`⚠️ AllEvents: ${event.name} - coordenadas inválidas`);
    return null;
  }
  
  return {
    title: event.name || 'Evento sem título',
    description: (event.description || 'Evento local').slice(0, 500),
    genre: mapGenre(event.category || '', event.name || '', event.description || ''),
    type: determineEventType(event.name || '', event.description || '', event.venue?.name || ''),
    location: {
      lat: lat,
      lng: lng,
      address: event.venue.address || event.venue.name || 'Endereço não especificado',
      venue_name: event.venue.name || 'Local',
      city: event.venue.city || '',
      is_secret: false
    },
    date: new Date(event.start_time).toISOString(),
    duration_hours: event.duration_hours || 4,
    price: parseFloat(event.ticket_price) || 0,
    is_secret: false,
    organizer: event.organizer?.name || 'Organizador Externo',
    organizer_id: 'external_allevents',
    max_capacity: parseInt(event.capacity) || 100,
    current_attendees: 0,
    image_url: event.image_url || `https://picsum.photos/800/400?random=${event.id}`,
    vibe_tags: ['music', 'local', 'external'],
    requires_approval: false,
    minimum_level: 1,
    external_source: 'allevents',
    external_id: event.id,
    external_url: event.url,
    verified_sublinx: false,
    sync_date: new Date().toISOString()
  };
};

const normalizeOpenWebNinjaEvent = (event) => {
  if (!event.start_time || !event.latitude) return null;
  
  const lat = parseFloat(event.latitude);
  const lng = parseFloat(event.longitude);
  
  if (isNaN(lat) || isNaN(lng) || lat === 0 && lng === 0) {
    console.warn(`⚠️ OpenWebNinja: ${event.name || event.title} - coordenadas inválidas`);
    return null;
  }
  
  return {
    title: event.name || event.title || 'Evento sem título',
    description: (event.description || 'Evento em tempo real').slice(0, 500),
    genre: mapGenre(event.category || '', event.name || '', event.description || ''),
    type: determineEventType(event.name || '', event.description || '', event.venue?.name || ''),
    location: {
      lat: lat,
      lng: lng,
      address: event.address || event.location || 'Endereço não especificado',
      venue_name: event.venue_name || event.venue || 'Local',
      city: event.city || '',
      is_secret: false
    },
    date: new Date(event.start_time).toISOString(),
    duration_hours: 4,
    price: 0,
    is_secret: false,
    organizer: event.organizer || 'Organizador Externo',
    organizer_id: 'external_openwebninja',
    max_capacity: 100,
    current_attendees: 0,
    image_url: event.image || `https://picsum.photos/800/400?random=${event.id}`,
    vibe_tags: ['realtime', 'music', 'external'],
    requires_approval: false,
    minimum_level: 1,
    external_source: 'openwebninja',
    external_id: event.id || event.event_id,
    external_url: event.link || event.url,
    verified_sublinx: false,
    sync_date: new Date().toISOString()
  };
};

// ==================== FUNÇÕES DE FETCH COM TIMEOUT ====================

const fetchWithTimeout = async (url, options, timeout) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
};

const fetchEventbriteEvents = async (city, authToken) => {
  if (!authToken) {
    console.log('⚠️ Eventbrite API key não configurada');
    return [];
  }
  
  try {
    const categories = API_CONFIGS.eventbrite.categories.join(',');
    const url = `${API_CONFIGS.eventbrite.baseUrl}/events/search/?location.address=${encodeURIComponent(city)}&categories=${categories}&expand=venue,organizer,ticket_availability`;
    
    const response = await fetchWithTimeout(url, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    }, API_CONFIGS.eventbrite.timeout);
    
    if (!response.ok) {
      throw new Error(`Eventbrite API error: ${response.status}`);
    }
    
    const data = await response.json();
    const events = data.events || [];
    
    console.log(`✅ Eventbrite: ${events.length} eventos encontrados`);
    
    return events
      .map(normalizeEventbriteEvent)
      .filter(e => e && e.location.lat && e.location.lng && isUndergroundEvent(e));
  } catch (error) {
    console.error('❌ Erro ao buscar Eventbrite:', error.message);
    return [];
  }
};

const fetchJamBaseEvents = async (city, authToken) => {
  if (!authToken) {
    console.log('⚠️ JamBase API key não configurada');
    return [];
  }
  
  try {
    const url = `${API_CONFIGS.jambase.baseUrl}/events?geoCity=${encodeURIComponent(city)}&apikey=${authToken}`;
    
    const response = await fetchWithTimeout(url, {}, API_CONFIGS.jambase.timeout);
    
    if (!response.ok) {
      throw new Error(`JamBase API error: ${response.status}`);
    }
    
    const data = await response.json();
    const events = data.events || [];
    
    console.log(`✅ JamBase: ${events.length} eventos encontrados`);
    
    return events
      .map(normalizeJamBaseEvent)
      .filter(e => e && e.location.lat && e.location.lng && isUndergroundEvent(e));
  } catch (error) {
    console.error('❌ Erro ao buscar JamBase:', error.message);
    return [];
  }
};

const fetchAllEventsEvents = async (city) => {
  try {
    const url = `${API_CONFIGS.allevents.baseUrl}?city=${encodeURIComponent(city)}&category=music,nightlife`;
    
    const response = await fetchWithTimeout(url, {}, API_CONFIGS.allevents.timeout);
    
    if (!response.ok) {
      console.log('⚠️ AllEvents API não disponível');
      return [];
    }
    
    const data = await response.json();
    const events = data.events || [];
    
    console.log(`✅ AllEvents: ${events.length} eventos encontrados`);
    
    return events
      .map(normalizeAllEventsEvent)
      .filter(e => e && e.location.lat && e.location.lng && isUndergroundEvent(e));
  } catch (error) {
    console.error('❌ Erro ao buscar AllEvents:', error.message);
    return [];
  }
};

const fetchOpenWebNinjaEvents = async (city, rapidApiKey) => {
  if (!rapidApiKey) {
    console.log('⚠️ RapidAPI key não configurada para OpenWebNinja');
    return [];
  }
  
  try {
    const url = `${API_CONFIGS.openwebninja.baseUrl}/search-events`;
    
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'real-time-events-search.p.rapidapi.com'
      },
      body: JSON.stringify({
        query: `music events in ${city}`,
        location: city,
        start: 0,
        num: 50
      })
    }, API_CONFIGS.openwebninja.timeout);
    
    if (!response.ok) {
      throw new Error(`OpenWebNinja API error: ${response.status}`);
    }
    
    const data = await response.json();
    const events = data.events || data.data || [];
    
    console.log(`✅ OpenWebNinja: ${events.length} eventos encontrados`);
    
    return events
      .map(normalizeOpenWebNinjaEvent)
      .filter(e => e && e.location.lat && e.location.lng && isUndergroundEvent(e));
  } catch (error) {
    console.error('❌ Erro ao buscar OpenWebNinja:', error.message);
    return [];
  }
};

// ==================== HANDLER PRINCIPAL ====================

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized - Admin only' },
        { status: 401 }
      );
    }
    
    const { city = 'São Paulo', force = false } = await req.json().catch(() => ({}));
    
    console.log(`🌍 Iniciando sincronização de eventos externos para: ${city}`);
    const startTime = performance.now();
    
    const existingEvents = await base44.asServiceRole.entities.Event.list('-date', 1000);
    
    const eventbriteToken = Deno.env.get('EVENTBRITE_API_KEY');
    const jambaseToken = Deno.env.get('JAMBASE_API_KEY');
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    
    console.log('🔄 Buscando eventos de múltiplas fontes...');
    
    const [eventbriteEvents, jambaseEvents, alleventsEvents, openWebNinjaEvents] = await Promise.all([
      fetchEventbriteEvents(city, eventbriteToken),
      fetchJamBaseEvents(city, jambaseToken),
      fetchAllEventsEvents(city),
      fetchOpenWebNinjaEvents(city, rapidApiKey)
    ]);
    
    let allExternalEvents = [
      ...eventbriteEvents,
      ...jambaseEvents,
      ...alleventsEvents,
      ...openWebNinjaEvents
    ];
    
    console.log(`📊 Total de eventos encontrados: ${allExternalEvents.length}`);
    
    const uniqueEvents = removeDuplicates(allExternalEvents, existingEvents);
    console.log(`✨ Eventos únicos após filtragem: ${uniqueEvents.length}`);
    
    const validationResults = uniqueEvents.map(event => ({
      event,
      validation: validateEvent(event)
    }));
    
    const validEvents = validationResults
      .filter(result => result.validation.valid)
      .map(result => result.event);
    
    const invalidEvents = validationResults
      .filter(result => !result.validation.valid)
      .map(result => ({
        title: result.event.title,
        reason: result.validation.reason,
        source: result.event.external_source,
        location: result.event.location
      }));
    
    console.log(`✅ Eventos válidos: ${validEvents.length}`);
    console.log(`❌ Eventos inválidos: ${invalidEvents.length}`);
    
    let insertedCount = 0;
    let errorCount = 0;
    const insertErrors = [];
    
    for (const event of validEvents) {
      try {
        await base44.asServiceRole.entities.Event.create(event);
        insertedCount++;
      } catch (error) {
        console.error(`❌ Erro ao inserir evento ${event.title}:`, error.message);
        errorCount++;
        insertErrors.push({
          title: event.title,
          source: event.external_source,
          location: event.location,
          error: error.message
        });
      }
    }
    
    const endTime = performance.now();
    const executionTime = Math.round(endTime - startTime);
    
    const summary = {
      success: true,
      city: city,
      timestamp: new Date().toISOString(),
      execution_time_ms: executionTime,
      stats: {
        total_found: allExternalEvents.length,
        unique_after_deduplication: uniqueEvents.length,
        valid_after_validation: validEvents.length,
        successfully_inserted: insertedCount,
        errors: errorCount,
        invalid_events: invalidEvents.length
      },
      sources: {
        eventbrite: eventbriteEvents.length,
        jambase: jambaseEvents.length,
        allevents: alleventsEvents.length,
        openwebninja: openWebNinjaEvents.length
      },
      validation_breakdown: {
        passed: validEvents.length,
        failed: invalidEvents.length,
        failure_reasons: invalidEvents.reduce((acc, inv) => {
          acc[inv.reason] = (acc[inv.reason] || 0) + 1;
          return acc;
        }, {})
      },
      location_quality: {
        total_validated: validEvents.length,
        with_precise_coordinates: validEvents.filter(e => 
          e.location.lat !== 0 && 
          e.location.lng !== 0 &&
          Math.abs(e.location.lat) < 90 &&
          Math.abs(e.location.lng) < 180
        ).length,
        with_address: validEvents.filter(e => e.location.address && e.location.address.length > 5).length,
        with_venue_name: validEvents.filter(e => e.location.venue_name && e.location.venue_name.length > 2).length
      },
      errors: errorCount > 0 ? {
        count: errorCount,
        details: insertErrors.slice(0, 10)
      } : undefined,
      invalid_events: invalidEvents.length > 0 ? {
        count: invalidEvents.length,
        samples: invalidEvents.slice(0, 10)
      } : undefined,
      message: `✅ Sincronização concluída! ${insertedCount} novos eventos adicionados ao SUBLINX em ${executionTime}ms.`
    };
    
    console.log('🎉 Sincronização finalizada:', summary);
    
    return Response.json(summary, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('💥 Erro na sincronização:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});