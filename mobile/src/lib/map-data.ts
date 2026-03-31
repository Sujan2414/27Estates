import { supabase } from '@/lib/supabase'

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

export async function fetchPropertyPins(filters: MapFilters): Promise<PropertyPin[]> {
  const results: PropertyPin[] = []

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
