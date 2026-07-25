/**
 * ETAPA 5 — DEDUPLICAÇÃO INTELIGENTE
 * Algoritmo de comparação fuzzy para detectar eventos duplicados.
 */

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array(n + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[n];
}

export function textSimilarity(a, b) {
  if (!a || !b) return 0;
  const s1 = a.toLowerCase().trim().replace(/\s+/g, ' ');
  const s2 = b.toLowerCase().trim().replace(/\s+/g, ' ');
  if (s1 === s2) return 1;
  const maxLen = Math.max(s1.length, s2.length);
  if (!maxLen) return 0;
  const dist = levenshtein(s1, s2);
  return 1 - dist / maxLen;
}

export function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function eventsAreDuplicates(e1, e2) {
  if (!e1 || !e2) return false;

  // Same source_id = same event
  if (e1.source_id && e2.source_id && e1.source === e2.source && e1.source_id === e2.source_id) {
    return { duplicate: true, confidence: 1, reason: 'same_source_id' };
  }

  let score = 0;
  const reasons = [];

  // Title similarity (fuzzy)
  const titleSim = textSimilarity(e1.title, e2.title);
  if (titleSim >= 0.85) { score += 40; reasons.push(`title_sim:${titleSim.toFixed(2)}`); }
  else if (titleSim >= 0.7) { score += 25; reasons.push(`title_sim:${titleSim.toFixed(2)}`); }
  else return { duplicate: false, confidence: 0 };

  // Same date (day-level)
  if (e1.date && e2.date) {
    const d1 = new Date(e1.date).toDateString();
    const d2 = new Date(e2.date).toDateString();
    if (d1 === d2) { score += 30; reasons.push('same_date'); }
    else return { duplicate: false, confidence: 0 };
  } else {
    return { duplicate: false, confidence: 0 };
  }

  // Same city
  if (e1.location?.city && e2.location?.city) {
    if (e1.location.city.toLowerCase() === e2.location.city.toLowerCase()) {
      score += 15;
      reasons.push('same_city');
    }
  }

  // Geographic proximity
  if (e1.location?.lat && e2.location?.lat) {
    const dist = haversineDistanceKm(
      e1.location.lat, e1.location.lng,
      e2.location.lat, e2.location.lng
    );
    if (dist < 0.5) { score += 15; reasons.push(`geo:${dist.toFixed(0)}m`); }
    else if (dist < 5) { score += 8; reasons.push(`geo:${dist.toFixed(1)}km`); }
  }

  // Same organizer
  if (e1.organizer_id && e2.organizer_id && e1.organizer_id === e2.organizer_id) {
    score += 10;
    reasons.push('same_organizer');
  }

  // Same URL
  if (e1.source_url && e2.source_url && e1.source_url === e2.source_url) {
    score += 20;
    reasons.push('same_url');
  }

  return { duplicate: score >= 55, confidence: Math.min(score / 100, 1), reasons };
}

const TRUST_ORDER = { verified: 5, confirmed: 4, partner: 3, pending: 2, rejected: 1 };

export function pickCanonicalEvent(events) {
  if (!events?.length) return null;
  return events.reduce((best, e) => {
    const te = TRUST_ORDER[e.trust_level] || 0;
    const tb = TRUST_ORDER[best.trust_level] || 0;
    if (te > tb) return e;
    if (te < tb) return best;
    // Tie-break: longer description = more complete
    return (e.description?.length || 0) > (best.description?.length || 0) ? e : best;
  });
}

export function consolidateEvents(events) {
  if (!events?.length) return null;
  const canonical = pickCanonicalEvent(events);

  // Merge: keep canonical image (by trust level), longest description, official link.
  // NEVER pick an image from a different duplicate event based on arbitrary criteria
  // (URL length, array position, etc.) — that would cross-contaminate images.
  const longestDesc = events
    .filter(e => e.description)
    .sort((a, b) => (b.description?.length || 0) - (a.description?.length || 0))[0];
  const officialUrl = events.find(e => e.source_url && e.source !== 'organizer');

  return {
    ...canonical,
    image_url: canonical.image_url,
    thumbnail_url: canonical.thumbnail_url,
    description: longestDesc?.description || canonical.description,
    source_url: officialUrl?.source_url || canonical.source_url,
    gallery_urls: [...new Set(events.flatMap(e => e.gallery_urls || []))],
    tags: [...new Set(events.flatMap(e => e.tags || []))],
  };
}

export function findDuplicates(events) {
  const groups = [];
  const assigned = new Set();

  for (let i = 0; i < events.length; i++) {
    if (assigned.has(events[i].id)) continue;
    const group = [events[i]];

    for (let j = i + 1; j < events.length; j++) {
      if (assigned.has(events[j].id)) continue;
      const result = eventsAreDuplicates(events[i], events[j]);
      if (result.duplicate) {
        group.push(events[j]);
        assigned.add(events[j].id);
      }
    }

    if (group.length > 1) {
      groups.push(group);
      assigned.add(events[i].id);
    }
  }

  return groups;
}

export function generateSyncHash(event) {
  const title = (event.title || '').toLowerCase().trim().replace(/\s+/g, ' ');
  const date = event.date ? new Date(event.date).toDateString() : '';
  const city = (event.location?.city || '').toLowerCase().trim();
  return `${title}|${date}|${city}`.substring(0, 200);
}