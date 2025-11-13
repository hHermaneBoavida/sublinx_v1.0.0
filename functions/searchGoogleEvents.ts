import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { query, location, dateRange } = await req.json();

    if (!query || query.length < 3) {
      return Response.json({ 
        error: 'Query deve ter pelo menos 3 caracteres' 
      }, { status: 400 });
    }

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_SEARCH_API_KEY');
    const GOOGLE_SEARCH_ENGINE_ID = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID');

    if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
      console.warn('Google API não configurada, usando busca mock');
      return Response.json({
        success: true,
        events: generateMockEvents(query, location),
        source: 'mock',
        message: 'API do Google não configurada. Configure GOOGLE_SEARCH_API_KEY e GOOGLE_SEARCH_ENGINE_ID'
      });
    }

    // Buscar eventos via Google Custom Search API
    const events = await searchGoogleEvents(
      query, 
      location, 
      dateRange,
      GOOGLE_API_KEY,
      GOOGLE_SEARCH_ENGINE_ID
    );

    // Enriquecer com Knowledge Graph
    const enrichedEvents = await enrichWithKnowledgeGraph(
      events,
      GOOGLE_API_KEY
    );

    return Response.json({
      success: true,
      events: enrichedEvents,
      source: 'google',
      count: enrichedEvents.length
    });

  } catch (error) {
    console.error('Erro ao buscar eventos Google:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});

// Buscar eventos via Google Custom Search
async function searchGoogleEvents(query, location, dateRange, apiKey, searchEngineId) {
  try {
    const city = location?.city || 'São Paulo';
    const searchQuery = `${query} event ${city} Brazil`;
    
    // Construir URL da API
    const params = new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q: searchQuery,
      num: 10,
      dateRestrict: dateRange || 'm1', // Últimos 1 mês
      lr: 'lang_pt', // Português
      gl: 'br', // Brasil
    });

    const url = `https://www.googleapis.com/customsearch/v1?${params}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return [];
    }

    // Parsear resultados
    const events = data.items.map(item => parseGoogleSearchResult(item, location));
    
    return events.filter(e => e !== null);

  } catch (error) {
    console.error('Erro na busca Google:', error);
    return [];
  }
}

// Parsear resultado do Google Search
function parseGoogleSearchResult(item, location) {
  try {
    const title = item.title || 'Evento';
    const description = item.snippet || '';
    const url = item.link || '';
    
    // Extrair informações estruturadas
    const eventData = item.pagemap?.event?.[0] || {};
    const organization = item.pagemap?.organization?.[0] || {};
    
    // Extrair data
    let eventDate = extractDateFromText(description, item.snippet);
    if (eventData.startdate) {
      eventDate = new Date(eventData.startdate).toISOString();
    }
    
    // Extrair preço
    let price = extractPriceFromText(description);
    if (eventData.offers?.price) {
      price = parseFloat(eventData.offers.price);
    }
    
    // Extrair localização
    let venue = eventData.location?.name || organization.name || '';
    let address = eventData.location?.address || '';
    
    // Imagem
    let imageUrl = '';
    if (item.pagemap?.cse_image?.[0]?.src) {
      imageUrl = item.pagemap.cse_image[0].src;
    } else if (item.pagemap?.metatags?.[0]?.['og:image']) {
      imageUrl = item.pagemap.metatags[0]['og:image'];
    }

    return {
      id: `google-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: cleanTitle(title),
      description: cleanDescription(description),
      source: 'google',
      external_url: url,
      image_url: imageUrl || 'https://picsum.photos/800/600?random=' + Math.random(),
      date: eventDate,
      location: {
        venue_name: venue || 'Venue',
        address: address || location?.city || 'São Paulo',
        city: location?.city || 'São Paulo',
        lat: location?.lat || -23.5505,
        lng: location?.lng || -46.6333
      },
      price: price,
      organizer: organization.name || extractOrganizerFromText(description),
      genre: inferGenreFromText(title + ' ' + description),
      type: inferTypeFromText(title + ' ' + description),
      vibe_tags: inferVibeTagsFromText(title + ' ' + description),
      is_external: true,
      max_capacity: 500,
      current_attendees: 0,
      requires_approval: false
    };

  } catch (error) {
    console.error('Erro ao parsear resultado:', error);
    return null;
  }
}

// Enriquecer com Knowledge Graph
async function enrichWithKnowledgeGraph(events, apiKey) {
  try {
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        try {
          // Buscar informações adicionais no Knowledge Graph
          const query = encodeURIComponent(event.title);
          const url = `https://kgsearch.googleapis.com/v1/entities:search?query=${query}&key=${apiKey}&limit=1&types=Event`;
          
          const response = await fetch(url);
          
          if (!response.ok) {
            return event; // Retornar evento original se falhar
          }

          const data = await response.json();
          
          if (data.itemListElement && data.itemListElement.length > 0) {
            const entity = data.itemListElement[0].result;
            
            // Enriquecer com dados do Knowledge Graph
            if (entity.description && !event.description) {
              event.description = entity.description;
            }
            
            if (entity.image?.contentUrl && !event.image_url) {
              event.image_url = entity.image.contentUrl;
            }
            
            if (entity.detailedDescription?.articleBody) {
              event.description = entity.detailedDescription.articleBody;
            }
          }

          return event;

        } catch (error) {
          console.error('Erro ao enriquecer evento:', error);
          return event;
        }
      })
    );

    return enrichedEvents;

  } catch (error) {
    console.error('Erro no Knowledge Graph:', error);
    return events; // Retornar eventos originais se falhar
  }
}

// Utilitários de extração
function extractDateFromText(text) {
  // Tentar extrair data do texto
  const now = new Date();
  
  // Padrões comuns de data em português
  const patterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY
    /(\d{1,2}) de (\w+) de (\d{4})/,   // DD de MÊS de YYYY
    /(\d{1,2}) de (\w+)/,              // DD de MÊS
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Parsear e retornar
      try {
        const date = new Date();
        // Lógica simplificada - usar 7 dias no futuro
        date.setDate(date.getDate() + 7);
        return date.toISOString();
      } catch (e) {
        continue;
      }
    }
  }

  // Default: 7 dias no futuro
  now.setDate(now.getDate() + 7);
  return now.toISOString();
}

function extractPriceFromText(text) {
  const priceMatch = text.match(/R\$\s*(\d+(?:[.,]\d{2})?)/);
  if (priceMatch) {
    return parseFloat(priceMatch[1].replace(',', '.'));
  }
  return 0;
}

function extractOrganizerFromText(text) {
  // Tentar extrair organizador do texto
  const patterns = [
    /organizado por ([^.,]+)/i,
    /por ([^.,]+)/i,
    /realizado por ([^.,]+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return 'Organizador';
}

function cleanTitle(title) {
  // Remover caracteres especiais e limitar tamanho
  return title
    .replace(/[|»›]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100);
}

function cleanDescription(description) {
  return description
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);
}

function inferGenreFromText(text) {
  const lower = text.toLowerCase();
  
  const genreMap = {
    techno: ['techno', 'tech house', 'minimal techno'],
    house: ['house', 'deep house', 'progressive house'],
    trance: ['trance', 'psy trance', 'psychedelic'],
    drum_bass: ['drum and bass', 'dnb', 'd&b', 'drum & bass'],
    funk: ['funk', 'baile funk', 'funk carioca'],
    trap: ['trap', 'hip hop', 'rap'],
    samba: ['samba', 'pagode'],
    rock: ['rock', 'indie', 'alternativo'],
    eletrônica: ['eletrônica', 'electronic', 'edm']
  };

  for (const [genre, keywords] of Object.entries(genreMap)) {
    if (keywords.some(k => lower.includes(k))) {
      return genre;
    }
  }

  return 'house';
}

function inferTypeFromText(text) {
  const lower = text.toLowerCase();
  
  if (lower.includes('rave') || lower.includes('warehouse')) return 'rave';
  if (lower.includes('rooftop') || lower.includes('terraço')) return 'rooftop';
  if (lower.includes('club') || lower.includes('balada')) return 'club';
  if (lower.includes('festival')) return 'festival';
  if (lower.includes('underground')) return 'underground';
  
  return 'club';
}

function inferVibeTagsFromText(text) {
  const lower = text.toLowerCase();
  const tags = [];
  
  if (lower.includes('dançar') || lower.includes('dance')) tags.push('dançar');
  if (lower.includes('relax') || lower.includes('chill')) tags.push('relaxar');
  if (lower.includes('social') || lower.includes('network')) tags.push('socializar');
  if (lower.includes('adrenalina') || lower.includes('intense')) tags.push('adrenalina');
  if (lower.includes('eletrônico') || lower.includes('electronic')) tags.push('eletrônico');
  
  return tags.length > 0 ? tags : ['dançar'];
}

// Mock events para quando API não estiver configurada
function generateMockEvents(query, location) {
  const mockEvents = [];
  const now = Date.now();
  
  for (let i = 0; i < 5; i++) {
    mockEvents.push({
      id: `google-mock-${now}-${i}`,
      title: `${query} - Evento ${i + 1} (Demo Google)`,
      description: `Evento de demonstração encontrado via busca do Google. Configure as APIs para ver eventos reais.`,
      source: 'google',
      external_url: `https://www.google.com/search?q=${encodeURIComponent(query + ' evento')}`,
      image_url: `https://picsum.photos/800/600?random=google${i}`,
      date: new Date(now + (i + 3) * 24 * 60 * 60 * 1000).toISOString(),
      location: {
        venue_name: 'Google Events Venue',
        address: location?.city || 'São Paulo',
        city: location?.city || 'São Paulo',
        lat: location?.lat || -23.5505,
        lng: location?.lng || -46.6333
      },
      price: Math.random() > 0.5 ? Math.floor(Math.random() * 100) : 0,
      organizer: 'Google Events Organizer',
      genre: inferGenreFromText(query),
      type: inferTypeFromText(query),
      vibe_tags: inferVibeTagsFromText(query),
      is_external: true,
      max_capacity: 500,
      current_attendees: 0,
      requires_approval: false
    });
  }

  return mockEvents;
}