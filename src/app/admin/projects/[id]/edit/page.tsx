'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import BrochureUpload from '@/components/admin/BrochureUpload'
import BHKMultiSelect from '@/components/admin/BHKMultiSelect'
import ImageUpload from '@/components/admin/ImageUpload'
import MultiImageUpload from '@/components/admin/MultiImageUpload'
import styles from '../../../admin.module.css'
import formStyles from '../../../properties/form.module.css'
import { AMENITIES_BY_CATEGORY, AMENITY_CATEGORIES, flattenAmenities } from '@/lib/amenities-data'
import { Check, Search } from 'lucide-react'

interface Developer {
    id: string
    name: string
}

interface Agent {
    id: string
    name: string
    phone?: string
    email?: string
}

interface FloorPlan {
    name: string
    image: string
    bhk?: string
    area?: string
}

interface ConnectivityItem {
    type: string
    name: string
    distance: string
    icon?: string
}

const CONNECTIVITY_ICONS = [
    { label: 'Map Pin', value: 'MapPin' },
    { label: 'Train', value: 'Train' },
    { label: 'Bus', value: 'Bus' },
    { label: 'Plane', value: 'Plane' },
    { label: 'Hospital', value: 'Building2' },
    { label: 'School', value: 'GraduationCap' },
    { label: 'Shopping', value: 'ShoppingCart' },
    { label: 'Park', value: 'TreePine' },
    { label: 'Office', value: 'Briefcase' },
    { label: 'Metro', value: 'TrainFront' },
]

interface HighlightItem {
    icon: string
    label: string
    value: string
}

// Residential tower
interface ResidentialTower {
    name: string
    total_floors: string
    total_units: string
    completion_date: string
    status: string
}

// Villa cluster
interface VillaCluster {
    cluster_name: string
    total_villas: string
    villa_types: string
    completion_date: string
    status: string
}

// Plot phase
interface PlotPhase {
    phase_name: string
    total_plots: string
    launch_date: string
    status: string
    completion_date: string
}

// Residential unit
interface ResidentialUnit {
    tower: string
    type: string
    bhk: string
    carpet_area: string
    built_up_area: string
    price_range: string
    status: string
}

// Villa type config
interface VillaTypeConfig {
    villa_type: string
    bhk: string
    plot_area: string
    built_up_area: string
    floors: string
    price_range: string
    status: string
}

// Plot config
interface PlotConfig {
    plot_type: string
    dimensions: string
    area_sqft: string
    facing: string
    price_per_sqft: string
    total_price: string
    status: string
}

// Commercial floor
interface CommercialFloor {
    floor_name: string
    total_units: string
    unit_types: string
    completion_date: string
    status: string
}

// Commercial unit
interface CommercialUnit {
    unit_type: string
    area_range: string
    price_range: string
    rent_per_sqft: string
    status: string
}

export default function EditProjectPage() {
    const router = useRouter()
    const params = useParams()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [developers, setDevelopers] = useState<Developer[]>([])
    const [agents, setAgents] = useState<Agent[]>([])

    // Basic Info
    const [formData, setFormData] = useState({
        project_id: '',
        project_name: '',
        title: '',
        description: '',
        rera_number: '',
        developer_id: '',
        developer_name: '',
        developer_image: '',
        developer_description: '',
        status: 'Under Construction',
        category: 'Residential',
        sub_category: '',
        total_units: '',
        // Pricing
        min_price: '',
        max_price: '',
        min_price_numeric: '',
        max_price_numeric: '',
        price_per_sqft: '',
        // Areas
        min_area: '',
        max_area: '',
        // Details
        property_type: '',
        bhk_options: '',
        transaction_type: '',
        // Dates
        launch_date: '',
        possession_date: '',
        // Media
        video_url: '',
        brochure_url: '',
        master_plan_image: '',
        // Flags
        is_featured: false,
        is_rera_approved: false,
        // Contact
        employee_name: '',
        employee_phone: '',
        employee_email: '',
        assigned_agent_id: '',
    })

    // Address
    const [address, setAddress] = useState({
        address: '',
        location: '',
        city: '',
        state: '',
        landmark: '',
        pincode: '',
        country: 'India',
        latitude: '',
        longitude: '',
    })

    // Images
    const [images, setImages] = useState<string[]>([''])

    // Floor Plans
    const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([{ name: '', image: '', bhk: '', area: '' }])

    // Connectivity
    const [connectivity, setConnectivity] = useState<ConnectivityItem[]>([{ type: '', name: '', distance: '', icon: '' }])

    // Highlights
    const [highlights, setHighlights] = useState<HighlightItem[]>([{ icon: '', label: '', value: '' }])

    // Amenities
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
    const [amenitySearch, setAmenitySearch] = useState('')
    const [amenityDropdownOpen, setAmenityDropdownOpen] = useState(false)

    // Category-specific: Towers / Clusters / Phases
    const [residentialTowers, setResidentialTowers] = useState<ResidentialTower[]>([{ name: '', total_floors: '', total_units: '', completion_date: '', status: '' }])
    const [villaClusters, setVillaClusters] = useState<VillaCluster[]>([{ cluster_name: '', total_villas: '', villa_types: '', completion_date: '', status: '' }])
    const [plotPhases, setPlotPhases] = useState<PlotPhase[]>([{ phase_name: '', total_plots: '', launch_date: '', status: '', completion_date: '' }])

    // Category-specific: Unit configs
    const [residentialUnits, setResidentialUnits] = useState<ResidentialUnit[]>([{ tower: '', type: '', bhk: '', carpet_area: '', built_up_area: '', price_range: '', status: '' }])
    const [villaTypes, setVillaTypes] = useState<VillaTypeConfig[]>([{ villa_type: '', bhk: '', plot_area: '', built_up_area: '', floors: '', price_range: '', status: '' }])
    const [plotConfigs, setPlotConfigs] = useState<PlotConfig[]>([{ plot_type: '', dimensions: '', area_sqft: '', facing: '', price_per_sqft: '', total_price: '', status: '' }])
    const [commercialFloors, setCommercialFloors] = useState<CommercialFloor[]>([{ floor_name: '', total_units: '', unit_types: '', completion_date: '', status: '' }])
    const [commercialUnits, setCommercialUnits] = useState<CommercialUnit[]>([{ unit_type: '', area_range: '', price_range: '', rent_per_sqft: '', status: '' }])

    // Specifications (JSON text for now - complex nested)
    const [specsJson, setSpecsJson] = useState('{}')

    // Ad Card
    const [adCardImage, setAdCardImage] = useState('')
    const [showAdOnHome, setShowAdOnHome] = useState(false)
    const [fifoWarning, setFifoWarning] = useState<{ show: boolean; oldestProject: string | null }>({ show: false, oldestProject: null })

    useEffect(() => {
        fetchProject()
        fetchDevelopers()
        fetchAgents()
    }, [])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const dropdown = document.getElementById('amenity-dropdown')
            if (dropdown && !dropdown.contains(e.target as Node)) {
                setAmenityDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const fetchProject = async () => {
        if (!params?.id) return
        const { data, error: fetchError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', params.id as string)
            .single()

        if (fetchError || !data) {
            setError('Project not found')
            setLoading(false)
            return
        }

        setFormData({
            project_id: data.project_id || '',
            project_name: data.project_name || '',
            title: data.title || '',
            description: data.description || '',
            rera_number: data.rera_number || '',
            developer_id: data.developer_id || '',
            developer_name: data.developer_name || '',
            developer_image: data.developer_image || '',
            developer_description: data.developer_description || '',
            status: data.status || 'Under Construction',
            category: (data as Record<string, unknown>).category as string || 'Residential',
            sub_category: (data as Record<string, unknown>).sub_category as string || '',
            total_units: (data as Record<string, unknown>).total_units?.toString() || '',
            min_price: data.min_price || '',
            max_price: data.max_price || '',
            min_price_numeric: data.min_price_numeric?.toString() || '',
            max_price_numeric: data.max_price_numeric?.toString() || '',
            price_per_sqft: (data as Record<string, unknown>).price_per_sqft?.toString() || '',
            min_area: data.min_area?.toString() || '',
            max_area: data.max_area?.toString() || '',
            property_type: data.property_type || '',
            bhk_options: data.bhk_options?.join(', ') || '',
            transaction_type: data.transaction_type || '',
            launch_date: data.launch_date || '',
            possession_date: data.possession_date || '',
            video_url: data.video_url || '',
            brochure_url: data.brochure_url || '',
            master_plan_image: (data as Record<string, unknown>).master_plan_image as string || '',
            is_featured: data.is_featured || false,
            is_rera_approved: data.is_rera_approved || false,
            employee_name: data.employee_name || '',
            employee_phone: data.employee_phone || '',
            employee_email: data.employee_email || '',
            assigned_agent_id: data.assigned_agent_id || '',
        })

        setAddress({
            address: data.address || '',
            location: data.location || '',
            city: data.city || '',
            state: data.state || '',
            landmark: data.landmark || '',
            pincode: data.pincode || '',
            country: data.country || 'India',
            latitude: data.latitude?.toString() || '',
            longitude: data.longitude?.toString() || '',
        })

        // Images - filter out null/undefined entries from DB
        const rawImages = data.images || []
        const cleanImages = rawImages.filter((img: unknown) => typeof img === 'string' && img.trim() !== '')
        setImages(cleanImages.length > 0 ? cleanImages : [''])

        // Floor Plans
        const fp = ((data as Record<string, unknown>).floor_plans as FloorPlan[]) || []
        setFloorPlans(fp.length > 0 ? fp : [{ name: '', image: '', bhk: '', area: '' }])

        // Connectivity
        const conn = ((data as Record<string, unknown>).connectivity as ConnectivityItem[]) || []
        setConnectivity(conn.length > 0 ? conn : [{ type: '', name: '', distance: '' }])

        // Highlights
        const hl = ((data as Record<string, unknown>).highlights as HighlightItem[]) || []
        setHighlights(hl.length > 0 ? hl : [{ icon: '', label: '', value: '' }])

        // Amenities
        setSelectedAmenities(flattenAmenities(data.amenities))

        // Specifications
        setSpecsJson(JSON.stringify(data.specifications_complex || {}, null, 2))

        // Ad Card
        setAdCardImage((data as Record<string, unknown>).ad_card_image as string || '')
        setShowAdOnHome((data as Record<string, unknown>).show_ad_on_home as boolean || false)

        // Category-specific data
        const cat = (data as Record<string, unknown>).category as string || 'Residential'
        const towersData = (data.towers_data as unknown[]) || []
        const planData = (data.project_plan as unknown[]) || []

        if (cat === 'Residential') {
            setResidentialTowers(
                towersData.length > 0
                    ? (towersData as ResidentialTower[])
                    : [{ name: '', total_floors: '', total_units: '', completion_date: '', status: '' }]
            )
            setResidentialUnits(
                planData.length > 0
                    ? (planData as ResidentialUnit[])
                    : [{ tower: '', type: '', bhk: '', carpet_area: '', built_up_area: '', price_range: '', status: '' }]
            )
        } else if (cat === 'Villa') {
            setVillaClusters(
                towersData.length > 0
                    ? (towersData as VillaCluster[])
                    : [{ cluster_name: '', total_villas: '', villa_types: '', completion_date: '', status: '' }]
            )
            setVillaTypes(
                planData.length > 0
                    ? (planData as VillaTypeConfig[])
                    : [{ villa_type: '', bhk: '', plot_area: '', built_up_area: '', floors: '', price_range: '', status: '' }]
            )
        } else if (cat === 'Plot') {
            setPlotPhases(
                towersData.length > 0
                    ? (towersData as PlotPhase[])
                    : [{ phase_name: '', total_plots: '', launch_date: '', status: '', completion_date: '' }]
            )
            setPlotConfigs(
                planData.length > 0
                    ? (planData as PlotConfig[])
                    : [{ plot_type: '', dimensions: '', area_sqft: '', facing: '', price_per_sqft: '', total_price: '', status: '' }]
            )
        } else if (cat === 'Commercial') {
            setCommercialFloors(
                towersData.length > 0
                    ? (towersData as CommercialFloor[])
                    : [{ floor_name: '', total_units: '', unit_types: '', completion_date: '', status: '' }]
            )
            setCommercialUnits(
                planData.length > 0
                    ? (planData as CommercialUnit[])
                    : [{ unit_type: '', area_range: '', price_range: '', rent_per_sqft: '', status: '' }]
            )
        }

        setLoading(false)
    }

    const fetchDevelopers = async () => {
        const { data } = await supabase.from('developers').select('id, name')
        if (data) setDevelopers(data)
    }

    const fetchAgents = async () => {
        const { data } = await supabase.from('agents').select('id, name, phone, email').order('name')
        if (data) setAgents(data)
    }

    const handleAgentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const agentId = e.target.value
        const selectedAgent = agents.find(a => a.id === agentId)

        setFormData(prev => ({
            ...prev,
            assigned_agent_id: agentId,
            employee_name: selectedAgent?.name || prev.employee_name,
            employee_phone: selectedAgent?.phone || prev.employee_phone,
            employee_email: selectedAgent?.email || prev.employee_email,
        }))
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setAddress(prev => ({ ...prev, [name]: value }))
    }

    // Amenity handlers
    const toggleAmenity = (label: string) => {
        setSelectedAmenities(prev =>
            prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label]
        )
    }
    const removeSelectedAmenity = (label: string) => {
        setSelectedAmenities(prev => prev.filter(a => a !== label))
    }

    // Filter amenities for dropdown
    const filteredAmenityCategories = AMENITY_CATEGORIES.map(cat => ({
        category: cat,
        items: AMENITIES_BY_CATEGORY[cat].filter(a =>
            a.label.toLowerCase().includes(amenitySearch.toLowerCase())
        ),
    })).filter(g => g.items.length > 0)

    // Image handlers
    const handleImageChange = (index: number, value: string) => setImages(prev => prev.map((img, i) => i === index ? value : img))
    const addImage = () => setImages(prev => [...prev, ''])
    const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index))

    // Floor plan handlers
    const handleFloorPlanChange = (index: number, field: keyof FloorPlan, value: string) => {
        setFloorPlans(prev => prev.map((fp, i) => i === index ? { ...fp, [field]: value } : fp))
    }
    const addFloorPlan = () => setFloorPlans(prev => [...prev, { name: '', image: '', bhk: '', area: '' }])
    const removeFloorPlan = (index: number) => setFloorPlans(prev => prev.filter((_, i) => i !== index))

    // Connectivity handlers
    const handleConnectivityChange = (index: number, field: keyof ConnectivityItem, value: string) => {
        setConnectivity(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
    }
    const addConnectivity = () => setConnectivity(prev => [...prev, { type: '', name: '', distance: '', icon: '' }])
    const removeConnectivity = (index: number) => setConnectivity(prev => prev.filter((_, i) => i !== index))

    // Highlight handlers
    const handleHighlightChange = (index: number, field: keyof HighlightItem, value: string) => {
        setHighlights(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h))
    }
    const addHighlight = () => setHighlights(prev => [...prev, { icon: '', label: '', value: '' }])
    const removeHighlight = (index: number) => setHighlights(prev => prev.filter((_, i) => i !== index))

    // Residential Tower handlers
    const handleResTowerChange = (index: number, field: keyof ResidentialTower, value: string) => {
        setResidentialTowers(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t))
    }
    const addResTower = () => setResidentialTowers(prev => [...prev, { name: '', total_floors: '', total_units: '', completion_date: '', status: '' }])
    const removeResTower = (index: number) => setResidentialTowers(prev => prev.filter((_, i) => i !== index))

    // Residential Unit handlers
    const handleResUnitChange = (index: number, field: keyof ResidentialUnit, value: string) => {
        setResidentialUnits(prev => prev.map((u, i) => i === index ? { ...u, [field]: value } : u))
    }
    const addResUnit = () => setResidentialUnits(prev => [...prev, { tower: '', type: '', bhk: '', carpet_area: '', built_up_area: '', price_range: '', status: '' }])
    const removeResUnit = (index: number) => setResidentialUnits(prev => prev.filter((_, i) => i !== index))

    // Villa Cluster handlers
    const handleVillaClusterChange = (index: number, field: keyof VillaCluster, value: string) => {
        setVillaClusters(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
    }
    const addVillaCluster = () => setVillaClusters(prev => [...prev, { cluster_name: '', total_villas: '', villa_types: '', completion_date: '', status: '' }])
    const removeVillaCluster = (index: number) => setVillaClusters(prev => prev.filter((_, i) => i !== index))

    // Villa Type handlers
    const handleVillaTypeChange = (index: number, field: keyof VillaTypeConfig, value: string) => {
        setVillaTypes(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
    }
    const addVillaType = () => setVillaTypes(prev => [...prev, { villa_type: '', bhk: '', plot_area: '', built_up_area: '', floors: '', price_range: '', status: '' }])
    const removeVillaType = (index: number) => setVillaTypes(prev => prev.filter((_, i) => i !== index))

    // Plot Phase handlers
    const handlePlotPhaseChange = (index: number, field: keyof PlotPhase, value: string) => {
        setPlotPhases(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
    }
    const addPlotPhase = () => setPlotPhases(prev => [...prev, { phase_name: '', total_plots: '', launch_date: '', status: '', completion_date: '' }])
    const removePlotPhase = (index: number) => setPlotPhases(prev => prev.filter((_, i) => i !== index))

    // Plot Config handlers
    const handlePlotConfigChange = (index: number, field: keyof PlotConfig, value: string) => {
        setPlotConfigs(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
    }
    const addPlotConfig = () => setPlotConfigs(prev => [...prev, { plot_type: '', dimensions: '', area_sqft: '', facing: '', price_per_sqft: '', total_price: '', status: '' }])
    const removePlotConfig = (index: number) => setPlotConfigs(prev => prev.filter((_, i) => i !== index))

    // Commercial Floor handlers
    const handleCommercialFloorChange = (index: number, field: keyof CommercialFloor, value: string) => {
        setCommercialFloors(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f))
    }
    const addCommercialFloor = () => setCommercialFloors(prev => [...prev, { floor_name: '', total_units: '', unit_types: '', completion_date: '', status: '' }])
    const removeCommercialFloor = (index: number) => setCommercialFloors(prev => prev.filter((_, i) => i !== index))

    // Commercial Unit handlers
    const handleCommercialUnitChange = (index: number, field: keyof CommercialUnit, value: string) => {
        setCommercialUnits(prev => prev.map((u, i) => i === index ? { ...u, [field]: value } : u))
    }
    const addCommercialUnit = () => setCommercialUnits(prev => [...prev, { unit_type: '', area_range: '', price_range: '', rent_per_sqft: '', status: '' }])
    const removeCommercialUnit = (index: number) => setCommercialUnits(prev => prev.filter((_, i) => i !== index))

    const handleAdToggle = async (checked: boolean) => {
        if (!checked) {
            setShowAdOnHome(false)
            setFifoWarning({ show: false, oldestProject: null })
            return
        }
        const { data: activeAds } = await supabase
            .from('projects')
            .select('id, project_name')
            .eq('show_ad_on_home', true)
            .neq('id', params!.id as string)
            .order('created_at', { ascending: true })
        if (activeAds && activeAds.length >= 5) {
            setFifoWarning({ show: true, oldestProject: activeAds[0].project_name })
        } else {
            setFifoWarning({ show: false, oldestProject: null })
        }
        setShowAdOnHome(true)
    }

    const confirmFifoReplace = async () => {
        const { data: activeAds } = await supabase
            .from('projects')
            .select('id')
            .eq('show_ad_on_home', true)
            .neq('id', params!.id as string)
            .order('created_at', { ascending: true })
            .limit(1)
        if (activeAds && activeAds.length > 0) {
            await supabase
                .from('projects')
                .update({ show_ad_on_home: false })
                .eq('id', activeAds[0].id)
        }
        setFifoWarning({ show: false, oldestProject: null })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        setSuccess(null)

        try {
            // Build amenities — using flat array now
            const amenitiesData = selectedAmenities

            // Build floor plans
            const floorPlansData = (floorPlans || []).filter(fp => {
                const name = fp?.name || ''
                const image = fp?.image || ''
                return name.trim() !== '' || image.trim() !== ''
            })

            // Build connectivity
            const connectivityData = (connectivity || []).filter(c => (c?.name || '').trim() !== '')

            // Build highlights
            const highlightsData = (highlights || []).filter(h => (h?.label || '').trim() !== '' && (h?.value || '').trim() !== '')

            // Build towers_data based on category
            let towersData: unknown[] = []
            if (formData.category === 'Residential') {
                towersData = (residentialTowers || []).filter(t => (t?.name || '').trim() !== '')
            } else if (formData.category === 'Villa') {
                towersData = (villaClusters || []).filter(c => (c?.cluster_name || '').trim() !== '')
            } else if (formData.category === 'Plot') {
                towersData = (plotPhases || []).filter(p => (p?.phase_name || '').trim() !== '')
            } else if (formData.category === 'Commercial') {
                towersData = (commercialFloors || []).filter(f => (f?.floor_name || '').trim() !== '')
            }

            // Build project_plan based on category
            let planData: unknown[] = []
            if (formData.category === 'Residential') {
                planData = (residentialUnits || []).filter(u => (u?.bhk || '').trim() !== '')
            } else if (formData.category === 'Villa') {
                planData = (villaTypes || []).filter(v => (v?.villa_type || '').trim() !== '')
            } else if (formData.category === 'Plot') {
                planData = (plotConfigs || []).filter(p => (p?.plot_type || '').trim() !== '')
            } else if (formData.category === 'Commercial') {
                planData = (commercialUnits || []).filter(u => (u?.unit_type || '').trim() !== '')
            }

            // Parse specifications
            let specsData = {}
            try {
                specsData = JSON.parse(specsJson)
            } catch {
                // keep empty
            }

            const projectData: Record<string, unknown> = {
                project_id: formData.project_id,
                project_name: formData.project_name,
                title: formData.title || null,
                description: formData.description || null,
                rera_number: formData.rera_number || null,
                developer_id: formData.developer_id || null,
                developer_name: formData.developer_name || null,
                developer_image: formData.developer_image || null,
                developer_description: formData.developer_description || null,
                status: formData.status,
                category: formData.category,
                sub_category: formData.sub_category || null,
                total_units: formData.total_units ? parseInt(formData.total_units) : null,
                // Pricing
                min_price: formData.min_price || null,
                max_price: formData.max_price || null,
                min_price_numeric: formData.min_price_numeric ? parseFloat(formData.min_price_numeric) : null,
                max_price_numeric: formData.max_price_numeric ? parseFloat(formData.max_price_numeric) : null,
                price_per_sqft: formData.price_per_sqft ? parseFloat(formData.price_per_sqft) : null,
                // Areas
                min_area: formData.min_area ? parseFloat(formData.min_area) : null,
                max_area: formData.max_area ? parseFloat(formData.max_area) : null,
                // Details
                property_type: formData.property_type || null,
                bhk_options: formData.bhk_options ? formData.bhk_options.split(',').map(s => s.trim()).filter(Boolean) : null,
                transaction_type: formData.transaction_type || null,
                // Dates
                launch_date: formData.launch_date || null,
                possession_date: formData.possession_date || null,
                // Location
                address: address.address || null,
                location: address.location || null,
                city: address.city || null,
                state: address.state || null,
                landmark: address.landmark || null,
                pincode: address.pincode || null,
                country: address.country || null,
                latitude: address.latitude ? parseFloat(address.latitude) : null,
                longitude: address.longitude ? parseFloat(address.longitude) : null,
                // Media
                images: (images || []).filter(img => img && typeof img === 'string' && img.trim() !== ''),
                video_url: formData.video_url || null,
                brochure_url: formData.brochure_url || null,
                master_plan_image: formData.master_plan_image || null,
                // Flags
                is_featured: formData.is_featured,
                is_rera_approved: formData.is_rera_approved,
                // Contact
                employee_name: formData.employee_name || null,
                employee_phone: formData.employee_phone || null,
                employee_email: formData.employee_email || null,
                assigned_agent_id: formData.assigned_agent_id || null,
                // JSONB
                amenities: amenitiesData,
                floor_plans: floorPlansData.length > 0 ? floorPlansData : null,
                connectivity: connectivityData.length > 0 ? connectivityData : null,
                highlights: highlightsData.length > 0 ? highlightsData : null,
                towers_data: towersData.length > 0 ? towersData : null,
                project_plan: planData.length > 0 ? planData : null,
                specifications_complex: Object.keys(specsData).length > 0 ? specsData : null,
                // Ad Card
                ad_card_image: adCardImage || null,
                show_ad_on_home: showAdOnHome || false,
            }

            const { error: updateError } = await supabase
                .from('projects')
                .update(projectData)
                .eq('id', params!.id as string)

            if (updateError) {
                console.error('Supabase update error:', updateError)
                console.error('Project data sent:', JSON.stringify(projectData, null, 2))
                throw new Error(updateError.message || updateError.details || JSON.stringify(updateError))
            }

            // Auto-save new developer to developers table if created via edit form
            if (!projectData.developer_id && projectData.developer_name) {
                const { data: existingDevs } = await supabase
                    .from('developers')
                    .select('id')
                    .ilike('name', projectData.developer_name as string)
                    .limit(1)

                if (!existingDevs || existingDevs.length === 0) {
                    await supabase.from('developers').insert([{
                        name: projectData.developer_name,
                        logo: projectData.developer_image || null,
                        description: projectData.developer_description || null
                    }])
                }
            }

            setSuccess('Project saved successfully!')
            setTimeout(() => router.push('/admin/projects'), 1500)
        } catch (err: any) {
            console.error('Project save failed:', err)
            const msg = err?.message || err?.details || (typeof err === 'string' ? err : 'Failed to update project')
            setError(msg)
        } finally {
            setSaving(false)
        }
    }

    const categories = ['Residential', 'Villa', 'Plot', 'Commercial']
    const subCategories: Record<string, string[]> = {
        Residential: ['Apartment', 'Penthouse', 'Studio', 'Duplex'],
        Villa: ['Independent Villa', 'Row House', 'Twin Villa', 'Farm Villa'],
        Plot: ['Farm Plot', 'Residential Plot', 'Commercial Plot', 'NA Plot'],
        Commercial: ['Office Space', 'Retail Shops', 'Co-Working Space', 'Showroom', 'Mixed Use', 'Business Park', 'Mall'],
    }
    const statusOptions = ['Under Construction', 'Ready to Move', 'Pre-Launch', 'Upcoming', 'Completed']

    if (loading) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.emptyState}>
                    <Loader2 className="animate-spin" size={32} />
                    <p>Loading project...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.dashboard}>
            <div className={formStyles.header}>
                <Link href="/admin/projects" className={formStyles.backBtn}>
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className={styles.pageTitle}>Edit Project</h1>
                    <p className={styles.pageSubtitle}>{formData.project_name}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className={formStyles.form}>
                {error && <div className={formStyles.error}>{error}</div>}

                {/* Basic Information */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Basic Information</h2>

                    <div className={formStyles.grid2}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Project ID *</label>
                            <input type="text" name="project_id" value={formData.project_id} onChange={handleChange} className={formStyles.input} required />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Project Name *</label>
                            <input type="text" name="project_name" value={formData.project_name} onChange={handleChange} className={formStyles.input} required />
                        </div>
                    </div>

                    <div className={formStyles.field}>
                        <label className={formStyles.label}>Title (Display)</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} className={formStyles.input} />
                    </div>

                    <div className={formStyles.field}>
                        <label className={formStyles.label}>Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} className={formStyles.textarea} rows={4} />
                    </div>

                    <div className={formStyles.grid3}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Category *</label>
                            <select name="category" value={formData.category} onChange={handleChange} className={formStyles.select}>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Sub Category</label>
                            <select name="sub_category" value={formData.sub_category} onChange={handleChange} className={formStyles.select}>
                                <option value="">Select...</option>
                                {(subCategories[formData.category] || []).map(sc => <option key={sc} value={sc}>{sc}</option>)}
                            </select>
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className={formStyles.select}>
                                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className={formStyles.grid3}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Total Units</label>
                            <input type="number" name="total_units" value={formData.total_units} onChange={handleChange} className={formStyles.input} />
                        </div>
                    </div>
                </div>

                {/* Developer Information */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Developer Info</h2>
                    <div className={formStyles.grid2}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Developer Name</label>
                            <input type="text" name="developer_name" value={formData.developer_name} onChange={handleChange} className={formStyles.input} />
                        </div>
                    </div>
                    <div className={formStyles.grid2}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Developer Image</label>
                            <ImageUpload
                                folder="developers"
                                onChange={(url) => setFormData(prev => ({ ...prev, developer_image: url }))}
                                value={formData.developer_image || ''}
                            />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Developer Description</label>
                            <textarea
                                name="developer_description"
                                value={formData.developer_description}
                                onChange={handleChange}
                                className={formStyles.textarea}
                                rows={5}
                            />
                        </div>
                    </div>

                    <div className={formStyles.grid2}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>RERA Number</label>
                            <input type="text" name="rera_number" value={formData.rera_number} onChange={handleChange} className={formStyles.input} />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>BHK Options (comma-separated)</label>
                            <BHKMultiSelect
                                value={formData.bhk_options}
                                onChange={(val) => setFormData(prev => ({ ...prev, bhk_options: val }))}
                            />
                        </div>
                    </div>

                    <div className={formStyles.grid2}>
                        <div className={formStyles.checkboxField}>
                            <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleChange} />
                            <label>Featured Project</label>
                        </div>
                        <div className={formStyles.checkboxField}>
                            <input type="checkbox" name="is_rera_approved" checked={formData.is_rera_approved} onChange={handleChange} />
                            <label>RERA Approved</label>
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Pricing & Area</h2>

                    <div className={formStyles.grid3}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Min Price (Display)</label>
                            <input type="text" name="min_price" value={formData.min_price} onChange={handleChange} className={formStyles.input} placeholder="₹45 L" />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Max Price (Display)</label>
                            <input type="text" name="max_price" value={formData.max_price} onChange={handleChange} className={formStyles.input} placeholder="₹1.2 Cr" />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Price per Sqft</label>
                            <input type="number" name="price_per_sqft" value={formData.price_per_sqft} onChange={handleChange} className={formStyles.input} />
                        </div>
                    </div>

                    <div className={formStyles.grid2}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Min Price (Numeric)</label>
                            <input type="number" name="min_price_numeric" value={formData.min_price_numeric} onChange={handleChange} className={formStyles.input} />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Max Price (Numeric)</label>
                            <input type="number" name="max_price_numeric" value={formData.max_price_numeric} onChange={handleChange} className={formStyles.input} />
                        </div>
                    </div>

                    <div className={formStyles.grid3}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Min Area (sq.ft)</label>
                            <input type="number" name="min_area" value={formData.min_area} onChange={handleChange} className={formStyles.input} />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Max Area (sq.ft)</label>
                            <input type="number" name="max_area" value={formData.max_area} onChange={handleChange} className={formStyles.input} />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Property Type</label>
                            <input type="text" name="property_type" value={formData.property_type} onChange={handleChange} className={formStyles.input} />
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Dates</h2>
                    <div className={formStyles.grid2}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Launch Date</label>
                            <input type="text" name="launch_date" value={formData.launch_date} onChange={handleChange} className={formStyles.input} placeholder="March 2024" />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Possession Date</label>
                            <input type="text" name="possession_date" value={formData.possession_date} onChange={handleChange} className={formStyles.input} placeholder="December 2026" />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Location</h2>

                    <div className={formStyles.grid2}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Address</label>
                            <input type="text" name="address" value={address.address} onChange={handleAddressChange} className={formStyles.input} />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Location / Area</label>
                            <input type="text" name="location" value={address.location} onChange={handleAddressChange} className={formStyles.input} />
                        </div>
                    </div>

                    <div className={formStyles.grid3}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>City</label>
                            <input type="text" name="city" value={address.city} onChange={handleAddressChange} className={formStyles.input} />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>State</label>
                            <input type="text" name="state" value={address.state} onChange={handleAddressChange} className={formStyles.input} />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>PIN Code</label>
                            <input type="text" name="pincode" value={address.pincode} onChange={handleAddressChange} className={formStyles.input} />
                        </div>
                    </div>

                    <div className={formStyles.grid3}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Country</label>
                            <input type="text" name="country" value={address.country} onChange={handleAddressChange} className={formStyles.input} />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Landmark</label>
                            <input type="text" name="landmark" value={address.landmark} onChange={handleAddressChange} className={formStyles.input} />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Latitude</label>
                            <input type="text" name="latitude" value={address.latitude} onChange={handleAddressChange} className={formStyles.input} />
                        </div>
                    </div>

                    <div className={formStyles.grid3}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Longitude</label>
                            <input type="text" name="longitude" value={address.longitude} onChange={handleAddressChange} className={formStyles.input} />
                        </div>
                    </div>
                </div>

                {/* Contact */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Contact Person</h2>
                    <div className={formStyles.grid3}>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Name</label>
                            <input type="text" name="employee_name" value={formData.employee_name} onChange={handleChange} className={formStyles.input} />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Phone</label>
                            <input type="text" name="employee_phone" value={formData.employee_phone} onChange={handleChange} className={formStyles.input} />
                        </div>
                        <div className={formStyles.field}>
                            <label className={formStyles.label}>Email</label>
                            <input type="email" name="employee_email" value={formData.employee_email} onChange={handleChange} className={formStyles.input} />
                        </div>
                    </div>
                    <div className={formStyles.field} style={{ marginTop: '1rem' }}>
                        <label className={formStyles.label}>Assigned Agent</label>
                        <select name="assigned_agent_id" value={formData.assigned_agent_id} onChange={handleAgentSelect} className={formStyles.select}>
                            <option value="">Select Agent</option>
                            {agents.map(agent => (
                                <option key={agent.id} value={agent.id}>{agent.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* === CATEGORY-SPECIFIC SECTIONS === */}

                {/* Residential: Towers & Unit Configurations */}
                {formData.category === 'Residential' && (
                    <div className={formStyles.section}>
                        <h2 className={formStyles.sectionTitle}>Tower Details & Unit Configurations</h2>

                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>Towers</h3>
                        {residentialTowers.map((tower, index) => (
                            <div key={index} className={formStyles.floorPlanRow}>
                                <div className={formStyles.grid3}>
                                    <input type="text" value={tower.name} onChange={(e) => handleResTowerChange(index, 'name', e.target.value)} className={formStyles.input} placeholder="Tower Name" />
                                    <input type="text" value={tower.total_floors} onChange={(e) => handleResTowerChange(index, 'total_floors', e.target.value)} className={formStyles.input} placeholder="Total Floors" />
                                    <input type="text" value={tower.total_units} onChange={(e) => handleResTowerChange(index, 'total_units', e.target.value)} className={formStyles.input} placeholder="Total Units" />
                                </div>
                                <div className={formStyles.grid3} style={{ marginTop: '0.5rem' }}>
                                    <input type="text" value={tower.completion_date} onChange={(e) => handleResTowerChange(index, 'completion_date', e.target.value)} className={formStyles.input} placeholder="Completion Date" />
                                    <input type="text" value={tower.status} onChange={(e) => handleResTowerChange(index, 'status', e.target.value)} className={formStyles.input} placeholder="Status" />
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        {residentialTowers.length > 1 && (
                                            <button type="button" onClick={() => removeResTower(index)} className={formStyles.removeBtn}><X size={18} /></button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addResTower} className={formStyles.addImageBtn}><Plus size={16} /> Add Tower</button>

                        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>Unit Configurations</h3>
                        {residentialUnits.map((unit, index) => (
                            <div key={index} className={formStyles.floorPlanRow}>
                                <div className={formStyles.grid4}>
                                    <input type="text" value={unit.tower} onChange={(e) => handleResUnitChange(index, 'tower', e.target.value)} className={formStyles.input} placeholder="Tower" />
                                    <input type="text" value={unit.type} onChange={(e) => handleResUnitChange(index, 'type', e.target.value)} className={formStyles.input} placeholder="Type (Apt/Penthouse)" />
                                    <input type="text" value={unit.bhk} onChange={(e) => handleResUnitChange(index, 'bhk', e.target.value)} className={formStyles.input} placeholder="BHK" />
                                    <input type="text" value={unit.carpet_area} onChange={(e) => handleResUnitChange(index, 'carpet_area', e.target.value)} className={formStyles.input} placeholder="Carpet Area" />
                                </div>
                                <div className={formStyles.grid4} style={{ marginTop: '0.5rem' }}>
                                    <input type="text" value={unit.built_up_area} onChange={(e) => handleResUnitChange(index, 'built_up_area', e.target.value)} className={formStyles.input} placeholder="Built-up Area" />
                                    <input type="text" value={unit.price_range} onChange={(e) => handleResUnitChange(index, 'price_range', e.target.value)} className={formStyles.input} placeholder="Price Range" />
                                    <input type="text" value={unit.status} onChange={(e) => handleResUnitChange(index, 'status', e.target.value)} className={formStyles.input} placeholder="Status" />
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        {residentialUnits.length > 1 && (
                                            <button type="button" onClick={() => removeResUnit(index)} className={formStyles.removeBtn}><X size={18} /></button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addResUnit} className={formStyles.addImageBtn}><Plus size={16} /> Add Unit</button>
                    </div>
                )}

                {/* Villa: Clusters & Villa Type Configurations */}
                {formData.category === 'Villa' && (
                    <div className={formStyles.section}>
                        <h2 className={formStyles.sectionTitle}>Cluster Details & Villa Type Configurations</h2>

                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>Clusters</h3>
                        {villaClusters.map((cluster, index) => (
                            <div key={index} className={formStyles.floorPlanRow}>
                                <div className={formStyles.grid3}>
                                    <input type="text" value={cluster.cluster_name} onChange={(e) => handleVillaClusterChange(index, 'cluster_name', e.target.value)} className={formStyles.input} placeholder="Cluster Name" />
                                    <input type="text" value={cluster.total_villas} onChange={(e) => handleVillaClusterChange(index, 'total_villas', e.target.value)} className={formStyles.input} placeholder="Total Villas" />
                                    <input type="text" value={cluster.villa_types} onChange={(e) => handleVillaClusterChange(index, 'villa_types', e.target.value)} className={formStyles.input} placeholder="Villa Types (comma-sep)" />
                                </div>
                                <div className={formStyles.grid3} style={{ marginTop: '0.5rem' }}>
                                    <input type="text" value={cluster.completion_date} onChange={(e) => handleVillaClusterChange(index, 'completion_date', e.target.value)} className={formStyles.input} placeholder="Completion Date" />
                                    <input type="text" value={cluster.status} onChange={(e) => handleVillaClusterChange(index, 'status', e.target.value)} className={formStyles.input} placeholder="Status" />
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        {villaClusters.length > 1 && (
                                            <button type="button" onClick={() => removeVillaCluster(index)} className={formStyles.removeBtn}><X size={18} /></button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addVillaCluster} className={formStyles.addImageBtn}><Plus size={16} /> Add Cluster</button>

                        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>Villa Type Configurations</h3>
                        {villaTypes.map((villa, index) => (
                            <div key={index} className={formStyles.floorPlanRow}>
                                <div className={formStyles.grid4}>
                                    <input type="text" value={villa.villa_type} onChange={(e) => handleVillaTypeChange(index, 'villa_type', e.target.value)} className={formStyles.input} placeholder="Villa Type" />
                                    <input type="text" value={villa.bhk} onChange={(e) => handleVillaTypeChange(index, 'bhk', e.target.value)} className={formStyles.input} placeholder="BHK" />
                                    <input type="text" value={villa.plot_area} onChange={(e) => handleVillaTypeChange(index, 'plot_area', e.target.value)} className={formStyles.input} placeholder="Plot Area" />
                                    <input type="text" value={villa.built_up_area} onChange={(e) => handleVillaTypeChange(index, 'built_up_area', e.target.value)} className={formStyles.input} placeholder="Built-up Area" />
                                </div>
                                <div className={formStyles.grid4} style={{ marginTop: '0.5rem' }}>
                                    <input type="text" value={villa.floors} onChange={(e) => handleVillaTypeChange(index, 'floors', e.target.value)} className={formStyles.input} placeholder="Floors" />
                                    <input type="text" value={villa.price_range} onChange={(e) => handleVillaTypeChange(index, 'price_range', e.target.value)} className={formStyles.input} placeholder="Price Range" />
                                    <input type="text" value={villa.status} onChange={(e) => handleVillaTypeChange(index, 'status', e.target.value)} className={formStyles.input} placeholder="Status" />
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        {villaTypes.length > 1 && (
                                            <button type="button" onClick={() => removeVillaType(index)} className={formStyles.removeBtn}><X size={18} /></button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addVillaType} className={formStyles.addImageBtn}><Plus size={16} /> Add Villa Type</button>
                    </div>
                )}

                {/* Commercial: Floors & Unit Configurations */}
                {formData.category === 'Commercial' && (
                    <div className={formStyles.section}>
                        <h2 className={formStyles.sectionTitle}>Floor / Wing Details & Unit Configurations</h2>

                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>Floors / Wings</h3>
                        {commercialFloors.map((floor, index) => (
                            <div key={index} className={formStyles.floorPlanRow}>
                                <div className={formStyles.grid3}>
                                    <input type="text" value={floor.floor_name} onChange={(e) => handleCommercialFloorChange(index, 'floor_name', e.target.value)} className={formStyles.input} placeholder="Floor / Wing Name" />
                                    <input type="text" value={floor.total_units} onChange={(e) => handleCommercialFloorChange(index, 'total_units', e.target.value)} className={formStyles.input} placeholder="Total Units" />
                                    <input type="text" value={floor.unit_types} onChange={(e) => handleCommercialFloorChange(index, 'unit_types', e.target.value)} className={formStyles.input} placeholder="Unit Types (Office, Retail...)" />
                                </div>
                                <div className={formStyles.grid3} style={{ marginTop: '0.5rem' }}>
                                    <input type="text" value={floor.completion_date} onChange={(e) => handleCommercialFloorChange(index, 'completion_date', e.target.value)} className={formStyles.input} placeholder="Completion Date" />
                                    <input type="text" value={floor.status} onChange={(e) => handleCommercialFloorChange(index, 'status', e.target.value)} className={formStyles.input} placeholder="Status" />
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        {commercialFloors.length > 1 && (
                                            <button type="button" onClick={() => removeCommercialFloor(index)} className={formStyles.removeBtn}><X size={18} /></button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addCommercialFloor} className={formStyles.addImageBtn}><Plus size={16} /> Add Floor / Wing</button>

                        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>Unit Configurations</h3>
                        {commercialUnits.map((unit, index) => (
                            <div key={index} className={formStyles.floorPlanRow}>
                                <div className={formStyles.grid4}>
                                    <input type="text" value={unit.unit_type} onChange={(e) => handleCommercialUnitChange(index, 'unit_type', e.target.value)} className={formStyles.input} placeholder="Unit Type (Office Space...)" />
                                    <input type="text" value={unit.area_range} onChange={(e) => handleCommercialUnitChange(index, 'area_range', e.target.value)} className={formStyles.input} placeholder="Area Range (500–2000 sqft)" />
                                    <input type="text" value={unit.price_range} onChange={(e) => handleCommercialUnitChange(index, 'price_range', e.target.value)} className={formStyles.input} placeholder="Price Range (₹50L–₹2Cr)" />
                                    <input type="text" value={unit.rent_per_sqft} onChange={(e) => handleCommercialUnitChange(index, 'rent_per_sqft', e.target.value)} className={formStyles.input} placeholder="Rent / sqft (₹80/sqft)" />
                                </div>
                                <div className={formStyles.grid4} style={{ marginTop: '0.5rem' }}>
                                    <input type="text" value={unit.status} onChange={(e) => handleCommercialUnitChange(index, 'status', e.target.value)} className={formStyles.input} placeholder="Status" />
                                    <div></div>
                                    <div></div>
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        {commercialUnits.length > 1 && (
                                            <button type="button" onClick={() => removeCommercialUnit(index)} className={formStyles.removeBtn}><X size={18} /></button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addCommercialUnit} className={formStyles.addImageBtn}><Plus size={16} /> Add Unit Config</button>
                    </div>
                )}

                {/* Plot: Phases & Plot Configurations */}
                {formData.category === 'Plot' && (
                    <div className={formStyles.section}>
                        <h2 className={formStyles.sectionTitle}>Phase Details & Plot Configurations</h2>

                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>Phases</h3>
                        {plotPhases.map((phase, index) => (
                            <div key={index} className={formStyles.floorPlanRow}>
                                <div className={formStyles.grid3}>
                                    <input type="text" value={phase.phase_name} onChange={(e) => handlePlotPhaseChange(index, 'phase_name', e.target.value)} className={formStyles.input} placeholder="Phase Name" />
                                    <input type="text" value={phase.total_plots} onChange={(e) => handlePlotPhaseChange(index, 'total_plots', e.target.value)} className={formStyles.input} placeholder="Total Plots" />
                                    <input type="text" value={phase.launch_date} onChange={(e) => handlePlotPhaseChange(index, 'launch_date', e.target.value)} className={formStyles.input} placeholder="Launch Date" />
                                </div>
                                <div className={formStyles.grid3} style={{ marginTop: '0.5rem' }}>
                                    <input type="text" value={phase.completion_date} onChange={(e) => handlePlotPhaseChange(index, 'completion_date', e.target.value)} className={formStyles.input} placeholder="Completion Date" />
                                    <input type="text" value={phase.status} onChange={(e) => handlePlotPhaseChange(index, 'status', e.target.value)} className={formStyles.input} placeholder="Status" />
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        {plotPhases.length > 1 && (
                                            <button type="button" onClick={() => removePlotPhase(index)} className={formStyles.removeBtn}><X size={18} /></button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addPlotPhase} className={formStyles.addImageBtn}><Plus size={16} /> Add Phase</button>

                        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>Plot Configurations</h3>
                        {plotConfigs.map((plot, index) => (
                            <div key={index} className={formStyles.floorPlanRow}>
                                <div className={formStyles.grid4}>
                                    <input type="text" value={plot.plot_type} onChange={(e) => handlePlotConfigChange(index, 'plot_type', e.target.value)} className={formStyles.input} placeholder="Plot Type" />
                                    <input type="text" value={plot.dimensions} onChange={(e) => handlePlotConfigChange(index, 'dimensions', e.target.value)} className={formStyles.input} placeholder="Dimensions (30x40)" />
                                    <input type="text" value={plot.area_sqft} onChange={(e) => handlePlotConfigChange(index, 'area_sqft', e.target.value)} className={formStyles.input} placeholder="Area (sqft)" />
                                    <input type="text" value={plot.facing} onChange={(e) => handlePlotConfigChange(index, 'facing', e.target.value)} className={formStyles.input} placeholder="Facing" />
                                </div>
                                <div className={formStyles.grid4} style={{ marginTop: '0.5rem' }}>
                                    <input type="text" value={plot.price_per_sqft} onChange={(e) => handlePlotConfigChange(index, 'price_per_sqft', e.target.value)} className={formStyles.input} placeholder="Price/sqft" />
                                    <input type="text" value={plot.total_price} onChange={(e) => handlePlotConfigChange(index, 'total_price', e.target.value)} className={formStyles.input} placeholder="Total Price" />
                                    <input type="text" value={plot.status} onChange={(e) => handlePlotConfigChange(index, 'status', e.target.value)} className={formStyles.input} placeholder="Status" />
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        {plotConfigs.length > 1 && (
                                            <button type="button" onClick={() => removePlotConfig(index)} className={formStyles.removeBtn}><X size={18} /></button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addPlotConfig} className={formStyles.addImageBtn}><Plus size={16} /> Add Plot Config</button>
                    </div>
                )}

                {/* Key Highlights */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Key Highlights</h2>
                    <p className={formStyles.sectionHelp}>Shown as highlight cards on the detail page (e.g., Configuration, Area Range, Possession, RERA)</p>
                    {highlights.map((hl, index) => (
                        <div key={index} className={formStyles.floorPlanRow}>
                            <div className={formStyles.grid3}>
                                <input type="text" value={hl.label} onChange={(e) => handleHighlightChange(index, 'label', e.target.value)} className={formStyles.input} placeholder="Label (e.g., Configuration)" />
                                <input type="text" value={hl.value} onChange={(e) => handleHighlightChange(index, 'value', e.target.value)} className={formStyles.input} placeholder="Value (e.g., 2, 3 BHK)" />
                                <div className={formStyles.imageInput}>
                                    <input type="text" value={hl.icon} onChange={(e) => handleHighlightChange(index, 'icon', e.target.value)} className={formStyles.input} placeholder="Icon (optional)" />
                                    {highlights.length > 1 && (
                                        <button type="button" onClick={() => removeHighlight(index)} className={formStyles.removeBtn}><X size={18} /></button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addHighlight} className={formStyles.addImageBtn}><Plus size={16} /> Add Highlight</button>
                </div>

                {/* Amenities */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Amenities</h2>
                    <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '12px' }}>
                        Select amenities available in this project.
                    </p>

                    {selectedAmenities.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                            {selectedAmenities.map(label => (
                                <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 500, color: '#166534' }}>
                                    {label}
                                    <button type="button" onClick={() => removeSelectedAmenity(label)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#166534' }}>
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div id="amenity-dropdown" style={{ position: 'relative', marginBottom: '16px' }}>
                        <div
                            onClick={() => setAmenityDropdownOpen(!amenityDropdownOpen)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', background: '#ffffff' }}
                        >
                            <Search size={16} color="#94a3b8" />
                            <input
                                type="text"
                                value={amenitySearch}
                                onChange={(e) => { setAmenitySearch(e.target.value); setAmenityDropdownOpen(true) }}
                                onFocus={() => setAmenityDropdownOpen(true)}
                                placeholder="Search amenities..."
                                style={{ border: 'none', outline: 'none', flex: 1, fontSize: '0.875rem', background: 'transparent' }}
                            />
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{selectedAmenities.length} selected</span>
                        </div>

                        {amenityDropdownOpen && (
                            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, maxHeight: '360px', overflowY: 'auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', zIndex: 50, padding: '8px' }}>
                                {filteredAmenityCategories.map(({ category, items }) => (
                                    <div key={category}>
                                        <div style={{ padding: '8px 10px 4px', fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{category}</div>
                                        {items.map(amenity => {
                                            const isSelected = selectedAmenities.includes(amenity.label)
                                            return (
                                                <button
                                                    key={amenity.label}
                                                    type="button"
                                                    onClick={() => toggleAmenity(amenity.label)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none', borderRadius: '6px', background: isSelected ? '#f0fdf4' : 'transparent', cursor: 'pointer', fontSize: '0.8125rem', color: isSelected ? '#166534' : '#334155', fontWeight: isSelected ? 600 : 400, transition: 'background 0.15s' }}
                                                >
                                                    <span style={{ width: '18px', height: '18px', borderRadius: '4px', border: isSelected ? '2px solid #22c55e' : '2px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: isSelected ? '#22c55e' : 'transparent' }}>
                                                        {isSelected && <Check size={12} color="#fff" />}
                                                    </span>
                                                    {amenity.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                ))}
                                {filteredAmenityCategories.length === 0 && (
                                    <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8125rem' }}>No amenities match your search</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Media */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Media</h2>

                    <div className={formStyles.field}>
                        <label className={formStyles.label}>Video URL</label>
                        <input type="url" name="video_url" value={formData.video_url} onChange={handleChange} className={formStyles.input} placeholder="https://youtube.com/embed/..." />
                    </div>

                    <div className={formStyles.field}>
                        <label className={formStyles.label}>Brochure</label>
                        <BrochureUpload
                            value={formData.brochure_url}
                            onChange={(url) => setFormData(prev => ({ ...prev, brochure_url: url }))}
                            folder="projects/brochures"
                            label="Upload Brochure (PDF)"
                        />
                    </div>

                    <div className={formStyles.field} style={{ marginBottom: '1rem' }}>
                        <label className={formStyles.label}>Master Plan Image</label>
                        <ImageUpload
                            value={formData.master_plan_image}
                            onChange={(url) => setFormData(prev => ({ ...prev, master_plan_image: url }))}
                            folder="projects/master-plans"
                            label="Upload Master Plan Image"
                        />
                    </div>

                    <div className={formStyles.field}>
                        <label className={formStyles.label}>Project Images</label>
                        <MultiImageUpload
                            images={images}
                            onChange={setImages}
                            folder="projects/images"
                            label="Upload Project Images"
                            maxImages={20}
                        />
                    </div>
                </div>

                {/* Floor Plans */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Floor Plans</h2>
                    {floorPlans.map((fp, index) => (
                        <div key={index} className={formStyles.floorPlanRow}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <div style={{ flex: 1 }}>
                                    <input type="text" value={fp.name} onChange={(e) => handleFloorPlanChange(index, 'name', e.target.value)} className={formStyles.input} placeholder="Plan name (e.g., 2 BHK Type A)" />
                                </div>
                                {floorPlans.length > 1 && (
                                    <button type="button" onClick={() => removeFloorPlan(index)} className={formStyles.removeBtn}><X size={18} /></button>
                                )}
                            </div>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <ImageUpload
                                    value={fp.image}
                                    onChange={(url) => handleFloorPlanChange(index, 'image', url)}
                                    folder="projects/floor-plans"
                                    label="Upload Floor Plan Image"
                                />
                            </div>
                            <div className={formStyles.grid2}>
                                <input type="text" value={fp.bhk || ''} onChange={(e) => handleFloorPlanChange(index, 'bhk', e.target.value)} className={formStyles.input} placeholder="BHK (optional)" />
                                <input type="text" value={fp.area || ''} onChange={(e) => handleFloorPlanChange(index, 'area', e.target.value)} className={formStyles.input} placeholder="Area (optional)" />
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addFloorPlan} className={formStyles.addImageBtn}>
                        <Plus size={16} /> Add Floor Plan
                    </button>
                </div>

                {/* Connectivity */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Connectivity</h2>
                    <p className={formStyles.sectionHelp}>Nearby landmarks, schools, hospitals, transport etc.</p>
                    {connectivity.map((conn, index) => (
                        <div key={index} style={{ marginBottom: '12px', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <select
                                    value={conn.icon || ''}
                                    onChange={(e) => handleConnectivityChange(index, 'icon', e.target.value)}
                                    className={formStyles.input}
                                    style={{ flex: '1 1 120px', maxWidth: '140px', padding: '10px', height: 'auto', margin: 0 }}
                                >
                                    <option value="">Select Icon</option>
                                    {CONNECTIVITY_ICONS.map(i => (
                                        <option key={i.value} value={i.value}>{i.label}</option>
                                    ))}
                                </select>
                                <input type="text" value={conn.type} onChange={(e) => handleConnectivityChange(index, 'type', e.target.value)} className={formStyles.input} placeholder="Type (School...)" style={{ flex: '1 1 150px', margin: 0 }} />
                                <input type="text" value={conn.name} onChange={(e) => handleConnectivityChange(index, 'name', e.target.value)} className={formStyles.input} placeholder="Name" style={{ flex: '1 1 150px', margin: 0 }} />
                                <input type="text" value={conn.distance} onChange={(e) => handleConnectivityChange(index, 'distance', e.target.value)} className={formStyles.input} placeholder="Dist (2 km)" style={{ flex: '1 1 100px', maxWidth: '120px', margin: 0 }} />
                                {connectivity.length > 1 && (
                                    <button type="button" onClick={() => removeConnectivity(index)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 }}><X size={16} /></button>
                                )}
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addConnectivity} className={formStyles.addImageBtn}>
                        <Plus size={16} /> Add Connectivity
                    </button>
                </div>

                {/* Specifications (JSON) */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Specifications</h2>
                    <p className={formStyles.sectionHelp}>
                        JSON format. For Residential/Villa: {`{ "structure": { ... }, "flooring": { ... } }`}.
                        For Plot: {`{ "road_width": "30 ft", "drainage": "Underground" }`}
                    </p>
                    <div className={formStyles.field}>
                        <textarea
                            value={specsJson}
                            onChange={(e) => setSpecsJson(e.target.value)}
                            className={formStyles.textarea}
                            rows={8}
                            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
                        />
                    </div>
                </div>

                {/* Ad Card for Homepage */}
                <div className={formStyles.section}>
                    <h2 className={formStyles.sectionTitle}>Ad Card for Homepage</h2>
                    <p className={formStyles.sectionHelp}>Upload an ad card image to display on the homepage stacking section. Max 5 active ads.</p>

                    <div className={formStyles.field}>
                        <label className={formStyles.label}>Ad Card Image</label>
                        <ImageUpload
                            value={adCardImage}
                            onChange={setAdCardImage}
                            folder="projects/ad-cards"
                            label="Upload Ad Card Image"
                        />
                    </div>

                    <div className={formStyles.checkboxField} style={{ marginTop: '8px' }}>
                        <input
                            type="checkbox"
                            checked={showAdOnHome}
                            onChange={(e) => handleAdToggle(e.target.checked)}
                        />
                        <label>Show this ad on the homepage stacking section</label>
                    </div>

                    {fifoWarning.show && (
                        <div style={{ marginTop: '12px', padding: '12px 16px', background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '8px' }}>
                            <p style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: '8px' }}>
                                There are already 5 active ads. Enabling this will replace <strong>{fifoWarning.oldestProject}</strong>&apos;s ad (oldest).
                            </p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={confirmFifoReplace}
                                    style={{ padding: '6px 14px', background: '#183C38', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                                    Confirm Replace
                                </button>
                                <button type="button" onClick={() => { setShowAdOnHome(false); setFifoWarning({ show: false, oldestProject: null }) }}
                                    style={{ padding: '6px 14px', background: '#fff', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className={formStyles.actions}>
                    {error && <div className={formStyles.error} style={{ flex: '1 1 100%', marginBottom: '0.75rem' }}>{error}</div>}
                    {success && <div style={{ flex: '1 1 100%', marginBottom: '0.75rem', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '0.875rem', fontWeight: 500 }}>{success}</div>}
                    <Link href="/admin/projects" className={formStyles.cancelBtn}>Cancel</Link>
                    <button type="submit" disabled={saving} className={formStyles.submitBtn}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}
