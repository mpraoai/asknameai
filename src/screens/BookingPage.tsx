import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarClock, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { PublicNumerologistInfo, OpenSlot, getPublicNumerologistInfo, getOpenSlots, bookAppointment } from '../services/bookingService';

/**
 * HubSpot's "Meetings" tool: one public, unauthenticated link a
 * numerologist can share (Instagram bio, WhatsApp) so a prospect books
 * their own slot instead of a back-and-forth over chat.
 */
export default function BookingPage() {
  const { numerologistId } = useParams<{ numerologistId: string }>();
  const [info, setInfo] = useState<PublicNumerologistInfo | null>(null);
  const [slots, setSlots] = useState<OpenSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<OpenSlot | null>(null);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    if (!numerologistId) return;
    (async () => {
      setLoading(true);
      const [publicInfo, openSlots] = await Promise.all([
        getPublicNumerologistInfo(numerologistId),
        getOpenSlots(numerologistId),
      ]);
      setInfo(publicInfo);
      setSlots(openSlots);
      if (openSlots.length > 0) setSelectedDate(openSlots[0].date);
      setLoading(false);
    })();
  }, [numerologistId]);

  const dates = useMemo(() => Array.from(new Set(slots.map((s) => s.date))), [slots]);
  const slotsForDate = slots.filter((s) => s.date === selectedDate);

  const handleBook = async () => {
    if (!numerologistId || !selectedSlot || !name.trim() || !mobile.trim()) {
      setError('Enter your name and mobile number, and pick a time.');
      return;
    }
    setError('');
    setBooking(true);
    const res = await bookAppointment(numerologistId, {
      name: name.trim(),
      mobile: mobile.trim(),
      email: email.trim() || undefined,
      scheduledAt: selectedSlot.iso,
    });
    setBooking(false);
    if (!res.success) {
      setError(res.error || 'Could not book that slot — it may have just been taken. Try another.');
      return;
    }
    setBooked(true);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#fbf3e7] text-gray-400 text-sm">Loading...</div>;
  }

  if (!info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf3e7] px-4">
        <p className="text-gray-500 text-sm">This booking link isn't available.</p>
      </div>
    );
  }

  if (booked && selectedSlot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf3e7] px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h1 className="text-lg font-bold text-gray-800">You're booked</h1>
          <p className="text-sm text-gray-500">
            {new Date(selectedSlot.iso).toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long' })}
            {' at '}
            {new Date(selectedSlot.iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-gray-400">with {info.business_name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf3e7] px-4 py-10">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 text-white" style={{ background: `linear-gradient(135deg, ${info.brand_color || '#4f46e5'}, #312e81)` }}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5" />
            <h1 className="text-lg font-bold">{info.business_name}</h1>
          </div>
          <p className="text-sm opacity-90 flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" />
            Book a numerology consultation
          </p>
        </div>

        <div className="p-6 space-y-4">
          {slots.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No open slots right now — please check back soon.</p>
          ) : (
            <>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Pick a date</label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {dates.map((date) => (
                    <button
                      key={date}
                      onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                      className={`flex-shrink-0 text-xs font-medium px-3 py-2 rounded-lg border ${
                        selectedDate === date ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {new Date(date).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' })}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Pick a time</label>
                <div className="grid grid-cols-3 gap-2">
                  {slotsForDate.map((slot) => (
                    <button
                      key={slot.iso}
                      onClick={() => setSelectedSlot(slot)}
                      className={`text-xs font-medium px-2 py-2 rounded-lg border ${
                        selectedSlot?.iso === slot.iso ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>

              {selectedSlot && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900"
                  />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 15))}
                    placeholder="Mobile number"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (optional)"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900"
                  />
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <button
                    onClick={handleBook}
                    disabled={booking}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
                  >
                    {booking && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm booking
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
