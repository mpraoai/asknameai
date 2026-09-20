import { supabase } from '../lib/supabase';

export interface AvailabilitySlot {
  id: string;
  numerologist_id: string;
  day_of_week: number; // 0 = Sunday
  start_time: string; // "HH:MM:SS"
  end_time: string;
}

export interface Appointment {
  id: string;
  numerologist_id: string;
  lead_id: string | null;
  name: string;
  mobile_number: string | null;
  email: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: 'booked' | 'cancelled' | 'completed';
  created_at: string;
}

export interface PublicNumerologistInfo {
  id: string;
  business_name: string;
  brand_color: string;
  logo_url: string | null;
}

// ---- Numerologist-side (authenticated) ----

export async function getAvailability(numerologistId: string): Promise<AvailabilitySlot[]> {
  const { data, error } = await supabase
    .from('availability_slots')
    .select('*')
    .eq('numerologist_id', numerologistId)
    .order('day_of_week', { ascending: true });

  if (error) {
    console.error('[bookingService] getAvailability error:', error.message);
    return [];
  }
  return data as AvailabilitySlot[];
}

export async function addAvailabilitySlot(
  numerologistId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('availability_slots')
    .insert({ numerologist_id: numerologistId, day_of_week: dayOfWeek, start_time: startTime, end_time: endTime });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeAvailabilitySlot(slotId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('availability_slots').delete().eq('id', slotId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getUpcomingAppointments(numerologistId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('numerologist_id', numerologistId)
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('[bookingService] getUpcomingAppointments error:', error.message);
    return [];
  }
  return data as Appointment[];
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: Appointment['status']
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('appointments').update({ status }).eq('id', appointmentId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---- Public booking page (anonymous) ----

export async function getPublicNumerologistInfo(numerologistId: string): Promise<PublicNumerologistInfo | null> {
  const { data, error } = await supabase.rpc('get_public_numerologist_info', { target_id: numerologistId });
  if (error || !data || data.length === 0) return null;
  return data[0] as PublicNumerologistInfo;
}

const SLOT_LENGTH_MINUTES = 30;
const BOOKING_WINDOW_DAYS = 14;

export interface OpenSlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  iso: string; // full ISO datetime, local
}

/**
 * Computes open 30-minute slots for the next two weeks from the
 * numerologist's weekly availability, minus anything already booked.
 * All client-side - no backend needed for a straightforward scheduling
 * calculation like this.
 */
export async function getOpenSlots(numerologistId: string): Promise<OpenSlot[]> {
  const [availability, existing] = await Promise.all([
    getAvailability(numerologistId),
    supabase
      .from('appointments')
      .select('scheduled_at')
      .eq('numerologist_id', numerologistId)
      .neq('status', 'cancelled')
      .then((r) => (r.data || []).map((a) => new Date(a.scheduled_at).getTime())),
  ]);

  if (availability.length === 0) return [];

  const bookedTimes = new Set(existing);
  const slots: OpenSlot[] = [];
  const now = new Date();

  for (let d = 0; d < BOOKING_WINDOW_DAYS; d++) {
    const day = new Date(now);
    day.setDate(day.getDate() + d);
    const dow = day.getDay();
    const dayAvailability = availability.filter((a) => a.day_of_week === dow);

    for (const window of dayAvailability) {
      const [startH, startM] = window.start_time.split(':').map(Number);
      const [endH, endM] = window.end_time.split(':').map(Number);

      const cursor = new Date(day);
      cursor.setHours(startH, startM, 0, 0);
      const end = new Date(day);
      end.setHours(endH, endM, 0, 0);

      while (cursor.getTime() + SLOT_LENGTH_MINUTES * 60000 <= end.getTime()) {
        if (cursor.getTime() > now.getTime() && !bookedTimes.has(cursor.getTime())) {
          slots.push({
            date: cursor.toISOString().slice(0, 10),
            time: cursor.toTimeString().slice(0, 5),
            iso: cursor.toISOString(),
          });
        }
        cursor.setMinutes(cursor.getMinutes() + SLOT_LENGTH_MINUTES);
      }
    }
  }

  return slots;
}

/**
 * Books a slot from the public page. Reuses an existing lead by mobile
 * number if one already exists for this numerologist (so a repeat client
 * booking again doesn't create a duplicate), otherwise captures a fresh
 * lead - same channel-tagging convention as the rest of the funnel.
 */
export async function bookAppointment(
  numerologistId: string,
  input: { name: string; mobile: string; email?: string; scheduledAt: string }
): Promise<{ success: boolean; error?: string }> {
  let leadId: string | null = null;

  if (input.mobile) {
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('assigned_numerologist_id', numerologistId)
      .eq('mobile_number', input.mobile)
      .maybeSingle();
    leadId = existingLead?.id || null;
  }

  if (!leadId) {
    const [first_name, ...rest] = input.name.trim().split(' ');
    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert({
        first_name: first_name || 'Unknown',
        last_name: rest.join(' ') || null,
        mobile_number: input.mobile || null,
        email: input.email || null,
        source_type: 'manual',
        channel: 'website',
        lead_score: 'hot',
        assigned_numerologist_id: numerologistId,
      })
      .select('id')
      .single();

    if (leadError) return { success: false, error: leadError.message };
    leadId = newLead.id;
  }

  const { error } = await supabase.from('appointments').insert({
    numerologist_id: numerologistId,
    lead_id: leadId,
    name: input.name,
    mobile_number: input.mobile || null,
    email: input.email || null,
    scheduled_at: input.scheduledAt,
  });

  if (error) return { success: false, error: error.message };

  if (leadId) {
    await supabase.from('activities').insert({
      lead_id: leadId,
      type: 'note',
      payload: { note: `Booked a meeting for ${new Date(input.scheduledAt).toLocaleString()} via the booking page` },
    });
  }

  return { success: true };
}
