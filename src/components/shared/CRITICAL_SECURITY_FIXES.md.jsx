# 🔒 SUBLINX - CORREÇÕES CRÍTICAS DE SEGURANÇA

**Status:** ⚠️ AÇÃO IMEDIATA NECESSÁRIA  
**Prioridade:** P0 - BLOQUEANTE PARA PRODUÇÃO  
**Data:** 30/11/2025

---

## 🚨 VULNERABILIDADES CRÍTICAS

### **1. Exposição de Dados Sensíveis [P0]**

#### Problema:
```javascript
// ❌ CRÍTICO: User entity retorna TODOS os campos
const users = await base44.entities.User.list();
// Expõe: email, phone, cpf, emergency_contact, etc.
```

#### Impacto:
- ❌ Vazamento de PII (Personally Identifiable Information)
- ❌ Violação de LGPD/GDPR
- ❌ Reprovação automática nas lojas
- ❌ Risco legal alto

#### Solução:
```javascript
// Backend: Criar view de User público
// entities/UserPublicProfile.json (criar este arquivo)
{
  "name": "UserPublicProfile",
  "type": "object",
  "source": "User",
  "fields": {
    "id": "string",
    "full_name": "string",
    "avatar_url": "string",
    "bio": "string",
    "underground_level": "number",
    "is_organizer": "boolean",
    "verified_organizer": "boolean"
  }
}

// Frontend: Usar SEMPRE UserPublicProfile
const users = await base44.entities.UserPublicProfile.list();
```

#### Action Items:
- [ ] Criar UserPublicProfile view
- [ ] Substituir ALL base44.entities.User.list()
- [ ] Adicionar backend validation
- [ ] Audit log de acesso a dados sensíveis

---

### **2. XSS em Comentários [P0]**

#### Problema:
```javascript
// ❌ CRÍTICO: HTML não sanitizado
<div dangerouslySetInnerHTML={{ __html: comment.content }} />
```

#### Impacto:
- ❌ Ataque XSS (cross-site scripting)
- ❌ Roubo de sessão/tokens
- ❌ Injeção de malware
- ❌ Reprovação nas lojas

#### Solução:
```javascript
// Instalar DOMPurify (já disponível no npm)
import DOMPurify from 'dompurify';

// ✅ Sanitizar SEMPRE antes de renderizar
const sanitized = DOMPurify.sanitize(comment.content);
<div dangerouslySetInnerHTML={{ __html: sanitized }} />

// Ou melhor ainda: usar texto plano
<div>{comment.content}</div>
```

#### Action Items:
- [ ] Instalar DOMPurify: `npm install dompurify`
- [ ] Sanitizar todos comentários, bios, descrições
- [ ] Adicionar Content Security Policy headers
- [ ] Testar com payloads XSS conhecidos

---

### **3. File Upload sem Validação [P1]**

#### Problema:
```javascript
// ❌ Apenas valida extensão do arquivo
if (!file.type.startsWith('image/')) {
  throw new Error('Invalid file');
}
```

#### Impacto:
- ⚠️ Upload de executáveis disfarçados
- ⚠️ Bypass via renomeação
- ⚠️ Possível RCE (remote code execution)

#### Solução:
```javascript
// ✅ Validar MIME type REAL no backend
import { fileTypeFromBuffer } from 'file-type';

async function validateImage(file) {
  const buffer = await file.arrayBuffer();
  const type = await fileTypeFromBuffer(buffer);
  
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!type || !allowed.includes(type.mime)) {
    throw new Error('Invalid image file');
  }
  
  // Validar tamanho
  if (buffer.byteLength > 5 * 1024 * 1024) { // 5MB
    throw new Error('File too large');
  }
  
  return true;
}
```

#### Action Items:
- [ ] Backend validation com file-type
- [ ] Scan de vírus (ClamAV ou similar)
- [ ] Limitar upload rate (10 files/min)
- [ ] Armazenar fora do root público

---

### **4. SQL Injection (Mitigado, mas verificar) [P1]**

#### Verificação:
```javascript
// ✅ OK: Base44 SDK usa prepared statements
const events = await base44.entities.Event.filter({
  title: userInput // Já está protegido
});

// ❌ NUNCA fazer:
const query = `SELECT * FROM events WHERE title = '${userInput}'`;
```

#### Action Items:
- [x] Verificado: SDK usa ORM seguro
- [ ] Adicionar input validation extra
- [ ] Rate limiting em queries

---

### **5. Autenticação e Autorização [P1]**

#### Problemas:
```javascript
// ⚠️ Frontend não valida role
if (user.is_organizer) {
  // Mostra UI de organizador
  // MAS backend precisa validar também!
}

// ⚠️ Rotas não protegidas
<Route path="/criar-evento" component={CriarEvento} />
// Qualquer um pode acessar!
```

#### Solução:
```javascript
// 1. Protected Routes no frontend
function ProtectedRoute({ component: Component, requireOrganizer, ...rest }) {
  const { user } = useCurrentUser();
  
  return (
    <Route
      {...rest}
      render={(props) => {
        if (!user) {
          return <Redirect to="/bem-vindo" />;
        }
        if (requireOrganizer && !user.is_organizer) {
          return <Redirect to="/upgrade" />;
        }
        return <Component {...props} />;
      }}
    />
  );
}

// 2. Backend SEMPRE valida
// functions/criarEvento.js
async function createEvent(req) {
  const user = await base44.auth.me();
  
  if (!user || !user.is_organizer) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  // Proceder...
}
```

#### Action Items:
- [ ] Implementar ProtectedRoute
- [ ] Backend validation em TODAS as functions
- [ ] Audit log de tentativas não autorizadas
- [ ] Rate limiting por IP

---

## 🛡️ PRÁTICAS DE SEGURANÇA OBRIGATÓRIAS

### **1. Input Validation**
```javascript
// ✅ Sempre validar inputs
function validateEventTitle(title) {
  if (!title || title.length < 3 || title.length > 100) {
    throw new Error('Invalid title');
  }
  
  // Remover caracteres perigosos
  return title.replace(/[<>\"\']/g, '');
}
```

### **2. Rate Limiting**
```javascript
// ✅ Limitar requests por usuário
const limiter = {
  create_event: 5, // 5 eventos por hora
  like: 100, // 100 likes por hora
  comment: 50, // 50 comentários por hora
};
```

### **3. HTTPS Everywhere**
```javascript
// ✅ Forçar HTTPS
if (window.location.protocol !== 'https:' && !isDev) {
  window.location.protocol = 'https:';
}
```

### **4. Secure Storage**
```javascript
// ❌ NUNCA usar localStorage para tokens
localStorage.setItem('token', jwt); // INSEGURO!

// ✅ Usar httpOnly cookies (backend set)
// Ou secure IndexedDB com encryption
```

### **5. Content Security Policy**
```html
<!-- Adicionar no HTML head -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline';
               img-src 'self' https: data:;
               connect-src 'self' https://api.sublinx.com;">
```

---

## 🔍 CHECKLIST DE SEGURANÇA PRÉ-PRODUÇÃO

### **Backend**
- [ ] Todas as functions validam autenticação
- [ ] Role-based access control implementado
- [ ] Rate limiting configurado
- [ ] Input validation em ALL endpoints
- [ ] File upload com validação MIME real
- [ ] Logs de auditoria habilitados
- [ ] Backup automático diário
- [ ] Secrets em env vars (não no código)

### **Frontend**
- [ ] DOMPurify em todos user-generated content
- [ ] Protected routes implementadas
- [ ] HTTPS forçado
- [ ] Tokens nunca em localStorage
- [ ] CSP headers configurados
- [ ] Dependencies sem vulnerabilidades (npm audit)
- [ ] Console.logs removidos de produção
- [ ] Error messages não expõem internals

### **Infraestrutura**
- [ ] Firewall configurado
- [ ] CORS restrito a domínios conhecidos
- [ ] SSL/TLS certificates válidos
- [ ] Database backups automáticos
- [ ] Monitoring e alertas ativos
- [ ] DDoS protection (Cloudflare)
- [ ] Penetration testing realizado

---

## 📋 PLANO DE AÇÃO IMEDIATO

### **Hoje (30/11/2025)**
1. ✅ Criar QA_FULL_AUDIT_REPORT.md
2. ✅ Criar CRITICAL_SECURITY_FIXES.md
3. ⏳ Implementar BUG-004 fix (getFeedInteractionsOptimized)
4. ⏳ Adicionar UserPublicProfile view

### **Amanhã (01/12/2025)**
1. Instalar DOMPurify
2. Sanitizar todos comentários/bios
3. Protected routes
4. Backend validation em functions

### **Semana 1**
1. File upload validation
2. Rate limiting
3. CSP headers
4. Security audit completo

---

## 🚨 CONTATO DE EMERGÊNCIA

**Security Lead:** security@sublinx.com  
**Urgente (24/7):** +55 11 99999-9999  
**Bug Bounty:** https://sublinx.com/security

---

**CRÍTICO: Não fazer deploy em produção antes de resolver itens P0!**