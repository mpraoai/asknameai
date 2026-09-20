import { supabase } from '../lib/supabase';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly_inr: number;
  reports_limit_per_month: number;
  team_size_limit: number;
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data } = await supabase
    .from('subscription_plans')
    .select('id, name, price_monthly_inr, reports_limit_per_month, team_size_limit')
    .eq('is_active', true)
    .order('price_monthly_inr', { ascending: true });
  return data || [];
}

export interface MySubscription {
  id: string;
  status: string;
  current_period_end: string | null;
  plan_id: string;
}

export async function getMySubscription(numerologistId: string): Promise<MySubscription | null> {
  const { data } = await supabase
    .from('subscriptions')
    .select('id, status, current_period_end, plan_id')
    .eq('numerologist_id', numerologistId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

function loadRazorpayCheckout(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Razorpay checkout'));
    document.body.appendChild(script);
  });
}

/**
 * Starts a real Razorpay recurring-subscription checkout for a numerologist
 * plan upgrade. Separate from the one-time purchase flow entirely. Returns
 * a clear "not configured yet" error rather than a generic failure if
 * RAZORPAY_KEY_ID/SECRET aren't set on the backend, since that's an
 * expected pre-launch state, not a bug.
 */
export async function subscribeToPlan(
  numerologistId: string,
  plan: SubscriptionPlan,
  customerName: string,
  customerEmail: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('razorpay-subscription', {
    body: { action: 'create-subscription', plan_id: plan.id, numerologist_id: numerologistId },
  });

  if (error || !data?.success) {
    // supabase-js doesn't parse a non-2xx function response into `data` -
    // the real error message is on the underlying HTTP Response body.
    let message = data?.error;
    if (!message && (error as any)?.context instanceof Response) {
      try {
        const body = await (error as any).context.clone().json();
        message = body?.error;
      } catch {
        // response wasn't JSON - fall through to the generic message below
      }
    }
    return { success: false, error: message || error?.message || 'Could not start checkout' };
  }

  try {
    await loadRazorpayCheckout();
  } catch {
    return { success: false, error: 'Could not load the payment widget. Check your connection and try again.' };
  }

  return new Promise((resolve) => {
    const razorpay = new (window as any).Razorpay({
      key: data.key_id,
      subscription_id: data.subscription_id,
      name: 'AskNameAI',
      description: `${plan.name} plan - monthly subscription`,
      prefill: { name: customerName, email: customerEmail },
      handler: () => resolve({ success: true }),
      modal: { ondismiss: () => resolve({ success: false, error: 'Checkout closed before completing payment' }) },
    });
    razorpay.open();
  });
}
