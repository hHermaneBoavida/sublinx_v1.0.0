import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// ==================== CONFIGURAÇÕES DAS APIS ====================

const API_CONFIGS = {
  eventbrite: {
    baseUrl: 'https://www.eventbriteapi.com/v3',
    requiresAuth: true,
    categories: ['music', 'nightlife', 'performing-arts']
  },
  jambase: {
    baseUrl: 'https://api.jambase.com/v3',
    requiresAuth: true
  },
  allevents: {
    baseUrl: 'https://allevents.in/api/events',
    requiresAuth: false
  },
  openwebninja: {
    baseUrl: 'https://real-time-events-search.p.rapidapi.com',
    requiresAuth: true,
    rapidApiKey: Deno.env.get('RAPIDAPI_KEY')
  }
};

// ==================== MAPEAMENTOS ====================

const GENRE_MAPPING = {
  'electronic': 'techno',
  'edm': 'house',
  'techno': 'techno',
  'house': 'house',
  'trance': 'trance',
  'drum and bass': 'drum_bass',
  'drum & bass': 'drum_bass',
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
  'jazz': 'ambient',
  'blues': 'ambient',
  'soul': 'funk',
  'r&b': 'funk',
  'default': 'house'
};

const UNDERGROUND_KEYWORDS = [
  'party', 'rave', 'balada', 'festa', 'noite', 'show', 'dj', 'música', 'music',
  'dance', 'dança', 'eletrônica', 'techno', 'house', 'trance', 'underground',
  'club', 'nightlife', 'electronic', 'festival', 'live music', 'concert'
];

const EXCLUDED_KEYWORDS = [
  'corporate', 'empresa', 'negócio', 'palestra', 'curso', 'workshop',
  'seminário', 'conferência', 'treinamento', 'igreja', 'culto', 'religioso',
  'gospel', 'church', 'religious', 'business', 'meeting'
];

// ==================== FUNÇÕES AUXILIARES ====================

const isUndergroundEvent = (event) => {
  const text = `${event.title} ${event.description}`.toLowerCase();
  
  const hasExcluded = EXCLUDED_KEYWORDS.some(keyword => text.includes(keyword));
  if (hasExcluded) return false;
  
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
  if (text.includes('rooftop') || text.includes('terraço')) return 'rooftop';
  if (text.includes('underground') || text.includes('secreto')) return 'underground';
  if (text.includes('festival')) return 'festival';
  if (text.includes('club') || text.includes('balada')) return 'club';
  
  return 'club';
};

const validateEvent = (event) => {
  const now = new Date();
  const eventDate = new Date(event.date);
  
  if (eventDate < now) return { valid: false, reason: 'Data no passado' };
  if (!event.title || event.title.length < 3) return { valid: false, reason: 'Título inválido' };
  if (!event.location?.lat || !event.location?.lng) return { valid: false, reason: 'Localização ausente' };
  if (Math.abs(event.location.lat) > 90 || Math.abs(event.location.lng) > 180) {
    return { valid: false, reason: 'Coordenadas inválidas' };
  }
  if (!event.location.venue_name || event.location.venue_name.length < 2) {
    return { valid: false, reason: 'Nome do local inválido' };
  }
  if (event.price < 0) return { valid: false, reason: 'Preço inválido' };
  if (event.duration_hours < 1 || event.duration_hours > 24) {
    return { valid: false, reason: 'Duração inválida' };
  }
  
  return { valid: true };
};

const removeDuplicates = (events, existingEvents) => {
  const existingMap = new Map();
  
  existingEvents.forEach(e => {
    const key = `${e.title.toLowerCase().trim()}_${new Date(e.date).getTime()}_${e.location.venue_name?.toLowerCase().trim() || ''}`;
    existingMap.set(key, true);
    
    if (e.external_source && e.external_id) {
      existingMap.set(`${e.external_source}_${e.external_id}`, true);
    }
  });
  
  return events.filter(event => {
    const titleKey = `${event.title.toLowerCase().trim()}_${new Date(event.date).getTime()}_${event.location.venue_name?.toLowerCase().trim() || ''}`;
    if (existingMap.has(titleKey)) return false;
    
    const externalKey = `${event.external_source}_${event.external_id}`;
    return !existingMap.has(externalKey);
  });
};

// ==================== NORMALIZADORES POR API ====================

const normalizeEventbriteEvent = (event) => {
  if (!event.start?.local || !event.venue) return null;
  
  const startDate = new Date(event.start.local);
  const endDate = event.end?.local ? new Date(event.end.local) : new Date(startDate.getTime() + 4 * 60 * 60 * 1000);
  
  return {
    title: event.name?.text || 'Evento sem título',
    description: event.description?.text || event.summary || 'Sem descrição',
    genre: mapGenre(event.category?.name || '', event.name?.text || '', event.description?.text || ''),
    type: determineEventType(event.name?.text || '', event.description?.text || '', event.venue?.name || ''),
    location: {
      lat: parseFloat(event.venue.latitude) || 0,
      lng: parseFloat(event.venue.longitude) || 0,
      address: event.venue.address?.localized_address_display || event.venue.name,
      venue_name: event.venue.name || 'Local não especificado',
      is_secret: false
    },
    date: startDate.toISOString(),
    duration_hours: Math.round((endDate - startDate) / (1000 * 60 * 60)) || 4,
    price: event.ticket_availability?.minimum_ticket_price?.major_value || 0,
    is_secret: false,
    organizer: event.organizer?.name || 'Organizador Externo',
    organizer_id: 'external_eventbrite',
    max_capacity: event.capacity || 100,
    current_attendees: 0,
    image_url: event.logo?.url || event.logo?.original?.url || `https://picsum.photos/800/400?random=${event.id}`,
    vibe_tags: ['music', 'party'],
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
  
  return {
    title: event.name || 'Evento sem título',
    description: event.description || 'Show ao vivo',
    genre: mapGenre('music', event.name, event.description || ''),
    type: determineEventType(event.name, event.description || '', event.location?.name || ''),
    location: {
      lat: parseFloat(event.location.latitude),
      lng: parseFloat(event.location.longitude),
      address: event.location.address || event.location.name,
      venue_name: event.location.name || 'Venue',
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
    vibe_tags: ['live', 'music'],
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
  
  return {
    title: event.name || 'Evento sem título',
    description: event.description || 'Evento local',
    genre: mapGenre(event.category || '', event.name || '', event.description || ''),
    type: determineEventType(event.name || '', event.description || '', event.venue?.name || ''),
    location: {
      lat: parseFloat(event.venue.latitude),
      lng: parseFloat(event.venue.longitude),
      address: event.venue.address || event.venue.name,
      venue_name: event.venue.name || 'Local',
      is_secret: false
    },
    date: new Date(event.start_time).toISOString(),
    duration_hours: event.duration_hours || 4,
    price: event.ticket_price || 0,
    is_secret: false,
    organizer: event.organizer?.name || 'Organizador Externo',
    organizer_id: 'external_allevents',
    max_capacity: event.capacity || 100,
    current_attendees: 0,
    image_url: event.image_url || `https://picsum.photos/800/400?random=${event.id}`,
    vibe_tags: ['music', 'local'],
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
  
  return {
    title: event.name || event.title || 'Evento sem título',
    description: event.description || 'Evento em tempo real',
    genre: mapGenre(event.category || '', event.name || '', event.description || ''),
    type: determineEventType(event.name || '', event.description || '', event.venue?.name || ''),
    location: {
      lat: parseFloat(event.latitude),
      lng: parseFloat(event.longitude),
      address: event.address || event.location || 'Endereço não especificado',
      venue_name: event.venue_name || event.venue || 'Local',
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
    vibe_tags: ['realtime', 'music'],
    requires_approval: false,
    minimum_level: 1,
    external_source: 'openwebninja',
    external_id: event.id || event.event_id,
    external_url: event.link || event.url,
    verified_sublinx: false,
    sync_date: new Date().toISOString()
  };
};

// ==================== FUNÇÕES DE FETCH ====================

const fetchEventbriteEvents = async (city, authToken) => {
  if (!authToken) {
    console.log('⚠️ Eventbrite API key não configurada');
    return [];
  }
  
  try {
    const categories = API_CONFIGS.eventbrite.categories.join(',');
    const url = `${API_CONFIGS.eventbrite.baseUrl}/events/search/?location.address=${city}&categories=${categories}&expand=venue,organizer,ticket_availability`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
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
    const url = `${API_CONFIGS.jambase.baseUrl}/events?geoCity=${city}&apikey=${authToken}`;
    
    const response = await fetch(url);
    
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
    const url = `${API_CONFIGS.allevents.baseUrl}?city=${city}&category=music,nightlife`;
    
    const response = await fetch(url);
    
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
    
    const response = await fetch(url, {
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
    });
    
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
    
    const { city = 'São Paulo', force = false } = await req.json();
    
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
        source: result.event.external_source
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