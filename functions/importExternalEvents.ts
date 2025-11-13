import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { source, query, location } = await req.json();

    let events = [];

    // Buscar eventos de múltiplas fontes públicas
    switch (source) {
      case 'sympla':
        events = await fetchSymplaEvents(query, location);
        break;
      
      case 'eventbrite':
        events = await fetchEventbriteEvents(query, location);
        break;
      
      case 'facebook':
        events = await fetchFacebookEvents(query, location);
        break;
      
      case 'all':
      default:
        const [symplaResults, eventbriteResults] = await Promise.allSettled([
          fetchSymplaEvents(query, location),
          fetchEventbriteEvents(query, location)
        ]);

        if (symplaResults.status === 'fulfilled') {
          events = [...events, ...symplaResults.value];
        }
        if (eventbriteResults.status === 'fulfilled') {
          events = [...events, ...eventbriteResults.value];
        }
    }

    // Normalizar eventos para formato SUBLINX
    const normalizedEvents = events.map(event => normalizeExternalEvent(event, source));

    return Response.json({
      success: true,
      events: normalizedEvents,
      source,
      count: normalizedEvents.length
    });

  } catch (error) {
    console.error('Erro ao importar eventos:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});

// Buscar eventos do Sympla (via RSS/API pública)
async function fetchSymplaEvents(query, location) {
  try {
    const city = location?.city || 'sao-paulo';
    const searchQuery = encodeURIComponent(query || 'festa');
    
    // API pública do Sympla (feed RSS convertido)
    const url = `https://www.sympla.com.br/eventos/${city}?q=${searchQuery}`;
    
    // Simular busca (em produção, usar scraper real ou API oficial)
    const mockEvents = [
      {
        id: `sympla-${Date.now()}-1`,
        title: `${query || 'Festa'} Eletrônica - Sympla`,
        description: 'Evento encontrado no Sympla com múltiplos DJs e atrações',
        source: 'sympla',
        external_url: url,
        image_url: 'https://picsum.photos/800/600?random=sympla1',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: {
          venue_name: 'Venue Sympla',
          address: 'Av. Paulista, 1000',
          city: city,
          lat: location?.lat || -23.5505,
          lng: location?.lng || -46.6333
        },
        price: 50.00,
        organizer: 'Organizador Sympla'
      }
    ];

    return mockEvents;
  } catch (error) {
    console.error('Erro Sympla:', error);
    return [];
  }
}

// Buscar eventos do Eventbrite
async function fetchEventbriteEvents(query, location) {
  try {
    const searchQuery = encodeURIComponent(query || 'party');
    const url = `https://www.eventbrite.com.br/d/brazil--sao-paulo/events/?q=${searchQuery}`;
    
    const mockEvents = [
      {
        id: `eventbrite-${Date.now()}-1`,
        title: `${query || 'Party'} Night - Eventbrite`,
        description: 'Evento internacional encontrado no Eventbrite',
        source: 'eventbrite',
        external_url: url,
        image_url: 'https://picsum.photos/800/600?random=eventbrite1',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        location: {
          venue_name: 'Eventbrite Venue',
          address: 'Rua Augusta, 2000',
          city: location?.city || 'São Paulo',
          lat: location?.lat || -23.5505,
          lng: location?.lng || -46.6333
        },
        price: 80.00,
        organizer: 'Eventbrite Organizer'
      }
    ];

    return mockEvents;
  } catch (error) {
    console.error('Erro Eventbrite:', error);
    return [];
  }
}

// Buscar eventos públicos do Facebook
async function fetchFacebookEvents(query, location) {
  try {
    // Eventos públicos do Facebook (via graph API ou scraping)
    const mockEvents = [
      {
        id: `facebook-${Date.now()}-1`,
        title: `${query || 'Event'} @ Facebook`,
        description: 'Evento público encontrado no Facebook',
        source: 'facebook',
        external_url: 'https://facebook.com/events',
        image_url: 'https://picsum.photos/800/600?random=facebook1',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        location: {
          venue_name: 'Facebook Venue',
          address: 'Local a definir',
          city: location?.city || 'São Paulo',
          lat: location?.lat || -23.5505,
          lng: location?.lng || -46.6333
        },
        price: 0,
        organizer: 'Facebook Organizer'
      }
    ];

    return mockEvents;
  } catch (error) {
    console.error('Erro Facebook:', error);
    return [];
  }
}

// Normalizar evento externo para formato SUBLINX
function normalizeExternalEvent(event, source) {
  return {
    ...event,
    is_external: true,
    source: source || event.source,
    genre: inferGenre(event.title, event.description),
    type: inferType(event.title, event.description),
    vibe_tags: inferVibeTags(event.title, event.description),
    current_attendees: 0,
    max_capacity: 500,
    requires_approval: false
  };
}

// Inferir gênero musical do evento
function inferGenre(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  
  const genreMap = {
    techno: ['techno', 'tech house', 'minimal'],
    house: ['house', 'deep house', 'progressive'],
    trance: ['trance', 'psy', 'psychedelic'],
    drum_bass: ['drum and bass', 'dnb', 'd&b'],
    funk: ['funk', 'baile funk', 'funk carioca'],
    trap: ['trap', 'hip hop', 'rap'],
    samba: ['samba', 'pagode'],
    rock: ['rock', 'indie', 'alternativo']
  };

  for (const [genre, keywords] of Object.entries(genreMap)) {
    if (keywords.some(k => text.includes(k))) {
      return genre;
    }
  }

  return 'house'; // default
}

// Inferir tipo de evento
function inferType(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('rave') || text.includes('warehouse')) return 'rave';
  if (text.includes('rooftop') || text.includes('terraço')) return 'rooftop';
  if (text.includes('club') || text.includes('balada')) return 'club';
  if (text.includes('festival')) return 'festival';
  if (text.includes('underground')) return 'underground';
  
  return 'club';
}

// Inferir tags de vibe
function inferVibeTags(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const tags = [];
  
  if (text.includes('dançar') || text.includes('dance')) tags.push('dançar');
  if (text.includes('relax') || text.includes('chill')) tags.push('relaxar');
  if (text.includes('social') || text.includes('network')) tags.push('socializar');
  if (text.includes('adrenalina') || text.includes('intense')) tags.push('adrenalina');
  if (text.includes('eletrônico') || text.includes('electronic')) tags.push('eletrônico');
  
  return tags.length > 0 ? tags : ['dançar'];
}