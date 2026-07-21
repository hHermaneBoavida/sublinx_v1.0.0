import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Palavras/padrões problemáticos (lista base - expandir conforme necessário)
const PROFANITY_PATTERNS = [
  /\b(fuck|shit|ass|bitch|damn|crap)\b/gi,
  /\b(porra|caralho|merda|puta|fdp|cu|bosta)\b/gi
];

const SPAM_PATTERNS = [
  /\b(viagra|cialis|casino|lottery|winner|prize)\b/gi,
  /\b(bit\.ly|tinyurl|goo\.gl)\b/gi, // Links encurtados suspeitos
  /(.)\1{10,}/g, // Repetição excessiva de caracteres
  /\b(buy now|click here|limited offer)\b/gi
];

const HATE_SPEECH_PATTERNS = [
  /\b(nazi|hitler|kill all|die)\b/gi,
  /\b(hate|destroy|exterminate)\s+(women|men|gays|blacks|whites|jews|muslims)\b/gi
];

const SCAM_INDICATORS = [
  /\b(free money|get rich quick|guaranteed income)\b/gi,
  /\b(send money|wire transfer|bitcoin wallet)\b/gi,
  /\b(nigerian prince|inheritance|lottery winner)\b/gi
];

// Analisa conteúdo e retorna score de severidade
function analyzeContent(text) {
  if (!text || typeof text !== 'string') {
    return { safe: true, score: 0, flags: [] };
  }

  const flags = [];
  let score = 0;

  // Profanidade
  for (const pattern of PROFANITY_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      score += matches.length * 5;
      flags.push({ type: 'profanity', count: matches.length, severity: 'low' });
    }
  }

  // Spam
  for (const pattern of SPAM_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      score += matches.length * 15;
      flags.push({ type: 'spam', count: matches.length, severity: 'medium' });
    }
  }

  // Discurso de ódio
  for (const pattern of HATE_SPEECH_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      score += matches.length * 50;
      flags.push({ type: 'hate_speech', count: matches.length, severity: 'critical' });
    }
  }

  // Indicadores de scam
  for (const pattern of SCAM_INDICATORS) {
    const matches = text.match(pattern);
    if (matches) {
      score += matches.length * 30;
      flags.push({ type: 'scam', count: matches.length, severity: 'high' });
    }
  }

  // Excesso de CAPS (spam-like)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.7 && text.length > 20) {
    score += 10;
    flags.push({ type: 'excessive_caps', severity: 'low' });
  }

  // Múltiplos links
  const urlCount = (text.match(/https?:\/\//g) || []).length;
  if (urlCount > 3) {
    score += urlCount * 5;
    flags.push({ type: 'multiple_links', count: urlCount, severity: 'medium' });
  }

  return {
    safe: score < 20,
    score,
    flags,
    action: score >= 50 ? 'block' : score >= 30 ? 'review' : score >= 20 ? 'warn' : 'allow'
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, communityId, contentType, contentId } = await req.json();

    if (!content || !communityId) {
      return Response.json({ 
        error: 'Missing required fields: content, communityId' 
      }, { status: 400 });
    }

    // Analisar conteúdo
    const analysis = analyzeContent(content);

    // Se crítico, criar report automático — mas apenas se o usuário pertencer à comunidade
    if (analysis.action === 'block') {
      try {
        const membership = await base44.asServiceRole.entities.CommunityMember.filter({
          community_id: communityId,
          user_id: user.id,
          is_active: true,
        });
        const isMember = Array.isArray(membership) && membership.length > 0;
        if (!isMember && user.role !== 'admin') {
          return Response.json({
            allowed: analysis.action !== 'block',
            action: analysis.action,
            score: analysis.score,
            flags: analysis.flags,
            filtered_content: content
          });
        }
        await base44.asServiceRole.entities.CommunityReport.create({
          community_id: communityId,
          reported_by: 'system',
          reported_user_id: user.id,
          content_type: contentType || 'message',
          content_id: contentId || `auto-${Date.now()}`,
          reason: analysis.flags[0]?.type === 'hate_speech' ? 'hate_speech' : 'spam',
          description: `Auto-detectado: ${JSON.stringify(analysis.flags)}`,
          status: 'pending',
          severity: 'critical'
        });
      } catch (e) {
        console.error('Erro ao criar report automático:', e);
      }
    }

    return Response.json({
      allowed: analysis.action !== 'block',
      action: analysis.action,
      score: analysis.score,
      flags: analysis.flags,
      filtered_content: analysis.action === 'warn' ? content.replace(/[^\w\s]/g, '*') : content
    });

  } catch (error) {
    console.error('Erro na moderação de conteúdo:', error);
    return Response.json({ 
      error: error.message,
      allowed: true // Em caso de erro, permitir (fail-safe)
    }, { status: 500 });
  }
});