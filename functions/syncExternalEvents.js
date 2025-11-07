import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Configurações das APIs
const API_CONFIGS = {
  eventbrite: {
    baseUrl: 'https://www.eventbriteapi.com/v3',
    categories: ['music', 'nightlife', 'performing-arts', 'community'],
  },
  jambase: {
    baseUrl: 'https://api.jambase.com/v3',
    categories: ['music', 'festival'],
  }
};

// Mapeamento de gêneros musicais
const GENRE_MAPPING = {
  'electronic': 'techno',
  'edm': 'house',
  'techno': 'techno',
  'house': 'house',
  'trance': 'trance',
  'drum and bass': 'drum_bass',
  'dubstep': 'dubstep',
  'hip hop': 'rap',
  'rap': 'rap',
  'funk': 'funk',
  'trap': 'trap',
  'reggae': 'reggae',
  'samba': 'samba',
  'default': 'house'
};

// Palavras-chave para filtragem underground
const UNDERGROUND_KEYWORDS = [
  'party', 'rave', 'club', 'nightlife', 'underground', 'techno', 'house',
  'dj', 'music', 'dance', 'electronic', 'festival', 'live music',
  'balada', 'festa', 'noite', 'show', 'apresentação'
];

const EXCLUDED_KEYWORDS = [
  'corporate', 'church', 'religious', 'conference', 'seminar',
  'workshop', 'training', 'business', 'corporate', 'empresa',
  'igreja', 'culto', 'palestra', 'curso'
];

// Função para validar se evento é underground
const isUndergroundEvent = (event) => {
  const text = `${event.title} ${event.description}`.toLowerCase();
  
  // Verificar exclusões
  const hasExcluded = EXCLUDED_KEYWORDS.some(keyword => text.includes(keyword));
  if (hasExcluded) return false;
  
  // Verificar inclusões
  const hasIncluded = UNDERGROUND_KEYWORDS.some(keyword => text.includes(keyword));
  return hasIncluded;
};

// Função para mapear gênero musical
const mapGenre = (category, name) => {
  const text = `${category} ${name}`.toLowerCase();
  
  for (const [key, value] of Object.entries(GENRE_MAPPING)) {
    if (text.includes(key)) {
      return value;
    }
  }
  
  return GENRE_MAPPING.default;
};

// Função para normalizar evento do Eventbrite
const normalizeEventbriteEvent = (event) => {
  if (!event.start?.local || !event.venue) return null;
  
  const startDate = new Date(event.start.local);
  const endDate = event.end?.local ? new Date(event.end.local) : new Date(startDate.getTime() + 4 * 60 * 60 * 1000);
  
  return {
    title: event.name?.text || 'Evento sem título',
    description: event.description?.text || event.summary || 'Sem descrição',
    genre: mapGenre(event.category?.name || '', event.name?.text || ''),
    type: 'club',
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
    verified_sublinx: false
  };
};

// Função para buscar eventos do Eventbrite
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

// Função para buscar eventos do JamBase
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
      .map(event => {
        if (!event.startDate || !event.location?.latitude) return null;
        
        return {
          title: event.name || 'Evento sem título',
          description: event.description || 'Show ao vivo',
          genre: mapGenre('music', event.name),
          type: 'club',
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
          verified_sublinx: false
        };
      })
      .filter(e => e && e.location.lat && e.location.lng && isUndergroundEvent(e));
  } catch (error) {
    console.error('❌ Erro ao buscar JamBase:', error.message);
    return [];
  }
};

// Função para validar e descartar duplicados
const removeDuplicates = (events, existingEvents) => {
  const existingMap = new Map();
  
  existingEvents.forEach(e => {
    const key = `${e.title.toLowerCase()}_${new Date(e.date).getTime()}`;
    existingMap.set(key, true);
  });
  
  return events.filter(event => {
    const key = `${event.title.toLowerCase()}_${new Date(event.date).getTime()}`;
    return !existingMap.has(key);
  });
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
    
    // Buscar eventos existentes
    const existingEvents = await base44.asServiceRole.entities.Event.list('-date', 1000);
    
    // Buscar de múltiplas APIs
    const eventbriteToken = Deno.env.get('EVENTBRITE_API_KEY');
    const jambaseToken = Deno.env.get('JAMBASE_API_KEY');
    
    const [eventbriteEvents, jambaseEvents] = await Promise.all([
      fetchEventbriteEvents(city, eventbriteToken),
      fetchJamBaseEvents(city, jambaseToken)
    ]);
    
    // Combinar todos os eventos
    let allExternalEvents = [
      ...eventbriteEvents,
      ...jambaseEvents
    ];
    
    console.log(`📊 Total de eventos encontrados: ${allExternalEvents.length}`);
    
    // Remover duplicados
    const uniqueEvents = removeDuplicates(allExternalEvents, existingEvents);
    
    console.log(`✨ Eventos únicos após filtragem: ${uniqueEvents.length}`);
    
    // Validar eventos
    const now = new Date();
    const validEvents = uniqueEvents.filter(event => {
      const eventDate = new Date(event.date);
      
      // Validações
      if (eventDate < now) return false;
      if (!event.title || event.title.length < 3) return false;
      if (!event.location.lat || !event.location.lng) return false;
      if (Math.abs(event.location.lat) > 90 || Math.abs(event.location.lng) > 180) return false;
      
      return true;
    });
    
    console.log(`✅ Eventos válidos: ${validEvents.length}`);
    
    // Inserir eventos no banco
    let insertedCount = 0;
    let errorCount = 0;
    
    for (const event of validEvents) {
      try {
        await base44.asServiceRole.entities.Event.create(event);
        insertedCount++;
      } catch (error) {
        console.error(`❌ Erro ao inserir evento ${event.title}:`, error.message);
        errorCount++;
      }
    }
    
    const summary = {
      success: true,
      city: city,
      timestamp: new Date().toISOString(),
      stats: {
        total_found: allExternalEvents.length,
        unique_after_deduplication: uniqueEvents.length,
        valid_after_validation: validEvents.length,
        successfully_inserted: insertedCount,
        errors: errorCount
      },
      sources: {
        eventbrite: eventbriteEvents.length,
        jambase: jambaseEvents.length
      },
      message: `✅ Sincronização concluída! ${insertedCount} novos eventos adicionados ao SUBLINX.`
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