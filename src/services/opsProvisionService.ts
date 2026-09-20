import { supabase } from '../lib/supabase';

export interface ProvisionSubscriberInput {
  first_name: string;
  last_name?: string;
  business_name: string;
  mobile_number: string;
  email: string;
  plan_id: string;
  module_codes: string[];
}

export interface ProvisionResult {
  success: boolean;
  error?: string;
  numerologist_id?: string;
  monthly_total_inr?: number;
  invoice_number?: string;
}

/** Calls admin-provision-subscriber (service role) to actually create the auth user, numerologist_profiles, modules, contract, and first invoice - the wizard's real "Grant system access" step. */
export async function provisionSubscriber(input: ProvisionSubscriberInput): Promise<ProvisionResult> {
  const { data, error } = await supabase.functions.invoke('admin-provision-subscriber', { body: input });

  if (error || !data?.success) {
    let message = data?.error;
    if (!message && (error as any)?.context instanceof Response) {
      try {
        const body = await (error as any).context.clone().json();
        message = body?.error;
      } catch {
        // not JSON, fall through
      }
    }
    return { success: false, error: message || error?.message || 'Could not provision subscriber' };
  }

  return { success: true, numerologist_id: data.numerologist_id, monthly_total_inr: data.monthly_total_inr, invoice_number: data.invoice_number };
}
