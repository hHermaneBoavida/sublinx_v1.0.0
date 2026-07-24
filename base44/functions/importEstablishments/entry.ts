import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import * as XLSX from 'npm:xlsx@0.18.5';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const fileUrl = body.file_url || 'https://media.base44.com/files/public/68a70ee66a1156f1068d2903/223e888fd_Estabelecimentos_Sacoma_ABC_100.xlsx';

    // SEGURANÇA: valida a URL para evitar SSRF — apenas https/http em hosts permitidos,
    // bloqueando IPs privados/locais e serviços de metadados de nuvem.
    const ALLOWED_HOSTS = ['media.base44.com', 'qtrypzzcjebvfcihiynt.supabase.co'];
    function validateFileUrl(raw) {
      let parsed;
      try { parsed = new URL(raw); } catch { return null; }
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
      const host = parsed.hostname.toLowerCase();
      if (ALLOWED_HOSTS.length && !ALLOWED_HOSTS.includes(host)) return null;
      // Bloqueia literais de IP privados/locais e link-local
      const ipMatch = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
      if (ipMatch) {
        const [, a, b] = ipMatch.map(Number);
        if (a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 0 || a === 169) return null;
      }
      if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return null;
      return parsed.href;
    }
    const safeUrl = validateFileUrl(fileUrl);
    if (!safeUrl) {
      return Response.json({ error: 'URL de arquivo não permitida' }, { status: 400 });
    }

    const resp = await fetch(safeUrl);
    if (!resp.ok) return Response.json({ error: 'Falha ao baixar arquivo' }, { status: 502 });
    const buf = await resp.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });

    const sheetName = wb.SheetNames.includes('Estabelecimentos') ? 'Estabelecimentos' : wb.SheetNames[1] || wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const mapType = (cat) => {
      const c = (cat || '').toLowerCase();
      if (c.includes('padaria')) return 'padaria';
      if (c.includes('pizzaria') || c.includes('pizza')) return 'pizzaria';
      if (c.includes('restaurante') || c.includes('churrasca') || c.includes('comida') || c.includes('cozinha')) return 'restaurante';
      if (c.includes('caf') || c.includes('lanchonete') || c.includes('confeitaria')) return 'cafe';
      if (c.includes('pub')) return 'pub';
      if (c.includes('lounge')) return 'lounge_bar';
      if (c.includes('boate') || c.includes('discoteca') || c.includes('balada')) return 'discoteca';
      if (c.includes('club') || c.includes('casa noturna')) return 'club';
      if (c.includes('hotel')) return 'hotel';
      if (c.includes('cultural') || c.includes('centro cultural')) return 'cultural_center';
      if (c.includes('studio') || c.includes('estúdio')) return 'studio';
      if (c.includes('galeria') || c.includes('gallery')) return 'gallery';
      if (c.includes('rooftop') || c.includes('terraço')) return 'rooftop';
      if (c.includes('warehouse') || c.includes('galpão')) return 'warehouse';
      return 'bar';
    };

    const coordsFor = (region) => {
      const r = (region || '').toLowerCase();
      if (r.includes('helióp') || r.includes('heliop')) return { lat: -23.6050, lng: -46.5890 };
      if (r.includes('sacomã') || r.includes('sacoma') || r.includes('ipiranga')) return { lat: -23.5945, lng: -46.6045 };
      if (r.includes('santo andré')) return { lat: -23.6666, lng: -46.5322 };
      if (r.includes('são bernardo') || r.includes('sao bernardo')) return { lat: -23.6944, lng: -46.5653 };
      if (r.includes('são caetano') || r.includes('sao caetano')) return { lat: -23.6226, lng: -46.5489 };
      if (r.includes('abc')) return { lat: -23.6815, lng: -46.5470 };
      if (r.includes('mauá') || r.includes('maua')) return { lat: -23.6689, lng: -46.4622 };
      if (r.includes('diadema')) return { lat: -23.6864, lng: -46.6122 };
      if (r.includes('ribeirão') || r.includes('ribeirao')) return { lat: -23.7000, lng: -46.4100 };
      return { lat: -23.6600, lng: -46.5800 };
    };

    const ticketAvg = (t) => {
      const m = (t || '').toLowerCase();
      if (m.includes('alto') || m.includes('premium')) return 120;
      if (m.includes('médio') || m.includes('medio')) return 60;
      if (m.includes('baixo') || m.includes('econ')) return 25;
      const num = (t || '').replace(/[^\d,.-]/g, '').replace(',', '.');
      const n = parseFloat(num);
      return isNaN(n) ? 50 : n;
    };

    const cleanPhone = (p) => (p || '').toString().trim();

    const venues = rows
      .filter(r => r['Nome do Estabelecimento'])
      .map(r => {
        const region = (r['Região'] || '').toString().trim();
        const coords = coordsFor(region);
        return {
          name: r['Nome do Estabelecimento'].toString().trim(),
          type: mapType(r['Categoria']),
          description: `${r['Categoria'] || ''} • ${region}`.trim(),
          location: {
            lat: coords.lat,
            lng: coords.lng,
            address: `${r['Endereço'] || ''} - ${region}`.trim(),
            city: 'São Paulo',
            state: 'SP',
            neighborhood: region,
            postal_code: (r['CEP'] || '').toString().trim(),
          },
          contact: {
            phone: cleanPhone(r['Telefone']),
          },
          average_price: ticketAvg(r['Ticket Médio']),
          verified: (r['Status Comercial'] || '').toString().toLowerCase().includes('ativo'),
          rating: 0,
          total_reviews: 0,
          upcoming_events_count: 0,
        };
      });

    if (venues.length === 0) {
      return Response.json({ error: 'Nenhum estabelecimento encontrado na planilha', sheets: wb.SheetNames, rowCount: rows.length }, { status: 400 });
    }

    const result = await base44.asServiceRole.entities.Venue.bulkCreate(venues);

    return Response.json({
      status: 'success',
      created: venues.length,
      sheet: sheetName,
      sample: venues.slice(0, 3),
    });
  } catch (error) {
    console.error('Erro em importEstablishments:', error);
    return Response.json({ error: 'Erro interno ao importar estabelecimentos' }, { status: 500 });
  }
});