import { createClient } from '@supabase/supabase-js'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface PurchaseRecord {
  id: string
  first_name: string
  last_name: string
  dob: string
  gender: string
  driver: number
  conductor: number
  plan: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}
