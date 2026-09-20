import React, { useEffect, useState } from 'react';
import { LifeBuoy, AlertTriangle } from 'lucide-react';
import { Ticket, getTickets, updateTicketStatus } from '../services/ticketService';
import { formatDate } from '../utils/locale';

interface TicketsPanelProps {
  numerologistId: string;
  onSelectLead: (leadId: string) => void;
}

const STATUS_META: Record<Ticket['status'], { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-red-100 text-red-700' },
  in_progress: { label: 'In progress', color: 'bg-amber-100 text-amber-700' },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700' },
};

/** Pillar D (Serve) from the Nestarmy PRD - support issues tracked to resolution, not lost in WhatsApp threads. */
export const TicketsPanel: React.FC<TicketsPanelProps> = ({ numerologistId, onSelectLead }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'' | Ticket['status']>('');

  useEffect(() => {
    load();
  }, [numerologistId]);

  const load = async () => {
    setLoading(true);
    setTickets(await getTickets(numerologistId));
    setLoading(false);
  };

  const handleStatus = async (id: string, status: Ticket['status']) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    await updateTicketStatus(id, status);
  };

  const isOverdue = (t: Ticket) => !!t.due_at && t.status !== 'resolved' && new Date(t.due_at) < new Date();

  const filtered = statusFilter ? tickets.filter((t) => t.status === statusFilter) : tickets;
  const overdueCount = tickets.filter(isOverdue).length;

  if (loading) {
    return <div className="text-center py-10 text-gray-400 text-sm">Loading tickets...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-400">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <LifeBuoy className="w-4 h-4 text-orange-500" />
          Support Tickets
        </h2>
        {overdueCount > 0 && (
          <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            {overdueCount} overdue
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Open one from a lead's record — a missing PDF, a wrong DOB on a report, anything that needs follow-up beyond a note.
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {(['', 'open', 'in_progress', 'resolved'] as const).map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              statusFilter === s ? 'bg-orange-600 border-orange-600 text-white' : 'border-gray-200 text-gray-500 hover:bg-orange-50'
            }`}
          >
            {s === '' ? `All (${tickets.length})` : `${STATUS_META[s].label} (${tickets.filter((t) => t.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No tickets here — open one from a lead's record when something needs tracking.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div key={t.id} className={`flex flex-wrap items-center justify-between gap-2 border rounded-lg px-3 py-2.5 ${isOverdue(t) ? 'border-red-200 bg-red-50/40' : 'border-gray-100'}`}>
              <div className="min-w-0">
                <button onClick={() => onSelectLead(t.lead_id)} className="text-sm font-medium text-gray-800 hover:underline text-left">
                  {t.lead?.first_name} {t.lead?.last_name}
                </button>
                <p className="text-xs text-gray-500">{t.subject}</p>
                <p className="text-[11px] text-gray-400">Opened {formatDate(t.created_at)}{isOverdue(t) ? ' · overdue' : ''}</p>
              </div>
              <select
                value={t.status}
                onChange={(e) => handleStatus(t.id, e.target.value as Ticket['status'])}
                className={`text-xs font-semibold border-0 rounded-full px-2.5 py-1 flex-shrink-0 ${STATUS_META[t.status].color}`}
              >
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
