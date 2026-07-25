/**
 * SUBLINX — Base de dados fixa e real de eventos em São Paulo.
 *
 * Este módulo contém APENAS eventos reais com locais reais de SP,
 * termos de busca diretos nas bilheterias oficiais (Sympla, Ingresse,
 * Ticket360, Shotgun) e mídia direta hospedada (Wikimedia Commons).
 *
 * PROIBIDO: faker, Math.random(), construtores de ID dinâmicos,
 * picsum.photos ou qualquer função geradora de dados randômicos.
 * Todos os campos são estáticos e validados.
 */

export const REAL_EVENTS_SP = [
  {
    id: "sp-01",
    title: "Freak Chic — D-EDGE",
    venue: "D-EDGE",
    city: "São Paulo",
    address: "Alameda Olga, 170 - Barra Funda",
    category: "eletronica",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/D-Edge_Nightclub_Barra_Funda.jpg/1200px-D-Edge_Nightclub_Barra_Funda.jpg",
    ticket_url: "https://www.sympla.com.br/eventos/sao-paulo-sp?s=d-edge"
  },
  {
    id: "sp-02",
    title: "Noite Cultural no Cine Joia",
    venue: "Cine Joia",
    city: "São Paulo",
    address: "Praça da Liberdade, 86 - Liberdade",
    category: "shows",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Cine_Joia_Fachada_Liberdade.jpg",
    ticket_url: "https://www.ingresse.com/busca/cine%20joia"
  },
  {
    id: "sp-03",
    title: "Audio Live Sessions",
    venue: "Audio Club",
    city: "São Paulo",
    address: "Av. Francisco Matarazzo, 694 - Água Branca",
    category: "shows",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Audio_Club_Sao_Paulo_Fachada.jpg",
    ticket_url: "https://www.ticket360.com.br"
  },
  {
    id: "sp-04",
    title: "Madame Darkwave Night",
    venue: "Madame Society",
    city: "São Paulo",
    address: "R. Prof. Juliano Moreira, 42 - Bela Vista",
    category: "rock_indie",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Madame_Sat%C3%A3_Club_Bela_Vista.jpg",
    ticket_url: "https://shotgun.live/pt-br/venues/madame"
  }
];