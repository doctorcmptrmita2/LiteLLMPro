# English-Only Pages Spec

## Overview
Ensure all marketing and dashboard pages are in English. Remove any Turkish content and standardize the language across the platform.

## User Stories

### US-1: Marketing Pages in English
**As a** visitor to CodexFlow website  
**I want** all marketing pages to be in English  
**So that** I can understand the content regardless of my location

**Acceptance Criteria:**
- [ ] All marketing page titles are in English
- [ ] All marketing page descriptions are in English
- [ ] All button labels and CTAs are in English
- [ ] All form labels and placeholders are in English
- [ ] Footer content is in English
- [ ] Navigation menu items are in English

### US-2: Dashboard Pages in English
**As a** logged-in user  
**I want** all dashboard pages to be in English  
**So that** I have a consistent experience

**Acceptance Criteria:**
- [ ] Dashboard sidebar menu is in English
- [ ] Dashboard header is in English
- [ ] All dashboard page content is in English
- [ ] Admin panel is in English
- [ ] Settings page is in English

### US-3: Auth Pages in English
**As a** user registering or logging in  
**I want** auth pages to be in English  
**So that** I can complete the authentication process

**Acceptance Criteria:**
- [ ] Login page is in English
- [ ] Register page is in English
- [ ] Error messages are in English

## Current Status

### ✅ Already in English
Based on code review, the following pages are already in English:

**Marketing Pages:**
- `/docs` - Documentation page ✅
- `/guides` - Guides page ✅
- `/about` - About page ✅
- `/blog` - Blog listing page ✅
- `/blog/[slug]` - Blog detail pages ✅
- `/contact` - Contact page ✅
- `/privacy` - Privacy policy ✅

### ⚠️ Pages Requiring Translation (Turkish → English)
The following pages contain Turkish content:

1. `/status` - System status page
   - "Tüm Sistemler Çalışıyor" → "All Systems Operational"
   - "Sistem Durumu" → "System Status"
   - "Son güncelleme" → "Last updated"
   - "Servisler" → "Services"
   - "Son 90 Gün" → "Last 90 Days"
   - "Son Olaylar" → "Recent Incidents"
   - Incident titles and descriptions in Turkish
   - "Güncellemelerden Haberdar Olun" → "Stay Updated"
   - "Abone Ol" → "Subscribe"

2. `/examples` - Code examples page
   - "Kod Örnekleri" → "Code Examples"
   - "Kopyala, yapıştır, çalıştır" → "Copy, paste, run"
   - Example titles and descriptions in Turkish
   - "Kopyala" button → "Copy"
   - "Daha fazla örnek için GitHub'ı ziyaret edin" → "Visit GitHub for more examples"

### ✅ Already in English
- `/terms` - Terms of service ✅
- `/cookies` - Cookie policy ✅
- `/dpa` - Data processing agreement ✅
- `/careers` - Careers page ✅
- `/extension` - VS Code extension page ✅
- `/changelog` - Changelog page ✅

### 🐛 Known Issues

1. **Blog 404 Error**: User reported `/blog/cost-savingsblog` returns 404
   - **Root Cause**: Typo in URL - correct URL is `/blog/cost-savings`
   - **Solution**: URL is correct, user needs to use proper slug

## Technical Notes

- All content is hardcoded in React components (no i18n library)
- Blog posts are stored in a `posts` object in `blog/[slug]/page.tsx`
- Valid blog slugs: `cfx-1-2-release`, `cost-savings`, `openrouter-integration`, `codexflow-guide`, `litellm-comparison`, `our-story`

## Out of Scope
- Adding multi-language support (i18n)
- Translating to other languages
- Dynamic content translation
