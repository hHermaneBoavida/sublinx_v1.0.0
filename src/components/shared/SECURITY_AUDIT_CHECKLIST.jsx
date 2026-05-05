# 🔒 SUBLINX - Security Audit & Penetration Testing Checklist

## SEVERITY LEVELS
- **🔴 CRITICAL**: Immediate fix required, blocks production
- **🟠 HIGH**: Fix before launch, significant risk
- **🟡 MEDIUM**: Fix within 1 week of launch
- **🟢 LOW**: Fix in next sprint, minor risk

---

## 1. AUTHENTICATION & SESSION MANAGEMENT

### Auth Flow Security
- [ ] 🔴 JWT tokens expire (7 days max)
- [ ] 🔴 Refresh tokens implemented and rotated
- [ ] 🔴 Password requirements enforced (Base44 handles this)
- [ ] 🟠 Multi-device session management working
- [ ] 🟠 Session invalidation on logout (all devices option)
- [ ] 🟠 Failed login attempt rate limiting (5 tries, 15 min lockout)
- [ ] 🟡 "Remember me" feature uses secure cookies
- [ ] 🟡 Account lockout after 10 failed attempts (24h)

### Password Security
- [ ] 🔴 Passwords never logged or stored in plaintext
- [ ] 🔴 Password reset tokens expire (1 hour)
- [ ] 🟠 Password reset emails contain no sensitive info
- [ ] 🟡 Password strength indicator on registration
- [ ] 🟢 Breach detection (Have I Been Pwned API integration)

### Test Scripts
```bash
# Test JWT expiration
curl -H "Authorization: Bearer EXPIRED_TOKEN" https://api.sublinx.app/user/profile
# Expected: 401 Unauthorized

# Test rate limiting on login
for i in {1..10}; do curl -X POST https://api.sublinx.app/auth/login -d '{"email":"test@test.com","password":"wrong"}'; done
# Expected: 429 Too Many Requests after 5 attempts

# Test session invalidation
curl -X POST https://api.sublinx.app/auth/logout -H "Authorization: Bearer $TOKEN"
curl -H "Authorization: Bearer $TOKEN" https://api.sublinx.app/user/profile
# Expected: 401 Unauthorized on second call
```

---

## 2. AUTHORIZATION & ACCESS CONTROL

### Role-Based Access Control (RBAC)
- [ ] 🔴 Service role usage audited and minimized
- [ ] 🔴 Organizer-only endpoints protected (`event.organizer_id === user.id`)
- [ ] 🔴 Admin endpoints exist only if absolutely necessary
- [ ] 🟠 User can only access own data (tickets, profile, interactions)
- [ ] 🟠 Ticket validation requires organizer authentication
- [ ] 🟡 Guest list access restricted to event organizer
- [ ] 🟡 Dashboard analytics only show own events

### Test Scripts
```bash
# Attempt to access another user's tickets
curl -H "Authorization: Bearer $USER1_TOKEN" https://api.sublinx.app/tickets?user_id=USER2_ID
# Expected: 403 Forbidden or only USER1's tickets returned

# Attempt to delete another organizer's event
curl -X DELETE https://api.sublinx.app/events/EVENT_ID_FROM_OTHER_ORGANIZER -H "Authorization: Bearer $ORGANIZER_TOKEN"
# Expected: 403 Forbidden

# Attempt to access organizer dashboard as regular user
curl -H "Authorization: Bearer $REGULAR_USER_TOKEN" https://api.sublinx.app/dashboard/metrics
# Expected: 403 Forbidden
```

---

## 3. INPUT VALIDATION & SANITIZATION

### XSS Prevention
- [ ] 🔴 All user inputs sanitized (DOMPurify or similar)
- [ ] 🔴 Content Security Policy (CSP) header configured
- [ ] 🟠 React auto-escaping verified (no `dangerouslySetInnerHTML` without sanitization)
- [ ] 🟡 Rich text editor (react-quill) configured to strip malicious tags

### SQL Injection Prevention
- [ ] 🔴 All queries use parameterized statements (Base44 SDK handles this)
- [ ] 🔴 No string concatenation in queries
- [ ] 🟠 LIKE queries sanitized (`%` and `_` escaped)

### Test Scripts
```bash
# XSS Attempt in Event Title
curl -X POST https://api.sublinx.app/events -H "Authorization: Bearer $TOKEN" -d '{
  "title": "<script>alert(\"XSS\")</script>",
  "description": "Normal description"
}'
# Expected: Sanitized or rejected

# SQL Injection in Search
curl "https://api.sublinx.app/events?search=techno' OR '1'='1"
# Expected: Treated as literal string, no injection

# XSS in Comments
curl -X POST https://api.sublinx.app/comments -H "Authorization: Bearer $TOKEN" -d '{
  "event_id": "123",
  "content": "<img src=x onerror=alert(1)>"
}'
# Expected: HTML tags escaped or stripped
```

---

## 4. DATA PROTECTION & ENCRYPTION

### Sensitive Data Handling
- [ ] 🔴 HTTPS enforced (HSTS header)
- [ ] 🔴 Payment data NEVER stored (tokenization only)
- [ ] 🔴 User location data encrypted at rest (if stored)
- [ ] 🟠 API keys and secrets stored in environment variables (not in code)
- [ ] 🟠 Database backups encrypted
- [ ] 🟡 PII (Personally Identifiable Information) logged minimally
- [ ] 🟡 Email addresses hashed for analytics

### Test Scripts
```bash
# Verify HTTPS enforcement
curl -I http://sublinx.app
# Expected: 301 redirect to https://sublinx.app

# Check HSTS header
curl -I https://sublinx.app | grep -i strict-transport-security
# Expected: Strict-Transport-Security: max-age=31536000; includeSubDomains

# Verify no secrets in response
curl https://api.sublinx.app/config
# Expected: No API keys, database credentials, or internal IPs exposed
```

---

## 5. API SECURITY

### Rate Limiting
- [ ] 🔴 Global rate limit: 1000 req/min per IP
- [ ] 🔴 Authenticated rate limit: 100 req/min per user
- [ ] 🟠 Expensive endpoints: Lower limits (e.g., AI recommendations: 10/min)
- [ ] 🟡 Rate limit headers returned (`X-RateLimit-Remaining`)

### API Request Validation
- [ ] 🔴 JSON schema validation on all POST/PUT endpoints
- [ ] 🔴 File upload size limits enforced (10MB max)
- [ ] 🟠 File type validation (images: jpg, png, webp only)
- [ ] 🟡 Request body size limit (1MB max)

### Test Scripts
```bash
# Test rate limiting
for i in {1..150}; do curl https://api.sublinx.app/events; done
# Expected: 429 Too Many Requests after ~100 requests

# Test file upload size
dd if=/dev/zero of=large_file.jpg bs=1M count=20
curl -X POST https://api.sublinx.app/upload -F "file=@large_file.jpg" -H "Authorization: Bearer $TOKEN"
# Expected: 413 Payload Too Large

# Test invalid JSON schema
curl -X POST https://api.sublinx.app/events -H "Authorization: Bearer $TOKEN" -d '{"title": 123}'
# Expected: 400 Bad Request with validation error
```

---

## 6. THIRD-PARTY INTEGRATIONS

### Payment Gateway Security
- [ ] 🔴 Webhook signature verification (Stripe/Mercadopago)
- [ ] 🔴 Webhook replay attack prevention (timestamp + nonce)
- [ ] 🟠 Payment status checked server-side (never trust client)
- [ ] 🟡 PCI DSS compliance if handling card data (use tokenization)

### AI/LLM Security
- [ ] 🔴 LLM API keys stored securely (service role only)
- [ ] 🟠 User prompts sanitized (prevent prompt injection)
- [ ] 🟡 Rate limiting on AI recommendations (10 req/min per user)
- [ ] 🟡 Response validation (schema enforcement)

### Google Maps API
- [ ] 🔴 API key restricted by HTTP referrer
- [ ] 🟠 API key restricted to specific endpoints (Maps JS API, Geocoding)
- [ ] 🟡 Daily quota limits set ($100/day max)

### Test Scripts
```bash
# Test webhook signature validation
curl -X POST https://api.sublinx.app/webhooks/payment -d '{"event": "payment.success"}' -H "X-Signature: INVALID_SIGNATURE"
# Expected: 401 Unauthorized

# Test API key restriction
curl "https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY" -H "Referer: https://malicious-site.com"
# Expected: Request blocked or error
```

---

## 7. FRONTEND SECURITY

### Client-Side Storage
- [ ] 🔴 No sensitive data in localStorage/sessionStorage
- [ ] 🔴 JWT tokens stored in httpOnly cookies (if possible) or secure localStorage
- [ ] 🟠 localStorage cleared on logout
- [ ] 🟡 IndexedDB used for cached data (not sensitive)

### Content Security Policy
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://maps.googleapis.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://api.sublinx.app wss://api.sublinx.app;
  font-src 'self' https://fonts.gstatic.com;
  frame-src 'self';
">
```

### Test Scripts
```javascript
// Check if sensitive data in localStorage
Object.keys(localStorage).forEach(key => {
  if (key.includes('password') || key.includes('secret')) {
    console.error('SECURITY ISSUE: Sensitive data in localStorage:', key);
  }
});

// Verify CSP violations are reported
// Open DevTools Console → Should see CSP warnings for violations
```

---

## 8. INFRASTRUCTURE SECURITY

### Server Configuration
- [ ] 🔴 Firewall rules: Only ports 80, 443 exposed
- [ ] 🔴 SSH disabled or key-based auth only
- [ ] 🟠 Server hardening: Disable unused services
- [ ] 🟡 Automatic security updates enabled
- [ ] 🟡 DDoS protection (Cloudflare/AWS Shield)

### Database Security
- [ ] 🔴 Database not publicly accessible
- [ ] 🔴 Strong database password (32+ chars, random)
- [ ] 🟠 Database connection encrypted (SSL)
- [ ] 🟡 Database user has minimal permissions (no DROP, TRUNCATE)
- [ ] 🟡 Backup verification: Restore test monthly

### Environment Variables
```bash
# Check for exposed secrets
git log --all --full-history --source -- "*env*" "*secret*" "*key*"
# Expected: No .env files committed

# Verify secrets are not in client bundle
grep -r "sk_live_" build/
# Expected: No matches
```

---

## 9. LOGGING & MONITORING

### Security Event Logging
- [ ] 🔴 Failed login attempts logged
- [ ] 🔴 Unauthorized access attempts logged
- [ ] 🟠 Payment failures logged
- [ ] 🟡 Suspicious activity patterns detected (e.g., rapid API calls)

### What NOT to Log
- [ ] 🔴 Passwords (even hashed)
- [ ] 🔴 Credit card numbers
- [ ] 🔴 Full JWT tokens
- [ ] 🟠 Full user email in public logs
- [ ] 🟡 User location coordinates

### Alerting
```yaml
# Example alert configuration
alerts:
  - name: Multiple Failed Logins
    condition: failed_login_count > 10 in 5 minutes
    action: notify_slack, block_ip
    
  - name: Unauthorized Access Attempt
    condition: http_status == 403 AND count > 50 in 1 minute
    action: notify_security_team
    
  - name: Unusual Payment Activity
    condition: payment_failure_rate > 10% in 1 hour
    action: notify_admin, pause_payments
```

---

## 10. COMPLIANCE & PRIVACY

### GDPR Compliance (EU)
- [ ] 🔴 Privacy policy published and linked
- [ ] 🔴 Cookie consent banner (functional vs analytics)
- [ ] 🟠 User data export functionality
- [ ] 🟠 User data deletion functionality (right to be forgotten)
- [ ] 🟡 Data processing agreements with third parties
- [ ] 🟡 Data breach notification plan (72h)

### LGPD Compliance (Brazil)
- [ ] 🔴 User consent for data collection
- [ ] 🔴 Transparent data usage policy
- [ ] 🟠 Data controller designated (DPO)
- [ ] 🟡 Data retention policy (2 years inactive → deletion)

### User Rights Implementation
```javascript
// Data Export API
POST /api/user/export-data
Response: {
  "user_profile": {...},
  "tickets": [...],
  "events_created": [...],
  "interactions": [...],
  "chat_history": [...]
}

// Data Deletion API
DELETE /api/user/delete-account
Response: {
  "status": "scheduled",
  "deletion_date": "2025-01-10"
}
```

---

## 11. PENETRATION TESTING

### OWASP Top 10 Checklist
- [ ] 🔴 **A01: Broken Access Control** - Test authorization bypasses
- [ ] 🔴 **A02: Cryptographic Failures** - Test HTTPS, encryption
- [ ] 🔴 **A03: Injection** - Test SQL, NoSQL, XSS, command injection
- [ ] 🟠 **A04: Insecure Design** - Review authentication flow, business logic
- [ ] 🟠 **A05: Security Misconfiguration** - Test default credentials, debug mode
- [ ] 🟡 **A06: Vulnerable Components** - Run `npm audit`, update dependencies
- [ ] 🟡 **A07: Identification & Auth Failures** - Test session management
- [ ] 🟡 **A08: Software & Data Integrity Failures** - Verify CI/CD security
- [ ] 🟢 **A09: Security Logging Failures** - Ensure critical events logged
- [ ] 🟢 **A10: Server-Side Request Forgery (SSRF)** - Test API proxy endpoints

### Automated Security Scans
```bash
# Dependency vulnerabilities
npm audit --audit-level=high

# OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://sublinx.app

# SSL/TLS configuration
testssl.sh https://sublinx.app

# Subdomain takeover check
subjack -w subdomains.txt -t 100 -timeout 30 -o results.txt
```

---

## 12. INCIDENT RESPONSE PLAN

### Security Breach Procedure
1. **Detect**: Monitoring alerts → Security team notified
2. **Contain**: Isolate affected systems, revoke compromised tokens
3. **Investigate**: Review logs, identify attack vector
4. **Eradicate**: Patch vulnerability, remove malicious code
5. **Recover**: Restore from clean backup, verify integrity
6. **Post-Incident**: Document lessons learned, update security measures

### Responsible Disclosure
- Security email: security@sublinx.app
- Bug bounty program (optional): HackerOne/Bugcrowd
- Response SLA: 
  - Critical: 4 hours
  - High: 24 hours
  - Medium: 1 week

---

## ✅ SECURITY AUDIT SIGN-OFF

**Critical Issues (🔴)**: _____ / _____ Resolved

**High Issues (🟠)**: _____ / _____ Resolved

**Medium Issues (🟡)**: _____ / _____ Resolved

**Low Issues (🟢)**: _____ / _____ Resolved

**Penetration Test**: ☐ PASSED ☐ FAILED

**OWASP Top 10**: ☐ VALIDATED

**Production Ready**: ☐ YES ☐ NO

**SECURITY LEAD**: _________________

**DATE**: _________________

**NEXT AUDIT DATE**: _________________