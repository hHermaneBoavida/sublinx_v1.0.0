import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar eventos recentes
    const recentEvents = await base44.asServiceRole.entities.Event.list('-created_date', 100);
    const recentInteractions = await base44.asServiceRole.entities.Like.list('-created_date', 200);
    
    // Agrupar por gênero
    const genreCounts = {};
    const typeCounts = {};
    const locationCounts = {};
    
    recentEvents.forEach(event => {
      genreCounts[event.genre] = (genreCounts[event.genre] || 0) + 1;
      typeCounts[event.type] = (typeCounts[event.type] || 0) + 1;
      if (event.location?.city) {
        locationCounts[event.location.city] = (locationCounts[event.location.city] || 0) + 1;
      }
    });

    // Calcular engajamento médio
    const engagementByGenre = {};
    recentEvents.forEach(event => {
      const likes = recentInteractions.filter(l => l.event_id === event.id).length;
      if (!engagementByGenre[event.genre]) {
        engagementByGenre[event.genre] = { total: 0, count: 0 };
      }
      engagementByGenre[event.genre].total += likes;
      engagementByGenre[event.genre].count += 1;
    });

    const avgEngagement = {};
    Object.keys(engagementByGenre).forEach(genre => {
      avgEngagement[genre] = engagementByGenre[genre].total / engagementByGenre[genre].count;
    });

    // Usar IA para analisar tendências
    const analysisPrompt = `Você é um analista de tendências de eventos underground e cultura eletrônica.

Analise os seguintes dados de eventos recentes (últimos 100 eventos):

GÊNEROS MAIS CRIADOS:
${Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([g, c]) => `- ${g}: ${c} eventos`).join('\n')}

TIPOS DE EVENTO:
${Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([t, c]) => `- ${t}: ${c} eventos`).join('\n')}

CIDADES MAIS ATIVAS:
${Object.entries(locationCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([l, c]) => `- ${l}: ${c} eventos`).join('\n')}

ENGAJAMENTO MÉDIO POR GÊNERO:
${Object.entries(avgEngagement).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([g, e]) => `- ${g}: ${e.toFixed(1)} curtidas/evento`).join('\n')}

Com base nisso:
1. Identifique 3 tendências principais da cena underground atual
2. Sugira 3 nichos emergentes que organizadores devem explorar
3. Recomende 3 combinações inovadoras de gênero + tipo de evento
4. Forneça 2 insights sobre o que o público está buscando

Seja específico, autêntico e focado na cultura eletrônica underground.`;

    const aiAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          main_trends: { 
            type: "array", 
            items: { 
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" }
              }
            }
          },
          emerging_niches: { 
            type: "array", 
            items: { 
              type: "object",
              properties: {
                niche: { type: "string" },
                potential: { type: "string" },
                target_audience: { type: "string" }
              }
            }
          },
          innovative_combinations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                genre: { type: "string" },
                event_type: { type: "string" },
                rationale: { type: "string" }
              }
            }
          },
          audience_insights: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    return Response.json({
      success: true,
      data_summary: {
        total_events: recentEvents.length,
        top_genres: Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
        top_cities: Object.entries(locationCounts).sort((a, b) => b[1] - a[1]).slice(0, 3),
        most_engaged_genre: Object.entries(avgEngagement).sort((a, b) => b[1] - a[1])[0]
      },
      ai_analysis: aiAnalysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error analyzing trends:', error);
    return Response.json({ 
      error: 'Failed to analyze trends',
      details: error.message 
    }, { status: 500 });
  }
});