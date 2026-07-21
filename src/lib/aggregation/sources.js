/**
 * ETAPA 3 — MAPEAMENTO DE FONTES
 * Transforma dados de cada API externa para o schema normalizado do SUBLINX.
 */
import { normalizeEvent } from './normalize';

const CURRENCY_BY_SOURCE = {
  ticketmaster: 'USD',
  eventbrite: 'USD',
  meetup: 'USD',
  bandsintown: 'USD',
  serpapi: 'BRL',
  sympla: 'BRL',
  shotgun: 'BRL',
  ingresse: 'BRL',
};

export const API_SOURCES = [
  { id: 'serpapi', name: 'SerpApi (Google Events)', scope: 'global', enabled: false },
  { id: 'ticketmaster', name: 'Ticketmaster Discovery', scope: 'global', enabled: false },
  { id: 'eventbrite', name: 'Eventbrite', scope: 'global', enabled: false },
  { id: 'meetup', name: 'Meetup', scope: 'global', enabled: false },
  { id: 'bandsintown', name: 'Bandsintown', scope: 'global', enabled: false },
  { id: 'sympla', name: 'Sympla', scope: 'brasil', enabled: false },
  { id: 'shotgun', name: 'Shotgun', scope: 'brasil', enabled: false },
  { id: 'ingresse', name: 'Ingresse', scope: 'brasil', enabled: false },
];

export const ALL_SOURCES = [...API_SOURCES];

export function mapSerpApiEvent(raw) {
  return normalizeEvent({
    title: raw.title,
    description: raw.description,
    date: raw.date,
    end_date: raw.end_date,
    location: {
      address: raw.venue?.address,
      venue_name: raw.venue?.name,
      city: raw.venue?.city,
      state: raw.venue?.state,
      lat: raw.venue?.latitude,
      lng: raw.venue?.longitude,
    },
    image_url: raw.thumbnail || raw.image,
    source: 'serpapi',
    source_id: raw.id || raw.link,
    source_url: raw.link,
    ticket_url: raw.ticket_link,
    category: raw.category || 'musica',
    currency: 'BRL',
  });
}

export function mapTicketmasterEvent(raw) {
  const venue = raw._embedded?.venues?.[0];
  const priceRanges = raw.priceRanges?.[0];
  return normalizeEvent({
    title: raw.name,
    description: raw.description || raw.info,
    date: raw.dates?.start?.dateTime,
    end_date: raw.dates?.end?.dateTime,
    location: {
      address: venue?.address?.line1,
      venue_name: venue?.name,
      city: venue?.city?.name,
      state: venue?.state?.stateCode,
      postal_code: venue?.postalCode,
      country: venue?.country?.countryCode,
      lat: parseFloat(venue?.location?.latitude),
      lng: parseFloat(venue?.location?.longitude),
    },
    image_url: raw.images?.find(i => i.ratio === '16_9')?.url || raw.images?.[0]?.url,
    min_price: priceRanges?.min,
    max_price: priceRanges?.max,
    currency: priceRanges?.currency || 'USD',
    ticket_url: raw.url,
    organizer: raw.promoter?.name,
    source: 'ticketmaster',
    source_id: raw.id,
    source_url: raw.url,
    category: raw.classifications?.[0]?.segment?.name?.toLowerCase() || 'musica',
    genre: raw.classifications?.[0]?.genre?.name?.toLowerCase() || 'other',
  });
}

export function mapEventbriteEvent(raw) {
  const venue = raw.venue;
  return normalizeEvent({
    title: raw.name?.text,
    description: raw.description?.text || raw.summary,
    date: raw.start?.utc,
    end_date: raw.end?.utc,
    location: {
      address: venue?.address?.address_1,
      venue_name: venue?.name,
      city: venue?.address?.city,
      state: venue?.address?.region,
      postal_code: venue?.address?.postal_code,
      country: venue?.address?.country,
      lat: parseFloat(venue?.latitude),
      lng: parseFloat(venue?.longitude),
    },
    image_url: raw.logo?.url,
    is_free: raw.is_free,
    currency: raw.currency || 'USD',
    ticket_url: raw.url,
    organizer: raw.organizer_id,
    source: 'eventbrite',
    source_id: raw.id,
    source_url: raw.url,
    category: raw.category?.name || 'musica',
  });
}

export function mapMeetupEvent(raw) {
  return normalizeEvent({
    title: raw.name,
    description: raw.description,
    date: raw.time ? new Date(raw.time).toISOString() : null,
    end_date: raw.time + raw.duration ? new Date(raw.time + raw.duration).toISOString() : null,
    location: {
      address: raw.venue?.address_1,
      venue_name: raw.venue?.name,
      city: raw.venue?.city,
      state: raw.venue?.state,
      country: raw.venue?.country,
      lat: raw.venue?.lat,
      lng: raw.venue?.lon,
    },
    image_url: raw.featured_photo?.highres_link,
    is_free: raw.fee?.amount === 0 || !raw.fee,
    currency: 'USD',
    ticket_url: raw.event_url,
    organizer: raw.group?.name,
    source: 'meetup',
    source_id: raw.id,
    source_url: raw.event_url,
    category: 'social',
  });
}

export function mapBandsintownEvent(raw) {
  return normalizeEvent({
    title: raw.title || raw.artist_name,
    description: raw.description,
    date: raw.datetime,
    location: {
      venue_name: raw.venue?.name,
      city: raw.venue?.city,
      state: raw.venue?.region,
      country: raw.venue?.country,
      lat: parseFloat(raw.venue?.latitude),
      lng: parseFloat(raw.venue?.longitude),
    },
    image_url: raw.image_url || raw.thumb_url,
    ticket_url: raw.offers?.[0]?.url,
    currency: 'USD',
    organizer: raw.artist_name,
    source: 'bandsintown',
    source_id: raw.id,
    source_url: raw.url,
    category: 'musica',
  });
}

export function mapSymplaEvent(raw) {
  return normalizeEvent({
    title: raw.name,
    description: raw.description,
    date: raw.start_date,
    end_date: raw.end_date,
    location: {
      address: raw.address?.street,
      venue_name: raw.address?.name,
      city: raw.address?.city,
      state: raw.address?.state,
      postal_code: raw.address?.zip_code,
      country: 'BR',
      lat: parseFloat(raw.address?.lat),
      lng: parseFloat(raw.address?.long),
    },
    image_url: raw.image,
    min_price: raw.min_price,
    max_price: raw.max_price,
    currency: 'BRL',
    ticket_url: raw.url,
    organizer: raw.host_name,
    source: 'sympla',
    source_id: raw.id,
    source_url: raw.url,
    category: raw.category || 'musica',
  });
}

export function mapShotgunEvent(raw) {
  return normalizeEvent({
    title: raw.name,
    description: raw.description,
    date: raw.starts_at,
    end_date: raw.ends_at,
    location: {
      address: raw.place?.address,
      venue_name: raw.place?.name,
      city: raw.place?.city,
      state: raw.place?.state,
      country: 'BR',
      lat: parseFloat(raw.place?.lat),
      lng: parseFloat(raw.place?.lng),
    },
    image_url: raw.cover_image,
    min_price: raw.min_price,
    max_price: raw.max_price,
    currency: 'BRL',
    ticket_url: raw.url,
    organizer: raw.organizer?.name,
    source: 'shotgun',
    source_id: raw.id,
    source_url: raw.url,
    category: raw.category || 'musica',
  });
}

export function mapIngresseEvent(raw) {
  return normalizeEvent({
    title: raw.name,
    description: raw.description,
    date: raw.startDate,
    end_date: raw.endDate,
    location: {
      address: raw.venue?.address,
      venue_name: raw.venue?.name,
      city: raw.venue?.city,
      state: raw.venue?.state,
      country: 'BR',
      lat: parseFloat(raw.venue?.latitude),
      lng: parseFloat(raw.venue?.longitude),
    },
    image_url: raw.logo,
    min_price: raw.minPrice,
    max_price: raw.maxPrice,
    currency: 'BRL',
    ticket_url: raw.url,
    organizer: raw.producer?.name,
    source: 'ingresse',
    source_id: raw.id,
    source_url: raw.url,
    category: raw.category || 'musica',
  });
}

export const SOURCE_MAPPERS = {
  serpapi: mapSerpApiEvent,
  ticketmaster: mapTicketmasterEvent,
  eventbrite: mapEventbriteEvent,
  meetup: mapMeetupEvent,
  bandsintown: mapBandsintownEvent,
  sympla: mapSymplaEvent,
  shotgun: mapShotgunEvent,
  ingresse: mapIngresseEvent,
};