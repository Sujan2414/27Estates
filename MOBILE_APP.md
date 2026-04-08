# 21 Estates — Mobile App
### Complete Product & Engineering Documentation

> **Stack:** React Native (Expo) · Supabase · Twilio Voice · OpenAI Whisper · Claude AI · LiveKit (optional)
> **Platforms:** iOS 15+ · Android 10+
> **Backend:** Shared with existing Next.js web app (no rebuild)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Project Setup](#3-project-setup)
4. [Design System & UI Guidelines](#4-design-system--ui-guidelines)
5. [Auth — Login & Onboarding](#5-auth--login--onboarding)
6. [Bottom Navigation & App Shell](#6-bottom-navigation--app-shell)
7. [CRM Module](#7-crm-module)
   - 7.1 Dashboard
   - 7.2 Leads List
   - 7.3 Lead Detail
   - 7.4 Pipeline (Kanban)
   - 7.5 AI Call Feature
   - 7.6 Warm Audience & Nurture
   - 7.7 Analytics
8. [HRMS Module](#8-hrms-module)
   - 8.1 Attendance & Check-In/Out
   - 8.2 Leave Management
   - 8.3 Tasks
   - 8.4 Regularizations
   - 8.5 Allocations
9. [CMS Module](#9-cms-module)
10. [Geotracking — Site Visit Verification](#10-geotracking--site-visit-verification)
11. [AI Call Summary & Lead Temperature](#11-ai-call-summary--lead-temperature)
12. [Push Notifications](#12-push-notifications)
13. [Folder Structure](#13-folder-structure)
14. [API & Backend Integration](#14-api--backend-integration)
15. [Testing](#15-testing)
16. [Build & Deployment](#16-build--deployment)
17. [Cost Breakdown](#17-cost-breakdown)
18. [Phase-wise Roadmap](#18-phase-wise-roadmap)

---

## 1. Overview

The 21 Estates mobile app brings the full web platform to agents' phones. Agents spend most of their day in the field — calling leads, visiting sites, updating statuses — and the mobile app is designed around that reality.

### What the app does

| Module | Key Capability |
|--------|---------------|
| CRM | Manage leads, call from app, get AI call summaries, move pipeline |
| HRMS | Punch in/out with GPS, apply leave, see tasks, check payroll |
| CMS | View and create property/project listings from the field |
| Geotracking | Verify agents visited a site with GPS proof |
| AI Calling | Twilio call + auto transcription + Claude analysis → HOT/WARM/COLD |

### Who uses it

- **Agents** — primary users. Call leads, track visits, punch attendance.
- **Team Leads** — review team performance, reassign leads, approve leaves.
- **Admins** — full access, same as web.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Mobile App (Expo)                     │
│   React Native · NativeWind · Expo Router               │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   CRM    │ │  HRMS    │ │  CMS     │ │ GeoTrack │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Shared Services Layer               │  │
│  │  supabase-client · api-client · auth · storage   │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
     ┌───────────────┼──────────────────┐
     ▼               ▼                  ▼
┌─────────┐   ┌────────────┐   ┌───────────────┐
│ Supabase│   │ Next.js    │   │ Twilio Voice  │
│ DB/Auth │   │ API Routes │   │ (Calls)       │
│ Storage │   │ (web app)  │   └───────┬───────┘
│ Realtime│   └────────────┘           │
└─────────┘                            ▼
                               ┌───────────────┐
                               │ OpenAI Whisper│
                               │ (Transcribe)  │
                               └───────┬───────┘
                                       ▼
                               ┌───────────────┐
                               │  Claude API   │
                               │ (Summary+     │
                               │  Temperature) │
                               └───────────────┘
```

### Key principle
The mobile app **shares the same Supabase database and Next.js API routes** as the web app. No duplicate backend. New endpoints only for mobile-specific features (call initiation, geotrack saves).

---

## 3. Project Setup

### Prerequisites
```bash
# Node 18+
node -v

# Install Expo CLI
npm install -g expo-cli eas-cli

# Install Expo Go on your phone (free from App Store / Play Store)
```

### Create the project
```bash
npx create-expo-app 21estates-mobile --template expo-template-blank-typescript
cd 21estates-mobile
```

### Install core dependencies
```bash
# Navigation
npx expo install expo-router

# Styling (Tailwind for React Native)
npm install nativewind tailwindcss

# Supabase
npm install @supabase/supabase-js

# Twilio Voice SDK
npm install @twilio/voice-react-native-sdk

# Location / GPS
npx expo install expo-location

# Notifications
npx expo install expo-notifications

# Secure storage (for tokens)
npx expo install expo-secure-store

# Audio / Media
npx expo install expo-av

# Camera (for CMS property photos)
npx expo install expo-camera expo-image-picker

# Maps
npm install react-native-maps

# Icons
npm install lucide-react-native
npm install @expo/vector-icons

# Bottom sheet (for modals)
npm install @gorhom/bottom-sheet

# Gestures / Animations
npx expo install react-native-gesture-handler react-native-reanimated

# Date picker
npm install react-native-date-picker

# Toast notifications
npm install react-native-toast-message
```

### Environment variables
Create `.env` at project root:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_BASE_URL=https://your-web-app.vercel.app
EXPO_PUBLIC_TWILIO_ACCOUNT_SID=your_twilio_sid
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key
EXPO_PUBLIC_CLAUDE_API_KEY=your_claude_key
```

### Start development
```bash
npx expo start
# Scan QR code with Expo Go app on your phone
```

---

## 4. Design System & UI Guidelines

### Philosophy
> "Clean, airy, and professional — the Zoho aesthetic with 21 Estates gold."

- **Light-first** — white surfaces, light gray backgrounds, no dark mode
- **Card-first layouts** — white rounded cards with soft shadows on light gray pages
- **Thumb-friendly** — all primary actions in bottom 60% of screen
- **Instant feedback** — skeleton loaders, haptic feedback, smooth transitions
- **Enterprise clean** — inspired by Zoho CRM mobile: generous whitespace, clear hierarchy, minimal decoration

### Color Palette
```
Background:    #F5F7FA  (light gray page background)
Surface:       #FFFFFF  (white cards)
Surface Alt:   #F0F2F7  (input backgrounds, inner sections)
Border:        #E5E8F0  (card borders)
Border Strong: #C9CDD8  (dividers)

Primary:       #C9930A  (21 Estates gold — deepened for light bg readability)
Primary Light: #FEF6E4  (gold tint — highlighted rows, active states)
Primary Dark:  #A87800  (pressed/active)

Success:       #0BAB7A  (green)
Success Light: #ECFDF5
Warning:       #D97706  (amber)
Warning Light: #FFFBEB
Danger:        #DC2626  (red)
Danger Light:  #FEF2F2
Info:          #2563EB  (blue — secondary actions)
Info Light:    #EFF6FF

Text Primary:  #1A1D23  (near black)
Text Secondary:#5C6474  (secondary text)
Text Muted:    #9CA3AF  (placeholders, captions)
Text Inverse:  #FFFFFF  (text on gold/dark backgrounds)

HOT Lead:      #DC2626 on #FEF2F2  (red pill)
WARM Lead:     #D97706 on #FFFBEB  (amber pill)
COLD Lead:     #2563EB on #EFF6FF  (blue pill)
DEAD Lead:     #6B7280 on #F9FAFB  (gray pill)
```

### Typography
```
Font Family:   Inter (expo-google-fonts)

Heading XL:    28px / Bold
Heading L:     22px / SemiBold
Heading M:     18px / SemiBold
Body:          15px / Regular
Body Small:    13px / Regular
Caption:       11px / Medium
Label:         12px / SemiBold / Letter-spacing: 0.5
```

### Spacing Scale
```
4, 8, 12, 16, 20, 24, 32, 40, 48
```

### Border Radius
```
Small:   8px   (tags, badges)
Medium:  12px  (cards)
Large:   16px  (modals, sheets)
XL:      24px  (FAB, avatar)
```

### Component Library (custom)

```
<LeadCard />         — lead summary card with temp pill + quick actions
<TemperaturePill />  — HOT / WARM / COLD / DEAD badge
<StatCard />         — metric card with icon + value + change
<CallButton />       — gold circular FAB that initiates Twilio call
<StatusPill />       — lead pipeline status badge
<AgentAvatar />      — circular avatar with online dot
<SectionHeader />    — screen section title with optional action link
<EmptyState />       — illustration + message for empty lists
<SkeletonCard />     — shimmer loading placeholder
<GeoConfirmSheet />  — bottom sheet for confirming site visit
```

---

## 5. Auth — Login & Onboarding

### Screens

#### Splash Screen
```
Background: #0A0A0F
Center: 21 Estates logo (gold) + tagline
Animation: fade in logo → auto-navigate after auth check
```

#### Login Screen
```
Layout:
  ─────────────────────────────
  [Logo centered, top 35%]

  "Welcome back" (28px Bold, white)
  "Sign in to your workspace" (14px, muted)

  [Email input — full width, rounded-16]
  [Password input — full width, eye toggle]

  [Forgot Password? — right aligned, gold text]

  [SIGN IN button — gold fill, full width, rounded-12]

  ─ OR ─

  [Continue with Google — outline button]
  ─────────────────────────────

  Bottom: "New agent? Contact your admin"
```

#### Forgot Password
- Email input → "Send Reset Link"
- Uses Supabase `resetPasswordForEmail()`
- Shows success state with email illustration

#### First Login (New Agent Setup)
- Set display name
- Upload profile photo (expo-image-picker)
- Set notification preferences
- Done → Dashboard

### Auth Logic
```typescript
// src/lib/auth.ts
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: {
        getItem: (key) => SecureStore.getItemAsync(key),
        setItem: (key, value) => SecureStore.setItemAsync(key, value),
        removeItem: (key) => SecureStore.deleteItemAsync(key),
      },
      autoRefreshToken: true,
      persistSession: true,
    },
  }
)
```

---

## 6. Bottom Navigation & App Shell

### Tab Structure
```
┌─────────────────────────────────────────┐
│                                         │
│           Screen Content                │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  🏠 Home  │ 👥 CRM │ 🏢 HRMS │ 👤 Me  │
└─────────────────────────────────────────┘
```

| Tab | Icon | Screens |
|-----|------|---------|
| Home | House | Dashboard / Quick Stats |
| CRM | Users | Leads, Pipeline, Analytics |
| HRMS | Building | Attendance, Leaves, Tasks |
| Me | Person | Profile, Settings, Notifications |

### App Shell
- **Header:** Screen title (left) + notification bell + avatar (right)
- **Safe area:** Handled via `react-native-safe-area-context`
- **Keyboard:** `KeyboardAvoidingView` on all form screens
- **Pull to refresh:** On all list screens

### Quick Action FAB (Floating Action Button)
Visible on Home and CRM tabs. Gold circle, bottom-right:
```
Tap → Bottom sheet with:
  ＋ Add New Lead
  📞 Quick Call
  📝 Add Note
  📅 Schedule Follow-up
```

---

## 7. CRM Module

### 7.1 Dashboard (Home Tab)

```
┌─────────────────────────────────────────┐
│  Good morning, Rahul 👋                 │
│  Saturday, 28 March 2026                │
│                                         │
│  ┌─────────────┐  ┌─────────────┐      │
│  │  My Leads   │  │ Follow-ups  │      │
│  │     24      │  │     6 today │      │
│  └─────────────┘  └─────────────┘      │
│  ┌─────────────┐  ┌─────────────┐      │
│  │  Calls Made │  │ Site Visits │      │
│  │   12 today  │  │  3 this wk  │      │
│  └─────────────┘  └─────────────┘      │
│                                         │
│  TODAY'S FOLLOW-UPS                     │
│  ┌────────────────────────────────┐     │
│  │ 🔴 Amit Sharma  · ₹80L budget  │     │
│  │ Last called 2 days ago  [Call] │     │
│  └────────────────────────────────┘     │
│  ┌────────────────────────────────┐     │
│  │ 🟡 Priya Mehta  · 2BHK         │     │
│  │ Interested in Whitefield [Call]│     │
│  └────────────────────────────────┘     │
│                                         │
│  RECENT ACTIVITY                        │
│  • Rohit moved Kapoor to Negotiation    │
│  • New lead from 99acres — Sneha R.     │
│  • Site visit logged — Greenview Apt    │
└─────────────────────────────────────────┘
```

**Data sources:**
- Follow-ups: `leads` where `next_follow_up_at <= today` and `assigned_agent_id = me`
- Stats: Aggregated from `lead_activities` for today
- Activity feed: `lead_activities` ordered by `created_at DESC`, limit 10

---

### 7.2 Leads List

```
┌─────────────────────────────────────────┐
│  Leads               [Filter] [Search]  │
│                                         │
│  [All] [Mine] [New] [Hot] [Site Visit]  │
│   ←─ horizontal scroll filter chips ─→  │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 🔴 HOT                          │    │
│  │ Amit Sharma                     │    │
│  │ +91 98765 43210                 │    │
│  │ 3BHK · Whitefield · ₹80–90L    │    │
│  │ 99acres · 2h ago                │    │
│  │ [Call] [WhatsApp] [View]        │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 🟡 WARM                         │    │
│  │ Priya Mehta                     │    │
│  │ +91 87654 32109                 │    │
│  │ 2BHK · HSR Layout · ₹50–60L    │    │
│  │ Meta Ads · 1d ago               │    │
│  │ [Call] [WhatsApp] [View]        │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Swipe Actions (React Native Gesture Handler):**
- Swipe left → Archive / Mark Lost
- Swipe right → Quick Call

**Filter chips:**
`All` `Mine` `New` `HOT` `WARM` `COLD` `Site Visit` `Follow-up Due`

**Sort options (bottom sheet):**
- Latest First
- Follow-up Due
- Priority (Hot first)
- Score (High to Low)

---

### 7.3 Lead Detail

```
┌─────────────────────────────────────────┐
│  ← Back          Amit Sharma     ···    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  A    Amit Sharma               │    │
│  │       +91 98765 43210           │    │
│  │       amit@email.com            │    │
│  │  🔴 HOT  ·  99acres  ·  Score 82│    │
│  │                                 │    │
│  │  [📞 Call] [💬 WhatsApp] [✉ Mail]│    │
│  └─────────────────────────────────┘    │
│                                         │
│  PRE-CALL BRIEF                         │
│  ┌─────────────────────────────────┐    │
│  │ Property: Greenview Apartments  │    │
│  │ Budget: ₹80L – ₹90L            │    │
│  │ Location: Whitefield            │    │
│  │ Type: 3BHK                      │    │
│  │ Last call: "Wants to visit      │    │
│  │ this weekend, check availability│    │
│  └─────────────────────────────────┘    │
│                                         │
│  PIPELINE STATUS                        │
│  [New]→[Contacted]→[Qualified]→[Nego.] │
│                     ^^^^ Current        │
│                                         │
│  TASKS (2 pending)                      │
│  ☐  Send brochure — Due today           │
│  ☐  Schedule site visit — Due Mar 30    │
│                                         │
│  ACTIVITY TIMELINE                      │
│  📞 Call · 45 min ago                   │
│     "Interested, asked about parking"   │
│     AI: WARM → HOT upgrade detected     │
│                                         │
│  📧 Email sent · 2h ago                 │
│     Sent project brochure               │
│                                         │
│  🆕 Lead created · 99acres · 1d ago     │
└─────────────────────────────────────────┘
```

**Actions sheet (··· menu):**
- Edit Lead Info
- Reassign Agent
- Add Note
- Log Site Visit
- Mark as Lost
- Delete Lead

---

### 7.4 Pipeline (Kanban — Horizontal Scroll)

```
  New        Contacted    Qualified    Negotiation   Site Visit   Converted
  ───        ─────────    ─────────    ───────────   ──────────   ─────────
  [Card]     [Card]       [Card]       [Card]        [Card]       [Card]
  [Card]     [Card]       [Card]                     [Card]
  [Card]                  [Card]
```

Each column is a vertical `FlatList`. Drag and drop between columns using `react-native-drag-sort` or long-press → move sheet.

Mobile alternative to drag: tap card → "Move to Stage" action sheet.

---

### 7.5 AI Call Feature

See [Section 11](#11-ai-call-summary--lead-temperature) for full technical detail.

**UI — During Call:**
```
┌─────────────────────────────────────────┐
│                                         │
│           CALLING...                    │
│                                         │
│       ┌─────────────┐                  │
│       │      A      │  Amit Sharma      │
│       └─────────────┘  +91 98765 43210  │
│                                         │
│       ● REC  00:01:42                   │
│       AI Listening...                   │
│                                         │
│  [Mute]   [Speaker]   [Keypad]          │
│                                         │
│         [  End Call  ]                  │
│         (red, full width)               │
│                                         │
└─────────────────────────────────────────┘
```

**UI — After Call (AI Summary Sheet):**
```
┌─────────────────────────────────────────┐
│  Call Summary — Amit Sharma             │
│  Duration: 2:45  ·  Just now            │
│                                         │
│  LEAD TEMPERATURE                       │
│  ┌─────────────────────────────────┐    │
│  │  🔴  HOT                        │    │
│  │  Confidence: 91%                │    │
│  │  "Showed strong intent, asked   │    │
│  │   about possession date, price  │    │
│  │   negotiation started"          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  SUMMARY                                │
│  Lead confirmed interest in 3BHK unit   │
│  at Greenview Apts. Budget confirmed    │
│  at ₹85L. Wants site visit Saturday     │
│  before 11am. Concerned about parking.  │
│                                         │
│  KEY SIGNALS DETECTED                   │
│  ✅ Asked about price negotiation       │
│  ✅ Requested specific date for visit   │
│  ✅ Mentioned bringing family           │
│  ⚠️  Concerned about parking slots     │
│                                         │
│  SUGGESTED NEXT ACTION                  │
│  Book site visit for Saturday 10am.     │
│  Confirm parking availability first.    │
│                                         │
│  [Save & Update Lead]  [Edit Notes]     │
└─────────────────────────────────────────┘
```

---

### 7.6 Warm Audience & Nurture

Mobile card list of leads in warm/nurture bucket:
- Shows days since last contact
- Quick WhatsApp / Email / Call buttons
- Bulk "Send Template" button

---

### 7.7 Analytics

```
MY PERFORMANCE — March 2026

Calls Made:    47  ↑ 12% vs last month
Leads Closed:   3  ↑ 50%
Site Visits:   11  ─ same
Conversion:  6.4%  ↑ 1.2%

BAR CHART: Daily calls this week
PIE CHART: Lead sources breakdown

TEAM LEADERBOARD (visible to leads/admins)
  1. Rohit Sharma    — 8 conversions
  2. Priya Nair      — 6 conversions
  3. You             — 3 conversions
```

---

## 8. HRMS Module

### 8.1 Attendance & Check-In/Out

```
┌─────────────────────────────────────────┐
│  Attendance                             │
│  Saturday, 28 March 2026                │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  STATUS: Not Checked In         │    │
│  │                                 │    │
│  │  📍 Detecting location...       │    │
│  │  Koramangala, Bangalore         │    │
│  │                                 │    │
│  │    [  CHECK IN  ]               │    │
│  │    (gold, large button)         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  WORK MODE                              │
│  [Office] [Work From Home] [On Field]   │
│                                         │
│  THIS MONTH                             │
│  Present: 18   Absent: 2   WFH: 4      │
│  Late: 1       Leaves: 1               │
│                                         │
│  CALENDAR VIEW                          │
│  [Mo][Tu][We][Th][Fr][Sa][Su]           │
│  [✓] [✓] [✓] [✓] [✓] [─] [─]          │
│  [✓] [✓] [L] [✓] [✓] [─] [─]          │
└─────────────────────────────────────────┘
```

**Check-In Logic:**
1. User taps CHECK IN
2. `expo-location` gets current GPS coordinates
3. Reverse geocode to get address
4. Save to `attendance` table: `check_in_lat`, `check_in_lng`, `check_in_address`, `check_in_time`
5. Admin can see map of where each agent checked in from

**Check-Out:**
- Same flow, saves `check_out_*` fields
- Calculates `hours_worked` automatically

---

### 8.2 Leave Management

**Apply Leave Screen:**
```
Leave Type:     [Casual] [Sick] [Earned]
From Date:      [Date Picker]
To Date:        [Date Picker]
Reason:         [Text area]
                [SUBMIT REQUEST]
```

**Leave Balance Card:**
```
Casual Leave:   8 / 12 remaining
Sick Leave:    10 / 12 remaining
Earned Leave:  15 / 18 remaining
```

**Leave History:**
- List of past applications with status pills: PENDING / APPROVED / REJECTED
- Admin sees all team leaves + approve/reject buttons

---

### 8.3 Tasks

```
┌─────────────────────────────────────────┐
│  My Tasks                    [+ Add]    │
│                                         │
│  TODAY                                  │
│  ☐  Send brochure to Amit Sharma        │
│     CRM · Due 5pm today                 │
│                                         │
│  ☐  Follow up with Priya re: site visit │
│     CRM · Due 3pm today                 │
│                                         │
│  THIS WEEK                              │
│  ☐  Property inspection — Whitefield   │
│     HRMS · Due Mar 30                   │
│  ✓  Submitted March report              │
│     Done Mar 27                         │
└─────────────────────────────────────────┘
```

Tasks are linked to either a lead (CRM task) or standalone (HRMS task). Tap to expand → mark complete → logs activity.

---

### 8.4 Regularizations

Form to request correction for missed punch-in/out:
```
Date:           [Date Picker]
In Time:        [Time Picker]
Out Time:       [Time Picker]
Reason:         [Text input]
                [SUBMIT]
```

Admin sees regularization requests → approve/reject with one tap.

---

### 8.5 Allocations

View which properties/projects are assigned to you:
- Property name, location, type
- Current leads associated
- Quick link to navigate to lead list filtered by that property

---

## 9. CMS Module

Mobile-optimised read/create for listings. Full editing stays on web (too complex for mobile).

### Property / Project List
```
┌─────────────────────────────────────────┐
│  Listings                 [+ Add Photo] │
│  [Properties] [Projects] [Commercial]   │
│                                         │
│  ┌────────────────────────────────┐     │
│  │ [Photo]  Greenview Apartments  │     │
│  │          Whitefield · 2-3 BHK  │     │
│  │          ₹65L – ₹95L  ACTIVE   │     │
│  └────────────────────────────────┘     │
│                                         │
│  ┌────────────────────────────────┐     │
│  │ [Photo]  Lumina Heights        │     │
│  │          HSR Layout · 3-4 BHK  │     │
│  │          ₹1.1Cr – ₹1.5Cr  ACT  │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

**Agent capability from mobile:**
- View property details + photos
- Share property link via WhatsApp (deep link to web listing)
- Add field photos (expo-camera → upload to Supabase Storage)
- Quick note for admin

**Admin-only from mobile:**
- Toggle active/inactive
- Update price

---

## 10. Geotracking — Site Visit Verification

### Problem it solves
Admin needs to verify agents actually visited the site, not just ticked a checkbox from office.

### Flow

```
Lead Detail → "Log Site Visit" button
       ↓
App starts GPS tracking session
       ↓
Map screen shows:
  • Agent's current location (blue dot)
  • Property location (gold pin)
  • Distance to property
       ↓
Agent arrives at property
App detects within 100m geofence → "You've arrived!"
       ↓
Green check confirms arrival
Agent can take photos, add notes
       ↓
"End Visit" → GPS stops tracking
       ↓
Visit summary saved:
  • Arrival time
  • Departure time
  • Duration at site
  • GPS coordinates (proof)
  • Photos
  • Notes
       ↓
Activity logged on lead: "Site visit — 45 min @ Whitefield"
```

### Geofence Check
```typescript
// src/lib/geotrack.ts
import * as Location from 'expo-location'

const GEOFENCE_RADIUS_METERS = 150

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth radius in metres
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function isAtProperty(
  agentLat: number, agentLng: number,
  propLat: number, propLng: number
): boolean {
  return haversineDistance(agentLat, agentLng, propLat, propLng) <= GEOFENCE_RADIUS_METERS
}
```

### Admin Visit Map View
Admin screen shows a map with:
- All agents' visit trails for selected date
- Property pins
- Time-at-location overlay
- Export to CSV

### Database Schema (add to Supabase)
```sql
CREATE TABLE site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  agent_id UUID REFERENCES employees(id),
  property_id TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  arrival_lat DOUBLE PRECISION,
  arrival_lng DOUBLE PRECISION,
  arrival_address TEXT,
  geofence_confirmed BOOLEAN DEFAULT false,
  gps_trail JSONB,  -- array of {lat, lng, timestamp}
  photos TEXT[],    -- Supabase storage URLs
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 11. AI Call Summary & Lead Temperature

### How it works end-to-end

```
1. Agent taps [Call] on lead
2. App requests Twilio access token from your Next.js API
3. Twilio Voice SDK places call via PSTN (real phone number)
4. CallKit (iOS) / ConnectionService (Android) shows native call UI
5. Twilio records both sides server-side
6. Agent ends call
7. Twilio webhook fires → your Next.js API receives recording URL
8. API downloads audio → sends to OpenAI Whisper
9. Whisper returns transcript
10. Transcript sent to Claude API with structured prompt
11. Claude returns JSON: { summary, temperature, signals, next_action }
12. Saved to lead_activities + lead.priority updated
13. Push notification sent to agent: "Call summary ready"
14. Agent opens app → sees full summary sheet
```

### Next.js API Routes needed

**`POST /api/calls/token`** — issue Twilio access token for agent
```typescript
// src/app/api/calls/token/route.ts
import twilio from 'twilio'
const AccessToken = twilio.jwt.AccessToken
const VoiceGrant = AccessToken.VoiceGrant

export async function POST(req: Request) {
  const { agentId } = await req.json()
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_API_KEY!,
    process.env.TWILIO_API_SECRET!,
    { identity: agentId }
  )
  token.addGrant(new VoiceGrant({ outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID }))
  return Response.json({ token: token.toJwt() })
}
```

**`POST /api/calls/recording-complete`** — Twilio webhook after call ends
```typescript
// src/app/api/calls/recording-complete/route.ts
export async function POST(req: Request) {
  const body = await req.formData()
  const recordingUrl = body.get('RecordingUrl') as string
  const callSid = body.get('CallSid') as string
  const leadId = body.get('leadId') as string // passed via TwiML params

  // 1. Download audio from Twilio
  // 2. Send to Whisper
  const transcript = await transcribeAudio(recordingUrl)

  // 3. Send to Claude
  const analysis = await analyzeCall(transcript)

  // 4. Save to Supabase
  await supabase.from('lead_activities').insert({
    lead_id: leadId,
    type: 'call',
    title: 'Call — AI Summary',
    description: analysis.summary,
    metadata: {
      duration_seconds: body.get('RecordingDuration'),
      temperature: analysis.temperature,
      signals: analysis.signals,
      transcript,
      next_action: analysis.next_action
    }
  })

  // 5. Update lead priority
  await supabase.from('leads')
    .update({ priority: analysis.temperature.toLowerCase() })
    .eq('id', leadId)

  return Response.json({ ok: true })
}
```

### Claude Prompt (Lead Temperature Analysis)
```typescript
async function analyzeCall(transcript: string) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are an expert real estate sales analyst. Analyze this call transcript between a real estate agent and a potential buyer.

TRANSCRIPT:
${transcript}

Return a JSON object with exactly these fields:
{
  "temperature": "HOT" | "WARM" | "COLD" | "DEAD",
  "confidence": number (0-100),
  "temperature_reason": "one sentence explanation",
  "summary": "3-4 sentence call summary",
  "signals": {
    "positive": ["signal1", "signal2"],
    "negative": ["concern1", "concern2"]
  },
  "next_action": "specific recommended action for agent",
  "urgency": "HIGH" | "MEDIUM" | "LOW"
}

Temperature guide:
- HOT: Asking to book/visit, discussing price, mentioned buying timeline within 1 month
- WARM: Interested but no clear timeline, asking questions, wants more info
- COLD: Vague interest, says "will think", longer timeline (3+ months)
- DEAD: Not interested, wrong number, already bought elsewhere`
    }]
  })

  return JSON.parse(response.content[0].text)
}
```

---

## 12. Push Notifications

### When to send
| Event | Recipient |
|-------|-----------|
| New lead assigned to you | Agent |
| Follow-up due in 30 min | Agent |
| AI call summary ready | Agent |
| Leave request approved/rejected | Employee |
| New task assigned | Employee |
| Lead escalated | Team Lead |
| Daily performance summary (9pm) | All agents |

### Setup
```typescript
// src/lib/notifications.ts
import * as Notifications from 'expo-notifications'

// Request permissions on first launch
export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== 'granted') return

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID!
  })

  // Save token to Supabase against employee record
  await supabase.from('employees')
    .update({ push_token: token.data })
    .eq('id', currentUserId)
}
```

Server-side (Next.js) sends via Expo Push API — no FCM/APNs setup needed in early phases.

---

## 13. Folder Structure

```
21estates-mobile/
├── app/                          # Expo Router screens
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── forgot-password.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/
│   │   ├── index.tsx             # Home / Dashboard
│   │   ├── crm/
│   │   │   ├── index.tsx         # Leads list
│   │   │   ├── [id].tsx          # Lead detail
│   │   │   ├── pipeline.tsx
│   │   │   └── analytics.tsx
│   │   ├── hrms/
│   │   │   ├── index.tsx         # Attendance
│   │   │   ├── leaves.tsx
│   │   │   ├── tasks.tsx
│   │   │   └── regularizations.tsx
│   │   ├── cms/
│   │   │   ├── index.tsx         # Listings
│   │   │   └── [id].tsx          # Property detail
│   │   └── me/
│   │       ├── index.tsx         # Profile
│   │       └── settings.tsx
│   └── _layout.tsx
│
├── src/
│   ├── components/
│   │   ├── ui/                   # Base components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Skeleton.tsx
│   │   ├── crm/
│   │   │   ├── LeadCard.tsx
│   │   │   ├── TemperaturePill.tsx
│   │   │   ├── CallButton.tsx
│   │   │   ├── CallSummarySheet.tsx
│   │   │   └── PipelineBoard.tsx
│   │   ├── hrms/
│   │   │   ├── AttendanceCard.tsx
│   │   │   ├── CheckInButton.tsx
│   │   │   └── LeaveCard.tsx
│   │   └── geo/
│   │       ├── SiteVisitMap.tsx
│   │       └── GeofenceOverlay.tsx
│   │
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client (shared logic)
│   │   ├── auth.ts
│   │   ├── twilio.ts             # Twilio Voice SDK wrapper
│   │   ├── geotrack.ts           # Location + geofence utils
│   │   ├── ai-call.ts            # Whisper + Claude integration
│   │   └── notifications.ts
│   │
│   ├── hooks/
│   │   ├── useLeads.ts
│   │   ├── useAttendance.ts
│   │   ├── useLocation.ts
│   │   └── useCall.ts
│   │
│   ├── store/                    # Zustand global state
│   │   ├── auth.store.ts
│   │   ├── crm.store.ts
│   │   └── call.store.ts
│   │
│   └── theme/
│       ├── colors.ts
│       ├── typography.ts
│       └── spacing.ts
│
├── assets/
│   ├── fonts/
│   ├── images/
│   └── icons/
│
├── app.json
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 14. API & Backend Integration

### Reused from web app (no changes needed)
```
GET  /api/crm/leads              → leads list
GET  /api/crm/leads/[id]         → lead detail
PUT  /api/crm/leads/[id]         → update lead
POST /api/crm/leads              → create lead
GET  /api/crm/tasks              → tasks
PUT  /api/crm/tasks/[id]         → update task
```

### New endpoints (mobile-only)
```
POST /api/calls/token                    → Twilio access token for agent
POST /api/calls/recording-complete       → Twilio webhook → AI pipeline
POST /api/geo/site-visits                → save geotracked visit
GET  /api/geo/site-visits/[leadId]       → visit history for lead
POST /api/notifications/register-token  → save push token
```

### Supabase Realtime (live updates)
```typescript
// Subscribe to new leads assigned to me
supabase
  .channel('my-leads')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'leads',
    filter: `assigned_agent_id=eq.${myId}`
  }, (payload) => {
    showNotification('New lead assigned: ' + payload.new.name)
  })
  .subscribe()
```

---

## 15. Testing

### Phase 1 — Expo Go (Development)
```bash
npx expo start
# Scan QR code → instant live reload on your phone
# No account, no publishing
```

Works for everything except:
- Push notifications (use simulator)
- Twilio native call SDK (needs dev build)

### Phase 2 — Development Build
```bash
# For Twilio Voice + native modules
eas build --profile development --platform android
# Install .apk directly on Android device
```

### Phase 3 — Beta Testing

**Android — Internal Testing Track**
```bash
eas build --profile preview --platform android
# Share .apk or upload to Play Console Internal Testing
# Up to 100 testers, share via email
```

**iOS — TestFlight**
```bash
eas build --profile preview --platform ios
eas submit --platform ios
# Upload to App Store Connect → TestFlight
# Share link to up to 10,000 testers
# No App Store review needed for TestFlight
```

### Test Checklist
```
Auth
  ☐ Login with valid credentials
  ☐ Login with invalid credentials (error shown)
  ☐ Forgot password flow
  ☐ Session persists after app restart

CRM
  ☐ Leads list loads and paginates
  ☐ Filter chips work
  ☐ Lead detail shows all sections
  ☐ Call button initiates Twilio call
  ☐ AI summary appears after call ends
  ☐ Pipeline status update saves

HRMS
  ☐ Check-in saves GPS location
  ☐ Check-out calculates hours correctly
  ☐ Leave application submits
  ☐ Tasks list loads and can be completed

Geotracking
  ☐ Site visit starts tracking
  ☐ Geofence alert triggers within 150m
  ☐ Visit saves with coordinates
  ☐ Admin can see visit on map

Notifications
  ☐ Permission prompt appears on first launch
  ☐ Follow-up reminder received
  ☐ Call summary notification received
```

---

## 16. Build & Deployment

### EAS Setup
```bash
npm install -g eas-cli
eas login
eas build:configure
```

### eas.json
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@apple.id",
        "ascAppId": "your_app_store_connect_id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json"
      }
    }
  }
}
```

### Build commands
```bash
# Android APK (share directly)
eas build --profile preview --platform android

# iOS TestFlight
eas build --profile preview --platform ios

# Production (both platforms)
eas build --profile production --platform all

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

### Store Requirements

**Google Play Store**
- Google Play Console account: **$25 one-time**
- Privacy policy URL required
- App icons: 512×512px
- Feature graphic: 1024×500px
- 2–8 screenshots
- Review time: **2–4 hours** (internal) to **3–7 days** (production)

**Apple App Store**
- Apple Developer account: **$99/year**
- Must have Mac or use cloud Mac (EAS handles this)
- Privacy policy URL required
- App icons: multiple sizes (auto-generated by Expo)
- 3–10 screenshots per device size
- Review time: **1–3 days**

---

## 17. Cost Breakdown

### Monthly costs at scale (50 active agents, 500 calls/month)

| Service | What | Monthly Cost |
|---------|------|-------------|
| Supabase | Database, Auth, Storage, Realtime | $25 (Pro) |
| Twilio | Phone number + 500 calls × 5min avg | ~$30 |
| OpenAI Whisper | 500 calls × 5min transcription | ~$15 |
| Claude API | 500 call summaries | ~$5 |
| EAS Build | Expo build service | Free (30 builds/mo) |
| Vercel | Next.js web app (existing) | $20 |
| Push notifications | Expo Push (included) | $0 |
| **TOTAL** | | **~$95/month** |

### Twilio number provisioning
```
Indian number (DID): ~$3/month
US number (toll-free): ~$2/month
International calls: ~$0.05/min
```

---

## 18. Phase-wise Roadmap

### Phase 1 — Foundation (Week 1–2)
- [ ] Expo project setup + TypeScript + NativeWind
- [ ] Supabase client config + secure token storage
- [ ] Login / logout / session persistence
- [ ] Bottom tab navigation shell
- [ ] Home dashboard (stats + follow-up list)
- [ ] Leads list with filter chips
- [ ] Lead detail (read-only)

### Phase 2 — Core CRM (Week 2–3)
- [ ] Lead create / edit form
- [ ] Pipeline status update
- [ ] Tasks (view + complete)
- [ ] Activity timeline on lead
- [ ] HRMS: Check-in / check-out with GPS
- [ ] HRMS: Leave application
- [ ] Push notifications (Expo)

### Phase 3 — AI Calling (Week 3–4)
- [ ] Twilio Voice SDK integration
- [ ] CallKit (iOS) + ConnectionService (Android)
- [ ] Recording webhook → Whisper → Claude
- [ ] AI call summary bottom sheet
- [ ] Lead temperature auto-update
- [ ] Call history on lead timeline

### Phase 4 — Geotracking (Week 4–5)
- [ ] Site visit flow (start/end)
- [ ] Geofence detection
- [ ] GPS trail recording
- [ ] Admin visit map view
- [ ] Field photo capture + Supabase upload

### Phase 5 — CMS + Polish (Week 5–6)
- [ ] Property / project listings view
- [ ] Share property via WhatsApp
- [ ] Field photo upload for listings
- [ ] Analytics charts (recharts-native)
- [ ] Dark/light theme toggle
- [ ] Haptic feedback throughout
- [ ] Skeleton loaders on all lists
- [ ] Offline queue for actions when no signal

### Phase 6 — Launch (Week 6–7)
- [ ] Internal testing (team of 5)
- [ ] Bug fixes from testing
- [ ] TestFlight beta (all agents)
- [ ] Google Play Internal Testing
- [ ] Collect feedback → fix critical issues
- [ ] Production release: App Store + Play Store

---

## Quick Reference

```
Repo:         21estates-mobile/
Backend:      https://your-app.vercel.app (shared)
Database:     Supabase (shared with web)
Calls:        Twilio Voice SDK
AI:           OpenAI Whisper + Claude Sonnet
Location:     expo-location
Notifications: Expo Push
Build:        EAS Build
iOS testing:  TestFlight
Android test: Direct APK → Play Internal
Styling:      NativeWind (Tailwind)
State:        Zustand
Navigation:   Expo Router
```

---

*Last updated: March 2026 — 21 Estates Engineering*
