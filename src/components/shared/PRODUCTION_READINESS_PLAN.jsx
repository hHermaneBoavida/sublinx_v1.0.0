# 🚀 SUBLINX - PLANO DE PREPARAÇÃO PARA PRODUÇÃO
## Production Readiness & Launch Plan

**Status:** PRÉ-LANÇAMENTO  
**Target:** Q1 2025  
**Plataforma:** PWA (Progressive Web App) + Web  
**Stack:** React 18 + Base44 Backend + Firebase + Leaflet Maps

---

## 📋 ÍNDICE

1. [Auditoria de Código](#1-auditoria-de-código)
2. [Testes de Performance](#2-testes-de-performance)
3. [Testes de Segurança](#3-testes-de-segurança)
4. [Testes Funcionais](#4-testes-funcionais)
5. [Otimizações Críticas](#5-otimizações-críticas)
6. [PWA & Offline](#6-pwa--offline)
7. [SEO & Meta Tags](#7-seo--meta-tags)
8. [Monitoring & Analytics](#8-monitoring--analytics)
9. [CI/CD & Deployment](#9-cicd--deployment)
10. [Checklist Final](#10-checklist-final)

---

## 1. AUDITORIA DE CÓDIGO

### 1.1 Análise Estática
```bash
# ESLint com regras de produção
npm run lint -- --max-warnings 0

# Type checking (se usar TypeScript)
npm run type-check

# Bundle analysis
npm run build
npm run analyze
```

### 1.2 Code Quality Metrics
- **Complexidade Ciclomática:** < 10 por função
- **Cobertura de Testes:** > 80%
- **Performance Budget:** < 200KB JS inicial
- **Lighthouse Score:** > 90 em todas as categorias

### 1.3 Issues Críticos Identificados

#### 🔴 CRÍTICO - Segurança
```javascript
// ❌ PROBLEMA: Tokens expostos no frontend
// Arquivo: components/*/
const API_KEY = "hardcoded-key" // NUNCA fazer isso

// ✅ SOLUÇÃO: Usar variáveis de ambiente
const API_KEY = import.meta.env.VITE_API_KEY
```

#### 🟡 ALTO - Performance
```javascript
// ❌ PROBLEMA: Re-renders desnecessários
<EventCard event={event} user={user} /> // Renderiza sempre

// ✅ SOLUÇÃO: Memoização
const MemoizedEventCard = React.memo(EventCard)
<MemoizedEventCard event={event} user={user} />
```

#### 🟢 MÉDIO - UX
- Melhorar estados de loading
- Adicionar skeleton screens
- Implementar error boundaries globais

---

## 2. TESTES DE PERFORMANCE

### 2.1 Frontend Performance

#### Load Testing
```javascript
// k6 load testing script
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 1000 },  // Stress
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% < 500ms
    http_req_failed: ['rate<0.01'],    // < 1% falhas
  },
};

export default function () {
  let res = http.get('https://sublinx.app/api/events');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

#### Bundle Size Optimization
```javascript
// webpack-bundle-analyzer
{
  "scripts": {
    "analyze": "vite-bundle-visualizer"
  }
}

// Target: < 200KB initial JS
// Current: ~350KB ⚠️ PRECISA OTIMIZAR
```

#### Core Web Vitals
- **LCP (Largest Contentful Paint):** < 2.5s ✅
- **FID (First Input Delay):** < 100ms ✅
- **CLS (Cumulative Layout Shift):** < 0.1 ⚠️ (Mapas causam shift)
- **TTFB (Time to First Byte):** < 600ms ✅

### 2.2 Mapa/Leaflet Performance

```javascript
// Cluster markers para + 100 eventos
import MarkerClusterGroup from 'react-leaflet-cluster';

// Lazy load tiles
<TileLayer 
  url="..." 
  maxZoom={18}
  keepBuffer={2}
  updateWhenIdle={true}
/>

// Virtualização de eventos
const visibleEvents = useMemo(() => 
  events.filter(e => isInViewport(e.location))
, [events, viewport]);
```

### 2.3 Backend/API Performance

#### Base44 Functions Optimization
```javascript
// ❌ PROBLEMA: N+1 queries
for (let event of events) {
  const organizer = await base44.entities.User.get(event.organizer_id);
}

// ✅ SOLUÇÃO: Batch queries
const organizerIds = events.map(e => e.organizer_id);
const organizers = await base44.entities.User.filter({
  id: { $in: organizerIds }
});
```

#### Caching Strategy
```javascript
// React Query config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5min
      cacheTime: 10 * 60 * 1000, // 10min
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

---

## 3. TESTES DE SEGURANÇA

### 3.1 OWASP Top 10 Compliance

#### A1: Injection
```javascript
// ✅ Sanitização de inputs
import DOMPurify from 'dompurify';

const sanitizedInput = DOMPurify.sanitize(userInput);
```

#### A2: Broken Authentication
```javascript
// ✅ JWT refresh tokens
// ✅ Session timeout (30min)
// ✅ Rate limiting
// ⚠️ TODO: 2FA para organizadores
```

#### A3: Sensitive Data Exposure
```javascript
// ✅ HTTPS obrigatório
// ✅ Secrets em variáveis de ambiente
// ⚠️ TODO: Criptografar dados sensíveis no localStorage
```

#### A4: XXE (XML External Entities)
```javascript
// N/A - Não usamos XML
```

#### A5: Broken Access Control
```javascript
// ⚠️ CRÍTICO: Validar permissões no backend
// Arquivo: functions/*

// ❌ PROBLEMA: Validação só no frontend
if (user.is_organizer) { /* permitir */ }

// ✅ SOLUÇÃO: Validar no backend
const user = await base44.auth.me();
if (!user.is_organizer) {
  return Response.json({ error: 'Unauthorized' }, { status: 403 });
}
```

#### A6: Security Misconfiguration
```javascript
// ✅ Content Security Policy
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self'; script-src 'self' 'unsafe-inline'; img-src * data:;" />

// ✅ Secure headers
headers: {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=()'
}
```

#### A7: XSS (Cross-Site Scripting)
```javascript
// ✅ React escapa automaticamente
// ⚠️ Verificar dangerouslySetInnerHTML
// ⚠️ Sanitizar inputs de usuários
```

### 3.2 Penetration Testing Checklist

- [ ] SQL Injection (Base44 protege)
- [ ] XSS (Cross-Site Scripting)
- [ ] CSRF (Cross-Site Request Forgery)
- [ ] Authentication bypass
- [ ] Authorization bypass
- [ ] Session hijacking
- [ ] API rate limiting
- [ ] File upload vulnerabilities
- [ ] Geolocation spoofing

### 3.3 Firebase Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users só podem ler/editar próprio perfil
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Events - todos podem ler, só organizadores podem criar
    match /events/{eventId} {
      allow read: if true;
      allow create: if request.auth != null && 
        request.auth.token.is_organizer == true;
      allow update, delete: if request.auth != null && 
        resource.data.organizer_id == request.auth.uid;
    }
  }
}
```

### 3.4 Rate Limiting

```javascript
// Cloudflare ou Nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
  limit_req zone=api burst=20 nodelay;
  limit_req_status 429;
}
```

---

## 4. TESTES FUNCIONAIS

### 4.1 User Flows Críticos

#### Flow 1: Descoberta de Eventos
```gherkin
Feature: Descoberta de Eventos no Mapa

Scenario: Usuário encontra evento próximo
  Given eu estou na página do mapa
  And minha localização é São Paulo
  When o mapa carrega
  Then eu vejo pins de eventos próximos
  And eu posso clicar em um pin
  And ver detalhes do evento
  
Scenario: Filtrar eventos por gênero
  Given eu estou no mapa
  When eu abro o filtro de gênero
  And seleciono "Techno"
  Then apenas eventos de Techno aparecem
```

#### Flow 2: Solicitação de Ingresso
```gherkin
Feature: Solicitar Acesso a Evento Secreto

Scenario: Request aprovado
  Given eu sou usuário autenticado
  And o evento requer aprovação
  When eu solicito acesso
  And preencho o formulário
  Then minha solicitação é enviada
  And recebo notificação quando aprovado
  
Scenario: Request negado
  Given eu sou usuário autenticado
  When minha solicitação é negada
  Then recebo notificação
  And vejo motivo da negação
```

#### Flow 3: Criação de Evento (Organizador)
```gherkin
Feature: Criar Evento Underground

Scenario: Evento público
  Given eu sou organizador verificado
  When eu clico em "Criar Evento"
  And preencho todos os campos obrigatórios
  And faço upload da imagem
  And seleciono localização no mapa
  And configuro ingressos
  Then o evento é criado
  And aparece no mapa imediatamente
  
Scenario: Evento secreto
  Given eu sou organizador PRO
  When eu ativo modo secreto
  Then localização fica oculta
  And apenas convidados veem
```

### 4.2 Edge Cases

```javascript
// Testes de edge cases
describe('Edge Cases', () => {
  test('Evento sem localização', () => {
    // Não deve quebrar o mapa
  });
  
  test('1000+ eventos simultâneos', () => {
    // Deve usar clustering
  });
  
  test('Usuário sem permissão de localização', () => {
    // Deve mostrar fallback
  });
  
  test('Evento no passado', () => {
    // Não deve aparecer no feed
  });
  
  test('Upload de imagem 10MB+', () => {
    // Deve rejeitar ou comprimir
  });
});
```

### 4.3 Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 100+ | ✅ Suportado |
| Firefox | 95+ | ✅ Suportado |
| Safari | 15+ | ⚠️ Testar mapas |
| Edge | 100+ | ✅ Suportado |
| Opera | 85+ | ✅ Suportado |
| Samsung Internet | 16+ | ⚠️ Testar |

### 4.4 Device Testing

- **Mobile:** iPhone 12+, Samsung Galaxy S21+, Pixel 6+
- **Tablet:** iPad Pro, Samsung Tab S8
- **Desktop:** 1920x1080, 2560x1440, 4K

---

## 5. OTIMIZAÇÕES CRÍTICAS

### 5.1 Code Splitting

```javascript
// React.lazy para rotas
const Feed = lazy(() => import('./pages/Feed'));
const Mapa = lazy(() => import('./pages/Mapa'));
const Perfil = lazy(() => import('./pages/Perfil'));

// Suspense wrapper
<Suspense fallback={<LoadingSkeleton />}>
  <Routes>
    <Route path="/feed" element={<Feed />} />
    <Route path="/mapa" element={<Mapa />} />
    <Route path="/perfil" element={<Perfil />} />
  </Routes>
</Suspense>
```

### 5.2 Image Optimization

```javascript
// Next-gen formats (WebP, AVIF)
<picture>
  <source srcset="image.avif" type="image/avif" />
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" alt="..." loading="lazy" />
</picture>

// Responsive images
<img 
  srcset="
    image-320w.jpg 320w,
    image-640w.jpg 640w,
    image-1280w.jpg 1280w
  "
  sizes="(max-width: 600px) 100vw, 50vw"
  src="image-640w.jpg"
  alt="..."
/>

// TODO: Implementar CDN com transformação automática
// Cloudinary ou ImageKit
```

### 5.3 Prefetching & Preloading

```javascript
// Prefetch recursos críticos
<link rel="prefetch" href="/api/events" as="fetch" />
<link rel="preload" href="/fonts/orbitron.woff2" as="font" type="font/woff2" crossorigin />

// React Router prefetch
<Link to="/evento/123" prefetch="intent">Ver Evento</Link>
```

### 5.4 Database Indexing

```sql
-- Índices para queries frequentes
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_location ON events USING GIST(location);
CREATE INDEX idx_events_genre ON events(genre);
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_likes_event ON likes(event_id);
CREATE INDEX idx_likes_user ON likes(user_id);

-- Compound indexes para filtros
CREATE INDEX idx_events_date_genre ON events(date, genre);
CREATE INDEX idx_events_location_date ON events USING GIST(location, date);
```

### 5.5 Service Worker Optimization

```javascript
// service-worker.js
const CACHE_VERSION = 'v2.0.0';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';

// Precache arquivos críticos
const STATIC_FILES = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Estratégia: Network First com fallback
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clonedResponse = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
```

---

## 6. PWA & OFFLINE

### 6.1 Manifest.json

```json
{
  "name": "SUBLINX - Underground Events",
  "short_name": "SUBLINX",
  "description": "Descubra eventos underground, cultura eletrônica e festas secretas",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#06B6D4",
  "background_color": "#000000",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop-1.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/mobile-1.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "shortcuts": [
    {
      "name": "Mapa de Eventos",
      "url": "/mapa",
      "icons": [{ "src": "/icons/map-icon.png", "sizes": "96x96" }]
    },
    {
      "name": "Feed",
      "url": "/feed",
      "icons": [{ "src": "/icons/feed-icon.png", "sizes": "96x96" }]
    }
  ],
  "categories": ["entertainment", "music", "social"],
  "iarc_rating_id": "e84b072d-71b3-4d3e-86ae-31a8ce4e53b7"
}
```

### 6.2 Offline Functionality

```javascript
// Offline Queue para ações
class OfflineQueue {
  constructor() {
    this.queue = JSON.parse(localStorage.getItem('offline-queue') || '[]');
  }
  
  add(action) {
    this.queue.push({ ...action, timestamp: Date.now() });
    localStorage.setItem('offline-queue', JSON.stringify(this.queue));
  }
  
  async processQueue() {
    for (const action of this.queue) {
      try {
        await this.executeAction(action);
        this.removeFromQueue(action);
      } catch (error) {
        console.error('Failed to process:', action, error);
      }
    }
  }
}

// Uso
window.addEventListener('online', () => {
  offlineQueue.processQueue();
});
```

### 6.3 Push Notifications

```javascript
// Solicitar permissão
const permission = await Notification.requestPermission();

if (permission === 'granted') {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: VAPID_PUBLIC_KEY
  });
  
  // Enviar subscription para backend
  await base44.entities.PushSubscription.create({
    user_id: user.id,
    subscription: JSON.stringify(subscription)
  });
}
```

---

## 7. SEO & META TAGS

### 7.1 Meta Tags Essenciais

```html
<!-- index.html -->
<head>
  <!-- Primary Meta Tags -->
  <title>SUBLINX - Eventos Underground & Cultura Eletrônica</title>
  <meta name="title" content="SUBLINX - Eventos Underground & Cultura Eletrônica" />
  <meta name="description" content="Descubra eventos underground, festas secretas e cultura eletrônica. Mapa interativo com techno, house, trance e mais." />
  <meta name="keywords" content="eventos underground, festas eletrônicas, techno, house, trance, raves, cultura eletrônica, eventos secretos" />
  <meta name="author" content="SUBLINX Team" />
  <meta name="robots" content="index, follow" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://sublinx.app/" />
  <meta property="og:title" content="SUBLINX - Eventos Underground & Cultura Eletrônica" />
  <meta property="og:description" content="Descubra eventos underground, festas secretas e cultura eletrônica." />
  <meta property="og:image" content="https://sublinx.app/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://sublinx.app/" />
  <meta name="twitter:title" content="SUBLINX - Eventos Underground" />
  <meta name="twitter:description" content="Descubra eventos underground e cultura eletrônica." />
  <meta name="twitter:image" content="https://sublinx.app/twitter-image.png" />
  
  <!-- iOS -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="SUBLINX" />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
  
  <!-- Android -->
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="theme-color" content="#06B6D4" />
  
  <!-- Canonical -->
  <link rel="canonical" href="https://sublinx.app/" />
  
  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "SUBLINX",
    "description": "Plataforma de descoberta de eventos underground",
    "applicationCategory": "Entertainment",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "BRL"
    }
  }
  </script>
</head>
```

### 7.2 sitemap.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://sublinx.app/</loc>
    <lastmod>2025-01-15</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://sublinx.app/feed</loc>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://sublinx.app/mapa</loc>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <!-- Eventos dinâmicos -->
  <url>
    <loc>https://sublinx.app/evento/[id]</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

### 7.3 robots.txt

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Sitemap: https://sublinx.app/sitemap.xml
```

---

## 8. MONITORING & ANALYTICS

### 8.1 Error Tracking - Sentry

```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Error Boundary
<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</Sentry.ErrorBoundary>
```

### 8.2 Analytics - Google Analytics 4

```javascript
import ReactGA from 'react-ga4';

ReactGA.initialize('G-XXXXXXXXXX');

// Track pageviews
const location = useLocation();
useEffect(() => {
  ReactGA.send({ 
    hitType: "pageview", 
    page: location.pathname 
  });
}, [location]);

// Track events
ReactGA.event({
  category: 'User',
  action: 'Like Event',
  label: eventId
});
```

### 8.3 Performance Monitoring - Web Vitals

```javascript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify(metric);
  
  // Beacon API para enviar antes de unload
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/analytics', body);
  } else {
    fetch('/analytics', { body, method: 'POST', keepalive: true });
  }
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### 8.4 Custom Metrics

```javascript
// Track feature usage
const trackFeatureUsage = (feature) => {
  ReactGA.event({
    category: 'Feature',
    action: 'Used',
    label: feature,
    value: 1
  });
};

// Track business metrics
const trackConversion = (type, value) => {
  ReactGA.event({
    category: 'Conversion',
    action: type,
    value: value
  });
};
```

---

## 9. CI/CD & DEPLOYMENT

### 9.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.API_URL }}
          VITE_SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
      
      - name: Notify Sentry
        run: |
          curl https://sentry.io/api/0/organizations/${{ secrets.SENTRY_ORG }}/releases/ \
            -X POST \
            -H "Authorization: Bearer ${{ secrets.SENTRY_AUTH_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{"version": "${{ github.sha }}", "projects": ["sublinx"]}'
```

### 9.2 Environment Variables

```bash
# .env.production
VITE_API_URL=https://api.sublinx.app
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_MAPBOX_TOKEN=pk.xxx
VITE_VAPID_PUBLIC_KEY=xxx
```

### 9.3 Deployment Checklist

- [ ] Build sem erros
- [ ] Testes passando (100%)
- [ ] Bundle size < target
- [ ] Lighthouse score > 90
- [ ] Sem console.logs em produção
- [ ] Source maps habilitados (Sentry)
- [ ] Environment variables configuradas
- [ ] CDN configurado
- [ ] Cache headers corretos
- [ ] SSL/HTTPS habilitado
- [ ] Rate limiting ativo
- [ ] Backup database configurado
- [ ] Monitoring ativo
- [ ] Rollback strategy definida

---

## 10. CHECKLIST FINAL

### 10.1 Pre-Launch (1 semana antes)

#### Código & Build
- [ ] Código auditado e otimizado
- [ ] Bundle size otimizado (< 200KB)
- [ ] Todos os testes passando
- [ ] Coverage > 80%
- [ ] Lighthouse > 90 em tudo
- [ ] Sem warnings no build
- [ ] Service Worker testado offline

#### Segurança
- [ ] HTTPS configurado
- [ ] Security headers implementados
- [ ] Rate limiting ativo
- [ ] Firebase rules validadas
- [ ] Secrets em env vars
- [ ] XSS/CSRF protegido
- [ ] Penetration test concluído

#### Performance
- [ ] Core Web Vitals ok
- [ ] Mapa com < 100 eventos carrega em < 2s
- [ ] Feed com infinite scroll fluido
- [ ] Images otimizadas (WebP/AVIF)
- [ ] Lazy loading implementado
- [ ] Database indexada

#### PWA
- [ ] Manifest.json completo
- [ ] Icons gerados (72-512px)
- [ ] Service Worker registrado
- [ ] Offline mode funcional
- [ ] Install prompt implementado
- [ ] Push notifications testadas

#### SEO & Meta
- [ ] Meta tags completas
- [ ] Open Graph configurado
- [ ] Twitter Cards configuradas
- [ ] Sitemap.xml gerado
- [ ] robots.txt configurado
- [ ] Structured data implementado

#### Monitoring
- [ ] Sentry configurado
- [ ] Google Analytics configurado
- [ ] Web Vitals tracking ativo
- [ ] Custom metrics implementados
- [ ] Error tracking testado
- [ ] Performance monitoring ativo

#### Legal & Compliance
- [ ] Política de Privacidade
- [ ] Termos de Uso
- [ ] LGPD/GDPR compliant
- [ ] Cookie consent banner
- [ ] Idade mínima (18+) validada

### 10.2 Launch Day

- [ ] Deploy para produção
- [ ] DNS propagado
- [ ] SSL ativo e válido
- [ ] Monitoring dashboard aberto
- [ ] Equipe de suporte pronta
- [ ] Rollback plan pronto
- [ ] Load testing final
- [ ] Smoke tests passando

### 10.3 Post-Launch (1 semana depois)

- [ ] Monitoring diário de errors
- [ ] Performance metrics estáveis
- [ ] User feedback coletado
- [ ] Bugs críticos resolvidos
- [ ] Analytics validados
- [ ] Conversão tracking funcionando
- [ ] Load tests com tráfego real
- [ ] Scaling se necessário

---

## 11. PLANO DE EMERGÊNCIA

### 11.1 Rollback Strategy

```bash
# Vercel rollback
vercel rollback

# Manual rollback
git revert HEAD
git push origin main
```

### 11.2 Incident Response

1. **Detecção:** Sentry alert ou monitoring
2. **Triagem:** Avaliar severidade (P0-P3)
3. **Comunicação:** Notificar stakeholders
4. **Resolução:** Fix + deploy
5. **Post-mortem:** Documentar lições

### 11.3 Downtime Communication

```html
<!-- Status page -->
<div class="status-page">
  <h1>🚧 SUBLINX em Manutenção</h1>
  <p>Voltaremos em breve! Acompanhe @sublinxapp</p>
</div>
```

---

## 12. MÉTRICAS DE SUCESSO

### KPIs Técnicos
- **Uptime:** > 99.9%
- **Response Time (p95):** < 500ms
- **Error Rate:** < 0.1%
- **Lighthouse Score:** > 90
- **Bundle Size:** < 200KB

### KPIs de Negócio
- **DAU (Daily Active Users):** Meta 10k no mês 1
- **Retention (D7):** > 40%
- **Conversão Free → PRO:** > 5%
- **NPS (Net Promoter Score):** > 50
- **App Installs (PWA):** > 30% dos usuários

---

## 📝 NOTAS FINAIS

**Status Atual:** 🟡 PRÉ-PRODUÇÃO  
**Pronto para Launch:** ⚠️ NÃO (pendente otimizações)  
**Estimativa:** 2-3 semanas para production-ready  

**Prioridade Máxima:**
1. ✅ Corrigir bundle size (atual: 350KB → target: 200KB)
2. ✅ Implementar rate limiting
3. ✅ Validar Firebase security rules
4. ✅ Otimizar performance do mapa
5. ✅ Configurar monitoring (Sentry + GA)

**Contato Técnico:**  
Para dúvidas sobre este plano, contatar o Tech Lead.

---

**Última Atualização:** 2025-01-15  
**Versão:** 1.0.0  
**Autor:** Engineering Team