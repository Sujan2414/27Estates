# 21 Estates Mobile

React Native (Expo) app — CRM, HRMS, CMS with AI calling and geotracking.
Light mode. Zoho CRM-inspired clean UI with 21 Estates gold accents.

---

## Quick Start

```bash
cd mobile
npm install
cp .env.example .env
# Paste your Supabase URL + anon key into .env

npm start
# Download "Expo Go" from App Store or Play Store
# Scan the QR code shown in terminal
```

---

## Folder Structure

```
mobile/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx            ← Animated login (Zoho-style)
│   │   └── forgot-password.tsx
│   └── (tabs)/
│       ├── index.tsx            ← Home dashboard
│       ├── me.tsx               ← Profile & settings
│       ├── crm/
│       │   ├── index.tsx        ← Leads list + search + filters
│       │   ├── create.tsx       ← Create new lead form
│       │   ├── lead/[id].tsx    ← Lead detail + pipeline + timeline
│       │   └── call/[id].tsx    ← Active call screen + AI summary
│       ├── hrms/
│       │   ├── index.tsx        ← Attendance + GPS check-in/out
│       │   ├── leaves.tsx       ← Leave management
│       │   └── tasks.tsx        ← My tasks
│       └── cms/
│           └── index.tsx        ← Property/Project listings
│
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx       ← Primary/secondary/outline/danger/ghost
│   │   │   ├── Input.tsx        ← Labeled input with focus states
│   │   │   ├── Card.tsx         ← Surface card with shadow
│   │   │   ├── Badge.tsx        ← Status pills (6 variants)
│   │   │   ├── Skeleton.tsx     ← Shimmer loading placeholder
│   │   │   ├── Header.tsx       ← Reusable screen header
│   │   │   ├── EmptyState.tsx   ← Empty list state
│   │   │   └── SectionHeader.tsx
│   │   └── crm/
│   │       ├── LeadCard.tsx     ← Lead summary card
│   │       ├── TemperaturePill.tsx ← HOT/WARM/COLD badge
│   │       ├── PipelineBar.tsx  ← Pipeline stage bar
│   │       └── CallSummarySheet.tsx ← AI call summary modal
│   ├── hooks/
│   │   ├── useLeads.ts          ← Lead data + filters
│   │   └── useCurrentEmployee.ts ← Auth + employee profile
│   ├── lib/
│   │   ├── supabase.ts          ← Supabase client (AsyncStorage)
│   │   ├── geo.ts               ← Geofence + site visit utilities
│   │   └── notifications.ts     ← Push notification utilities
│   └── theme/
│       └── colors.ts            ← Full design system
```

---

## Design System

| Token | Value |
|-------|-------|
| Page background | `#F5F7FA` |
| Card surface | `#FFFFFF` |
| Input background | `#F0F2F7` |
| Border | `#E5E8F0` |
| Primary (gold) | `#C9930A` |
| Text primary | `#1A1D23` |
| Text muted | `#9CA3AF` |

All screens use `StyleSheet.create()`. No NativeWind dependency.

---

## Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_BASE_URL=https://your-app.vercel.app
```

---

## Phase Progress

- [x] Phase 1 — Auth, navigation shell, Home, CRM list, HRMS check-in, Profile
- [x] Phase 2 — Lead create form, tasks, leave management, CMS listings
- [x] Phase 2b — UI components (Skeleton, Header, Badge, EmptyState, LeadCard)
- [x] Phase 2c — Active call screen UI (Twilio wiring in Phase 3)
- [ ] Phase 3 — Twilio Voice SDK + Whisper + Claude AI summaries
- [ ] Phase 4 — Geotracking site visit verification with map
- [ ] Phase 5 — Push notifications, polish, offline support
- [ ] Phase 6 — EAS build → App Store + Play Store

---

## Testing

Phase 1–2 works fully with Expo Go. Just run `npm start` and scan.

Phase 3 (Twilio calling) requires a development build:
```bash
npm install -g eas-cli
eas build --profile development --platform android
```
