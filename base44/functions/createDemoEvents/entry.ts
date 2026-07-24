import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { hasOrganizerAccess } from '../../shared/subscriptionAuth.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar se usuário está autenticado
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apenas organizador com assinatura ativa ou admin podem criar eventos demo
    const isAdmin = user.role === 'admin';
    if (!isAdmin) {
      const hasAccess = await hasOrganizerAccess(base44, user.id);
      if (!hasAccess) {
        return Response.json({ error: 'Acesso negado — assinatura de organizador inativa' }, { status: 403 });
      }
    }

    // Eventos reais em São Paulo - locais icônicos da cena underground
    const demoEvents = [
      {
        title: "Techno Warehouse: Industrial Rave",
        description: "Uma noite imersiva de techno industrial no coração da cidade. Line-up: Charlotte de Witte, Amelie Lens, ANNA.",
        genre: "techno",
        type: "warehouse",
        location: {
          lat: -23.5489,
          lng: -46.6388,
          venue_name: "Warehouse SP",
          address: "Rua Augusta, 1000 - Consolação",
          city: "São Paulo",
          state: "SP"
        },
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        duration_hours: 8,
        price: 80,
        organizer: "Techno Brasil",
        organizer_id: user.id,
        max_capacity: 500,
        current_attendees: 287,
        image_url: "https://images.unsplash.com/photo-1571266028243-d220c9f2fbc3?w=800",
        requires_approval: true,
        minimum_level: 3,
        age_restriction: "18+"
      },
      {
        title: "Rooftop Sessions: Deep House Sunset",
        description: "House music com vista panorâmica. DJs: Dixon, Âme, Tale Of Us. Open bar premium.",
        genre: "house",
        type: "rooftop",
        location: {
          lat: -23.5615,
          lng: -46.6560,
          venue_name: "Skye Bar",
          address: "Av. Paulista, 2073 - Bela Vista",
          city: "São Paulo",
          state: "SP"
        },
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        duration_hours: 6,
        price: 120,
        organizer: "Rooftop Events",
        organizer_id: user.id,
        max_capacity: 300,
        current_attendees: 156,
        image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800",
        requires_approval: false,
        age_restriction: "21+"
      },
      {
        title: "Underground Rave: Secret Location",
        description: "Localização revelada 2h antes. Drum & Bass, Jungle, Breakbeat. Sistema de som Funktion-One.",
        genre: "drum_bass",
        type: "underground",
        location: {
          lat: -23.5330,
          lng: -46.6290,
          venue_name: "Local Secreto",
          address: "Vila Madalena",
          city: "São Paulo",
          state: "SP",
          is_secret: true
        },
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration_hours: 12,
        price: 60,
        organizer: "Secret Raves SP",
        organizer_id: user.id,
        max_capacity: 800,
        current_attendees: 423,
        image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
        requires_approval: true,
        minimum_level: 5,
        is_secret: true,
        age_restriction: "18+"
      },
      {
        title: "Baile Funk: Favela Vibe",
        description: "O melhor do funk carioca em SP. MCs: MC Hariel, MC Ryan SP, MC IG. Proibidão até amanhecer.",
        genre: "funk",
        type: "club",
        location: {
          lat: -23.5255,
          lng: -46.6730,
          venue_name: "Clube da Quebrada",
          address: "Rua Dr. Neto de Araújo, 45 - Vila Mariana",
          city: "São Paulo",
          state: "SP"
        },
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        duration_hours: 6,
        price: 30,
        organizer: "Baile da Quebrada",
        organizer_id: user.id,
        max_capacity: 600,
        current_attendees: 512,
        image_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800",
        requires_approval: false,
        age_restriction: "16+"
      },
      {
        title: "Psytrance Festival: Full Moon",
        description: "Festival de psytrance com 3 stages. Infected Mushroom, Vini Vici, Astrix. Decoração psicodélica completa.",
        genre: "trance",
        type: "festival",
        location: {
          lat: -23.6050,
          lng: -46.6950,
          venue_name: "Green Valley Open Air",
          address: "Av. das Nações Unidas, 4777 - Alto da Boa Vista",
          city: "São Paulo",
          state: "SP"
        },
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        duration_hours: 16,
        price: 150,
        organizer: "Psytrance Brasil",
        organizer_id: user.id,
        max_capacity: 2000,
        current_attendees: 847,
        image_url: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800",
        requires_approval: false,
        age_restriction: "18+"
      },
      {
        title: "Trap & Hip Hop: Urban Vibes",
        description: "A melhor cena trap de SP. Artistas: Matuê, Teto, Wiu, Brandão85. Street style obrigatório.",
        genre: "trap",
        type: "club",
        location: {
          lat: -23.5440,
          lng: -46.6420,
          venue_name: "Urban Club",
          address: "Rua Augusta, 2690 - Cerqueira César",
          city: "São Paulo",
          state: "SP"
        },
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        duration_hours: 5,
        price: 50,
        organizer: "Urban Music SP",
        organizer_id: user.id,
        max_capacity: 400,
        current_attendees: 321,
        image_url: "https://images.unsplash.com/photo-1571266028243-d220c9f2fbc3?w=800",
        requires_approval: false,
        age_restriction: "18+"
      },
      {
        title: "Minimal Techno: After Hours",
        description: "After exclusivo de minimal techno. Richie Hawtin, Ricardo Villalobos. Som Void Acoustics.",
        genre: "minimal",
        type: "underground",
        location: {
          lat: -23.5580,
          lng: -46.6600,
          venue_name: "The Loft SP",
          address: "Al. Franca, 1029 - Jardins",
          city: "São Paulo",
          state: "SP"
        },
        date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
        duration_hours: 10,
        price: 100,
        organizer: "Minimal Vibes",
        organizer_id: user.id,
        max_capacity: 200,
        current_attendees: 178,
        image_url: "https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?w=800",
        requires_approval: true,
        minimum_level: 4,
        age_restriction: "21+"
      },
      {
        title: "Reggae Night: Good Vibes Only",
        description: "Reggae roots e dub com as melhores sound systems. Natiruts ao vivo + DJs convidados.",
        genre: "reggae",
        type: "club",
        location: {
          lat: -23.5510,
          lng: -46.6340,
          venue_name: "Bourbon Street",
          address: "Rua dos Chanés, 127 - Moema",
          city: "São Paulo",
          state: "SP"
        },
        date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        duration_hours: 6,
        price: 40,
        organizer: "Reggae SP",
        organizer_id: user.id,
        max_capacity: 350,
        current_attendees: 201,
        image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
        requires_approval: false,
        age_restriction: "18+"
      }
    ];

    // Criar eventos
    const createdEvents = [];
    for (const eventData of demoEvents) {
      try {
        // Verificar se já existe
        const existing = await base44.asServiceRole.entities.Event.filter({
          title: eventData.title,
          organizer_id: eventData.organizer_id
        });

        if (existing.length === 0) {
          const event = await base44.asServiceRole.entities.Event.create(eventData);
          createdEvents.push(event);
        }
      } catch (error) {
        console.error(`Erro ao criar evento ${eventData.title}:`, error);
      }
    }

    return Response.json({
      success: true,
      created: createdEvents.length,
      message: `${createdEvents.length} eventos demo criados com sucesso!`
    });

  } catch (error) {
    console.error('Erro ao criar eventos demo:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});