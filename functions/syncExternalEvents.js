import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Configurações das APIs
const API_CONFIGS = {
  eventbrite: {
    baseUrl: 'https://www.eventbriteapi.com/v3',
    categories: ['music', 'nightlife', 'performing-arts', 'community'],
    requiresAuth: true
  },
  jambase: {
    baseUrl: 'https://api.jambase.com/v3',
    categories: ['music', 'festival'],
    requiresAuth: true
  },
  allevents: {
    baseUrl: 'https://allevents.in/api/events',
    categories: ['music', 'nightlife', 'party'],
    requiresAuth: false
  }
};

// Mapeamento expandido de gêneros musicais
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

// Palavras-chave expandidas para filtragem underground
const UNDERGROUND_KEYWORDS = [
  // Português
  'party', 'rave', 'balada', 'festa', 'noite', 'show', 'apresentação',
  'dj', 'música', 'music', 'dance', 'dança', 'eletrônica', 'techno',
  'house', 'trance', 'underground', 'alternativo', 'indie',
  // Inglês
  'club', 'nightlife', 'electronic', 'festival', 'live music',
  'concert', 'gig', 'performance', 'venue', 'bar', 'pub'
];

const EXCLUDED_KEYWORDS = [
  // Português
  'corporate', 'empresa', 'negócio', 'palestra', 'curso',
  'workshop', 'seminário', 'conferência', 'treinamento',
  'igreja', 'culto', 'religioso', 'gospel',
  // Inglês
  'church', 'religious', 'conference', 'seminar',
  'training', 'business', 'corporate', 'meeting'
];

// Validação de evento underground
const isUndergroundEvent = (event) => {
  const text = `${event.title} ${event.description}`.toLowerCase();
  
  const hasExcluded = EXCLUDED_KEYWORDS.some(keyword => text.includes(keyword));
  if (hasExcluded) return false;
  
  const hasIncluded = UNDERGROUND_KEYWORDS.some(keyword => text.includes(keyword));
  return hasIncluded;
};

// Mapear gênero musical
const mapGenre = (category, name, description = '') => {
  const text = `${category} ${name} ${description}`.toLowerCase();
  
  for (const [key, value] of Object.entries(GENRE_MAPPING)) {
    if (text.includes(key)) {
      return value;
    }
  }
  
  return GENRE_MAPPING.default;
};

// Determinar tipo de evento
const determineEventType = (title, description, venue) => {
  const text = `${title} ${description} ${venue}`.toLowerCase();
  
  if (text.includes('rave') || text.includes('warehouse')) return 'rave';
  if (text.includes('rooftop') || text.includes('terraço')) return 'rooftop';
  if (text.includes('underground') || text.includes('secreto')) return 'underground';
  if (text.includes('festival')) return 'festival';
  if (text.includes('club') || text.includes('balada')) return 'club';
  
  return 'club'; // default
};

// Normalizar evento do Eventbrite
const normalizeEventbriteEvent = (event) => {
  if (!event.start?.local || !event.venue) return null;
  
  const startDate = new Date(event.start.local);
  const endDate = event.end?.local ? new Date(event.end.local) : new Date(startDate.getTime() + 4 * 60 * 60 * 1000);
  
  const genre = mapGenre(event.category?.name || '', event.name?.text || '', event.description?.text || '');
  const type = determineEventType(event.name?.text || '', event.description?.text || '', event.venue?.name || '');
  
  return {
    title: event.name?.text || 'Evento sem título',
    description: event.description?.text || event.summary || 'Sem descrição',
    genre,
    type,
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

// Normalizar evento do JamBase
const normalizeJamBaseEvent = (event) => {
  if (!event.startDate || !event.location?.latitude) return null;
  
  const genre = mapGenre('music', event.name, event.description || '');
  const type = determineEventType(event.name, event.description || '', event.location?.name || '');
  
  return {
    title: event.name || 'Evento sem título',
    description: event.description || 'Show ao vivo',
    genre,
    type,
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

// Normalizar evento do AllEvents
const normalizeAllEventsEvent = (event) => {
  if (!event.start_time || !event.venue?.latitude) return null;
  
  const genre = mapGenre(event.category || '', event.name || '', event.description || '');
  const type = determineEventType(event.name || '', event.description || '', event.venue?.name || '');
  
  return {
    title: event.name || 'Evento sem título',
    description: event.description || 'Evento local',
    genre,
    type,
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

// Buscar eventos do Eventbrite
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

// Buscar eventos do JamBase
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

// Buscar eventos do AllEvents
const fetchAllEventsEvents = async (city) => {
  try {
    // AllEvents é gratuito mas requer cadastro
    // Aqui é um exemplo - ajustar conforme a API real
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

// Validar e descartar duplicados
const removeDuplicates = (events, existingEvents) => {
  const existingMap = new Map();
  
  // Criar mapa de eventos existentes
  existingEvents.forEach(e => {
    // Chave única: título + data + local (mais robusto)
    const key = `${e.title.toLowerCase().trim()}_${new Date(e.date).getTime()}_${e.location.venue_name?.toLowerCase().trim() || ''}`;
    existingMap.set(key, true);
    
    // Também marcar por external_id se existir
    if (e.external_source && e.external_id) {
      existingMap.set(`${e.external_source}_${e.external_id}`, true);
    }
  });
  
  return events.filter(event => {
    // Verificar por título + data + local
    const titleKey = `${event.title.toLowerCase().trim()}_${new Date(event.date).getTime()}_${event.location.venue_name?.toLowerCase().trim() || ''}`;
    if (existingMap.has(titleKey)) return false;
    
    // Verificar por external_id
    const externalKey = `${event.external_source}_${event.external_id}`;
    if (existingMap.has(externalKey)) return false;
    
    return true;
  });
};

// Validar evento completo
const validateEvent = (event) => {
  const now = new Date();
  const eventDate = new Date(event.date);
  
  // Data não pode ser no passado
  if (eventDate < now) return { valid: false, reason: 'Data no passado' };
  
  // Título deve ter no mínimo 3 caracteres
  if (!event.title || event.title.length < 3) return { valid: false, reason: 'Título inválido' };
  
  // Localização deve existir e ser válida
  if (!event.location.lat || !event.location.lng) return { valid: false, reason: 'Localização ausente' };
  if (Math.abs(event.location.lat) > 90 || Math.abs(event.location.lng) > 180) return { valid: false, reason: 'Coordenadas inválidas' };
  
  // Venue name deve existir
  if (!event.location.venue_name || event.location.venue_name.length < 2) return { valid: false, reason: 'Nome do local inválido' };
  
  // Preço não pode ser negativo
  if (event.price < 0) return { valid: false, reason: 'Preço inválido' };
  
  // Duração deve ser razoável (entre 1 e 24 horas)
  if (event.duration_hours < 1 || event.duration_hours > 24) return { valid: false, reason: 'Duração inválida' };
  
  return { valid: true };
};

// Handler principal
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação de admin
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
    
    // Buscar eventos existentes
    const existingEvents = await base44.asServiceRole.entities.Event.list('-date', 1000);
    
    // Buscar de múltiplas APIs em paralelo
    const eventbriteToken = Deno.env.get('EVENTBRITE_API_KEY');
    const jambaseToken = Deno.env.get('JAMBASE_API_KEY');
    
    console.log('🔄 Buscando eventos de múltiplas fontes...');
    
    const [eventbriteEvents, jambaseEvents, alleventsEvents] = await Promise.all([
      fetchEventbriteEvents(city, eventbriteToken),
      fetchJamBaseEvents(city, jambaseToken),
      fetchAllEventsEvents(city)
    ]);
    
    // Combinar todos os eventos
    let allExternalEvents = [
      ...eventbriteEvents,
      ...jambaseEvents,
      ...alleventsEvents
    ];
    
    console.log(`📊 Total de eventos encontrados: ${allExternalEvents.length}`);
    
    // Remover duplicados
    const uniqueEvents = removeDuplicates(allExternalEvents, existingEvents);
    console.log(`✨ Eventos únicos após filtragem: ${uniqueEvents.length}`);
    
    // Validar eventos
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
    
    // Inserir eventos no banco
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
    
    // Estatísticas detalhadas
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
        allevents: alleventsEvents.length
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
        details: insertErrors.slice(0, 10) // Apenas primeiros 10 erros
      } : undefined,
      invalid_events: invalidEvents.length > 0 ? {
        count: invalidEvents.length,
        samples: invalidEvents.slice(0, 10) // Apenas primeiros 10
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