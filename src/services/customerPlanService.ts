import { supabase } from '../lib/supabase';

export interface CustomerPayment {
  id: string;
  plan_name: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

/**
 * Looks up the paid plan a lead actually purchased on the main site, by
 * matching their mobile/email against a registered customer account.
 * Returns null when there's no match or no completed payment - never
 * fabricates a plan.
 */
export async function getCustomerPlan(mobile: string | null, email: string | null): Promise<CustomerPayment | null> {
  if (!mobile && !email) return null;

  let authUserId: string | null = null;
  if (mobile) {
    const { data } = await supabase.from('user_profiles').select('auth_user_id').eq('mobile_number', mobile).maybeSingle();
    authUserId = data?.auth_user_id || null;
  }
  if (!authUserId && email) {
    const { data } = await supabase.from('user_profiles').select('auth_user_id').eq('email', email).maybeSingle();
    authUserId = data?.auth_user_id || null;
  }
  if (!authUserId) return null;

  const { data: payment, error } = await supabase
    .from('payments')
    .select('id, plan_name, amount, currency, status, created_at')
    .eq('user_id', authUserId)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !payment) return null;
  return payment as CustomerPayment;
}
