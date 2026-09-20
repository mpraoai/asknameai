import React, { useEffect, useState } from 'react';
import { CalendarClock, Copy, Check, Plus, Trash2, Phone, Mail, MessageSquareText } from 'lucide-react';
import {
  AvailabilitySlot,
  Appointment,
  getAvailability,
  addAvailabilitySlot,
  removeAvailabilitySlot,
  getUpcomingAppointments,
  updateAppointmentStatus,
} from '../services/bookingService';
import { Snippet, getSnippets, createSnippet, deleteSnippet } from '../services/snippetService';
import { formatDateTime } from '../utils/locale';

interface MeetingsPanelProps {
  numerologistId: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const MeetingsPanel: React.FC<MeetingsPanelProps> = ({ numerologistId }) => {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDay, setNewDay] = useState(1);
  const [newStart, setNewStart] = useState('10:00');
  const [newEnd, setNewEnd] = useState('17:00');
  const [linkCopied, setLinkCopied] = useState(false);
  const [snippetTitle, setSnippetTitle] = useState('');
  const [snippetBody, setSnippetBody] = useState('');

  const bookingLink = `${window.location.origin}/book/${numerologistId}`;

  useEffect(() => {
    load();
  }, [numerologistId]);

  const load = async () => {
    setLoading(true);
    const [avail, appts, snips] = await Promise.all([
      getAvailability(numerologistId),
      getUpcomingAppointments(numerologistId),
      getSnippets(numerologistId),
    ]);
    setAvailability(avail);
    setAppointments(appts);
    setSnippets(snips);
    setLoading(false);
  };

  const handleAddSlot = async () => {
    await addAvailabilitySlot(numerologistId, newDay, `${newStart}:00`, `${newEnd}:00`);
    load();
  };

  const handleRemoveSlot = async (id: string) => {
    await removeAvailabilitySlot(id);
    load();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      // clipboard unavailable - ignore
    }
  };

  const handleUpdateStatus = async (id: string, status: Appointment['status']) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    await updateAppointmentStatus(id, status);
  };

  const handleAddSnippet = async () => {
    if (!snippetTitle.trim() || !snippetBody.trim()) return;
    await createSnippet(numerologistId, snippetTitle.trim(), snippetBody.trim());
    setSnippetTitle('');
    setSnippetBody('');
    load();
  };

  const upcoming = appointments.filter((a) => a.status === 'booked' && new Date(a.scheduled_at) >= new Date());
  const past = appointments.filter((a) => a.status !== 'booked' || new Date(a.scheduled_at) < new Date());

  if (loading) {
    return <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-cyan-400">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-1">
          <CalendarClock className="w-4 h-4 text-cyan-500" />
          Your Booking Link
        </h2>
        <p className="text-xs text-gray-400 mb-3">
          Share this link on your Instagram bio or WhatsApp — a prospect picks an open slot themselves, no back-and-forth.
        </p>
        <div className="flex items-center gap-2">
          <input readOnly value={bookingLink} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 bg-gray-50 min-w-0" />
          <button onClick={handleCopyLink} className="flex-shrink-0 text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-2 rounded-lg flex items-center gap-1.5">
            {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {linkCopied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-cyan-400">
        <h2 className="font-semibold text-gray-800 mb-1">Weekly Availability</h2>
        <p className="text-xs text-gray-400 mb-4">Open hours a prospect can book into, repeating every week.</p>
        {availability.length === 0 ? (
          <p className="text-sm text-gray-400 mb-3">No availability set yet — your booking link won't show any open slots until you add one below.</p>
        ) : (
          <div className="space-y-1.5 mb-4">
            {availability.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-700">{DAYS[slot.day_of_week]} &middot; {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                <button onClick={() => handleRemoveSlot(slot.id)} className="text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <select value={newDay} onChange={(e) => setNewDay(Number(e.target.value))} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-900">
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
          <input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-900" />
          <span className="text-xs text-gray-400">to</span>
          <input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-900" />
          <button onClick={handleAddSlot} className="text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-cyan-400">
        <h2 className="font-semibold text-gray-800 mb-4">Upcoming Bookings ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400">No upcoming bookings yet.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((appt) => (
              <div key={appt.id} className="flex flex-wrap items-center justify-between gap-2 border border-gray-100 rounded-lg px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{appt.name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    <span>{formatDateTime(appt.scheduled_at)}</span>
                    {appt.mobile_number && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{appt.mobile_number}</span>}
                    {appt.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{appt.email}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleUpdateStatus(appt.id, 'completed')} className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-2.5 py-1 rounded-lg">Done</button>
                  <button onClick={() => handleUpdateStatus(appt.id, 'cancelled')} className="text-xs bg-gray-100 text-gray-500 hover:bg-gray-200 px-2.5 py-1 rounded-lg">Cancel</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {past.length > 0 && (
          <p className="text-xs text-gray-400 mt-3">{past.length} past booking{past.length === 1 ? '' : 's'} (completed/cancelled) not shown.</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-teal-400">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-1">
          <MessageSquareText className="w-4 h-4 text-teal-500" />
          Snippets
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Reusable text for quick notes — pick one when logging a call or message on the Pipeline board instead of retyping it.
        </p>
        {snippets.length > 0 && (
          <div className="space-y-1.5 mb-4">
            {snippets.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-700">{s.title}</p>
                  <p className="text-xs text-gray-400 truncate">{s.body}</p>
                </div>
                <button onClick={async () => { await deleteSnippet(s.id); load(); }} className="text-gray-400 hover:text-red-600 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={snippetTitle}
            onChange={(e) => setSnippetTitle(e.target.value)}
            placeholder="Title, e.g. 'No answer'"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-900 w-40"
          />
          <input
            type="text"
            value={snippetBody}
            onChange={(e) => setSnippetBody(e.target.value)}
            placeholder="Text it inserts, e.g. 'Called, no answer, will try again tomorrow'"
            className="flex-1 min-w-[220px] text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
          />
          <button onClick={handleAddSnippet} className="text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-lg flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};
