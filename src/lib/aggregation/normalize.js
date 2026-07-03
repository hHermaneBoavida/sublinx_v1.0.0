/**
 * ETAPA 4 — NORMALIZAÇÃO
 * Funções de normalização para eventos agregados de múltiplas APIs.
 */

export function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .replace(/[^\x20-\x7E\u00C0-\u024F\u1E00-\u1EFF\u2026\-\u2018\u2019\u201C\u201D]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripBrokenHTML(html) {
  if (!html) return '';
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function toISODate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function normalizeCurrency(currency) {
  if (!currency) return 'BRL';
  const map = {
    'R$': 'BRL', 'BRL': 'BRL', 'REAL': 'BRL', 'REAIS': 'BRL',
    '$': 'USD', 'USD': 'USD', 'DOLLAR': 'USD',
    '€': 'EUR', 'EUR': 'EUR',
  };
  return map[String(currency).toUpperCase()] || String(currency).toUpperCase().substring(0, 3);
}

export function normalizeCountry(country) {
  if (!country) return 'BR';
  const map = {
    'BRASIL': 'BR', 'BRAZIL': 'BR', 'BR': 'BR',
    'USA': 'US', 'ESTADOS UNIDOS': 'US', 'UNITED STATES': 'US', 'US': 'US',
    'PORTUGAL': 'PT', 'PT': 'PT',
    'ESPANHA': 'ES', 'SPAIN': 'ES', 'ES': 'ES',
  };
  return map[String(country).toUpperCase().trim()] || String(country).toUpperCase().substring(0, 2);
}

export function normalizeURL(url) {
  if (!url) return null;
  let u = String(url).trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try {
    return new URL(u).href;
  } catch {
    return null;
  }
}

export function normalizeCoordinates(lat, lng) {
  const la = parseFloat(lat);
  const ln = parseFloat(lng);
  if (isNaN(la) || isNaN(ln)) return null;
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return null;
  return { lat: Math.round(la * 1e6) / 1e6, lng: Math.round(ln * 1e6) / 1e6 };
}

export function slugify(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 120)
    .replace(/^-|-$/g, '');
}

export function normalizeEvent(rawEvent) {
  const title = normalizeText(rawEvent.title);
  const description = stripBrokenHTML(rawEvent.description || rawEvent.short_description);

  return {
    title,
    subtitle: normalizeText(rawEvent.subtitle),
    description,
    short_description: normalizeText(rawEvent.short_description || description?.substring(0, 200)),
    genre: rawEvent.genre || 'other',
    category: rawEvent.category || 'musica',
    subcategory: rawEvent.subcategory,
    tags: Array.isArray(rawEvent.tags) ? rawEvent.tags.map(normalizeText).filter(Boolean) : [],
    type: rawEvent.type || 'other',
    location: {
      lat: rawEvent.location?.lat,
      lng: rawEvent.location?.lng,
      address: normalizeText(rawEvent.location?.address),
      venue_name: normalizeText(rawEvent.location?.venue_name),
      city: normalizeText(rawEvent.location?.city),
      state: normalizeText(rawEvent.location?.state),
      postal_code: normalizeText(rawEvent.location?.postal_code),
      country: normalizeCountry(rawEvent.location?.country),
      is_secret: rawEvent.location?.is_secret || false,
    },
    date: toISODate(rawEvent.date),
    end_date: toISODate(rawEvent.end_date),
    timezone: rawEvent.timezone || 'America/Sao_Paulo',
    is_recurring: rawEvent.is_recurring || false,
    recurrence_pattern: rawEvent.recurrence_pattern,
    duration_hours: rawEvent.duration_hours,
    price: rawEvent.price,
    is_free: rawEvent.is_free || (rawEvent.min_price === 0 && rawEvent.max_price === 0),
    min_price: rawEvent.min_price,
    max_price: rawEvent.max_price,
    currency: normalizeCurrency(rawEvent.currency),
    ticket_url: normalizeURL(rawEvent.ticket_url),
    organizer: normalizeText(rawEvent.organizer),
    organizer_id: rawEvent.organizer_id,
    organizer_logo: rawEvent.organizer_logo,
    organizer_website: normalizeURL(rawEvent.organizer_website),
    organizer_instagram: normalizeText(rawEvent.organizer_instagram),
    organizer_facebook: normalizeText(rawEvent.organizer_facebook),
    organizer_tiktok: normalizeText(rawEvent.organizer_tiktok),
    organizer_linkedin: normalizeText(rawEvent.organizer_linkedin),
    organizer_email: rawEvent.organizer_email,
    organizer_phone: rawEvent.organizer_phone,
    max_capacity: rawEvent.max_capacity,
    current_attendees: rawEvent.current_attendees || 0,
    image_url: normalizeURL(rawEvent.image_url),
    thumbnail_url: normalizeURL(rawEvent.thumbnail_url || rawEvent.image_url),
    gallery_urls: Array.isArray(rawEvent.gallery_urls)
      ? rawEvent.gallery_urls.map(normalizeURL).filter(Boolean)
      : [],
    video_urls: Array.isArray(rawEvent.video_urls)
      ? rawEvent.video_urls.map(normalizeURL).filter(Boolean)
      : [],
    logo_url: normalizeURL(rawEvent.logo_url),
    age_restriction: rawEvent.age_restriction || '18+',
    event_status: rawEvent.event_status || 'published',
    source: rawEvent.source,
    source_url: normalizeURL(rawEvent.source_url),
    source_id: String(rawEvent.source_id || ''),
    slug: rawEvent.slug || slugify(title),
  };
}