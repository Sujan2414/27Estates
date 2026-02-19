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
            projects: {
                Row: {
                    [key: string]: any
                }
                Insert: {
                    [key: string]: any
                }
                Update: {
                    [key: string]: any
                }
                Relationships: any[]
            }
            properties: {
                Row: {
                    [key: string]: any
                }
                Insert: {
                    [key: string]: any
                }
                Update: {
                    [key: string]: any
                }
                Relationships: any[]
            }
            user_bookmarks: {
                Row: {
                    [key: string]: any
                }
                Insert: {
                    [key: string]: any
                }
                Update: {
                    [key: string]: any
                }
                Relationships: any[]
            }
            // Catch-all for other tables if needed by other components using Database['public']['Tables'][TableName]
            [key: string]: {
                Row: {
                    [key: string]: any
                }
                Insert: {
                    [key: string]: any
                }
                Update: {
                    [key: string]: any
                }
                Relationships: any[]
            }
        }
        Views: {
            [key: string]: {
                Row: {
                    [key: string]: any
                }
                Insert?: {
                    [key: string]: any
                }
                Update?: {
                    [key: string]: any
                }
                Relationships?: any[]
            }
        }
        Functions: {
            [key: string]: {
                Args: {
                    [key: string]: any
                }
                Returns: any
            }
        }
        Enums: {
            [key: string]: any
        }
    }
}
