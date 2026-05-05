# 🐛 SUBLINX - BUG TRACKER

## 🔴 CRITICAL BUGS (P0)

### BUG-001: Dashboard Timeout com >50 Eventos
**STATUS**: ✅ FIXED
**FILE**: `functions/getDashboardMetrics.js`
**DESCRIPTION**: Query carregava TODOS tickets/likes/comments sem filtro
**IMPACT**: Timeout após 30s com organizadores grandes
**FIX**: Filtrar por `event_id: { $in: eventIds }`
**VERIFIED**: ✅

### BUG-002: Memory Leak em Mapa
**STATUS**: ✅ FIXED
**FILE**: `components/map/MapView.jsx`
**DESCRIPTION**: Leaflet maps não eram destruídos ao navegar
**IMPACT**: Memory crescia indefinidamente (+60MB/min)
**FIX**: `mapRef.current.remove()` no cleanup
**VERIFIED**: ✅

### BUG-003: Crash ao Like Offline
**STATUS**: ✅ FIXED
**FILE**: `components/feed/EventFeedCard.jsx`
**DESCRIPTION**: Erro não tratado ao criar Like sem conexão
**IMPACT**: White screen crash
**FIX**: Offline queue system
**VERIFIED**: ✅

### BUG-004: Duplicate Events em Infinite Scroll
**STATUS**: ✅ FIXED
**FILE**: `pages/Feed.js`
**DESCRIPTION**: fetchNextPage retornava eventos já carregados
**IMPACT**: Cards duplicados, confusão do usuário
**FIX**: Deduplicate usando Map por ID
**VERIFIED**: ✅

---

## 🟡 HIGH PRIORITY BUGS (P1)

### BUG-005: EventFeedCard Re-renders Excessivos
**STATUS**: 🔄 IN PROGRESS
**FILE**: `components/feed/EventFeedCard.jsx`
**DESCRIPTION**: Card re-renderiza quando QUALQUER evento recebe like
**IMPACT**: Lag visível ao interagir com feed
**FIX**: React.memo com custom comparison
**ASSIGNED TO**: Performance team
**ETA**: Next sprint

### BUG-006: Guest List Null Reference
**STATUS**: ⚠️ UNVERIFIED
**FILE**: `components/guestlist/GuestListManager.jsx`
**DESCRIPTION**: Possible crash se `guestList` for null
**IMPACT**: White screen ao abrir guest list vazia
**FIX**: Add `guestList?.filter()` optional chaining
**NEEDS**: Testing with empty guest list

### BUG-007: Calendar Integration Fails Silently
**STATUS**: 🔍 INVESTIGATING
**FILE**: `components/integrations/CalendarIntegration.jsx`
**DESCRIPTION**: Erro ao adicionar evento não mostra feedback
**IMPACT**: User pensa que funcionou
**FIX**: Add error toast + retry button

---

## 🟢 MEDIUM PRIORITY BUGS (P2)

### BUG-008: Image Upload Sem Validação
**STATUS**: 🆕 NEW
**FILE**: `pages/CriarEvento.js`
**DESCRIPTION**: Aceita qualquer arquivo como imagem
**IMPACT**: Crash ao fazer upload de PDF/ZIP
**FIX**: Validar MIME type antes de upload

### BUG-009: Organizer Name Cache Desatualizado
**STATUS**: 🆕 NEW
**FILE**: `entities/Event.json`
**DESCRIPTION**: Campo `organizer` (cache) nunca é atualizado
**IMPACT**: Nome errado se organizador mudar perfil
**FIX**: Remover campo ou criar job de sincronização

### BUG-010: Timezone Issues
**STATUS**: 🆕 NEW
**FILES**: Múltiplos
**DESCRIPTION**: Datas mostram timezone errado
**IMPACT**: Eventos aparecem em horário incorreto
**FIX**: Usar `date-fns-tz` + UTC storage

---

## 🔵 LOW PRIORITY BUGS (P3)

### BUG-011: Toast Notifications Stack
**STATUS**: 🆕 NEW
**DESCRIPTION**: Múltiplos toasts sobrepõem
**IMPACT**: UX ruim
**FIX**: Limit concurrent toasts

### BUG-012: Scroll Restoration
**STATUS**: 🆕 NEW
**DESCRIPTION**: Feed não mantém posição ao voltar
**IMPACT**: UX ruim
**FIX**: ScrollRestoration component

---

## 🧪 REGRESSION TESTS NEEDED

### Test Cases
1. [ ] Load 1000 events on map → Should cluster correctly
2. [ ] Scroll feed 10 pages → No duplicates, no memory leak
3. [ ] Like/Unlike rapidly → No race conditions
4. [ ] Open/close modals 20x → No memory leak
5. [ ] Offline → Like → Online → Should sync
6. [ ] Dashboard with 100 events → <5s load
7. [ ] Upload 10MB image → Should reject
8. [ ] Navigate Map→Feed→Map 10x → Stable memory

---

## 🔒 SECURITY VULNERABILITIES

### VULN-001: XSS via Comment
**SEVERITY**: HIGH
**FILE**: `components/feed/EventFeedCard.jsx`
**DESCRIPTION**: Comments rendered sem sanitização
**EXPLOIT**: `<script>alert('XSS')</script>` em comment
**FIX**: ✅ Sanitize com InputSanitizer

### VULN-002: Unauthorized Data Access
**SEVERITY**: MEDIUM
**FILE**: `functions/getDashboardMetrics.js`
**DESCRIPTION**: Não valida se user é dono dos eventos
**EXPLOIT**: Request com outro user_id
**FIX**: ✅ Validate `is_organizer`

### VULN-003: Rate Limiting Ausente
**SEVERITY**: MEDIUM
**FILES**: All backend functions
**DESCRIPTION**: Sem limite de requisições
**EXPLOIT**: DDoS via API spam
**FIX**: Implement rate limiter (Deno KV?)

---

## 📋 BUG RESOLUTION CHECKLIST

### Para cada bug:
- [ ] Reproduzir localmente
- [ ] Escrever test case
- [ ] Implementar fix
- [ ] Verificar não causa regressão
- [ ] Deploy para staging
- [ ] Monitor por 24h
- [ ] Deploy para produção
- [ ] Close ticket

---

## 📊 BUG STATISTICS

**Total Bugs**: 12
**Critical**: 4 (✅ 100% fixed)
**High**: 3 (🔄 33% in progress)
**Medium**: 3 (🆕 0% started)
**Low**: 2 (🆕 0% started)

**Resolution Rate**: 4/12 (33%) - Session 1
**Target**: 10/12 (83%) - After P1
**Final Target**: 12/12 (100%) - After P2

---

**LAST UPDATED**: 2025-11-30
**NEXT REVIEW**: Daily durante P0/P1