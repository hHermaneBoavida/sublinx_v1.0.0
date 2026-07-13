/**
 * MOTOR DE SINCRONIZAÇÃO — SUBLINX
 * Usa InvokeLLM com busca web para descobrir eventos globalmente.
 * Funciona sem backend functions (executa client-side).
 */
import { base44 } from '@/api/base44Client';
import { normalizeEvent } from './normalize';
import { validateEvent } from './validate';
import { eventsAreDuplicates, generateSyncHash } from './dedup';

const GENRE_MAP = [
  { match: ['techno'], value: 'techno' },
  { match: ['house', 'deep house', 'tech house'], value: 'house' },
  { match: ['trance'], value: 'trance' },
  { match: ['drum', 'dnb', 'd&b', 'jungle'], value: 'drum_bass' },
  { match: ['dubstep'], value: 'dubstep' },
  { match: ['ambient', 'chill'], value: 'ambient' },
  { match: ['hip hop', 'hip-hop', 'rap'], value: 'hip_hop' },
  { match: ['trap'], value: 'trap' },
  { match: ['reggae'], value: 'reggae' },
  { match: ['samba'], value: 'samba' },
  { match: ['funk'], value: 'funk' },
  { match: ['kizomba'], value: 'kizomba' },
  { match: ['kuduro'], value: 'kuduro' },
  { match: ['pagode'], value: 'pagode' },
  { match: ['minimal'], value: 'minimal' },
  { match: ['acid'], value: 'acid' },
  { match: ['hardcore'], value: 'hardcore' },
  { match: ['experimental'], value: 'experimental' },
];

const TYPE_MAP = [
  { match: ['festival'], value: 'festival' },
  { match: ['rave'], value: 'rave' },
  { match: ['club', 'clubbing', 'party', 'festa'], value: 'club' },
  { match: ['concert', 'show'], value: 'concert' },
  { match: ['warehouse'], value: 'warehouse' },
  { match: ['rooftop'], value: 'rooftop' },
  { match: ['underground'], value: 'underground' },
  { match: ['secret'], value: 'secret' },
  { match: ['workshop'], value: 'workshop' },
  { match: ['conference', 'conferência'], value: 'conference' },
  { match: ['exhibition', 'exposição'], value: 'exhibition' },
  { match: ['sport', 'esporte'], value: 'sport_event' },
  { match: ['cultural'], value: 'cultural_event' },
  { match: ['networking'], value: 'networking' },
];

function mapEnum(text, map, fallback) {
  if (!text) return fallback;
  const lower = String(text).toLowerCase();
  for (const entry of map) {
    if (entry.match.some(m => lower.includes(m))) return entry.value;
  }
  return fallback;
}

const CITIES = [
  'São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza',
  'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Recife', 'Florianópolis',
  'Berlim', 'Londres', 'Amsterdã', 'Barcelona', 'Lisboa', 'Paris', 'Nova York',
];

const CATEGORIES = [
  'techno', 'house', 'trance', 'drum and bass', 'hip hop',
  'samba', 'funk', 'reggae', 'festival', 'show',
];

export { CITIES, CATEGORIES };

const EVENT_SCHEMA = {
  type: 'object',
  properties: {
    events: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          subtitle: { type: 'string' },
          description: { type: 'string' },
          date: { type: 'string' },
          end_date: { type: 'string' },
          venue_name: { type: 'string' },
          address: { type: 'string' },
          neighborhood: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          postal_code: { type: 'string' },
          country: { type: 'string' },
          lat: { type: 'number' },
          lng: { type: 'number' },
          organizer_name: { type: 'string' },
          organizer_website: { type: 'string' },
          organizer_instagram: { type: 'string' },
          organizer_facebook: { type: 'string' },
          min_price: { type: 'number' },
          max_price: { type: 'number' },
          currency: { type: 'string' },
          ticket_url: { type: 'string' },
          image_url: { type: 'string' },
          source_url: { type: 'string' },
          age_restriction: { type: 'string' },
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

export async function discoverEventsViaWeb({ city, category }) {
  const prompt = `Find real upcoming ${category} events in ${city} happening in the next 60 days (July-August 2026).

For each event provide ALL available info: title, description, start date (ISO 8601), end date, venue name, full address, city, state, country, latitude, longitude, organizer name, organizer website, organizer Instagram, ticket price range, currency, ticket purchase URL, event image URL, source URL, age restriction, category, tags.

Only include REAL events you are confident exist. Return up to 20 events.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: EVENT_SCHEMA,
  });

  return result?.events || [];
}

export async function geocodeAddress(address, city, state, country) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Geocode this location: ${address}, ${city}, ${state}, ${country}. Return precise latitude and longitude coordinates.`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        lat: { type: 'number' },
        lng: { type: 'number' },
        formatted_address: { type: 'string' },
      },
    },
  });
  return result;
}

export async function fetchOpenGraphImage(url) {
  if (!url) return null;
  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Find the main event banner/cover image URL for the event at this page: ${url}. Return only the image URL.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: { image_url: { type: 'string' } },
      },
    });
    return result?.image_url || null;
  } catch {
    return null;
  }
}

const DEFAULT_IMAGE = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a70ee66a1156f1068d2903/de9996d20_500x500.png';

export async function findOrCreateOrganizer(name, source, sourceId, extraData) {
  if (!name) return null;
  const existing = await base44.entities.ExternalOrganizer.filter({ name }, '-created_date', 5);
  if (existing.length > 0) {
    return existing[0];
  }
  return await base44.entities.ExternalOrganizer.create({
    name,
    source,
    source_id: sourceId || '',
    logo_url: extraData?.logo_url,
    website: extraData?.website,
    instagram: extraData?.instagram,
    facebook: extraData?.facebook,
    city: extraData?.city,
    country: extraData?.country || 'BR',
    events_count: 0,
    last_synced_at: new Date().toISOString(),
  });
}

export async function runSync({ city, category, onProgress }) {
  const startTime = new Date();
  let imported = 0, updated = 0, ignored = 0, duplicates = 0;
  const errors = [];

  try {
    if (onProgress) onProgress(`Buscando eventos de ${category} em ${city}...`);

    const rawEvents = await discoverEventsViaWeb({ city, category });

    if (onProgress) onProgress(`${rawEvents.length} eventos encontrados. Buscando base atual...`);

    const existing = await base44.entities.Event.list('-created_date', 500);

    if (onProgress) onProgress(`Processando ${rawEvents.length} eventos...`);

    for (let i = 0; i < rawEvents.length; i++) {
      const raw = rawEvents[i];
      try {
        if (onProgress && i % 3 === 0) {
          onProgress(`Processando ${i + 1}/${rawEvents.length}...`);
        }

        const genre = mapEnum(raw.category, GENRE_MAP, 'techno');
        const type = mapEnum(raw.category, TYPE_MAP, 'other');

        const normalized = normalizeEvent({
          title: raw.title,
          subtitle: raw.subtitle,
          description: raw.description,
          date: raw.date,
          end_date: raw.end_date,
          genre,
          category: 'musica',
          tags: raw.tags,
          type,
          location: {
            address: raw.address,
            venue_name: raw.venue_name,
            city: raw.city || city,
            state: raw.state,
            postal_code: raw.postal_code,
            country: raw.country || 'BR',
            lat: raw.lat,
            lng: raw.lng,
          },
          organizer: raw.organizer_name,
          organizer_website: raw.organizer_website,
          organizer_instagram: raw.organizer_instagram,
          organizer_facebook: raw.organizer_facebook,
          min_price: raw.min_price,
          max_price: raw.max_price,
          currency: raw.currency,
          ticket_url: raw.ticket_url,
          image_url: raw.image_url,
          age_restriction: raw.age_restriction || '18+',
          source: 'serpapi',
          source_id: raw.source_url || raw.title,
          source_url: raw.source_url,
        });

        // ETAPA 8 — Validação
        const validation = validateEvent(normalized);
        if (!validation.valid) {
          ignored++;
          errors.push(`${normalized.title || 'unknown'}: ${validation.errors.join(', ')}`);
          continue;
        }

        // ETAPA 7 — Geocodificação (se coordenadas ausentes)
        if (!normalized.location.lat || !normalized.location.lng) {
          try {
            const geo = await geocodeAddress(
              normalized.location.address || normalized.location.venue_name,
              normalized.location.city,
              normalized.location.state,
              normalized.location.country
            );
            if (geo && typeof geo.lat === 'number' && typeof geo.lng === 'number') {
              normalized.location.lat = geo.lat;
              normalized.location.lng = geo.lng;
            }
          } catch (e) {
            // Skip geocoding failure
          }
        }

        // Skip if still no coordinates after geocoding
        if (!normalized.location.lat || !normalized.location.lng) {
          ignored++;
          errors.push(`${normalized.title}: sem coordenadas`);
          continue;
        }

        // ETAPA 5 — Deduplicação
        const dupeResult = existing.some(e => eventsAreDuplicates(e, normalized).duplicate);
        if (dupeResult) {
          duplicates++;
          continue;
        }

        // ETAPA 6 — Organizador
        if (normalized.organizer) {
          try {
            const org = await findOrCreateOrganizer(
              normalized.organizer,
              'serpapi',
              normalized.source_id,
              {
                website: normalized.organizer_website,
                instagram: normalized.organizer_instagram,
                facebook: normalized.organizer_facebook,
                city: normalized.location.city,
              }
            );
            if (org) normalized.organizer_id = org.id;
          } catch (e) {
            // Continue without organizer link
          }
        }

        if (!normalized.organizer_id) {
          ignored++;
          errors.push(`${normalized.title}: sem organizador`);
          continue;
        }

        // ETAPA 2 — Imagens (fallback)
        if (!normalized.image_url) {
          normalized.image_url = DEFAULT_IMAGE;
          normalized.thumbnail_url = DEFAULT_IMAGE;
        }

        normalized.sync_hash = generateSyncHash(normalized);

        // ETAPA 12 — Criar evento
        await base44.entities.Event.create({
          ...normalized,
          is_published: false,
          trust_level: 'pending',
          last_synced_at: new Date().toISOString(),
        });
        imported++;

      } catch (e) {
        errors.push(e.message);
        ignored++;
      }
    }

    // ETAPA 11 — Log
    await base44.entities.SyncLog.create({
      sync_type: 'incremental',
      source: 'web_search',
      status: imported > 0 ? 'completed' : (errors.length > 0 ? 'partial' : 'completed'),
      started_at: startTime.toISOString(),
      completed_at: new Date().toISOString(),
      events_imported: imported,
      events_updated: updated,
      events_ignored: ignored,
      duplicates_found: duplicates,
      errors: errors.slice(0, 20),
      duration_seconds: Math.round((Date.now() - startTime.getTime()) / 1000),
      api_calls_made: 1 + Math.ceil(ignored / 3),
      summary: `Sync web (${city}/${category}): ${imported} importados, ${duplicates} duplicados, ${ignored} ignorados.`,
    });

    return { imported, updated, ignored, duplicates, errors, total: rawEvents.length };
  } catch (e) {
    try {
      await base44.entities.SyncLog.create({
        sync_type: 'incremental',
        source: 'web_search',
        status: 'failed',
        started_at: startTime.toISOString(),
        completed_at: new Date().toISOString(),
        errors: [e.message],
        duration_seconds: Math.round((Date.now() - startTime.getTime()) / 1000),
        summary: `Erro na sincronização: ${e.message}`,
      });
    } catch {}
    throw e;
  }
}