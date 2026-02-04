export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            properties: {
                Row: {
                    id: string
                    property_id: string
                    title: string
                    display_name: string | null
                    description: string | null
                    // Pricing
                    price: number
                    price_text: string | null
                    price_per_sqft: number | null
                    deposit_amount: string | null
                    maintenance_charges: string | null
                    // Location - Separate columns
                    location: string
                    address: string | null
                    street: string | null
                    city: string | null
                    state: string | null
                    pincode: string | null
                    area: string | null
                    country: string | null
                    landmark: string | null
                    flat_no: string | null
                    building_name: string | null
                    floor_number: string | null
                    total_floors: string | null
                    latitude: number | null
                    longitude: number | null
                    // Property Details
                    bedrooms: number
                    bathrooms: number
                    sqft: number
                    carpet_area: number | null
                    built_up_area: number | null
                    plot_size: number | null
                    total_rooms: number | null
                    balconies: number | null
                    parking_count: number | null
                    lot_size: number | null
                    floors: number | null
                    rooms: number | null
                    // Type & Category
                    property_type: 'Sale' | 'Rent'
                    category: string
                    sub_category: string | null
                    // Additional Details
                    furnishing: string | null
                    facing: string | null
                    ownership: string | null
                    possession_status: string | null
                    property_age: string | null
                    flooring: string | null
                    transaction_type: string | null
                    // Project Link
                    project_id: string | null
                    project_name: string | null
                    // Agent
                    agent_id: string | null
                    // Owner Info
                    owner_name: string | null
                    owner_phone: string | null
                    owner_email: string | null
                    // Status & Flags
                    status: string
                    is_featured: boolean
                    is_verified: boolean
                    // Media
                    images: string[]
                    video_url: string | null
                    // Amenities
                    amenities: Json | null
                    // Reference
                    ref_number: string | null
                    source: string | null
                    // Timestamps
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    title: string
                    display_name?: string | null
                    description?: string | null
                    price: number
                    price_text?: string | null
                    price_per_sqft?: number | null
                    deposit_amount?: string | null
                    maintenance_charges?: string | null
                    location: string
                    address?: string | null
                    street?: string | null
                    city?: string | null
                    state?: string | null
                    pincode?: string | null
                    area?: string | null
                    country?: string | null
                    landmark?: string | null
                    flat_no?: string | null
                    building_name?: string | null
                    floor_number?: string | null
                    total_floors?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    bedrooms: number
                    bathrooms: number
                    sqft: number
                    carpet_area?: number | null
                    built_up_area?: number | null
                    plot_size?: number | null
                    total_rooms?: number | null
                    balconies?: number | null
                    parking_count?: number | null
                    lot_size?: number | null
                    floors?: number | null
                    rooms?: number | null
                    property_type: 'Sale' | 'Rent'
                    category: string
                    sub_category?: string | null
                    furnishing?: string | null
                    facing?: string | null
                    ownership?: string | null
                    possession_status?: string | null
                    property_age?: string | null
                    flooring?: string | null
                    transaction_type?: string | null
                    project_id?: string | null
                    project_name?: string | null
                    agent_id?: string | null
                    owner_name?: string | null
                    owner_phone?: string | null
                    owner_email?: string | null
                    status?: string
                    is_featured?: boolean
                    is_verified?: boolean
                    images?: string[]
                    video_url?: string | null
                    amenities?: Json | null
                    ref_number?: string | null
                    source?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string
                    title?: string
                    display_name?: string | null
                    description?: string | null
                    price?: number
                    price_text?: string | null
                    price_per_sqft?: number | null
                    deposit_amount?: string | null
                    maintenance_charges?: string | null
                    location?: string
                    address?: string | null
                    street?: string | null
                    city?: string | null
                    state?: string | null
                    pincode?: string | null
                    area?: string | null
                    country?: string | null
                    landmark?: string | null
                    flat_no?: string | null
                    building_name?: string | null
                    floor_number?: string | null
                    total_floors?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    bedrooms?: number
                    bathrooms?: number
                    sqft?: number
                    carpet_area?: number | null
                    built_up_area?: number | null
                    plot_size?: number | null
                    total_rooms?: number | null
                    balconies?: number | null
                    parking_count?: number | null
                    lot_size?: number | null
                    floors?: number | null
                    rooms?: number | null
                    property_type?: 'Sale' | 'Rent'
                    category?: string
                    sub_category?: string | null
                    furnishing?: string | null
                    facing?: string | null
                    ownership?: string | null
                    possession_status?: string | null
                    property_age?: string | null
                    flooring?: string | null
                    transaction_type?: string | null
                    project_id?: string | null
                    project_name?: string | null
                    agent_id?: string | null
                    owner_name?: string | null
                    owner_phone?: string | null
                    owner_email?: string | null
                    status?: string
                    is_featured?: boolean
                    is_verified?: boolean
                    images?: string[]
                    video_url?: string | null
                    amenities?: Json | null
                    ref_number?: string | null
                    source?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            projects: {
                Row: {
                    id: string
                    project_id: string
                    project_name: string
                    title: string | null
                    description: string | null
                    specifications: string | null
                    rera_number: string | null
                    developer_id: string | null
                    developer_name: string | null
                    // Location
                    address: string | null
                    location: string | null
                    city: string | null
                    state: string | null
                    landmark: string | null
                    pincode: string | null
                    country: string | null
                    latitude: number | null
                    longitude: number | null
                    // Pricing
                    min_price: string | null
                    max_price: string | null
                    min_price_numeric: number | null
                    max_price_numeric: number | null
                    // Areas
                    min_area: number | null
                    max_area: number | null
                    // Project Details
                    property_type: string | null
                    bhk_options: string[] | null
                    transaction_type: string | null
                    status: string
                    // Dates
                    launch_date: string | null
                    possession_date: string | null
                    // Media
                    images: string[]
                    brochure_url: string | null
                    video_url: string | null
                    // Flags
                    is_featured: boolean
                    is_rera_approved: boolean
                    // Contact
                    employee_name: string | null
                    employee_phone: string | null
                    employee_email: string | null
                    // Timestamps
                    // New JSONB columns
                    towers_data: Json | null
                    project_plan: Json | null
                    specifications_complex: Json | null
                    amenities: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    project_id: string
                    project_name: string
                    title?: string | null
                    description?: string | null
                    specifications?: string | null
                    rera_number?: string | null
                    developer_id?: string | null
                    developer_name?: string | null
                    address?: string | null
                    location?: string | null
                    city?: string | null
                    state?: string | null
                    landmark?: string | null
                    pincode?: string | null
                    country?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    min_price?: string | null
                    max_price?: string | null
                    min_price_numeric?: number | null
                    max_price_numeric?: number | null
                    min_area?: number | null
                    max_area?: number | null
                    property_type?: string | null
                    bhk_options?: string[] | null
                    transaction_type?: string | null
                    status?: string
                    launch_date?: string | null
                    possession_date?: string | null
                    images?: string[]
                    brochure_url?: string | null
                    video_url?: string | null
                    is_featured?: boolean
                    is_rera_approved?: boolean
                    employee_name?: string | null
                    employee_phone?: string | null
                    employee_email?: string | null
                    towers_data?: Json | null
                    project_plan?: Json | null
                    specifications_complex?: Json | null
                    amenities?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string
                    project_name?: string
                    title?: string | null
                    description?: string | null
                    specifications?: string | null
                    rera_number?: string | null
                    developer_id?: string | null
                    developer_name?: string | null
                    address?: string | null
                    location?: string | null
                    city?: string | null
                    state?: string | null
                    landmark?: string | null
                    pincode?: string | null
                    country?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    min_price?: string | null
                    max_price?: string | null
                    min_price_numeric?: number | null
                    max_price_numeric?: number | null
                    min_area?: number | null
                    max_area?: number | null
                    property_type?: string | null
                    bhk_options?: string[] | null
                    transaction_type?: string | null
                    status?: string
                    launch_date?: string | null
                    possession_date?: string | null
                    images?: string[]
                    brochure_url?: string | null
                    video_url?: string | null
                    is_featured?: boolean
                    is_rera_approved?: boolean
                    employee_name?: string | null
                    employee_phone?: string | null
                    employee_email?: string | null
                    towers_data?: Json | null
                    project_plan?: Json | null
                    specifications_complex?: Json | null
                    amenities?: Json | null
                    created_at?: string
                    updated_at?: string
                }
            }
            developers: {
                Row: {
                    id: string
                    name: string
                    email: string | null
                    phone: string | null
                    logo: string | null
                    description: string | null
                    website: string | null
                    projects_count: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    email?: string | null
                    phone?: string | null
                    logo?: string | null
                    description?: string | null
                    website?: string | null
                    projects_count?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string | null
                    phone?: string | null
                    logo?: string | null
                    description?: string | null
                    website?: string | null
                    projects_count?: number
                    created_at?: string
                }
            }
            blogs: {
                Row: {
                    id: string
                    slug: string
                    title: string
                    excerpt: string | null
                    content: string
                    author: string
                    author_image: string | null
                    cover_image: string | null
                    tags: string[]
                    reading_time: string | null
                    published_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    slug: string
                    title: string
                    excerpt?: string | null
                    content: string
                    author: string
                    author_image?: string | null
                    cover_image?: string | null
                    tags?: string[]
                    reading_time?: string | null
                    published_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    slug?: string
                    title?: string
                    excerpt?: string | null
                    content?: string
                    author?: string
                    author_image?: string | null
                    cover_image?: string | null
                    tags?: string[]
                    reading_time?: string | null
                    published_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            user_bookmarks: {
                Row: {
                    id: string
                    user_id: string
                    property_id: string | null
                    project_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    property_id?: string | null
                    project_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    property_id?: string | null
                    project_id?: string | null
                    created_at?: string
                }
            }
            inquiries: {
                Row: {
                    id: string
                    property_id: string | null
                    project_id: string | null
                    name: string
                    email: string
                    phone: string | null
                    message: string
                    status: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    property_id?: string | null
                    project_id?: string | null
                    name: string
                    email: string
                    phone?: string | null
                    message: string
                    status?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string | null
                    project_id?: string | null
                    name?: string
                    email?: string
                    phone?: string | null
                    message?: string
                    status?: string
                    created_at?: string
                }
            }
            agents: {
                Row: {
                    id: string
                    name: string
                    email: string
                    phone: string | null
                    image: string | null
                    role: string
                    bio: string | null
                    properties_count: number
                    rating: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    email: string
                    phone?: string | null
                    image?: string | null
                    role?: string
                    bio?: string | null
                    properties_count?: number
                    rating?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string
                    phone?: string | null
                    image?: string | null
                    role?: string
                    bio?: string | null
                    properties_count?: number
                    rating?: number | null
                    created_at?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    full_name: string | null
                    avatar_url: string | null
                    role: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: string
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
