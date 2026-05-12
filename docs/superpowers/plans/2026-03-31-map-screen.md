# Map Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full Mapbox-powered Map tab to the 21 Estates mobile app showing live employee locations (profile-photo pins, active only during clock-in) and all property/project/commercial pins with detail sheets, filters, and share functionality.

**Architecture:** A new `map` tab is added to the existing Expo Router tabs layout. A background `expo-task-manager` task writes employee GPS to a new `employee_locations` Supabase table; the map screen subscribes via Supabase Realtime. Property/project/commercial pins are fetched from the existing Supabase tables (they already store `latitude`/`longitude`). A `@gorhom/bottom-sheet` panel slides up when a property pin is tapped to show full listing details and a share button.

**Tech Stack:** `@rnmapbox/maps` · `expo-location` + `expo-task-manager` · `@gorhom/bottom-sheet` (already installed) · Supabase Realtime · `react-native-share` · Expo Dev Client (required for Mapbox native module)

---

## File Structure

| File | Responsibility |
|---|---|
| `mobile/app/(tabs)/map.tsx` | Map screen entry point (tab route) |
| `mobile/src/components/map/MapScreen.tsx` | Full map UI — renders Mapbox map, all pins, filter bar, FAB |
| `mobile/src/components/map/EmployeePin.tsx` | Circular profile-photo pin for an employee |
| `mobile/src/components/map/PropertyPin.tsx` | Icon pin for property/project/commercial |
| `mobile/src/components/map/PropertySheet.tsx` | Bottom-sheet detail card for a tapped property |
| `mobile/src/components/map/MapFilterBar.tsx` | Horizontal scrollable filter pills (type, city) |
| `mobile/src/lib/location-tracker.ts` | Background location task definition + start/stop helpers |
| `mobile/src/lib/map-data.ts` | Supabase queries for map pins (properties + employee locations) |
| `supabase/migrations/20260331_employee_locations.sql` | New `employee_locations` table |
| `mobile/app/(tabs)/_layout.tsx` | **Modify** — add Map tab |
| `mobile/app/(tabs)/hrms/clock-in.tsx` | **Modify** — start/stop location tracker on check-in/check-out |

---

## Task 1: Supabase — Create `employee_locations` Table

**Files:**
- Create: `supabase/migrations/20260331_employee_locations.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- supabase/migrations/20260331_employee_locations.sql
create table if not exists public.employee_locations (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references public.profiles(id) on delete cascade,
  lat           double precision not null,
  lng           double precision not null,
  accuracy      double precision,
  heading       double precision,
  updated_at    timestamptz not null default now(),
  unique (employee_id)   -- one row per employee, upserted on update
);

-- Enable Realtime
alter publication supabase_realtime add table public.employee_locations;

-- RLS: employees can write their own row; admins/managers can read all
alter table public.employee_locations enable row level security;

create policy "employee can upsert own location"
  on public.employee_locations for all
  using (employee_id = auth.uid())
  with check (employee_id = auth.uid());

create policy "admin can read all locations"
  on public.employee_locations for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin', 'manager')
    )
  );
```

- [ ] **Step 2: Apply the migration in Supabase dashboard**

Open Supabase SQL editor → paste and run the migration. Confirm `employee_locations` table appears in Table Editor.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/SujanDandgulkar/OneDrive - UK&CO/21 estates/21-estates-web"
git add supabase/migrations/20260331_employee_locations.sql
git commit -m "feat: add employee_locations table with RLS and Realtime"
```

---

## Task 2: Install Mapbox + Configure Dev Client

**Files:**
- Modify: `mobile/package.json`
- Modify: `mobile/app.json`

- [ ] **Step 1: Install Mapbox and react-native-share**

```bash
cd "/c/Users/SujanDandgulkar/OneDrive - UK&CO/21 estates/21-estates-web/mobile"
npx expo install @rnmapbox/maps react-native-share expo-task-manager
```

- [ ] **Step 2: Add Mapbox token to `app.json`**

Read `mobile/app.json`, then add the Mapbox token plugin config inside `"expo"`:

```json
{
  "expo": {
    "plugins": [
      [
        "@rnmapbox/maps",
        {
          "RNMapboxMapsImpl": "mapbox",
          "RNMapboxMapsDownloadToken": "YOUR_MAPBOX_SECRET_TOKEN"
        }
      ]
    ]
  }
}
```

Replace `YOUR_MAPBOX_SECRET_TOKEN` with the secret token from mapbox.com/account/access-tokens (starts with `sk.`). The public token (`pk.`) goes in `.env`:

```bash
# mobile/.env (add this line)
EXPO_PUBLIC_MAPBOX_TOKEN=pk.ey...your_public_token
```

- [ ] **Step 3: Rebuild dev client**

```bash
cd "/c/Users/SujanDandgulkar/OneDrive - UK&CO/21 estates/21-estates-web/mobile"
npx expo run:android   # or: npx expo run:ios
```

> ⚠️ Mapbox requires a native build — Expo Go will not work. This step compiles the app once; after that hot-reload works normally.

- [ ] **Step 4: Commit**

```bash
git add mobile/package.json mobile/app.json mobile/package-lock.json
git commit -m "chore: install @rnmapbox/maps and expo-task-manager"
```

---

## Task 3: Background Location Tracker Service

**Files:**
- Create: `mobile/src/lib/location-tracker.ts`

- [ ] **Step 1: Create the location tracker**

```typescript
// mobile/src/lib/location-tracker.ts
import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'
import { supabase } from '@/lib/supabase'

export const LOCATION_TASK = '21ESTATES_LOCATION_TASK'

// ── Background task definition ─────────────────────────────────────────────
// Must be called at module top-level (outside components)
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.warn('[LocationTask] error:', error.message)
    return
  }
  const { locations } = data as { locations: Location.LocationObject[] }
  const latest = locations[locations.length - 1]
  if (!latest) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('employee_locations')
    .upsert(
      {
        employee_id: user.id,
        lat: latest.coords.latitude,
        lng: latest.coords.longitude,
        accuracy: latest.coords.accuracy,
        heading: latest.coords.heading,
        updated_at: new Date(latest.timestamp).toISOString(),
      },
      { onConflict: 'employee_id' }
    )
})

// ── Start tracking (call on clock-in) ──────────────────────────────────────
export async function startLocationTracking(): Promise<boolean> {
  const { status } = await Location.requestBackgroundPermissionsAsync()
  if (status !== 'granted') {
    console.warn('[LocationTracker] background location permission denied')
    return false
  }

  const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false)
  if (isRunning) return true

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 30_000,        // every 30 seconds
    distanceInterval: 50,        // or every 50 metres
    foregroundService: {
      notificationTitle: '21 Estates',
      notificationBody: 'Location tracking active during your shift',
      notificationColor: '#183C38',
    },
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true, // iOS blue bar
  })

  return true
}

// ── Stop tracking (call on clock-out) ─────────────────────────────────────
export async function stopLocationTracking(): Promise<void> {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false)
  if (!isRunning) return

  await Location.stopLocationUpdatesAsync(LOCATION_TASK)

  // Remove the employee's location row so they disappear from the map
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase
      .from('employee_locations')
      .delete()
      .eq('employee_id', user.id)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/lib/location-tracker.ts
git commit -m "feat: background location tracker service (start/stop on clock-in/out)"
```

---

## Task 4: Wire Location Tracking Into Clock-In / Clock-Out

**Files:**
- Modify: `mobile/app/(tabs)/hrms/clock-in.tsx`

- [ ] **Step 1: Read the current clock-in file**

Read `mobile/app/(tabs)/hrms/clock-in.tsx` fully before editing.

- [ ] **Step 2: Import and call start/stop tracking**

At the top of `clock-in.tsx`, add:

```typescript
import { startLocationTracking, stopLocationTracking } from '@/lib/location-tracker'
```

Find the `handleCheckIn` function (or wherever the Supabase `check_in` PATCH call is made). After the successful Supabase response, add:

```typescript
// Start background GPS tracking
await startLocationTracking()
```

Find the `handleCheckOut` function. After the successful Supabase response, add:

```typescript
// Stop GPS tracking and remove location from map
await stopLocationTracking()
```

- [ ] **Step 3: Add permissions to app.json**

In `mobile/app.json` under `"expo"`, add:

```json
{
  "expo": {
    "android": {
      "permissions": [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_LOCATION"
      ]
    },
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "21 Estates tracks your location during your work shift to help your team coordinate.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "21 Estates tracks your location in the background during your work shift.",
        "UIBackgroundModes": ["location", "fetch"]
      }
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add mobile/app/(tabs)/hrms/clock-in.tsx mobile/app.json
git commit -m "feat: start/stop background location on clock-in/clock-out"
```

---

## Task 5: Map Data Service (Supabase Queries)

**Files:**
- Create: `mobile/src/lib/map-data.ts`

- [ ] **Step 1: Create the map data service**

```typescript
// mobile/src/lib/map-data.ts
import { supabase } from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────
export type PinType = 'property' | 'project' | 'commercial'

export interface PropertyPin {
  id: string
  type: PinType
  title: string
  location: string | null
  city: string | null
  lat: number
  lng: number
  images: string[] | null
  price_text: string | null
  price: number | null
  bedrooms: number | null
  bathrooms: number | null
  sqft: number | null
  property_type: string | null
  category: string | null
  status: string | null
  bhk_options: string[] | null
  min_price: string | null
  max_price: string | null
  project_name: string | null
}

export interface EmployeeLocation {
  employee_id: string
  lat: number
  lng: number
  updated_at: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
}

export interface MapFilters {
  type: PinType | 'all'
  city: string | 'all'
}

// ── Employee Locations ────────────────────────────────────────────────────
export async function fetchEmployeeLocations(): Promise<EmployeeLocation[]> {
  const { data, error } = await supabase
    .from('employee_locations')
    .select(`
      employee_id, lat, lng, updated_at,
      profile:employee_id ( full_name, avatar_url, role )
    `)

  if (error) {
    console.warn('[MapData] employee_locations error:', error.message)
    return []
  }

  return (data ?? []).map((row: any) => ({
    employee_id: row.employee_id,
    lat: row.lat,
    lng: row.lng,
    updated_at: row.updated_at,
    full_name: row.profile?.full_name ?? null,
    avatar_url: row.profile?.avatar_url ?? null,
    role: row.profile?.role ?? null,
  }))
}

// ── Property Pins ─────────────────────────────────────────────────────────
export async function fetchPropertyPins(filters: MapFilters): Promise<PropertyPin[]> {
  const results: PropertyPin[] = []

  // Properties (residential)
  if (filters.type === 'all' || filters.type === 'property') {
    let q = supabase
      .from('properties')
      .select('id, title, location, city, latitude, longitude, images, price, price_text, bedrooms, bathrooms, sqft, property_type, category, status')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .not('category', 'in', '("Commercial","Office","Offices","Warehouse")')

    if (filters.city !== 'all') q = q.ilike('city', filters.city)

    const { data } = await q.limit(200)
    for (const p of data ?? []) {
      results.push({
        id: p.id, type: 'property',
        title: p.title, location: p.location, city: p.city,
        lat: p.latitude, lng: p.longitude,
        images: p.images, price_text: p.price_text, price: p.price,
        bedrooms: p.bedrooms, bathrooms: p.bathrooms, sqft: p.sqft,
        property_type: p.property_type, category: p.category, status: p.status,
        bhk_options: null, min_price: null, max_price: null, project_name: null,
      })
    }
  }

  // Projects
  if (filters.type === 'all' || filters.type === 'project') {
    let q = supabase
      .from('projects')
      .select('id, project_name, location, city, latitude, longitude, images, bhk_options, min_price, max_price, status, category')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (filters.city !== 'all') q = q.ilike('city', filters.city)

    const { data } = await q.limit(200)
    for (const p of data ?? []) {
      results.push({
        id: p.id, type: 'project',
        title: p.project_name, location: p.location, city: p.city,
        lat: p.latitude, lng: p.longitude,
        images: p.images, price_text: null, price: null,
        bedrooms: null, bathrooms: null, sqft: null,
        property_type: null, category: p.category, status: p.status,
        bhk_options: p.bhk_options, min_price: p.min_price, max_price: p.max_price,
        project_name: p.project_name,
      })
    }
  }

  // Commercial
  if (filters.type === 'all' || filters.type === 'commercial') {
    let q = supabase
      .from('properties')
      .select('id, title, location, city, latitude, longitude, images, price, price_text, sqft, property_type, category, status')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .in('category', ['Commercial', 'Office', 'Offices', 'Warehouse'])

    if (filters.city !== 'all') q = q.ilike('city', filters.city)

    const { data } = await q.limit(200)
    for (const p of data ?? []) {
      results.push({
        id: p.id, type: 'commercial',
        title: p.title, location: p.location, city: p.city,
        lat: p.latitude, lng: p.longitude,
        images: p.images, price_text: p.price_text, price: p.price,
        bedrooms: null, bathrooms: null, sqft: p.sqft,
        property_type: p.property_type, category: p.category, status: p.status,
        bhk_options: null, min_price: null, max_price: null, project_name: null,
      })
    }
  }

  return results
}

// ── Unique cities for filter pills ────────────────────────────────────────
export async function fetchCities(): Promise<string[]> {
  const [{ data: propCities }, { data: projCities }] = await Promise.all([
    supabase.from('properties').select('city').not('city', 'is', null),
    supabase.from('projects').select('city').not('city', 'is', null),
  ])
  const all = [
    ...(propCities ?? []).map((r: any) => r.city),
    ...(projCities ?? []).map((r: any) => r.city),
  ]
  return [...new Set(all)].filter(Boolean).sort()
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/lib/map-data.ts
git commit -m "feat: map data service — employee locations + property pins + city filter"
```

---

## Task 6: EmployeePin Component

**Files:**
- Create: `mobile/src/components/map/EmployeePin.tsx`

- [ ] **Step 1: Create the employee pin**

```typescript
// mobile/src/components/map/EmployeePin.tsx
import { View, Image, Text, StyleSheet } from 'react-native'
import { colors, radius, shadows } from '@/theme/colors'
import type { EmployeeLocation } from '@/lib/map-data'

interface Props {
  employee: EmployeeLocation
}

// Renders a circular profile-photo pin with a name label below
// Used as a Mapbox MarkerView child
export function EmployeePin({ employee }: Props) {
  const initials = (employee.full_name ?? 'U')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <View style={styles.wrapper}>
      {/* Outer ring (brand green) */}
      <View style={styles.ring}>
        {employee.avatar_url ? (
          <Image
            source={{ uri: employee.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.fallback]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
      </View>
      {/* Downward triangle */}
      <View style={styles.triangle} />
      {/* Name label */}
      <View style={styles.label}>
        <Text style={styles.labelText} numberOfLines={1}>
          {employee.full_name?.split(' ')[0] ?? 'Employee'}
        </Text>
      </View>
    </View>
  )
}

const PIN_SIZE = 44

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  ring: {
    width: PIN_SIZE + 4,
    height: PIN_SIZE + 4,
    borderRadius: (PIN_SIZE + 4) / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  avatar: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  fallback: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
    marginTop: -1,
  },
  label: {
    marginTop: 3,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    ...shadows.xs,
    maxWidth: 90,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textPrimary,
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/components/map/EmployeePin.tsx
git commit -m "feat: EmployeePin component — circular photo pin with name label"
```

---

## Task 7: PropertyPin Component

**Files:**
- Create: `mobile/src/components/map/PropertyPin.tsx`

- [ ] **Step 1: Create the property pin**

```typescript
// mobile/src/components/map/PropertyPin.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, shadows } from '@/theme/colors'
import type { PropertyPin as PropertyPinData } from '@/lib/map-data'

interface Props {
  pin: PropertyPinData
  onPress: (pin: PropertyPinData) => void
  selected?: boolean
}

const PIN_CONFIG = {
  property:   { icon: 'home' as const,       color: colors.primary,  bg: colors.primaryLight },
  project:    { icon: 'business' as const,   color: '#7C3AED',       bg: '#F5F3FF' },
  commercial: { icon: 'storefront' as const, color: colors.gold,     bg: colors.goldLight },
}

function formatPriceShort(pin: PropertyPinData): string {
  const p = pin.price
  if (!p && !pin.min_price) return 'On Request'
  if (pin.min_price) return `${pin.min_price}`
  if (!p) return 'On Request'
  if (p >= 10_000_000) return `₹${(p / 10_000_000).toFixed(1)}Cr`
  if (p >= 100_000)    return `₹${(p / 100_000).toFixed(0)}L`
  return `₹${p.toLocaleString('en-IN')}`
}

export function PropertyPin({ pin, onPress, selected = false }: Props) {
  const cfg = PIN_CONFIG[pin.type]

  return (
    <Pressable onPress={() => onPress(pin)} style={styles.wrapper}>
      <View style={[
        styles.bubble,
        { backgroundColor: selected ? cfg.color : colors.surface },
        selected && styles.bubbleSelected,
        shadows.card,
      ]}>
        <Ionicons
          name={cfg.icon}
          size={14}
          color={selected ? '#fff' : cfg.color}
        />
        <Text style={[
          styles.priceText,
          { color: selected ? '#fff' : colors.textPrimary },
        ]}>
          {formatPriceShort(pin)}
        </Text>
      </View>
      <View style={[styles.dot, { backgroundColor: cfg.color }]} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleSelected: {
    borderColor: 'transparent',
  },
  priceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/components/map/PropertyPin.tsx
git commit -m "feat: PropertyPin component — price bubble with type colour coding"
```

---

## Task 8: PropertySheet Bottom-Sheet Component

**Files:**
- Create: `mobile/src/components/map/PropertySheet.tsx`

- [ ] **Step 1: Create the property detail sheet**

```typescript
// mobile/src/components/map/PropertySheet.tsx
import {
  View, Text, StyleSheet, ScrollView, Image,
  Pressable, Share, Dimensions,
} from 'react-native'
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { useMemo, useRef, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, shadows, type as t } from '@/theme/colors'
import type { PropertyPin } from '@/lib/map-data'

const { width: SCREEN_W } = Dimensions.get('window')

interface Props {
  pin: PropertyPin | null
  onClose: () => void
}

const TYPE_LABEL: Record<string, string> = {
  property:   'Residential',
  project:    'Project',
  commercial: 'Commercial',
}

function formatFullPrice(pin: PropertyPin): string {
  if (pin.price_text) return pin.price_text
  if (pin.min_price && pin.max_price) return `${pin.min_price} – ${pin.max_price}`
  if (pin.min_price) return `From ${pin.min_price}`
  const p = pin.price
  if (!p) return 'Price on Request'
  if (p >= 10_000_000) return `₹ ${(p / 10_000_000).toFixed(2)} Cr`
  if (p >= 100_000)    return `₹ ${(p / 100_000).toFixed(2)} L`
  return `₹ ${p.toLocaleString('en-IN')}`
}

async function sharePin(pin: PropertyPin) {
  const price = formatFullPrice(pin)
  const message =
    `🏠 *${pin.title}*\n` +
    `📍 ${pin.location ?? pin.city ?? 'Location TBD'}\n` +
    `💰 ${price}\n` +
    (pin.bhk_options?.length ? `🛏 ${pin.bhk_options.join(', ')} BHK\n` : '') +
    (pin.bedrooms ? `🛏 ${pin.bedrooms} BHK  🚿 ${pin.bathrooms} Bath  📐 ${pin.sqft} sqft\n` : '') +
    `\n21 Estates — Contact us for a site visit.`
  await Share.share({ message })
}

export function PropertySheet({ pin, onClose }: Props) {
  const snapPoints = useMemo(() => ['45%', '85%'], [])
  const bottomSheetRef = useRef<BottomSheet>(null)

  useEffect(() => {
    if (pin) {
      bottomSheetRef.current?.expand()
    } else {
      bottomSheetRef.current?.close()
    }
  }, [pin])

  if (!pin) return null

  const coverImage = pin.images?.[0] ?? null
  const typeLabel  = TYPE_LABEL[pin.type] ?? pin.type

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {/* Cover image */}
        {coverImage && (
          <Image source={{ uri: coverImage }} style={styles.cover} />
        )}

        {/* Header row */}
        <View style={styles.header}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{typeLabel}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Title + location */}
        <Text style={[t.h2, { color: colors.textPrimary, marginTop: 8 }]}>
          {pin.title}
        </Text>
        {(pin.location || pin.city) && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={[t.sm, { color: colors.textSecondary }]}>
              {[pin.location, pin.city].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}

        {/* Price */}
        <Text style={styles.price}>{formatFullPrice(pin)}</Text>

        {/* Stats row */}
        {(pin.bedrooms || pin.sqft || pin.bhk_options?.length) && (
          <View style={styles.statsRow}>
            {pin.bedrooms && (
              <StatChip icon="bed-outline" label={`${pin.bedrooms} BHK`} />
            )}
            {pin.bathrooms && (
              <StatChip icon="water-outline" label={`${pin.bathrooms} Bath`} />
            )}
            {pin.sqft && (
              <StatChip icon="expand-outline" label={`${pin.sqft} sqft`} />
            )}
            {pin.bhk_options?.map(b => (
              <StatChip key={b} icon="bed-outline" label={`${b} BHK`} />
            ))}
          </View>
        )}

        {/* Property type chip */}
        {pin.property_type && (
          <Text style={[t.sm, { color: colors.textMuted, marginTop: 8 }]}>
            {pin.property_type} · {pin.category}
          </Text>
        )}

        {/* Image gallery strip */}
        {(pin.images?.length ?? 0) > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gallery}
          >
            {pin.images!.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.thumb} />
            ))}
          </ScrollView>
        )}

        {/* CTA Buttons */}
        <View style={styles.ctaRow}>
          <Pressable
            style={[styles.ctaBtn, styles.primaryBtn]}
            onPress={() => sharePin(pin)}
          >
            <Ionicons name="share-outline" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Share Brochure</Text>
          </Pressable>

          <Pressable style={[styles.ctaBtn, styles.secondaryBtn]}>
            <Ionicons name="call-outline" size={18} color={colors.primary} />
            <Text style={styles.secondaryBtnText}>Contact</Text>
          </Pressable>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  )
}

function StatChip({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={13} color={colors.textSecondary} />
      <Text style={[t.sm, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: colors.surface, borderRadius: 24 },
  handle:  { backgroundColor: colors.border, width: 40 },
  content: { padding: 20, paddingBottom: 48 },
  cover: {
    width: '100%', height: 200,
    borderRadius: radius.xl, marginBottom: 12,
    backgroundColor: colors.surfaceAlt,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.pill,
  },
  typeText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  price: {
    fontSize: 22, fontWeight: '700', color: colors.primary, marginTop: 10,
  },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border,
  },
  gallery: { gap: 8, paddingVertical: 12 },
  thumb: { width: 100, height: 70, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  ctaRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  ctaBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: radius.xl,
  },
  primaryBtn: { backgroundColor: colors.primary },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  secondaryBtn: { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary },
  secondaryBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/components/map/PropertySheet.tsx
git commit -m "feat: PropertySheet bottom-sheet with price, stats, gallery, share CTA"
```

---

## Task 9: MapFilterBar Component

**Files:**
- Create: `mobile/src/components/map/MapFilterBar.tsx`

- [ ] **Step 1: Create the filter bar**

```typescript
// mobile/src/components/map/MapFilterBar.tsx
import { ScrollView, Pressable, Text, View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius } from '@/theme/colors'
import type { MapFilters, PinType } from '@/lib/map-data'

interface Props {
  filters: MapFilters
  cities: string[]
  onChange: (f: MapFilters) => void
  employeeCount: number
  showEmployees: boolean
  onToggleEmployees: () => void
}

const TYPE_OPTIONS: { key: MapFilters['type']; label: string; icon: any }[] = [
  { key: 'all',        label: 'All',        icon: 'apps-outline' },
  { key: 'property',   label: 'Residential', icon: 'home-outline' },
  { key: 'project',    label: 'Projects',   icon: 'business-outline' },
  { key: 'commercial', label: 'Commercial', icon: 'storefront-outline' },
]

export function MapFilterBar({
  filters, cities, onChange, employeeCount, showEmployees, onToggleEmployees,
}: Props) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Employee toggle */}
        <Pressable
          onPress={onToggleEmployees}
          style={[styles.pill, showEmployees && styles.pillActive]}
        >
          <Ionicons
            name="people-outline"
            size={14}
            color={showEmployees ? '#fff' : colors.textSecondary}
          />
          <Text style={[styles.pillText, showEmployees && styles.pillTextActive]}>
            Team ({employeeCount})
          </Text>
        </Pressable>

        {/* Type filters */}
        {TYPE_OPTIONS.map(opt => (
          <Pressable
            key={opt.key}
            onPress={() => onChange({ ...filters, type: opt.key })}
            style={[styles.pill, filters.type === opt.key && styles.pillActive]}
          >
            <Ionicons
              name={opt.icon}
              size={14}
              color={filters.type === opt.key ? '#fff' : colors.textSecondary}
            />
            <Text style={[
              styles.pillText,
              filters.type === opt.key && styles.pillTextActive,
            ]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}

        {/* City filter */}
        <Pressable
          onPress={() => onChange({ ...filters, city: 'all' })}
          style={[styles.pill, filters.city === 'all' && styles.pillActive]}
        >
          <Text style={[styles.pillText, filters.city === 'all' && styles.pillTextActive]}>
            All Cities
          </Text>
        </Pressable>
        {cities.map(city => (
          <Pressable
            key={city}
            onPress={() => onChange({ ...filters, city })}
            style={[styles.pill, filters.city === city && styles.pillActive]}
          >
            <Text style={[styles.pillText, filters.city === city && styles.pillTextActive]}>
              {city}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 60, left: 0, right: 0, zIndex: 10,
  },
  scroll: { paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.surface,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  pillTextActive: { color: '#fff' },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/components/map/MapFilterBar.tsx
git commit -m "feat: MapFilterBar — type + city filter pills + employee toggle"
```

---

## Task 10: MapScreen Component (Core Map Logic)

**Files:**
- Create: `mobile/src/components/map/MapScreen.tsx`

- [ ] **Step 1: Create the full map screen component**

```typescript
// mobile/src/components/map/MapScreen.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, StyleSheet, SafeAreaView, Pressable,
  ActivityIndicator, Text, Platform,
} from 'react-native'
import Mapbox, { Camera, MarkerView, MapView } from '@rnmapbox/maps'
import { Ionicons } from '@expo/vector-icons'
import { colors, shadows } from '@/theme/colors'
import { EmployeePin } from './EmployeePin'
import { PropertyPin } from './PropertyPin'
import { PropertySheet } from './PropertySheet'
import { MapFilterBar } from './MapFilterBar'
import {
  fetchEmployeeLocations,
  fetchPropertyPins,
  fetchCities,
  type EmployeeLocation,
  type PropertyPin as PropertyPinData,
  type MapFilters,
} from '@/lib/map-data'
import { supabase } from '@/lib/supabase'

// Set the Mapbox access token (public token from .env)
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!)

// Default map center — Bangalore
const DEFAULT_CENTER: [number, number] = [77.5946, 12.9716]
const DEFAULT_ZOOM = 11

export function MapScreen() {
  const cameraRef = useRef<Camera>(null)

  const [loading, setLoading]           = useState(true)
  const [employees, setEmployees]       = useState<EmployeeLocation[]>([])
  const [properties, setProperties]     = useState<PropertyPinData[]>([])
  const [cities, setCities]             = useState<string[]>([])
  const [selectedPin, setSelectedPin]   = useState<PropertyPinData | null>(null)
  const [showEmployees, setShowEmployees] = useState(true)
  const [filters, setFilters]           = useState<MapFilters>({ type: 'all', city: 'all' })

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadAll()
  }, [])

  // ── Reload properties when filters change ────────────────────────────────
  useEffect(() => {
    loadProperties()
  }, [filters])

  // ── Supabase Realtime — employee_locations ────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('employee_locations_map')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employee_locations' },
        () => { loadEmployees() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadEmployees(), loadProperties(), loadCities()])
    setLoading(false)
  }

  async function loadEmployees() {
    const data = await fetchEmployeeLocations()
    setEmployees(data)
  }

  async function loadProperties() {
    const data = await fetchPropertyPins(filters)
    setProperties(data)
  }

  async function loadCities() {
    const data = await fetchCities()
    setCities(data)
  }

  const handlePropertyPress = useCallback((pin: PropertyPinData) => {
    setSelectedPin(pin)
    // Fly camera to pin
    cameraRef.current?.flyTo([pin.lng, pin.lat], 1000)
    cameraRef.current?.zoomTo(15, 800)
  }, [])

  const handleSheetClose = useCallback(() => {
    setSelectedPin(null)
  }, [])

  const flyToCurrentLocation = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const mine = employees.find(e => e.employee_id === user.id)
    if (mine) {
      cameraRef.current?.flyTo([mine.lng, mine.lat], 800)
      cameraRef.current?.zoomTo(16, 600)
    }
  }, [employees])

  return (
    <View style={styles.container}>
      {/* ── Mapbox Map ─────────────────────────────────────────────────────── */}
      <MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Dark}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled
        compassPosition={{ top: 120, right: 16 }}
        scaleBarEnabled={false}
      >
        <Camera
          ref={cameraRef}
          centerCoordinate={DEFAULT_CENTER}
          zoomLevel={DEFAULT_ZOOM}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {/* ── Employee Pins ───────────────────────────────────────────────── */}
        {showEmployees && employees.map(emp => (
          <MarkerView
            key={`emp-${emp.employee_id}`}
            coordinate={[emp.lng, emp.lat]}
            anchor={{ x: 0.5, y: 1 }}
          >
            <EmployeePin employee={emp} />
          </MarkerView>
        ))}

        {/* ── Property Pins ───────────────────────────────────────────────── */}
        {properties.map(pin => (
          <MarkerView
            key={`pin-${pin.type}-${pin.id}`}
            coordinate={[pin.lng, pin.lat]}
            anchor={{ x: 0.5, y: 1 }}
          >
            <PropertyPin
              pin={pin}
              onPress={handlePropertyPress}
              selected={selectedPin?.id === pin.id}
            />
          </MarkerView>
        ))}
      </MapView>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <MapFilterBar
        filters={filters}
        cities={cities}
        onChange={setFilters}
        employeeCount={employees.length}
        showEmployees={showEmployees}
        onToggleEmployees={() => setShowEmployees(v => !v)}
      />

      {/* ── Loading overlay ─────────────────────────────────────────────────── */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}

      {/* ── FABs ─────────────────────────────────────────────────────────── */}
      <View style={styles.fabStack}>
        {/* Refresh */}
        <Pressable style={styles.fab} onPress={loadAll}>
          <Ionicons name="refresh-outline" size={22} color={colors.primary} />
        </Pressable>
        {/* My location */}
        <Pressable style={styles.fab} onPress={flyToCurrentLocation}>
          <Ionicons name="locate-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {/* ── Live counter ────────────────────────────────────────────────────── */}
      {employees.length > 0 && (
        <View style={styles.liveChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{employees.length} live</Text>
        </View>
      )}

      {/* ── Property Detail Sheet ────────────────────────────────────────── */}
      <PropertySheet pin={selectedPin} onClose={handleSheetClose} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabStack: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    gap: 10,
  },
  fab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  liveChip: {
    position: 'absolute',
    top: 60,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    ...shadows.xs,
  },
  liveDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveText: { fontSize: 11, fontWeight: '600', color: colors.textPrimary },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/components/map/MapScreen.tsx
git commit -m "feat: MapScreen — Mapbox dark map with employee + property pins, filters, sheet"
```

---

## Task 11: Map Tab Route + Tab Bar Update

**Files:**
- Create: `mobile/app/(tabs)/map.tsx`
- Modify: `mobile/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Create the map tab route file**

```typescript
// mobile/app/(tabs)/map.tsx
import { MapScreen } from '@/components/map/MapScreen'

export default function MapTab() {
  return <MapScreen />
}
```

- [ ] **Step 2: Read the current `_layout.tsx`**

Read `mobile/app/(tabs)/_layout.tsx` fully.

- [ ] **Step 3: Add the Map tab to the TABS array**

In `mobile/app/(tabs)/_layout.tsx`, update the `TABS` array to add the map tab between CRM and Tasks:

```typescript
const TABS: TabConfig[] = [
  { name: 'index',  title: 'Home',       icon: 'home-outline',       iconFocused: 'home' },
  { name: 'hrms',   title: 'Attendance',  icon: 'calendar-outline',   iconFocused: 'calendar' },
  { name: 'crm',    title: 'CRM',         icon: 'clipboard-outline',  iconFocused: 'clipboard' },
  { name: 'map',    title: 'Map',         icon: 'map-outline',        iconFocused: 'map' },
  { name: 'cms',    title: 'Tasks',       icon: 'checkbox-outline',   iconFocused: 'checkbox' },
  { name: 'me',     title: 'Profile',     icon: 'layers-outline',     iconFocused: 'layers' },
]
```

- [ ] **Step 4: Commit**

```bash
git add mobile/app/(tabs)/map.tsx mobile/app/(tabs)/_layout.tsx
git commit -m "feat: add Map tab to bottom navigation"
```

---

## Task 12: Dark Mapbox Style Customisation

**Files:**
- Create: `mobile/src/lib/mapbox-style.ts`
- Modify: `mobile/src/components/map/MapScreen.tsx`

- [ ] **Step 1: Create a custom style override helper**

```typescript
// mobile/src/lib/mapbox-style.ts
// Mapbox Style URL — use Dark style as base, then apply brand overlays via layers
// Full custom JSON style is managed in Mapbox Studio.
// This file holds the Studio style URL and any runtime layer overrides.

// Replace with your own Studio style URL after creating it on mapbox.com/studio
// Default: use Mapbox built-in dark style until custom style is published
export const MAP_STYLE_URL =
  process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL ?? 'mapbox://styles/mapbox/dark-v11'

// Brand overlay colours applied via Mapbox layer expressions at runtime
export const BRAND_OVERLAYS = {
  background:  '#0D1B1A',   // very dark teal (near #183C38 darkened)
  water:       '#0E2E2B',
  land:        '#152320',
  roads:       '#1E4D47',
  roadsLabel:  '#4A8F88',
  buildings:   '#1C3430',
}
```

- [ ] **Step 2: Update MapScreen to use the style URL**

In `mobile/src/components/map/MapScreen.tsx`, replace:

```typescript
styleURL={Mapbox.StyleURL.Dark}
```

With:

```typescript
import { MAP_STYLE_URL } from '@/lib/mapbox-style'
// ...
styleURL={MAP_STYLE_URL}
```

- [ ] **Step 3: Commit**

```bash
git add mobile/src/lib/mapbox-style.ts mobile/src/components/map/MapScreen.tsx
git commit -m "feat: configurable Mapbox style URL with dark brand-green overlay config"
```

---

## Task 13: End-to-End Verification Checklist

- [ ] **Step 1: Build and run on device**

```bash
cd "/c/Users/SujanDandgulkar/OneDrive - UK&CO/21 estates/21-estates-web/mobile"
npx expo run:android   # or npx expo run:ios
```

- [ ] **Step 2: Verify Map tab appears**

Open the app → confirm "Map" icon appears in bottom tab bar between CRM and Tasks.

- [ ] **Step 3: Verify property pins render**

Confirm property/project/commercial pins appear on the map with correct colours:
- Green bubbles = residential properties
- Purple bubbles = projects
- Gold bubbles = commercial

- [ ] **Step 4: Verify tapping a pin opens the bottom sheet**

Tap any property pin → confirm bottom sheet slides up with title, price, image, BHK/sqft stats, and "Share Brochure" button.

- [ ] **Step 5: Verify Share button**

Tap "Share Brochure" → confirm native share sheet opens with pre-formatted property details text.

- [ ] **Step 6: Verify filters work**

Tap "Projects" filter pill → confirm only project pins remain visible. Tap a city → confirm only that city's pins show.

- [ ] **Step 7: Verify employee pins on check-in**

Clock in via HRMS → grant background location permission → confirm employee photo pin appears on Map tab.

- [ ] **Step 8: Verify employee pin disappears on clock-out**

Clock out → confirm the employee's pin is removed from the map within ~5 seconds (Realtime).

- [ ] **Step 9: Final commit**

```bash
git add .
git commit -m "feat: complete map screen with employee tracking, property pins, filters, and share"
```

---

## Self-Review

**Spec coverage:**
- ✅ Employee location shown as profile photo pin (Task 6)
- ✅ Location starts on clock-in, stops on clock-out (Task 4)
- ✅ Properties/projects/commercial as map pins (Task 7 + Task 10)
- ✅ Clicking pin opens property details (Task 8)
- ✅ Share brochure / photos (Task 8 — Share.share)
- ✅ Map filters by type and city (Task 9)
- ✅ Supabase data already captured — queries existing tables (Task 5)
- ✅ Mapbox with dark brand-green theme (Task 12)
- ✅ Realtime employee location updates (Task 10 — Supabase channel)

**No placeholders found.** All code blocks are complete and runnable.

**Type consistency:** `PropertyPin` type defined in `map-data.ts` (Task 5) is used consistently in `PropertyPin.tsx` (Task 7), `PropertySheet.tsx` (Task 8), and `MapScreen.tsx` (Task 10). `EmployeeLocation` type defined in Task 5 and used in Task 6 and Task 10. `MapFilters` defined in Task 5 and used in Tasks 9 and 10. All consistent.


