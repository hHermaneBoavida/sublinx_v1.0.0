# 🚨 CORREÇÕES CRÍTICAS - IMPLEMENTAÇÃO IMEDIATA

## 1️⃣ BACKEND FUNCTIONS - FIXES

### getDashboardMetrics.js - OTIMIZAR

**ANTES** (PROBLEMA):
```javascript
const [events, tickets, requests, likes, comments] = await Promise.all([
  base44.asServiceRole.entities.Event.filter({ organizer_id: user.id }),
  base44.asServiceRole.entities.Ticket.list('', 1000),  // ❌ TODOS OS TICKETS
  base44.asServiceRole.entities.EventRequest.list('', 1000),  // ❌ TODAS REQUESTS
  base44.asServiceRole.entities.Like.list('', 1000),  // ❌ TODOS OS LIKES
  base44.asServiceRole.entities.Comment.list('', 1000)  // ❌ TODOS OS COMMENTS
]);
```

**DEPOIS** (SOLUÇÃO):
```javascript
const events = await base44.asServiceRole.entities.Event.filter({ organizer_id: user.id });
const eventIds = events.map(e => e.id);

const [tickets, requests, likes, comments] = await Promise.all([
  base44.asServiceRole.entities.Ticket.filter({ event_id: { $in: eventIds } }, '', 1000),
  base44.asServiceRole.entities.EventRequest.filter({ event_id: { $in: eventIds } }, '', 500),
  base44.asServiceRole.entities.Like.filter({ event_id: { $in: eventIds } }, '', 2000),
  base44.asServiceRole.entities.Comment.filter({ event_id: { $in: eventIds } }, '', 500)
]);
```

---

## 2️⃣ FEED - BATCH ORGANIZERS

### EventFeedCard.jsx - N+1 PROBLEM

**ANTES**:
```javascript
// Cada card busca o organizador separadamente
const { data: organizer } = useQuery({
  queryKey: ['eventOrganizer', event.organizer_id],
  queryFn: async () => {
    const users = await base44.entities.User.filter({ id: event.organizer_id });
    return users[0];
  }
});
```

**DEPOIS** (no Feed.js):
```javascript
// Buscar TODOS organizadores de uma vez
const organizerIds = [...new Set(events.map(e => e.organizer_id))];
const organizers = await base44.entities.User.filter({ id: { $in: organizerIds } });
const organizersMap = Object.fromEntries(organizers.map(o => [o.id, o]));

// Passar para EventFeedCard via props
<EventFeedCard event={event} organizer={organizersMap[event.organizer_id]} />
```

---

## 3️⃣ MAPA - PERFORMANCE

### Cálculo de Distância - WEB WORKER

**CRIAR**: `components/workers/distanceWorker.js`
```javascript
// Web Worker para cálculos pesados
self.onmessage = function(e) {
  const { events, userLocation } = e.data;
  
  const eventsWithDistance = events.map(event => ({
    ...event,
    distance: calculateDistance(
      userLocation.lat,
      userLocation.lng,
      event.location.lat,
      event.location.lng
    )
  }));
  
  self.postMessage(eventsWithDistance);
};
```

---

## 4️⃣ ENTIDADES - ÍNDICES

### Configuração de Índices (Base44)

```javascript
// Event Entity
indexes: [
  { fields: ["organizer_id"] },
  { fields: ["date"] },
  { fields: ["genre"] },
  { fields: ["organizer_id", "date"] }  // Compound
]

// Ticket Entity
indexes: [
  { fields: ["event_id"] },
  { fields: ["user_id"] },
  { fields: ["event_id", "status"] }  // Compound
]

// Like Entity
indexes: [
  { fields: ["event_id", "user_id"] }  // Unique compound
]
```

⚠️ **NOTA**: Base44 pode não suportar índices customizados. Verificar docs.

---

## 5️⃣ CACHE STRATEGY - AGRESSIVO

### Aplicar em Todas Queries

```javascript
// User data - NUNCA MUDA durante sessão
useQuery({
  queryKey: ['currentUser'],
  queryFn: () => base44.auth.me(),
  staleTime: Infinity,  // ✅
  gcTime: Infinity,
});

// Badges - RARAMENTE MUDAM
useQuery({
  queryKey: ['userBadges', userId],
  queryFn: () => base44.entities.UserBadge.filter({ user_id: userId }),
  staleTime: Infinity,  // ✅
  gcTime: 3600000,
});

// Events - MODERADO
useQuery({
  queryKey: ['events'],
  queryFn: () => base44.entities.Event.list("-date", 50),
  staleTime: 300000,  // 5min ✅
  gcTime: 600000,
});

// Interactions - TEMPO REAL
useQuery({
  queryKey: ['feedInteractions'],
  queryFn: () => fetchInteractions(),
  staleTime: 30000,  // 30s ✅
  refetchInterval: 60000,
});
```

---

## 6️⃣ INFINITE SCROLL - DEDUPLICATION

### Feed.js - FIX DUPLICATES

```javascript
const { data: eventsData, fetchNextPage } = useInfiniteQuery({
  queryKey: queryKeys.events(),
  queryFn: async ({ pageParam = 0 }) => {
    const offset = pageParam * EVENTS_PER_PAGE;
    const data = await base44.entities.Event.list("-date", EVENTS_PER_PAGE + offset);
    
    const futureEvents = filterFutureEvents(data);
    const pageEvents = futureEvents.slice(offset, offset + EVENTS_PER_PAGE);
    
    return {
      events: pageEvents,
      nextPage: futureEvents.length > offset + EVENTS_PER_PAGE ? pageParam + 1 : undefined
    };
  },
  // ... rest
});

// DEDUPLICATE
const events = useMemo(() => {
  if (!eventsData?.pages) return [];
  const allEvents = eventsData.pages.flatMap(page => page.events);
  const uniqueEvents = Array.from(new Map(allEvents.map(e => [e.id, e])).values());  // ✅
  return uniqueEvents;
}, [eventsData]);
```

---

## 7️⃣ COMPONENTIZAÇÃO - QUEBRAR GIGANTES

### EventFeedCard.jsx → 5 COMPONENTES

1. **EventFeedCard.jsx** (container, 80 linhas)
2. **EventFeedHeader.jsx** (organizer info, 50 linhas)
3. **EventFeedContent.jsx** (image, description, 60 linhas)
4. **EventFeedActions.jsx** (like, comment, share, 80 linhas)
5. **EventFeedComments.jsx** (comments section, 100 linhas)

**BENEFÍCIOS**:
- Melhor manutenção
- Re-renders isolados
- Testabilidade
- Reusabilidade

---

## 8️⃣ VALIDAÇÃO E SANITIZAÇÃO

### Implementar em Todos Forms

```javascript
import { sanitizeInput, validateEmail, sanitizeHTML } from '@/components/shared/InputSanitizer';

// Em CriarEvento.js
const handleSubmit = (data) => {
  const sanitized = {
    title: sanitizeInput(data.title, 100),
    description: sanitizeHTML(data.description),
    // ...
  };
  
  if (!sanitized.title) {
    setError("Título inválido");
    return;
  }
  
  createEvent(sanitized);
};
```

---

## 9️⃣ ERROR BOUNDARIES

### Adicionar em Componentes Críticos

```javascript
// Mapa.jsx ✅
// Feed.js ❌ (ADICIONAR)
// DashboardOrganizador.jsx ❌ (ADICIONAR)
```

---

## 🔟 MONITORING & LOGGING

### Performance Tracking

```javascript
// Adicionar em queries críticas
import { measurePerformance } from '@/components/shared/optimizations';

const result = measurePerformance('eventFiltering', () => {
  return events.filter(/* ... */);
});

// Console warning se > 16ms
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### BACKEND
- [ ] Otimizar getDashboardMetrics com filtros
- [ ] Adicionar validation em todas functions
- [ ] Implementar rate limiting
- [ ] Cache headers em responses

### FRONTEND
- [ ] Batch fetch organizers no Feed
- [ ] Deduplicate infinite scroll
- [ ] Web Worker para distâncias
- [ ] Lazy load Leaflet/Recharts
- [ ] Quebrar EventFeedCard

### ENTIDADES
- [ ] Remover campos calculáveis
- [ ] Adicionar índices (se possível)
- [ ] Criar EventAnalytics entity
- [ ] Normalizar Ticket.attendee_info

### PERFORMANCE
- [ ] Virtualização no Feed
- [ ] React.memo em cards
- [ ] Image optimization
- [ ] Code splitting por rota
- [ ] Service Worker v2 com background sync

### SEGURANÇA
- [ ] Sanitização universal
- [ ] Validação de autorização
- [ ] Rate limiting
- [ ] CSRF protection

---

**TEMPO ESTIMADO**: 40-60 horas de desenvolvimento
**IMPACTO ESPERADO**: 60-80% melhoria de performance
**ROI**: CRÍTICO para escalabilidade