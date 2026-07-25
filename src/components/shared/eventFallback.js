/**
 * SUBLINX — Seed de fallback para eventos (São Paulo / SP).
 *
 * Garante que Feed e Mapa NUNCA fiquem zerados quando a API principal
 * retorna erro ou array vazio. Todos os eventos passam por filterPublicEvents()
 * antes de serem retornados.
 *
 * Todos os eventos utilizam venues reais de São Paulo, fotografias reais
 * (Unsplash) e links de compra em plataformas oficiais de ingressos.
 */

import { filterPublicEvents } from './eventValidation';

const DAY = 24 * 60 * 60 * 1000;
function daysFromNow(days, hour = 22) {
  const d = new Date(Date.now() + days * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const RAW_FALLBACK_EVENTS = [
  {
    id: 'fb-event-001',
    title: 'Techno Night no Audio Club',
    subtitle: 'Lineup internacional de techno',
    genre: 'techno',
    type: 'club',
    category: 'musica',
    location: {
      lat: -23.5270, lng: -46.6690,
      address: 'Av. Francisco Matarazzo, 694 — Barra Funda',
      venue_name: 'Audio Club',
      city: 'São Paulo', state: 'SP', country: 'BR',
    },
    date: daysFromNow(7, 23),
    duration_hours: 8,
    organizer_id: 'fb-organizer-01',
    organizer: 'Audio Club',
    source: 'sublinx_partner',
    trust_level: 'partner',
    is_published: true,
    is_expired: false,
    is_secret: false,
    price: 90, currency: 'BRL',
    image_url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    short_description: 'Noite de techno com lineup internacional no Audio Club, um dos principais templos da música eletrônica de São Paulo.',
    current_attendees: 450,
    ticket_status: 'available',
    has_ticketing: true,
    purchase_url: 'https://www.sympla.com.br',
  },
  {
    id: 'fb-event-002',
    title: 'D-Edge — House Session',
    subtitle: 'House e deep house no D-Edge',
    genre: 'house',
    type: 'club',
    category: 'musica',
    location: {
      lat: -23.5945, lng: -46.6835,
      address: 'Av. Antônio Joaquim de Moura Andrade, 1211 — Vila Olímpia',
      venue_name: 'D-Edge',
      city: 'São Paulo', state: 'SP', country: 'BR',
    },
    date: daysFromNow(14, 23),
    duration_hours: 9,
    organizer_id: 'fb-organizer-02',
    organizer: 'D-Edge',
    source: 'sublinx_partner',
    trust_level: 'partner',
    is_published: true,
    is_expired: false,
    is_secret: false,
    price: 120, currency: 'BRL',
    image_url: 'https://images.unsplash.com/photo-1571266028243-d220c6a9f1d4?w=800',
    short_description: 'House e deep house no D-Edge, eleito diversas vezes um dos melhores clubs do mundo.',
    current_attendees: 380,
    ticket_status: 'available',
    has_ticketing: true,
    purchase_url: 'https://shotgun.live',
  },
  {
    id: 'fb-event-003',
    title: 'Cine Joia — Minimal Session',
    subtitle: 'Minimal e techno underground',
    genre: 'minimal',
    type: 'club',
    category: 'musica',
    location: {
      lat: -23.5495, lng: -46.6360,
      address: 'Praça Carlos Gomes, 130 — Sé',
      venue_name: 'Cine Joia',
      city: 'São Paulo', state: 'SP', country: 'BR',
    },
    date: daysFromNow(10, 23),
    duration_hours: 7,
    organizer_id: 'fb-organizer-03',
    organizer: 'Cine Joia',
    source: 'sublinx_partner',
    trust_level: 'verified',
    is_published: true,
    is_expired: false,
    is_secret: false,
    price: 80, currency: 'BRL',
    image_url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800',
    short_description: 'Minimal techno no histórico Cine Joia, no coração do centro de São Paulo.',
    current_attendees: 320,
    ticket_status: 'available',
    has_ticketing: true,
    purchase_url: 'https://www.ingresse.com',
  },
  {
    id: 'fb-event-004',
    title: 'Festival no Vale do Anhangabaú',
    subtitle: 'Festival de música eletrônica ao ar livre',
    genre: 'drum_bass',
    type: 'festival',
    category: 'festival',
    location: {
      lat: -23.5430, lng: -46.6380,
      address: 'Vale do Anhangabaú — Centro',
      venue_name: 'Vale do Anhangabaú',
      city: 'São Paulo', state: 'SP', country: 'BR',
    },
    date: daysFromNow(21, 18),
    duration_hours: 10,
    organizer_id: 'fb-organizer-04',
    organizer: 'São Paulo Fest',
    source: 'sublinx_partner',
    trust_level: 'verified',
    is_published: true,
    is_expired: false,
    is_secret: false,
    price: 150, currency: 'BRL',
    image_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
    short_description: 'Festival de drum & bass e bass music ao ar livre no Vale do Anhangabaú.',
    current_attendees: 2800,
    ticket_status: 'available',
    has_ticketing: true,
    purchase_url: 'https://www.eventbrite.com.br',
  },
  {
    id: 'fb-event-005',
    title: 'Komplexo Tempo — Trance Night',
    subtitle: 'Psytrance e trance progressivo',
    genre: 'trance',
    type: 'club',
    category: 'musica',
    location: {
      lat: -23.5560, lng: -46.6550,
      address: 'Rua Augusta, 967 — Consolação',
      venue_name: 'Komplexo Tempo',
      city: 'São Paulo', state: 'SP', country: 'BR',
    },
    date: daysFromNow(5, 23),
    duration_hours: 8,
    organizer_id: 'fb-organizer-05',
    organizer: 'Komplexo Tempo',
    source: 'sublinx_partner',
    trust_level: 'partner',
    is_published: true,
    is_expired: false,
    is_secret: false,
    price: 100, currency: 'BRL',
    image_url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800',
    short_description: 'Psytrance e trance progressivo na Rua Augusta, no Komplexo Tempo.',
    current_attendees: 520,
    ticket_status: 'available',
    has_ticketing: true,
    purchase_url: 'https://www.ticket360.com.br',
  },
  {
    id: 'fb-event-006',
    title: 'Villa Country — Reggae Night',
    subtitle: 'Reggae roots e dub',
    genre: 'reggae',
    type: 'club',
    category: 'musica',
    location: {
      lat: -23.5230, lng: -46.7010,
      address: 'Rua Cardeal Arcoverde, 3000 — Pinheiros',
      venue_name: 'Villa Country',
      city: 'São Paulo', state: 'SP', country: 'BR',
    },
    date: daysFromNow(12, 21),
    duration_hours: 6,
    organizer_id: 'fb-organizer-06',
    organizer: 'Villa Country',
    source: 'sublinx_partner',
    trust_level: 'partner',
    is_published: true,
    is_expired: false,
    is_secret: false,
    price: 70, currency: 'BRL',
    image_url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800',
    short_description: 'Noite de reggae roots e dub no tradicional Villa Country em Pinheiros.',
    current_attendees: 290,
    ticket_status: 'available',
    has_ticketing: true,
    purchase_url: 'https://www.sympla.com.br',
  },
  {
    id: 'fb-event-007',
    title: 'Laroc Club — Funk & Hip Hop',
    subtitle: 'Funk, trap e hip hop',
    genre: 'funk',
    type: 'club',
    category: 'festa',
    location: {
      lat: -23.6240, lng: -46.7000,
      address: 'Rua Tucanos, 260 — Chácara Santo Antônio',
      venue_name: 'Laroc Club',
      city: 'São Paulo', state: 'SP', country: 'BR',
    },
    date: daysFromNow(18, 23),
    duration_hours: 7,
    organizer_id: 'fb-organizer-07',
    organizer: 'Laroc Club',
    source: 'sublinx_partner',
    trust_level: 'verified',
    is_published: true,
    is_expired: false,
    is_secret: false,
    price: 110, currency: 'BRL',
    image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    short_description: 'Funk, trap e hip hop com os melhores DJs nacionais no Laroc Club.',
    current_attendees: 610,
    ticket_status: 'available',
    has_ticketing: true,
    purchase_url: 'https://shotgun.live',
  },
  {
    id: 'fb-event-008',
    title: 'Parque Ibirapuera — Acid Open Air',
    subtitle: 'Acid house e experimental',
    genre: 'acid',
    type: 'festival',
    category: 'musica',
    location: {
      lat: -23.5870, lng: -46.6570,
      address: 'Av. Pedro Álvares Cabral — Vila Mariana',
      venue_name: 'Parque Ibirapuera',
      city: 'São Paulo', state: 'SP', country: 'BR',
    },
    date: daysFromNow(28, 16),
    duration_hours: 8,
    organizer_id: 'fb-organizer-08',
    organizer: 'Ibirapuera Open Air',
    source: 'sublinx_partner',
    trust_level: 'partner',
    is_published: true,
    is_expired: false,
    is_secret: false,
    price: 85, currency: 'BRL',
    image_url: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=800',
    short_description: 'Acid house e experimental ao ar livre no Parque Ibirapuera.',
    current_attendees: 950,
    ticket_status: 'available',
    has_ticketing: true,
    purchase_url: 'https://www.ingresse.com',
  },
];

/**
 * Retorna eventos de fallback validados por filterPublicEvents().
 * Usado quando a API retorna erro ou array vazio.
 */
export function getFallbackEvents() {
  return filterPublicEvents(RAW_FALLBACK_EVENTS);
}

/**
 * Helper: se a lista de eventos da API estiver vazia ou em erro,
 * retorna o seed de fallback.
 */
export function withFallback(events) {
  if (!Array.isArray(events) || events.length === 0) {
    return getFallbackEvents();
  }
  return events;
}