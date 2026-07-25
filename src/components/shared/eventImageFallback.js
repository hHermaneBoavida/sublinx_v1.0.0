// SVG inline fallback for event images — no external requests, no random generators.
// Used whenever an event has no image_url or the URL fails to load.
export const FALLBACK_EVENT_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-family='sans-serif' font-size='28' font-weight='bold'%3ESUBLINX EVENTOS%3C/text%3E%3C/svg%3E";

// Fallback ticket URL — Sympla São Paulo search (verified bilheteria platform).
export const FALLBACK_TICKET_URL = "https://www.sympla.com.br/eventos/sao-paulo-sp";