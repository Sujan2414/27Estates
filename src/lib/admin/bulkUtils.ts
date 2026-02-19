import * as XLSX from 'xlsx'

// ─── Property Template ───────────────────────────────────────

const PROPERTY_COLUMNS = [
    'property_id',
    'title',
    'description',
    'price',
    'price_per_sqft',
    'location',
    'bedrooms',
    'bathrooms',
    'sqft',
    'lot_size',
    'floors',
    'rooms',
    'property_type',
    'category',
    'is_featured',
    'video_url',
    'images',
    'address_street',
    'address_area',
    'address_city',
    'address_state',
    'address_zip',
    'address_country',
    'amenities_interior',
    'amenities_outdoor',
    'amenities_utilities',
    'amenities_other',
    'floor_plans',
]

const PROPERTY_EXAMPLE = {
    property_id: 'PROP-001',
    title: 'Luxury 3BHK in Whitefield',
    description: 'Spacious apartment with garden view',
    price: '15000000',
    price_per_sqft: '8500',
    location: 'Whitefield',
    bedrooms: '3',
    bathrooms: '2',
    sqft: '1800',
    lot_size: '',
    floors: '1',
    rooms: '6',
    property_type: 'Sales',
    category: 'Apartment',
    is_featured: 'false',
    video_url: '',
    images: 'https://example.com/img1.jpg, https://example.com/img2.jpg',
    address_street: '123 Main Street',
    address_area: 'Whitefield',
    address_city: 'Bangalore',
    address_state: 'Karnataka',
    address_zip: '560066',
    address_country: 'India',
    amenities_interior: 'Modular Kitchen, Wooden Flooring, Walk-in Closet',
    amenities_outdoor: 'Swimming Pool, Garden',
    amenities_utilities: 'Power Backup, Water Supply',
    amenities_other: 'Parking, Gym',
    floor_plans: '[{"name":"Ground Floor","image":"https://example.com/fp.jpg"}]',
}

// ─── Project Template ────────────────────────────────────────

const PROJECT_COLUMNS = [
    'project_id',
    'project_name',
    'title',
    'description',
    'rera_number',
    'developer_name',
    'status',
    'category',
    'sub_category',
    'total_units',
    'min_price',
    'max_price',
    'min_price_numeric',
    'max_price_numeric',
    'price_per_sqft',
    'min_area',
    'max_area',
    'property_type',
    'bhk_options',
    'transaction_type',
    'launch_date',
    'possession_date',
    'video_url',
    'brochure_url',
    'master_plan_image',
    'is_featured',
    'is_rera_approved',
    'employee_name',
    'employee_phone',
    'employee_email',
    'address',
    'location',
    'city',
    'state',
    'landmark',
    'pincode',
    'images',
    'amenities',
    'floor_plans',
    'connectivity',
    'highlights',
    'towers_data',
    'unit_configs',
]

const PROJECT_EXAMPLE = {
    project_id: 'PRJ-001',
    project_name: 'Green Valley Residences',
    title: 'Premium Living at Green Valley',
    description: 'A gated community with modern amenities',
    rera_number: 'PRM/KA/RERA/2024/001',
    developer_name: 'ABC Builders',
    status: 'Under Construction',
    category: 'Residential',
    sub_category: 'Apartment',
    total_units: '200',
    min_price: '60 Lakhs',
    max_price: '1.5 Cr',
    min_price_numeric: '6000000',
    max_price_numeric: '15000000',
    price_per_sqft: '8500',
    min_area: '800',
    max_area: '2000',
    property_type: 'Apartment',
    bhk_options: '2BHK, 3BHK, 4BHK',
    transaction_type: 'New Launch',
    launch_date: '2024-01-15',
    possession_date: '2026-06-30',
    video_url: '',
    brochure_url: '',
    master_plan_image: '',
    is_featured: 'false',
    is_rera_approved: 'true',
    employee_name: 'John',
    employee_phone: '9876543210',
    employee_email: 'john@example.com',
    address: '123 Main Road',
    location: 'Whitefield',
    city: 'Bangalore',
    state: 'Karnataka',
    landmark: 'Near IT Park',
    pincode: '560066',
    images: 'https://example.com/img1.jpg, https://example.com/img2.jpg',
    amenities: '{"clubhouse":["Gym","Swimming Pool"],"outdoor":["Jogging Track","Garden"],"security":["CCTV","Intercom"],"lifestyle":["Clubhouse","Play Area"],"utilities":["Power Backup","Water Supply"]}',
    floor_plans: '[{"name":"2BHK Type A","image":"","bhk":"2","area":"1050"}]',
    connectivity: '[{"type":"Metro","name":"Whitefield Metro","distance":"2 km"}]',
    highlights: '[{"icon":"🏊","label":"Swimming Pool","value":"Olympic Size"}]',
    towers_data: '[{"name":"Tower A","total_floors":"20","total_units":"80","completion_date":"2025-12","status":"Under Construction"}]',
    unit_configs: '[{"tower":"Tower A","type":"Luxury","bhk":"3","carpet_area":"1200","built_up_area":"1500","price_range":"1.2-1.5 Cr","status":"Available"}]',
}

// ─── Template Generation ─────────────────────────────────────

export function generatePropertyTemplate(): void {
    const wb = XLSX.utils.book_new()
    const data = [PROPERTY_COLUMNS, PROPERTY_COLUMNS.map(col => PROPERTY_EXAMPLE[col as keyof typeof PROPERTY_EXAMPLE] ?? '')]
    const ws = XLSX.utils.aoa_to_sheet(data)

    // Set column widths
    ws['!cols'] = PROPERTY_COLUMNS.map(col => ({
        wch: Math.max(col.length, 20)
    }))

    XLSX.utils.book_append_sheet(wb, ws, 'Properties')
    XLSX.writeFile(wb, 'property_template.xlsx')
}

export function generateProjectTemplate(): void {
    const wb = XLSX.utils.book_new()
    const data = [PROJECT_COLUMNS, PROJECT_COLUMNS.map(col => PROJECT_EXAMPLE[col as keyof typeof PROJECT_EXAMPLE] ?? '')]
    const ws = XLSX.utils.aoa_to_sheet(data)

    ws['!cols'] = PROJECT_COLUMNS.map(col => ({
        wch: Math.max(col.length, 25)
    }))

    XLSX.utils.book_append_sheet(wb, ws, 'Projects')
    XLSX.writeFile(wb, 'project_template.xlsx')
}

// ─── Helpers ─────────────────────────────────────────────────

function safeStr(val: unknown): string {
    if (val === null || val === undefined) return ''
    return String(val).trim()
}

function safeBool(val: unknown): boolean {
    const s = safeStr(val).toLowerCase()
    return s === 'true' || s === 'yes' || s === '1'
}

function safeNum(val: unknown): number | null {
    const s = safeStr(val)
    if (s === '') return null
    const n = Number(s)
    return isNaN(n) ? null : n
}

function safeInt(val: unknown): number | null {
    const n = safeNum(val)
    return n !== null ? Math.round(n) : null
}

function parseCommaSeparated(val: unknown): string[] {
    const s = safeStr(val)
    if (!s) return []
    return s.split(',').map(v => v.trim()).filter(Boolean)
}

function safeJsonParse<T>(val: unknown, fallback: T): T {
    const s = safeStr(val)
    if (!s) return fallback
    try {
        return JSON.parse(s)
    } catch {
        return fallback
    }
}

// ─── Property Parsing ────────────────────────────────────────

export interface ParsedProperty {
    property_id: string
    title: string
    description: string
    price: number
    price_per_sqft: number | null
    location: string
    bedrooms: number
    bathrooms: number
    sqft: number
    lot_size: number | null
    floors: number | null
    rooms: number | null
    property_type: string
    category: string
    is_featured: boolean
    video_url: string | null
    images: string[]
    address: {
        street: string
        area: string
        city: string
        state: string
        zip: string
        country: string
        coordinates: { lat: number; lng: number }
    }
    amenities: {
        interior: string[]
        outdoor: string[]
        utilities: string[]
        other: string[]
    }
    floor_plans: { name: string; image: string }[] | null
}

export interface ParseResult<T> {
    valid: T[]
    errors: { row: number; message: string }[]
}

export async function parsePropertyExcel(file: File): Promise<ParseResult<ParsedProperty>> {
    const data = await file.arrayBuffer()
    const wb = XLSX.read(data)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

    const valid: ParsedProperty[] = []
    const errors: { row: number; message: string }[] = []

    rows.forEach((row, i) => {
        const rowNum = i + 2 // 1-indexed, skip header
        try {
            const title = safeStr(row['title'])
            const price = safeNum(row['price'])
            const location = safeStr(row['location'])

            if (!title) { errors.push({ row: rowNum, message: 'Title is required' }); return }
            if (price === null) { errors.push({ row: rowNum, message: 'Price is required' }); return }
            if (!location) { errors.push({ row: rowNum, message: 'Location is required' }); return }

            const property: ParsedProperty = {
                property_id: safeStr(row['property_id']),
                title,
                description: safeStr(row['description']),
                price,
                price_per_sqft: safeNum(row['price_per_sqft']),
                location,
                bedrooms: safeInt(row['bedrooms']) ?? 0,
                bathrooms: safeInt(row['bathrooms']) ?? 0,
                sqft: safeInt(row['sqft']) ?? 0,
                lot_size: safeInt(row['lot_size']),
                floors: safeInt(row['floors']),
                rooms: safeInt(row['rooms']),
                property_type: safeStr(row['property_type']) || 'Sales',
                category: safeStr(row['category']) || 'Apartment',
                is_featured: safeBool(row['is_featured']),
                video_url: safeStr(row['video_url']) || null,
                images: parseCommaSeparated(row['images']),
                address: {
                    street: safeStr(row['address_street']),
                    area: safeStr(row['address_area']),
                    city: safeStr(row['address_city']),
                    state: safeStr(row['address_state']),
                    zip: safeStr(row['address_zip']),
                    country: safeStr(row['address_country']) || 'India',
                    coordinates: { lat: 0, lng: 0 },
                },
                amenities: {
                    interior: parseCommaSeparated(row['amenities_interior']),
                    outdoor: parseCommaSeparated(row['amenities_outdoor']),
                    utilities: parseCommaSeparated(row['amenities_utilities']),
                    other: parseCommaSeparated(row['amenities_other']),
                },
                floor_plans: safeJsonParse<{ name: string; image: string }[]>(row['floor_plans'], []),
            }

            valid.push(property)
        } catch (err) {
            errors.push({ row: rowNum, message: err instanceof Error ? err.message : 'Unknown error' })
        }
    })

    return { valid, errors }
}

// ─── Project Parsing ─────────────────────────────────────────

export interface ParsedProject {
    project_id: string
    project_name: string
    title: string
    description: string
    rera_number: string | null
    developer_name: string | null
    status: string
    category: string
    sub_category: string | null
    total_units: number | null
    min_price: string | null
    max_price: string | null
    min_price_numeric: number | null
    max_price_numeric: number | null
    price_per_sqft: number | null
    min_area: number | null
    max_area: number | null
    property_type: string | null
    bhk_options: string[]
    transaction_type: string | null
    launch_date: string | null
    possession_date: string | null
    video_url: string | null
    brochure_url: string | null
    master_plan_image: string | null
    is_featured: boolean
    is_rera_approved: boolean
    employee_name: string | null
    employee_phone: string | null
    employee_email: string | null
    address: string | null
    location: string
    city: string | null
    state: string | null
    landmark: string | null
    pincode: string | null
    images: string[]
    amenities: Record<string, string[]>
    floor_plans: unknown[] | null
    connectivity: unknown[] | null
    highlights: unknown[] | null
    towers_data: unknown[] | null
    unit_configs: unknown[] | null
}

export async function parseProjectExcel(file: File): Promise<ParseResult<ParsedProject>> {
    const data = await file.arrayBuffer()
    const wb = XLSX.read(data)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

    const valid: ParsedProject[] = []
    const errors: { row: number; message: string }[] = []

    rows.forEach((row, i) => {
        const rowNum = i + 2
        try {
            const project_name = safeStr(row['project_name'])
            const location = safeStr(row['location'])

            if (!project_name) { errors.push({ row: rowNum, message: 'Project name is required' }); return }
            if (!location) { errors.push({ row: rowNum, message: 'Location is required' }); return }

            const project: ParsedProject = {
                project_id: safeStr(row['project_id']),
                project_name,
                title: safeStr(row['title']) || project_name,
                description: safeStr(row['description']),
                rera_number: safeStr(row['rera_number']) || null,
                developer_name: safeStr(row['developer_name']) || null,
                status: safeStr(row['status']) || 'Under Construction',
                category: safeStr(row['category']) || 'Residential',
                sub_category: safeStr(row['sub_category']) || null,
                total_units: safeInt(row['total_units']),
                min_price: safeStr(row['min_price']) || null,
                max_price: safeStr(row['max_price']) || null,
                min_price_numeric: safeNum(row['min_price_numeric']),
                max_price_numeric: safeNum(row['max_price_numeric']),
                price_per_sqft: safeNum(row['price_per_sqft']),
                min_area: safeNum(row['min_area']),
                max_area: safeNum(row['max_area']),
                property_type: safeStr(row['property_type']) || null,
                bhk_options: parseCommaSeparated(row['bhk_options']),
                transaction_type: safeStr(row['transaction_type']) || null,
                launch_date: safeStr(row['launch_date']) || null,
                possession_date: safeStr(row['possession_date']) || null,
                video_url: safeStr(row['video_url']) || null,
                brochure_url: safeStr(row['brochure_url']) || null,
                master_plan_image: safeStr(row['master_plan_image']) || null,
                is_featured: safeBool(row['is_featured']),
                is_rera_approved: safeBool(row['is_rera_approved']),
                employee_name: safeStr(row['employee_name']) || null,
                employee_phone: safeStr(row['employee_phone']) || null,
                employee_email: safeStr(row['employee_email']) || null,
                address: safeStr(row['address']) || null,
                location,
                city: safeStr(row['city']) || null,
                state: safeStr(row['state']) || null,
                landmark: safeStr(row['landmark']) || null,
                pincode: safeStr(row['pincode']) || null,
                images: parseCommaSeparated(row['images']),
                amenities: safeJsonParse<Record<string, string[]>>(row['amenities'], {}),
                floor_plans: safeJsonParse<unknown[] | null>(row['floor_plans'], null),
                connectivity: safeJsonParse<unknown[] | null>(row['connectivity'], null),
                highlights: safeJsonParse<unknown[] | null>(row['highlights'], null),
                towers_data: safeJsonParse<unknown[] | null>(row['towers_data'], null),
                unit_configs: safeJsonParse<unknown[] | null>(row['unit_configs'], null),
            }

            valid.push(project)
        } catch (err) {
            errors.push({ row: rowNum, message: err instanceof Error ? err.message : 'Unknown error' })
        }
    })

    return { valid, errors }
}

// ─── Bulk Export (Download existing data) ────────────────────

export function exportPropertiesToExcel(properties: Record<string, unknown>[]): void {
    const rows = properties.map(p => {
        const addr = (p.address as Record<string, unknown>) || {}
        const am = (p.amenities as Record<string, string[]>) || {}
        return {
            property_id: p.property_id || '',
            title: p.title || '',
            description: p.description || '',
            price: p.price || '',
            price_per_sqft: p.price_per_sqft || '',
            location: p.location || '',
            bedrooms: p.bedrooms || '',
            bathrooms: p.bathrooms || '',
            sqft: p.sqft || '',
            lot_size: p.lot_size || '',
            floors: p.floors || '',
            rooms: p.rooms || '',
            property_type: p.property_type || '',
            category: p.category || '',
            is_featured: p.is_featured ? 'true' : 'false',
            video_url: p.video_url || '',
            images: Array.isArray(p.images) ? (p.images as string[]).join(', ') : '',
            address_street: addr.street || '',
            address_area: addr.area || '',
            address_city: addr.city || '',
            address_state: addr.state || '',
            address_zip: addr.zip || '',
            address_country: addr.country || 'India',
            amenities_interior: (am.interior || []).join(', '),
            amenities_outdoor: (am.outdoor || []).join(', '),
            amenities_utilities: (am.utilities || []).join(', '),
            amenities_other: (am.other || []).join(', '),
            floor_plans: p.floor_plans ? JSON.stringify(p.floor_plans) : '',
        }
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = PROPERTY_COLUMNS.map(col => ({ wch: Math.max(col.length, 20) }))
    XLSX.utils.book_append_sheet(wb, ws, 'Properties')
    XLSX.writeFile(wb, `properties_export_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function exportProjectsToExcel(projects: Record<string, unknown>[]): void {
    const rows = projects.map(p => ({
        project_id: p.project_id || '',
        project_name: p.project_name || '',
        title: p.title || '',
        description: p.description || '',
        rera_number: p.rera_number || '',
        developer_name: p.developer_name || '',
        status: p.status || '',
        category: p.category || '',
        sub_category: p.sub_category || '',
        total_units: p.total_units || '',
        min_price: p.min_price || '',
        max_price: p.max_price || '',
        min_price_numeric: p.min_price_numeric || '',
        max_price_numeric: p.max_price_numeric || '',
        price_per_sqft: p.price_per_sqft || '',
        min_area: p.min_area || '',
        max_area: p.max_area || '',
        property_type: p.property_type || '',
        bhk_options: Array.isArray(p.bhk_options) ? (p.bhk_options as string[]).join(', ') : '',
        transaction_type: p.transaction_type || '',
        launch_date: p.launch_date || '',
        possession_date: p.possession_date || '',
        video_url: p.video_url || '',
        brochure_url: p.brochure_url || '',
        master_plan_image: p.master_plan_image || '',
        is_featured: p.is_featured ? 'true' : 'false',
        is_rera_approved: p.is_rera_approved ? 'true' : 'false',
        employee_name: p.employee_name || '',
        employee_phone: p.employee_phone || '',
        employee_email: p.employee_email || '',
        address: p.address || '',
        location: p.location || '',
        city: p.city || '',
        state: p.state || '',
        landmark: p.landmark || '',
        pincode: p.pincode || '',
        images: Array.isArray(p.images) ? (p.images as string[]).join(', ') : '',
        amenities: p.amenities ? JSON.stringify(p.amenities) : '',
        floor_plans: p.floor_plans ? JSON.stringify(p.floor_plans) : '',
        connectivity: p.connectivity ? JSON.stringify(p.connectivity) : '',
        highlights: p.highlights ? JSON.stringify(p.highlights) : '',
        towers_data: p.towers_data ? JSON.stringify(p.towers_data) : '',
        unit_configs: p.unit_configs ? JSON.stringify(p.unit_configs) : '',
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = PROJECT_COLUMNS.map(col => ({ wch: Math.max(col.length, 25) }))
    XLSX.utils.book_append_sheet(wb, ws, 'Projects')
    XLSX.writeFile(wb, `projects_export_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
