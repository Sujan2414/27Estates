import * as XLSX from 'xlsx'

export type ProjectCategory = 'Residential' | 'Villa' | 'Plot' | 'Commercial'

// ─── Property Columns ─────────────────────────────────────────

const PROPERTY_COLUMNS = [
    'property_id', 'title', 'description', 'price', 'price_per_sqft',
    'location', 'bedrooms', 'bathrooms', 'sqft', 'lot_size', 'floors',
    'rooms', 'property_type', 'category', 'is_featured', 'video_url',
    'images', 'address_street', 'address_area', 'address_city', 'address_state',
    'address_zip', 'address_country', 'amenities_interior', 'amenities_outdoor',
    'amenities_utilities', 'amenities_other', 'floor_plans',
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

// ─── Project Shared Columns ───────────────────────────────────

const PROJECT_SHARED_COLUMNS = [
    'project_id', 'project_name', 'title', 'description',
    'rera_number', 'developer_name',
    'status', 'category', 'sub_category', 'total_units',
    'min_price', 'max_price', 'min_price_numeric', 'max_price_numeric',
    'price_per_sqft', 'min_area', 'max_area',
    'transaction_type', 'launch_date', 'possession_date',
    'video_url', 'brochure_url', 'master_plan_image',
    'is_featured', 'is_rera_approved',
    'employee_name', 'employee_phone', 'employee_email',
    'address', 'location', 'city', 'state', 'landmark', 'pincode',
    'images', 'amenities', 'floor_plans', 'connectivity', 'highlights',
]

// Legacy single-template columns (kept for backward compat)
const PROJECT_COLUMNS = [...PROJECT_SHARED_COLUMNS, 'bhk_options', 'towers_data', 'unit_configs']

// ─── Category-Specific Column Suffixes ───────────────────────

// Residential / Villa: up to 4 towers, up to 5 unit configs
const TOWER_COLS = [1, 2, 3, 4].flatMap(n => [
    `tower${n}_name`, `tower${n}_total_floors`, `tower${n}_total_units`,
    `tower${n}_completion_date`, `tower${n}_status`,
])
const RES_UNIT_COLS = [1, 2, 3, 4, 5].flatMap(n => [
    `unit${n}_bhk`, `unit${n}_carpet_area`, `unit${n}_built_up_area`,
    `unit${n}_price_range`, `unit${n}_status`,
])

// Plot: up to 4 phases, up to 4 plot types
const PHASE_COLS = [1, 2, 3, 4].flatMap(n => [
    `phase${n}_name`, `phase${n}_total_plots`, `phase${n}_plot_sizes`,
    `phase${n}_completion_date`, `phase${n}_status`,
])
const PLOT_UNIT_COLS = [1, 2, 3, 4].flatMap(n => [
    `plotunit${n}_type`, `plotunit${n}_area`, `plotunit${n}_price_range`, `plotunit${n}_status`,
])

// Commercial: up to 4 floors/wings, up to 5 unit types
const FLOOR_COLS = [1, 2, 3, 4].flatMap(n => [
    `floor${n}_name`, `floor${n}_total_units`, `floor${n}_unit_types`,
    `floor${n}_completion_date`, `floor${n}_status`,
])
const COMM_UNIT_COLS = [1, 2, 3, 4, 5].flatMap(n => [
    `cunit${n}_type`, `cunit${n}_area_range`, `cunit${n}_price_range`,
    `cunit${n}_rent_per_sqft`, `cunit${n}_status`,
])

function getCategoryColumns(category: ProjectCategory): string[] {
    const base = [...PROJECT_SHARED_COLUMNS]
    if (category === 'Residential' || category === 'Villa') {
        return [...base, 'bhk_options', ...TOWER_COLS, ...RES_UNIT_COLS]
    } else if (category === 'Plot') {
        return [...base, ...PHASE_COLS, ...PLOT_UNIT_COLS]
    } else {
        // Commercial
        return [...base, ...FLOOR_COLS, ...COMM_UNIT_COLS]
    }
}

// ─── Category Example Rows ────────────────────────────────────

const PROJECT_SHARED_EXAMPLE: Record<string, string> = {
    project_id: 'PRJ-001',
    project_name: 'Green Valley Residences',
    title: 'Premium Living at Green Valley',
    description: 'A gated community with modern amenities',
    rera_number: 'PRM/KA/RERA/2024/001',
    developer_name: 'ABC Builders',
    status: 'Under Construction',
    sub_category: '',
    total_units: '200',
    min_price: '60 Lakhs',
    max_price: '1.5 Cr',
    min_price_numeric: '6000000',
    max_price_numeric: '15000000',
    price_per_sqft: '8500',
    min_area: '800',
    max_area: '2000',
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
    amenities: '{"clubhouse":["Gym","Swimming Pool"],"outdoor":["Jogging Track","Garden"]}',
    floor_plans: '[{"name":"2BHK Type A","image":"","bhk":"2","area":"1050"}]',
    connectivity: '[{"type":"Metro","name":"Whitefield Metro","distance":"2 km"}]',
    highlights: '[{"icon":"","label":"Swimming Pool","value":"Olympic Size"}]',
}

const CATEGORY_EXAMPLE_EXTRAS: Record<ProjectCategory, Record<string, string>> = {
    Residential: {
        category: 'Residential',
        sub_category: 'Apartment',
        bhk_options: '2BHK, 3BHK, 4BHK',
        tower1_name: 'Tower A', tower1_total_floors: '20', tower1_total_units: '80', tower1_completion_date: '2025-12-31', tower1_status: 'Under Construction',
        tower2_name: 'Tower B', tower2_total_floors: '18', tower2_total_units: '72', tower2_completion_date: '2026-03-31', tower2_status: 'Under Construction',
        tower3_name: '', tower3_total_floors: '', tower3_total_units: '', tower3_completion_date: '', tower3_status: '',
        tower4_name: '', tower4_total_floors: '', tower4_total_units: '', tower4_completion_date: '', tower4_status: '',
        unit1_bhk: '2BHK', unit1_carpet_area: '950', unit1_built_up_area: '1150', unit1_price_range: '60-80 Lakhs', unit1_status: 'Available',
        unit2_bhk: '3BHK', unit2_carpet_area: '1200', unit2_built_up_area: '1500', unit2_price_range: '90 L - 1.2 Cr', unit2_status: 'Available',
        unit3_bhk: '4BHK', unit3_carpet_area: '1800', unit3_built_up_area: '2200', unit3_price_range: '1.5 - 2 Cr', unit3_status: 'Limited',
        unit4_bhk: '', unit4_carpet_area: '', unit4_built_up_area: '', unit4_price_range: '', unit4_status: '',
        unit5_bhk: '', unit5_carpet_area: '', unit5_built_up_area: '', unit5_price_range: '', unit5_status: '',
    },
    Villa: {
        category: 'Villa',
        sub_category: 'Independent Villa',
        bhk_options: '3BHK, 4BHK',
        tower1_name: 'Phase 1', tower1_total_floors: '2', tower1_total_units: '30', tower1_completion_date: '2025-06-30', tower1_status: 'Ready to Move',
        tower2_name: 'Phase 2', tower2_total_floors: '2', tower2_total_units: '25', tower2_completion_date: '2026-01-31', tower2_status: 'Under Construction',
        tower3_name: '', tower3_total_floors: '', tower3_total_units: '', tower3_completion_date: '', tower3_status: '',
        tower4_name: '', tower4_total_floors: '', tower4_total_units: '', tower4_completion_date: '', tower4_status: '',
        unit1_bhk: '3BHK', unit1_carpet_area: '2200', unit1_built_up_area: '2800', unit1_price_range: '1.2 - 1.5 Cr', unit1_status: 'Available',
        unit2_bhk: '4BHK', unit2_carpet_area: '3000', unit2_built_up_area: '3600', unit2_price_range: '2 - 2.5 Cr', unit2_status: 'Available',
        unit3_bhk: '', unit3_carpet_area: '', unit3_built_up_area: '', unit3_price_range: '', unit3_status: '',
        unit4_bhk: '', unit4_carpet_area: '', unit4_built_up_area: '', unit4_price_range: '', unit4_status: '',
        unit5_bhk: '', unit5_carpet_area: '', unit5_built_up_area: '', unit5_price_range: '', unit5_status: '',
    },
    Plot: {
        category: 'Plot',
        sub_category: 'Residential Plot',
        phase1_name: 'Phase 1', phase1_total_plots: '50', phase1_plot_sizes: '1200-2400 sqft', phase1_completion_date: '2025-06-30', phase1_status: 'Ready to Move',
        phase2_name: 'Phase 2', phase2_total_plots: '40', phase2_plot_sizes: '2400-4800 sqft', phase2_completion_date: '2026-03-31', phase2_status: 'Under Construction',
        phase3_name: '', phase3_total_plots: '', phase3_plot_sizes: '', phase3_completion_date: '', phase3_status: '',
        phase4_name: '', phase4_total_plots: '', phase4_plot_sizes: '', phase4_completion_date: '', phase4_status: '',
        plotunit1_type: 'Corner Plot', plotunit1_area: '2400 sqft', plotunit1_price_range: '40-60 Lakhs', plotunit1_status: 'Available',
        plotunit2_type: 'Regular Plot', plotunit2_area: '1200 sqft', plotunit2_price_range: '20-30 Lakhs', plotunit2_status: 'Available',
        plotunit3_type: '', plotunit3_area: '', plotunit3_price_range: '', plotunit3_status: '',
        plotunit4_type: '', plotunit4_area: '', plotunit4_price_range: '', plotunit4_status: '',
    },
    Commercial: {
        category: 'Commercial',
        sub_category: 'Office Space',
        floor1_name: 'Ground Floor', floor1_total_units: '10', floor1_unit_types: 'Retail Shops', floor1_completion_date: '2025-12-31', floor1_status: 'Ready to Move',
        floor2_name: 'First Floor', floor2_total_units: '20', floor2_unit_types: 'Office Space', floor2_completion_date: '2025-12-31', floor2_status: 'Ready to Move',
        floor3_name: 'Second Floor', floor3_total_units: '20', floor3_unit_types: 'Co-Working Space', floor3_completion_date: '2026-06-30', floor3_status: 'Under Construction',
        floor4_name: '', floor4_total_units: '', floor4_unit_types: '', floor4_completion_date: '', floor4_status: '',
        cunit1_type: 'Retail Shop', cunit1_area_range: '300-600 sqft', cunit1_price_range: '30-80 Lakhs', cunit1_rent_per_sqft: '120', cunit1_status: 'Available',
        cunit2_type: 'Office Unit', cunit2_area_range: '500-2000 sqft', cunit2_price_range: '50 L - 2 Cr', cunit2_rent_per_sqft: '85', cunit2_status: 'Available',
        cunit3_type: 'Co-Working Desk', cunit3_area_range: '50-200 sqft', cunit3_price_range: '5-20 Lakhs', cunit3_rent_per_sqft: '60', cunit3_status: 'Limited',
        cunit4_type: '', cunit4_area_range: '', cunit4_price_range: '', cunit4_rent_per_sqft: '', cunit4_status: '',
        cunit5_type: '', cunit5_area_range: '', cunit5_price_range: '', cunit5_rent_per_sqft: '', cunit5_status: '',
    },
}

// ─── Instructions Sheet ───────────────────────────────────────

function buildInstructionsSheet(category: ProjectCategory): XLSX.WorkSheet {
    const subCatMap: Record<ProjectCategory, string> = {
        Residential: 'Apartment | Penthouse | Studio | Duplex',
        Villa: 'Independent Villa | Row House | Twin Villa | Farm Villa',
        Plot: 'Farm Plot | Residential Plot | Commercial Plot | NA Plot',
        Commercial: 'Office Space | Retail Shops | Co-Working Space | Showroom | Mixed Use | Business Park | Mall',
    }

    const rows: unknown[][] = [
        ['21 Estates – Bulk Import Instructions', '', `Template: ${category} Projects`],
        [],
        ['FIELD', 'VALID VALUES / FORMAT', 'NOTES'],
        ['─────────────────', '─────────────────────────────────────────────────', '───────────────────────'],
        ['status', 'Under Construction | Ready to Move | Pre-Launch | Upcoming | Completed', 'Required'],
        ['category', category, `Fixed for this template`],
        ['sub_category', subCatMap[category], 'Pick one from the list'],
        ['transaction_type', 'New Launch | Resale | Rental', ''],
        ['is_featured', 'true | false', ''],
        ['is_rera_approved', 'true | false', ''],
        [],
        ['DATE FORMAT', 'YYYY-MM-DD  (e.g., 2025-06-30)', ''],
        ['PRICE FORMAT', 'min_price / max_price: display text (e.g., "1.5 Cr")', ''],
        ['', 'min_price_numeric / max_price_numeric: number in rupees (e.g., 15000000)', ''],
        ['IMAGES', 'Comma-separated URLs (e.g., https://…/img1.jpg, https://…/img2.jpg)', ''],
        ['AMENITIES', 'JSON: {"clubhouse":["Gym"],"outdoor":["Pool"]}', 'Optional – leave blank if unsure'],
        [],
    ]

    if (category === 'Residential' || category === 'Villa') {
        rows.push(['── TOWERS / PHASES ──', '', ''])
        rows.push(['bhk_options', '2BHK, 3BHK, 4BHK  (comma separated)', ''])
        rows.push(['tower1_name … tower4_name', 'Tower A, Block 1, Phase 1, etc.', 'Leave blank if not applicable'])
        rows.push(['tower_status', 'Under Construction | Ready to Move | Completed', ''])
        rows.push([])
        rows.push(['── UNIT CONFIGS ──', '', ''])
        rows.push(['unit1_bhk … unit5_bhk', '1BHK | 2BHK | 3BHK | 3.5BHK | 4BHK | 5BHK | Studio', ''])
        rows.push(['unit_carpet_area', 'Area in sqft (e.g., 1200)', ''])
        rows.push(['unit_built_up_area', 'Area in sqft (e.g., 1500)', ''])
        rows.push(['unit_price_range', 'Display text (e.g., 90 L - 1.2 Cr)', ''])
        rows.push(['unit_status', 'Available | Sold Out | Blocked | Limited', ''])
    } else if (category === 'Plot') {
        rows.push(['── PHASES ──', '', ''])
        rows.push(['phase1_name … phase4_name', 'Phase 1, Section A, etc.', 'Leave blank if not applicable'])
        rows.push(['phase_total_plots', 'Number of plots in this phase', ''])
        rows.push(['phase_plot_sizes', 'Size range (e.g., 1200-2400 sqft)', ''])
        rows.push(['phase_status', 'Under Construction | Ready to Move | Completed', ''])
        rows.push([])
        rows.push(['── PLOT TYPES ──', '', ''])
        rows.push(['plotunit1_type … plotunit4_type', 'Corner Plot | Regular Plot | Premium Plot | etc.', ''])
        rows.push(['plotunit_area', 'Area or range (e.g., 2400 sqft)', ''])
        rows.push(['plotunit_price_range', 'Display text (e.g., 40-60 Lakhs)', ''])
        rows.push(['plotunit_status', 'Available | Sold Out | Blocked | Limited', ''])
    } else {
        rows.push(['── FLOORS / WINGS ──', '', ''])
        rows.push(['floor1_name … floor4_name', 'Ground Floor, First Floor, Wing A, etc.', 'Leave blank if not applicable'])
        rows.push(['floor_total_units', 'Number of units on this floor/wing', ''])
        rows.push(['floor_unit_types', 'Types of units on this floor (e.g., Retail Shops)', ''])
        rows.push(['floor_status', 'Under Construction | Ready to Move | Completed', ''])
        rows.push([])
        rows.push(['── COMMERCIAL UNIT TYPES ──', '', ''])
        rows.push(['cunit1_type … cunit5_type', 'Retail Shop | Office Unit | Co-Working Desk | etc.', ''])
        rows.push(['cunit_area_range', 'Area range (e.g., 500-2000 sqft)', ''])
        rows.push(['cunit_price_range', 'Display text (e.g., 50 L - 2 Cr)', ''])
        rows.push(['cunit_rent_per_sqft', 'Monthly rent per sqft in ₹ (e.g., 85)', ''])
        rows.push(['cunit_status', 'Available | Sold Out | Blocked | Limited', ''])
    }

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 35 }, { wch: 60 }, { wch: 25 }]
    return ws
}

// ─── Template Generation ──────────────────────────────────────

export function generatePropertyTemplate(): void {
    const wb = XLSX.utils.book_new()
    const data = [PROPERTY_COLUMNS, PROPERTY_COLUMNS.map(col => PROPERTY_EXAMPLE[col as keyof typeof PROPERTY_EXAMPLE] ?? '')]
    const ws = XLSX.utils.aoa_to_sheet(data)
    ws['!cols'] = PROPERTY_COLUMNS.map(col => ({ wch: Math.max(col.length, 20) }))
    XLSX.utils.book_append_sheet(wb, ws, 'Properties')
    XLSX.writeFile(wb, 'property_template.xlsx')
}

export function generateProjectTemplate(category?: ProjectCategory): void {
    const wb = XLSX.utils.book_new()

    if (category) {
        // Category-specific template with flat columns
        const cols = getCategoryColumns(category)
        const example = { ...PROJECT_SHARED_EXAMPLE, ...CATEGORY_EXAMPLE_EXTRAS[category] }
        const exampleRow = cols.map(col => example[col] ?? '')

        const ws = XLSX.utils.aoa_to_sheet([cols, exampleRow])
        ws['!cols'] = cols.map(col => ({ wch: Math.max(col.length, 22) }))

        const instrWs = buildInstructionsSheet(category)

        XLSX.utils.book_append_sheet(wb, instrWs, 'Instructions')
        XLSX.utils.book_append_sheet(wb, ws, category)
        XLSX.writeFile(wb, `project_template_${category.toLowerCase()}.xlsx`)
    } else {
        // Legacy generic template
        const data = [PROJECT_COLUMNS, PROJECT_COLUMNS.map(col => {
            const legacy = {
                ...PROJECT_SHARED_EXAMPLE,
                bhk_options: '2BHK, 3BHK, 4BHK',
                category: 'Residential',
                sub_category: 'Apartment',
                towers_data: '[{"name":"Tower A","total_floors":"20","total_units":"80","completion_date":"2025-12","status":"Under Construction"}]',
                unit_configs: '[{"bhk":"3BHK","carpet_area":"1200","built_up_area":"1500","price_range":"1.2-1.5 Cr","status":"Available"}]',
            }
            return legacy[col as keyof typeof legacy] ?? ''
        })]
        const ws = XLSX.utils.aoa_to_sheet(data)
        ws['!cols'] = PROJECT_COLUMNS.map(col => ({ wch: Math.max(col.length, 25) }))
        XLSX.utils.book_append_sheet(wb, ws, 'Projects')
        XLSX.writeFile(wb, 'project_template.xlsx')
    }
}

// ─── Helpers ──────────────────────────────────────────────────

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

// ─── Flat Column Assembly ─────────────────────────────────────

function assembleTowersData(row: Record<string, unknown>, category: string): unknown[] | null {
    if (category === 'Commercial') {
        const floors = [1, 2, 3, 4].map(n => ({
            floor_name: safeStr(row[`floor${n}_name`]),
            total_units: safeStr(row[`floor${n}_total_units`]),
            unit_types: safeStr(row[`floor${n}_unit_types`]),
            completion_date: safeStr(row[`floor${n}_completion_date`]),
            status: safeStr(row[`floor${n}_status`]),
        })).filter(f => f.floor_name !== '')
        return floors.length > 0 ? floors : null
    } else if (category === 'Plot') {
        const phases = [1, 2, 3, 4].map(n => ({
            phase_name: safeStr(row[`phase${n}_name`]),
            total_plots: safeStr(row[`phase${n}_total_plots`]),
            plot_sizes: safeStr(row[`phase${n}_plot_sizes`]),
            completion_date: safeStr(row[`phase${n}_completion_date`]),
            status: safeStr(row[`phase${n}_status`]),
        })).filter(p => p.phase_name !== '')
        return phases.length > 0 ? phases : null
    } else {
        // Residential / Villa
        const towers = [1, 2, 3, 4].map(n => ({
            name: safeStr(row[`tower${n}_name`]),
            total_floors: safeStr(row[`tower${n}_total_floors`]),
            total_units: safeStr(row[`tower${n}_total_units`]),
            completion_date: safeStr(row[`tower${n}_completion_date`]),
            status: safeStr(row[`tower${n}_status`]),
        })).filter(t => t.name !== '')
        return towers.length > 0 ? towers : null
    }
}

function assembleUnitConfigs(row: Record<string, unknown>, category: string): unknown[] | null {
    if (category === 'Commercial') {
        const units = [1, 2, 3, 4, 5].map(n => ({
            unit_type: safeStr(row[`cunit${n}_type`]),
            area_range: safeStr(row[`cunit${n}_area_range`]),
            price_range: safeStr(row[`cunit${n}_price_range`]),
            rent_per_sqft: safeStr(row[`cunit${n}_rent_per_sqft`]),
            status: safeStr(row[`cunit${n}_status`]),
        })).filter(u => u.unit_type !== '')
        return units.length > 0 ? units : null
    } else if (category === 'Plot') {
        const units = [1, 2, 3, 4].map(n => ({
            type: safeStr(row[`plotunit${n}_type`]),
            area: safeStr(row[`plotunit${n}_area`]),
            price_range: safeStr(row[`plotunit${n}_price_range`]),
            status: safeStr(row[`plotunit${n}_status`]),
        })).filter(u => u.type !== '')
        return units.length > 0 ? units : null
    } else {
        // Residential / Villa
        const units = [1, 2, 3, 4, 5].map(n => ({
            bhk: safeStr(row[`unit${n}_bhk`]),
            carpet_area: safeStr(row[`unit${n}_carpet_area`]),
            built_up_area: safeStr(row[`unit${n}_built_up_area`]),
            price_range: safeStr(row[`unit${n}_price_range`]),
            status: safeStr(row[`unit${n}_status`]),
        })).filter(u => u.bhk !== '')
        return units.length > 0 ? units : null
    }
}

function isFlatFormat(row: Record<string, unknown>): boolean {
    return (
        'tower1_name' in row ||
        'phase1_name' in row ||
        'floor1_name' in row
    )
}

// ─── Property Parsing ─────────────────────────────────────────

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
        street: string; area: string; city: string; state: string
        zip: string; country: string; coordinates: { lat: number; lng: number }
    }
    amenities: { interior: string[]; outdoor: string[]; utilities: string[]; other: string[] }
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
        const rowNum = i + 2
        try {
            const title = safeStr(row['title'])
            const price = safeNum(row['price'])
            const location = safeStr(row['location'])

            if (!title) { errors.push({ row: rowNum, message: 'Title is required' }); return }
            if (price === null) { errors.push({ row: rowNum, message: 'Price is required' }); return }
            if (!location) { errors.push({ row: rowNum, message: 'Location is required' }); return }

            valid.push({
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
            })
        } catch (err) {
            errors.push({ row: rowNum, message: err instanceof Error ? err.message : 'Unknown error' })
        }
    })

    return { valid, errors }
}

// ─── Project Parsing ──────────────────────────────────────────

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

    // Find the data sheet (skip 'Instructions' sheet if present)
    const dataSheetName = wb.SheetNames.find(n => n !== 'Instructions') ?? wb.SheetNames[0]
    const ws = wb.Sheets[dataSheetName]
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

            const category = safeStr(row['category']) || 'Residential'
            const flat = isFlatFormat(row)

            valid.push({
                project_id: safeStr(row['project_id']),
                project_name,
                title: safeStr(row['title']) || project_name,
                description: safeStr(row['description']),
                rera_number: safeStr(row['rera_number']) || null,
                developer_name: safeStr(row['developer_name']) || null,
                status: safeStr(row['status']) || 'Under Construction',
                category,
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
                // Use flat columns if present, fall back to JSON
                towers_data: flat
                    ? assembleTowersData(row, category)
                    : safeJsonParse<unknown[] | null>(row['towers_data'], null),
                unit_configs: flat
                    ? assembleUnitConfigs(row, category)
                    : safeJsonParse<unknown[] | null>(row['unit_configs'], null),
            })
        } catch (err) {
            errors.push({ row: rowNum, message: err instanceof Error ? err.message : 'Unknown error' })
        }
    })

    return { valid, errors }
}

// ─── Bulk Export ──────────────────────────────────────────────

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
