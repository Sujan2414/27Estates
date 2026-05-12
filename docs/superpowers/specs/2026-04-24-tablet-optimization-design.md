# Tablet Optimization Pass — 27 Estates Mobile

**Date:** 2026-04-24
**Status:** Approved, in implementation
**Scope:** Option B from brainstorm — proper tablet pass, OTA-deliverable

## Context

The 27 Estates mobile app (Expo SDK 54, React Native 0.81) is currently in active App Store + Play Store submission (TestFlight build 1.0.0(7); Play Internal Testing AAB versionCode 6). The app is portrait-locked (`app.json: orientation: "portrait"`) and `supportsTablet: true`. Every screen reads `Dimensions.get('window').width` once at module load and renders a phone-first layout, leaving stretched cards, dead horizontal space, and a visible bottom-gap on iPad/Android tablets.

All changes in this spec are React Native styling/component changes. They ship via `eas update` on the existing `production` channel and reach existing TestFlight + Play Internal Testing installs without rebuild or resubmission.

## Tablet definition

`useIsTablet()` returns `true` when `Math.min(width, height) >= 600`. Covers iPad mini (744 pt shortest edge), all larger iPads, and Android 7"+ tablets. Reactive to dimension changes (split-view / multitasking on iPad).

## Sections

### 1. Responsive primitives (`lib/responsive.ts`)

```ts
useIsTablet(): boolean
useContentWidth(maxPhone = 9999, maxTablet = 720): number
```

Both backed by `useWindowDimensions()` so layouts re-render on rotation / split-view resize.

### 2. CustomTabBar fix

Root cause of "gap at bottom": `Math.max(insets.bottom, 10)` adds a 10 px floor even when inset is 0 (older iPads with no home indicator). Combined with screen-level `paddingBottom`, produces visible empty space.

Changes to [components/nav/CustomTabBar.tsx](D:\Listings%20mobile%20version\components\nav\CustomTabBar.tsx):

- Drop the `10`-floor — use `insets.bottom` directly.
- Bar `paddingTop`: 10 → 14.
- On tablets: icons 22 → 26, labels 10 → 12, browse circle 68 → 80.
- On tablets: bar wrapped in centered `maxWidth: 720` container so it doesn't span the full canvas.

### 3. Content max-width clamp

Single-column screens get a centered 720 px content column on tablets. Background fills canvas; content sits in a column.

Affected screens:

- All `app/(auth)/*` (login, sign-in, signup, complete-profile, add-location, preferences, preferred-cities, success, verify-email, verify-reset, forgot-password, welcome)
- `app/onboarding.tsx`
- `app/me.tsx`
- `app/notifications.tsx`
- `app/edit-cities.tsx`, `app/edit-types.tsx`
- `app/project/[id].tsx`
- `app/property/[id].tsx`
- `app/list-property/*`
- `app/search.tsx`
- `app/filters.tsx`

Mechanism: each screen's outer `<ScrollView>` or `<View>` gets a centered inner `<View style={{ width: contentWidth, alignSelf: 'center' }}>`. No re-layout — content just stops stretching past 720 px.

### 4. Two-column grids on tablets

`FlatList`s with `numColumns={isTablet ? 2 : 1}` on:

- `(tabs)/index.tsx` — featured projects, recent listings sections
- `(tabs)/bookmarks.tsx` + `bookmarks-list.tsx`
- `(tabs)/agents.tsx`
- `category/[type].tsx` (Browse list)
- `search.tsx` results

[components/property/PropertyCard.tsx](D:\Listings%20mobile%20version\components\property\PropertyCard.tsx) gets an optional `width` prop so it can size correctly in either layout. No card redesign.

### 5. Touch-target + typography bumps

On tablets only:

- Primary CTA button height: 56 → 64
- Input field height: 56 → 64
- Body fontSize: +2 pt
- Section heading fontSize: +4 pt

## Out of scope (cut from B for risk control)

- iPad master-detail / split-view on project & property pages
- Landscape orientation (portrait-lock kept)
- Custom modal/sheet redesigns
- Map screen redesign (just clamp to centre)
- Messages / chat tablet-specific layout

## Delivery

1. Implement sections 1 → 5 in order.
2. `tsc --noEmit` to verify.
3. `eas update --branch production` to push OTA.
4. Existing iOS + Android testers pick up the change on second app launch.

No new build, no app-store resubmission.
