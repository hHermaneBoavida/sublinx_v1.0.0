# 📱 SUBLINX - PWA Store Deployment Guide

## PWA vs Native App Decision

**SUBLINX is a Progressive Web App (PWA)**, not a native React Native app. Here's the deployment strategy:

---

## 1. PWA OPTIMIZATION CHECKLIST

### Service Worker Configuration
```javascript
// public/service-worker.js
const CACHE_NAME = 'sublinx-v1.0.0';
const urlsToCache = [
  '/',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Fetch event - network first, cache fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
```

### Manifest.json Configuration
```json
{
  "name": "SUBLINX - Underground Events",
  "short_name": "SUBLINX",
  "description": "Descubra eventos underground, raves e cultura eletrônica na sua cidade",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#06b6d4",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshot-mobile-1.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshot-desktop-1.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "shortcuts": [
    {
      "name": "Mapa de Eventos",
      "url": "/mapa",
      "icons": [{ "src": "/icon-map-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "Feed",
      "url": "/feed",
      "icons": [{ "src": "/icon-feed-96x96.png", "sizes": "96x96" }]
    }
  ],
  "categories": ["entertainment", "social", "music", "lifestyle"],
  "iarc_rating_id": "e84b072d-71b3-4d3e-86ae-31a8ce4e53b7"
}
```

---

## 2. ASSET REQUIREMENTS

### Icon Sizes (All Required)
| Size | Purpose | File |
|------|---------|------|
| 512×512 | Primary icon | icon-512x512.png |
| 512×512 | Maskable (safe zone) | icon-maskable-512x512.png |
| 192×192 | Android home screen | icon-192x192.png |
| 144×144 | Windows tiles | icon-144x144.png |
| 96×96 | iOS bookmark | icon-96x96.png |
| 72×72 | Legacy Android | icon-72x72.png |
| 48×48 | Favicon | icon-48x48.png |
| 32×32 | Browser tab | favicon-32x32.png |
| 16×16 | Browser tab | favicon-16x16.png |

**Design Guidelines**:
- Maskable icon: Content in safe zone (80% of canvas)
- High contrast, recognizable at small sizes
- Transparent or solid background (match theme_color)
- SVG source for future updates

### Screenshots (6+ Required)
**Mobile (750×1334 or higher)**:
1. Home/Map view with events
2. Event details modal
3. Feed with recommendations
4. User profile/tickets
5. Chat/community feature
6. AI recommendations highlight

**Desktop (1920×1080)**:
1. Map with clustering
2. Dashboard (organizer view)
3. Analytics/reports

**Format**: PNG, max 8MB each

---

## 3. GOOGLE PLAY STORE (PWA via TWA)

### Trusted Web Activity Setup

**Step 1: Install Bubblewrap**
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://sublinx.app/manifest.json
```

**Step 2: Configure TWA**
```json
// twa-manifest.json
{
  "packageId": "com.sublinx.app",
  "host": "sublinx.app",
  "name": "SUBLINX",
  "launcherName": "SUBLINX",
  "display": "standalone",
  "themeColor": "#06b6d4",
  "navigationColor": "#000000",
  "backgroundColor": "#000000",
  "enableNotifications": true,
  "startUrl": "/",
  "iconUrl": "https://sublinx.app/icon-512x512.png",
  "maskableIconUrl": "https://sublinx.app/icon-maskable-512x512.png",
  "splashScreenFadeOutDuration": 300,
  "signingKey": {
    "path": "./android.keystore",
    "alias": "sublinx"
  },
  "appVersionName": "1.0.0",
  "appVersionCode": 1,
  "shortcuts": [
    {
      "name": "Mapa",
      "short_name": "Mapa",
      "url": "/mapa",
      "icon": "https://sublinx.app/icon-map-96x96.png"
    }
  ],
  "minSdkVersion": 24,
  "targetSdkVersion": 34
}
```

**Step 3: Build APK**
```bash
bubblewrap build
# Generates: app-release-signed.apk
```

**Step 4: Play Store Console**
1. Create app: https://play.google.com/console
2. App details:
   - **Name**: SUBLINX - Underground Events
   - **Short description**: Descubra raves, eventos underground e cultura eletrônica
   - **Full description**: (500+ characters, keyword optimized)
   - **Category**: Entertainment > Events
   - **Tags**: eventos, festas, underground, techno, house, rave
3. Upload APK
4. Content rating: Complete questionnaire (likely 16+/18+)
5. Target audience: 18+
6. Privacy policy: https://sublinx.app/privacy
7. Data safety: Declare location, payment, user data collection
8. Pricing: Free (with in-app purchases if applicable)

### Digital Asset Links (Required)
```json
// public/.well-known/assetlinks.json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.sublinx.app",
    "sha256_cert_fingerprints": [
      "SHA256_FINGERPRINT_FROM_KEYSTORE"
    ]
  }
}]
```

**Get SHA256**:
```bash
keytool -list -v -keystore android.keystore -alias sublinx
```

---

## 4. APPLE APP STORE (PWA via PWABuilder)

### PWA to iOS App

**Step 1: Use PWABuilder**
1. Go to https://www.pwabuilder.com/
2. Enter URL: https://sublinx.app
3. Click "Package for App Stores"
4. Select "iOS" → Download Xcode project

**Step 2: Xcode Configuration**
```swift
// Info.plist additions
<key>NSLocationWhenInUseUsageDescription</key>
<string>SUBLINX precisa da sua localização para mostrar eventos próximos</string>

<key>NSCameraUsageDescription</key>
<string>Tire fotos para compartilhar nos eventos</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Selecione fotos para seu perfil ou evento</string>

<key>NSUserNotificationUsageDescription</key>
<string>Receba alertas sobre eventos próximos e novidades</string>
```

**Step 3: App Store Connect**
1. Create app: https://appstoreconnect.apple.com/
2. App information:
   - **Name**: SUBLINX
   - **Subtitle**: Underground Events & Culture
   - **Primary Category**: Entertainment > Events
   - **Secondary Category**: Social Networking
   - **Age Rating**: 17+ (due to nightlife content)
3. Upload screenshots (6.7", 6.5", 5.5" required)
4. Upload app preview video (15-30s, portrait)
5. Keywords: eventos,underground,rave,techno,house,festas,balada
6. Privacy policy URL: https://sublinx.app/privacy
7. Support URL: https://sublinx.app/support

### Screenshots for iOS
**Required Sizes**:
- iPhone 6.7" (1290×2796): iPhone 14 Pro Max, 15 Plus
- iPhone 6.5" (1242×2688): iPhone 11 Pro Max, XS Max
- iPhone 5.5" (1242×2208): iPhone 8 Plus

**Tip**: Use Figma/Sketch with device frames + actual app screenshots

---

## 5. OPTIMIZATION FOR PWA

### Performance Budget
```javascript
// webpack.config.js
module.exports = {
  performance: {
    maxAssetSize: 500000, // 500KB
    maxEntrypointSize: 500000,
    hints: 'error'
  }
};
```

### Lighthouse Score Requirements
| Category | Target |
|----------|--------|
| Performance | 90+ |
| Accessibility | 90+ |
| Best Practices | 95+ |
| SEO | 95+ |
| PWA | ✅ All checks |

### Caching Strategy
```javascript
// Network-first for API calls
const apiCache = 'api-cache-v1';
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(apiCache).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});

// Cache-first for static assets
const staticCache = 'static-v1';
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/static/')) {
    event.respondWith(
      caches.match(event.request).then((response) => response || fetch(event.request))
    );
  }
});
```

---

## 6. ANALYTICS & MONITORING

### Install Tracking
```javascript
// Track PWA installations
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
  
  // Show custom install button
  document.getElementById('install-btn').style.display = 'block';
  
  // Track prompt shown
  gtag('event', 'pwa_prompt_shown');
});

window.addEventListener('appinstalled', () => {
  gtag('event', 'pwa_installed');
});
```

### Usage Analytics
```javascript
// Track PWA vs browser usage
if (window.matchMedia('(display-mode: standalone)').matches) {
  gtag('event', 'pwa_launched');
} else {
  gtag('event', 'browser_launched');
}
```

---

## 7. STORE LISTING OPTIMIZATION (ASO)

### Keywords Strategy
**Primary**: eventos underground, rave, techno, house, festas eletrônicas
**Secondary**: balada, festa, DJ, música eletrônica, cultura underground
**Long-tail**: eventos de techno em são paulo, raves underground, festas secretas

### Description Template (PT-BR)
```
🎵 SUBLINX - O app definitivo para cultura underground

Descubra os melhores eventos de música eletrônica, raves e festas underground na sua cidade. SUBLINX conecta você à cena underground com:

✨ RECURSOS PRINCIPAIS:
• 🗺️ Mapa interativo com eventos próximos
• 🎯 Recomendações personalizadas por IA
• 🎫 Compra de ingressos integrada
• 💬 Chat em tempo real com outros ravers
• 📸 Compartilhe momentos com a comunidade
• 🔒 Eventos secretos e exclusivos

🎧 PARA AMANTES DE:
Techno, House, Trance, Drum & Bass, Dubstep, Ambient, Minimal, Funk, Trap

🏆 POR QUE SUBLINX?
• Descubra eventos que combinam com seu estilo
• Conecte-se com a comunidade underground
• Acesso antecipado a eventos exclusivos
• Sistema de pontos e recompensas
• Avaliações e reviews de eventos

📍 Disponível em São Paulo, Rio de Janeiro e principais cidades do Brasil.

🌐 Junte-se à revolução underground. Baixe SUBLINX agora!

---
Privacy: https://sublinx.app/privacy
Termos: https://sublinx.app/terms
```

---

## 8. COMPLIANCE & LEGAL

### Age Restrictions
- **Google Play**: 16+ (alcohol/nightlife references)
- **App Store**: 17+ (frequent/intense alcohol references)

### Content Rating (IARC)
1. Complete questionnaire at https://www.globalratings.com/
2. Questions to answer:
   - Violence: None
   - Nudity: None
   - Profanity: Mild (user-generated content)
   - Controlled substances: References to alcohol/nightlife
   - Gambling: None
   - User interaction: Yes (chat, comments)
   - Location sharing: Yes
   - User-generated content: Yes (moderated)

### Privacy Policy Requirements
Must include:
- Data collected: Location, email, photos, usage analytics
- How data is used: Recommendations, event discovery, analytics
- Third-party sharing: Payment processors, analytics (GA4, Sentry)
- Data retention: 2 years inactive → deletion
- User rights: Access, deletion, export (GDPR/LGPD)
- Cookies: Functional, analytics (with consent)
- Contact: privacy@sublinx.app

---

## 9. SUBMISSION CHECKLIST

### Pre-Submission
- [ ] App tested on real devices (iOS 15+, Android 11+)
- [ ] All links work (privacy, terms, support)
- [ ] Screenshots are localized (PT-BR)
- [ ] Video preview is engaging (< 30s)
- [ ] Test account credentials provided
- [ ] App icon passes guidelines (no transparency, no rounded corners on source)
- [ ] Metadata is keyword-optimized
- [ ] Age rating determined
- [ ] Content disclaimer added (if nightlife/18+)

### Google Play
- [ ] APK uploaded (arm64-v8a + armeabi-v7a)
- [ ] Short description (< 80 chars)
- [ ] Full description (4000 chars)
- [ ] 2 screenshots minimum (8 recommended)
- [ ] High-res icon (512×512)
- [ ] Feature graphic (1024×500)
- [ ] Privacy policy URL
- [ ] Content rating certificate
- [ ] Target API level 33+ (Android 13)
- [ ] App signing by Google Play

### App Store
- [ ] IPA uploaded via Xcode/Transporter
- [ ] 6.7", 6.5", 5.5" screenshots (3+ each)
- [ ] App preview video (optional but recommended)
- [ ] Promotional text (170 chars)
- [ ] Keywords (100 chars, comma-separated)
- [ ] Support URL
- [ ] Marketing URL (optional)
- [ ] Privacy policy URL
- [ ] App review information: demo account, notes
- [ ] Export compliance: No encryption (or declare)

---

## 10. POST-LAUNCH MONITORING

### First 48 Hours
- Monitor crash-free rate (target: 99%+)
- Track install conversions (target: 30%+ from page views)
- Watch app reviews/ratings (respond within 24h)
- Check server load (auto-scaling working?)
- Verify payment flows (0 failed transactions)

### Weekly Reviews
- App Store ratings: Maintain 4.5+ stars
- User feedback: Categorize feature requests vs bugs
- Crash analytics: Fix P0/P1 within 48h
- Performance: Lighthouse score weekly
- Competitor analysis: Monitor similar apps

---

## ✅ DEPLOYMENT SIGN-OFF

**PWA Optimized**: ☐ YES ☐ NO

**Store Assets Ready**: ☐ YES ☐ NO

**Legal Compliance**: ☐ YES ☐ NO

**Performance Validated**: ☐ YES ☐ NO

**SUBMITTED TO STORES**: 
- Google Play: ☐ SUBMITTED ☐ APPROVED (Date: ______)
- App Store: ☐ SUBMITTED ☐ APPROVED (Date: ______)

**SIGNED BY**: _________________

**DATE**: _________________