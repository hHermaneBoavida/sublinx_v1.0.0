# 📱 SUBLINX - CHECKLIST COMPLETO DE PUBLICAÇÃO
**Versão:** 2.2 Pre-Launch  
**Última Atualização:** 30/11/2025

---

## 🎯 OVERVIEW

Este documento contém **TODOS** os passos necessários para publicar o SUBLINX nas lojas de aplicativos, sem risco de reprovação.

---

## ✅ PRÉ-REQUISITOS (ANTES DE ENVIAR)

### **1. Build e Testes**
- [ ] Build de produção sem erros
- [ ] Todos os testes passando (95%+ cobertura)
- [ ] Testado em 5+ dispositivos reais
- [ ] Testado em iOS 15+, 16, 17
- [ ] Testado em Android 12, 13, 14
- [ ] Performance Score > 85 (Lighthouse)
- [ ] Sem memory leaks (testado com DevTools)
- [ ] Cold start < 2.5s

### **2. Assets Obrigatórios**
- [ ] Ícone 1024x1024 (iOS, sem alpha)
- [ ] Ícone 512x512 (Android)
- [ ] Screenshots iPhone 6.7" (mínimo 3)
- [ ] Screenshots iPhone 5.5" (mínimo 3)
- [ ] Screenshots iPad 12.9" (mínimo 2)
- [ ] Screenshots Android Phone (mínimo 2)
- [ ] Screenshots Android Tablet (mínimo 2)
- [ ] Feature Graphic 1024x500 (Google Play)
- [ ] Vídeo promocional 15-30s (opcional)

### **3. Legal**
- [ ] Política de Privacidade publicada (URL pública)
- [ ] Termos de Serviço publicados (URL pública)
- [ ] Email de suporte configurado
- [ ] Conta de desenvolvedor ativa (Apple + Google)
- [ ] Certificados de distribuição válidos

---

## 🍎 APPLE APP STORE

### **Passo 1: App Store Connect**
1. Acesse: https://appstoreconnect.apple.com
2. Clique em "My Apps" → "+" → "New App"
3. Preencha:
   - **Platform:** iOS
   - **Name:** SUBLINX - Underground Events
   - **Primary Language:** Portuguese (Brazil)
   - **Bundle ID:** com.sublinx.app
   - **SKU:** SUBLINX001

### **Passo 2: App Information**
```
Name: SUBLINX - Underground Events
Subtitle: Descubra raves e eventos secretos perto de você
Category: 
  Primary: Lifestyle
  Secondary: Entertainment

Age Rating:
  - Alcohol, Tobacco, or Drug Use: Infrequent/Mild
  - Profanity or Crude Humor: None
  - Sexual Content: None
  - Violence: None
  - Horror/Fear Themes: None
  
  Result: 17+ (devido a eventos noturnos/álcool)
```

### **Passo 3: Pricing and Availability**
- [ ] **Price:** Free (Gratuito)
- [ ] **Availability:** All Countries/Regions
- [ ] **Pre-Order:** No

### **Passo 4: Privacy**
```markdown
Privacy Policy URL: https://sublinx.com/privacy
Privacy Manifest (PrivacyInfo.xcprivacy):

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>Precisamos da sua localização para mostrar eventos próximos a você</string>
    
    <key>NSCameraUsageDescription</key>
    <string>Permita o acesso à câmera para tirar fotos e criar reels de eventos</string>
    
    <key>NSPhotoLibraryUsageDescription</key>
    <string>Permita o acesso às fotos para fazer upload de imagens nos eventos</string>
    
    <key>NSUserTrackingUsageDescription</key>
    <string>Usamos apenas analytics anônimo para melhorar o app. Sem tracking de terceiros.</string>
</dict>
</plist>

Data Collection:
✅ Location Data: For showing nearby events
✅ Photos/Videos: User-uploaded content (optional)
✅ Contact Info: Email, name for account
✅ Usage Data: Analytics (anonymous)

Data Linked to User:
✅ Email, Name, Location (precise)

Third-Party Sharing:
❌ We do NOT share data with third parties
✅ Analytics only (first-party)
```

### **Passo 5: App Review Information**
```
Contact Information:
  First Name: [Seu Nome]
  Last Name: [Sobrenome]
  Phone: +55 11 99999-9999
  Email: support@sublinx.com

Demo Account:
  Username: reviewer@sublynx.com
  Password: Demo123!Review

Notes:
"SUBLINX é um app de descoberta de eventos underground.
Para testar completamente:
1. Permitir acesso à localização
2. Explorar o mapa de eventos (eventos demo pré-carregados)
3. Dar like/comentar em eventos
4. Ver perfil e ingressos salvos

Conta demo tem acesso completo a todas funcionalidades.
Todos eventos são fictícios para review."

Attachments:
- demo_walkthrough.pdf (opcional)
```

### **Passo 6: Version Information**
```
Version: 1.0
Copyright: 2025 SUBLINX Inc.
Trade Representative Contact: (mesmo do support)

What's New in This Version:
"🎉 Primeira versão do SUBLINX!

✨ Funcionalidades:
• Mapa interativo de eventos underground
• Feed de eventos personalizado
• Sistema de reels para eventos
• Perfil com ingressos digitais
• Notificações de eventos próximos
• Modo offline com sincronização

Encontre raves, festas secretas e eventos alternativos perto de você!"

Keywords: (máximo 100 caracteres)
rave,techno,underground,festa,evento,balada,show,música,eletrônica,dj
```

### **Passo 7: Build Upload**
```bash
# 1. Archive no Xcode
Product → Archive

# 2. Validate Archive
Window → Organizer → Distribute App → Validation

# 3. Upload to App Store
Distribute App → App Store Connect → Upload

# 4. Aguardar processamento (15-30min)
```

### **Passo 8: Screenshots**
```
iPhone 6.7" (Pro Max):
- Screenshot 1: Mapa com eventos
- Screenshot 2: Feed de eventos
- Screenshot 3: Detalhes de evento
- Screenshot 4: Perfil com tickets
- Screenshot 5: Reels view (opcional)

iPhone 5.5":
- Screenshot 1: Mapa
- Screenshot 2: Feed
- Screenshot 3: Perfil

iPad 12.9":
- Screenshot 1: Mapa (landscape)
- Screenshot 2: Feed (portrait)

DICA: Use Figma ou Rotato para gerar screenshots profissionais
```

### **Passo 9: Submit for Review**
- [ ] Revisar TODOS os campos
- [ ] Confirmar screenshots corretos
- [ ] Verificar demo account funciona
- [ ] Clicar em "Submit for Review"
- [ ] Aguardar (1-3 dias úteis)

### **Passo 10: Possíveis Rejeições e Como Resolver**
```
Rejeição: "App crashes on launch"
Solução: Testar cold start, remover console.logs

Rejeição: "Metadata incorrect"
Solução: Screenshots devem corresponder ao app

Rejeição: "Missing functionality"
Solução: Demo account deve ter acesso total

Rejeição: "Privacy policy invalid"
Solução: URL deve estar acessível publicamente

Rejeição: "Spam/duplicação"
Solução: Mostrar diferenciais únicos do app
```

---

## 🤖 GOOGLE PLAY STORE

### **Passo 1: Google Play Console**
1. Acesse: https://play.google.com/console
2. "Create app"
3. Preencha:
   - **App name:** SUBLINX - Eventos Underground
   - **Default language:** Portuguese (Brazil)
   - **App or game:** App
   - **Free or paid:** Free

### **Passo 2: Store Listing**
```
App name: SUBLINX - Eventos Underground

Short description (80 chars):
Descubra raves e festas secretas perto de você 🎉

Full description (4000 chars):
🎵 SUBLINX - O App Definitivo para Eventos Underground

Cansado de perder as melhores raves e festas secretas? 
O SUBLINX conecta você aos eventos alternativos mais incríveis da sua cidade!

✨ FUNCIONALIDADES:

📍 MAPA INTERATIVO
• Veja todos os eventos underground próximos
• Filtros por gênero: techno, house, trance, drum&bass
• Descubra eventos secretos exclusivos
• Navegação com GPS integrado

🎉 FEED PERSONALIZADO
• Eventos recomendados baseados no seu gosto
• Sistema de likes e comentários
• Compartilhe experiências com a comunidade
• Salve eventos para lembrar depois

🎬 REELS DE EVENTOS
• Assista vídeos dos eventos antes de ir
• Poste seus próprios reels
• Veja o clima da festa em tempo real

🎫 INGRESSOS DIGITAIS
• Compre ingressos direto no app
• QR Code para entrada rápida
• Histórico de eventos frequentados
• Sistema de cashback e recompensas

🔔 NOTIFICAÇÕES INTELIGENTES
• Alertas de eventos próximos à sua localização
• Lembrete de eventos salvos
• Avisos quando artistas favoritos tocam perto

🎨 PERFIL PERSONALIZADO
• Badges e conquistas
• Estatísticas de eventos
• Conexão com amigos
• Preferências musicais

💎 PLANOS PREMIUM:
• Acesso a eventos secretos VIP
• Prioridade em guest lists
• Descontos exclusivos
• Chat direto com organizadores

🎧 GÊNEROS SUPORTADOS:
Techno • House • Trance • Drum&Bass • Dubstep • Hardstyle
Funk • Trap • Hip-Hop • Reggae • Samba • Pagode

Baixe agora e mergulhe na cena underground! 🚀

#underground #rave #techno #festa #balada #evento

Categories:
  Primary: Lifestyle
  Secondary: Entertainment

Contact:
  Email: support@sublinx.com
  Website: https://sublinx.com
  Phone: +55 11 99999-9999

Privacy Policy: https://sublinx.com/privacy
```

### **Passo 3: Graphic Assets**
- [ ] **App icon:** 512x512 (PNG, sem alpha)
- [ ] **Feature graphic:** 1024x500 (JPEG/PNG)
- [ ] **Screenshots:** Mínimo 2 (Phone)
- [ ] **Screenshots Tablet:** Opcional mas recomendado
- [ ] **Promotional video:** Opcional (YouTube link)

### **Passo 4: Categorization**
```
App:
  Category: Events
  Tags: underground, rave, techno, eventos, festas

Content rating:
  Target age group: 18+
  Questionnaire:
    - Violence: No
    - Sexual content: No
    - Profanity: No
    - Controlled substances: References to alcohol (events context)
    - User-generated content: Yes (moderated)
  
  Result: PEGI 18 / ESRB Mature (17+)
```

### **Passo 5: App Content**
```
Privacy Policy: https://sublinx.com/privacy

Data Safety:
  Data collected:
    ✅ Location (precise): For showing nearby events
    ✅ Photos and videos: User uploads (optional)
    ✅ Personal info: Name, email
    ✅ App activity: Likes, favorites, comments
  
  Data shared:
    ❌ No data shared with third parties
  
  Security practices:
    ✅ Data encrypted in transit
    ✅ Data encrypted at rest
    ✅ You can request data deletion
  
  Data usage:
    ✅ App functionality
    ✅ Analytics
    ✅ Personalization
```

### **Passo 6: Target Audience and Content**
```
Target age group: 18+

Content declarations:
  - Ads: No
  - In-app purchases: Yes (premium plans)
  - User-generated content: Yes
  - Share location: Yes
  - Sensitive content: Mild (alcohol references)

Government app: No
COVID-19 contact tracing: No
```

### **Passo 7: App Access**
```
Access type: All features are available without restrictions

Special access:
  - Demo account for testing
  
Instructions for reviewers:
"Login com:
Email: reviewer@sublynx.com
Senha: Demo123!Review

O app requer permissões de:
- Localização (para mapa de eventos)
- Câmera/Fotos (para upload de reels)
- Notificações (para alertas)

Eventos demo pré-carregados para teste."
```

### **Passo 8: Technical Details**
```
Target SDK: 34 (Android 14)
Minimum SDK: 24 (Android 7.0)

Release type:
  - Production track (após beta testing)
  OR
  - Internal/Closed testing primeiro

App signing:
  ✅ Google Play App Signing (recomendado)
  
Release name: 1.0.0 (build 1)

Release notes:
"🎉 Primeira versão do SUBLINX!

Novidades:
✨ Mapa interativo de eventos
🎉 Feed personalizado
🎬 Reels de eventos
🎫 Ingressos digitais
🔔 Notificações inteligentes
💎 Sistema de recompensas

Encontre as melhores raves e festas secretas!"
```

### **Passo 9: Build Upload**
```bash
# 1. Gerar bundle AAB (não APK!)
./gradlew bundleRelease

# 2. Assinar bundle
jarsigner -verbose -sigalg SHA256withRSA \
  -digestalg SHA-256 \
  -keystore release.keystore \
  app-release.aab \
  alias_name

# 3. Upload via Play Console
App releases → Production → Create new release
→ Upload AAB → Review and rollout

# 4. Enviar para review (24-48h)
```

### **Passo 10: Pre-Launch Report**
```
Depois do upload, Google testa automaticamente em:
- 20+ dispositivos reais
- Diferentes versões Android
- Accessibility checks
- Performance tests

Aguardar resultado (2-6h) antes de publicar
Resolver issues críticos se houver
```

---

## 🔒 POLÍTICA DE PRIVACIDADE (TEMPLATE)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>SUBLINX - Política de Privacidade</title>
</head>
<body>
    <h1>Política de Privacidade - SUBLINX</h1>
    <p>Última atualização: 30/11/2025</p>
    
    <h2>1. Dados Coletados</h2>
    <p>Coletamos as seguintes informações:</p>
    <ul>
        <li><strong>Informações de Conta:</strong> Nome, email, senha (criptografada)</li>
        <li><strong>Localização:</strong> Localização precisa (GPS) para mostrar eventos próximos</li>
        <li><strong>Conteúdo do Usuário:</strong> Fotos, vídeos, comentários (upload opcional)</li>
        <li><strong>Dados de Uso:</strong> Eventos visualizados, likes, saves (analytics anônimo)</li>
    </ul>
    
    <h2>2. Como Usamos os Dados</h2>
    <ul>
        <li>Personalizar recomendações de eventos</li>
        <li>Mostrar eventos próximos à sua localização</li>
        <li>Melhorar a experiência do app</li>
        <li>Enviar notificações relevantes (com seu consentimento)</li>
        <li>Analytics interno (sem identificação pessoal)</li>
    </ul>
    
    <h2>3. Compartilhamento de Dados</h2>
    <p><strong>NÃO</strong> compartilhamos seus dados pessoais com terceiros, exceto:</p>
    <ul>
        <li>Quando exigido por lei</li>
        <li>Para processar pagamentos (Stripe - dados criptografados)</li>
        <li>Analytics anônimo (Google Analytics)</li>
    </ul>
    
    <h2>4. Seus Direitos</h2>
    <p>Você tem direito a:</p>
    <ul>
        <li>Acessar seus dados</li>
        <li>Corrigir informações incorretas</li>
        <li>Deletar sua conta e todos os dados</li>
        <li>Exportar seus dados (formato JSON)</li>
        <li>Revogar permissões (localização, câmera)</li>
    </ul>
    
    <h2>5. Segurança</h2>
    <ul>
        <li>Dados criptografados em trânsito (HTTPS)</li>
        <li>Senhas com hash bcrypt</li>
        <li>Infraestrutura segura (Firebase)</li>
        <li>Backup diário de dados</li>
    </ul>
    
    <h2>6. Cookies</h2>
    <p>Usamos cookies apenas para:</p>
    <ul>
        <li>Manter sessão de login</li>
        <li>Preferências do app (tema, idioma)</li>
    </ul>
    
    <h2>7. Menores de Idade</h2>
    <p>O app é para maiores de 18 anos. Não coletamos dados de menores intencionalmente.</p>
    
    <h2>8. Contato</h2>
    <p>Para dúvidas sobre privacidade:</p>
    <ul>
        <li>Email: privacy@sublinx.com</li>
        <li>Telefone: +55 11 99999-9999</li>
    </ul>
    
    <h2>9. Alterações</h2>
    <p>Esta política pode ser atualizada. Notificaremos sobre mudanças significativas.</p>
</body>
</html>
```

---

## 📝 TERMOS DE SERVIÇO (TEMPLATE)

```markdown
# Termos de Serviço - SUBLINX

Última atualização: 30/11/2025

## 1. Aceitação dos Termos
Ao usar o SUBLINX, você concorda com estes termos.

## 2. Uso do Serviço
- Você deve ter 18+ anos
- Não postar conteúdo ilegal, ofensivo ou spam
- Não usar o app para atividades ilegais
- Respeitar direitos autorais

## 3. Conteúdo do Usuário
- Você mantém propriedade do que posta
- Nos concede licença para exibir seu conteúdo
- Podemos remover conteúdo inadequado

## 4. Ingressos e Pagamentos
- Compras são finais (sujeito a política de reembolso do evento)
- Preços podem variar
- Não somos responsáveis por eventos cancelados

## 5. Limitação de Responsabilidade
- Não garantimos disponibilidade 100%
- Não somos responsáveis por eventos de terceiros
- Use o app por sua conta e risco

## 6. Modificações
- Podemos alterar os termos
- Você será notificado sobre mudanças

## 7. Contato
Email: legal@sublinx.com
Telefone: +55 11 99999-9999
```

---

## 🚀 TIMELINE DE PUBLICAÇÃO

```
Semana 1: Preparação
  Dia 1-2: Assets (screenshots, ícones)
  Dia 3-4: Metadata (descrições, keywords)
  Dia 5-7: Testes finais

Semana 2: Beta Testing
  Dia 1: Upload TestFlight (iOS)
  Dia 2: Upload Internal Testing (Android)
  Dia 3-7: Corrigir bugs de beta

Semana 3: Submissão
  Dia 1: Submit App Store (review 1-3 dias)
  Dia 2: Submit Google Play (review 24-48h)
  Dia 3-7: Aguardar aprovação

Semana 4: Lançamento
  Dia 1: Aprovação ✅
  Dia 2: Release gradual (10% → 100%)
  Dia 3-7: Monitorar crashes, reviews
```

---

## 📊 MÉTRICAS PÓS-LANÇAMENTO

```
Semana 1:
  - Installs: Meta 1000+
  - Crashes: < 1%
  - Ratings: Meta 4.0+
  - Reviews: Responder TODOS

Mês 1:
  - DAU/MAU ratio: Meta 30%+
  - Retention D1: Meta 40%+
  - Retention D7: Meta 20%+
  - Churn: < 50%

Ferramentas:
  - Firebase Analytics
  - Crashlytics
  - App Store Connect Analytics
  - Google Play Console Statistics
```

---

## ✅ CHECKLIST FINAL

### Antes de Submit
- [ ] Build testado em 5+ dispositivos reais
- [ ] Performance Score > 85
- [ ] Sem crashes em cold start
- [ ] Política de privacidade publicada
- [ ] Demo account funcional
- [ ] Screenshots profissionais
- [ ] Descrição completa e clara
- [ ] Keywords otimizados
- [ ] Certificados válidos
- [ ] Bundle/AAB assinado

### Depois de Submit
- [ ] Monitorar email de review
- [ ] Responder perguntas rapidamente
- [ ] Preparar plano B se reprovado
- [ ] Marketing ready (landing page, redes sociais)

---

**🎉 BOA SORTE NO LANÇAMENTO!**

Em caso de dúvidas, consulte:
- Apple: https://developer.apple.com/app-store/review/guidelines/
- Google: https://support.google.com/googleplay/android-developer/