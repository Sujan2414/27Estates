const fs = require('fs');
const path = require('path');

const content = `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          project_id: string | null
          project_name: string | null
          title: string | null
          description: string | null
          specifications: string | null
          rera_number: string | null
          developer_id: string | null
          developer_name: string | null
          address: string | null
          location: string | null
          city: string | null
          landmark: string | null
          pincode: string | null
          state: string | null
          country: string | null
          latitude: number | null
          longitude: number | null
          min_price: string | null
          max_price: string | null
          min_price_numeric: number | null
          max_price_numeric: number | null
          price_per_sqft: number | null
          min_area: number | null
          max_area: number | null
          property_type: string | null
          bhk_options: string[] | null
          transaction_type: string | null
          status: string | null
          category: string | null
          sub_category: string | null
          total_units: number | null
          launch_date: string | null
          possession_date: string | null
          images: string[] | null
          brochure_url: string | null
          video_url: string | null
          master_plan_image: string | null
          ad_card_image: string | null
          show_ad_on_home: boolean | null
          is_featured: boolean | null
          is_rera_approved: boolean | null
          employee_name: string | null
          employee_phone: string | null
          employee_email: string | null
          assigned_agent_id: string | null
          amenities: Json | null
          floor_plans: Json | null
          connectivity: Json | null
          highlights: Json | null
          towers_data: Json | null
          project_plan: Json | null
          specifications_complex: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
`;

const filePath = path.join(__dirname, 'src', 'lib', 'supabase', 'database.types.ts');
fs.writeFileSync(filePath, content, 'utf8');
console.log('database.types.ts written successfully!');
