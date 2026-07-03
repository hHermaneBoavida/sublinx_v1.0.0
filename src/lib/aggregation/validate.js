/**
 * ETAPA 8 — QUALIDADE DOS DADOS
 * Validação obrigatória antes de salvar qualquer evento.
 */

export function validateEvent(event) {
  const errors = [];

  if (!event.title || !event.title.trim()) {
    errors.push('Evento sem título');
  }

  if (!event.date) {
    errors.push('Evento sem data');
  } else {
    const d = new Date(event.date);
    if (isNaN(d.getTime())) {
      errors.push('Data inválida');
    }
  }

  if (!event.location) {
    errors.push('Evento sem localização');
  } else {
    if (typeof event.location.lat !== 'number' || typeof event.location.lng !== 'number') {
      errors.push('Coordenadas ausentes ou inválidas');
    }
    if (!event.location.address && !event.location.venue_name && !event.location.city) {
      errors.push('Endereço ausente');
    }
  }

  if (!event.organizer_id) {
    errors.push('Evento sem organizador');
  }

  if (!event.organizer || !String(event.organizer).trim()) {
    errors.push('Nome do organizador ausente');
  }

  if (!event.genre) {
    errors.push('Evento sem categoria (genre)');
  }

  if (!event.type) {
    errors.push('Evento sem tipo');
  }

  if (!event.source) {
    errors.push('Evento sem fonte de origem');
  }

  if (!event.source_url && !event.source_id) {
    errors.push('Evento sem identificação única (URL ou source_id)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateAndMark(event) {
  const { valid, errors } = validateEvent(event);
  return {
    ...event,
    validation_errors: valid ? [] : errors,
    last_validated_at: new Date().toISOString(),
  };
}