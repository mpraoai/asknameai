import React, { useEffect, useState } from 'react';
import { X, Send } from 'lucide-react';
import {
  getAllSupportTickets, updateSupportTicketStatus, getTicketMessages, addTicketMessage,
  SupportTicket, SupportTicketMessage,
} from '../../services/opsSupportService';

const PRIORITY_SOFT: Record<string, string> = { hot: 'bg-red-100 text-red-700', warm: 'bg-amber-100 text-amber-700', cold: 'bg-blue-100 text-blue-700' };
const STATUS_SOFT: Record<string, string> = { open: 'bg-red-100 text-red-700', in_progress: 'bg-amber-100 text-amber-700', resolved: 'bg-emerald-100 text-emerald-700' };

function slaLabel(t: SupportTicket): string {
  if (t.status === 'resolved') return '—';
  if (!t.sla_due_at) return '—';
  const ms = new Date(t.sla_due_at).getTime() - Date.now();
  if (ms <= 0) return 'Overdue';
  const hrs = Math.round(ms / 3600000);
  return hrs < 24 ? `${hrs}h left` : `${Math.round(hrs / 24)}d left`;
}

export const ServiceSection: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SupportTicket | null>(null);

  const load = async () => { setTickets(await getAllSupportTickets()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const open = tickets.filter((t) => t.status === 'open').length;
  const inProgress = tickets.filter((t) => t.status === 'in_progress').length;
  const resolved = tickets.filter((t) => t.status === 'resolved').length;

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-xs text-gray-400 uppercase font-mono">Open</p><p className="text-2xl font-display font-bold mt-1">{open}</p></div>
        <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-xs text-gray-400 uppercase font-mono">In progress</p><p className="text-2xl font-display font-bold mt-1">{inProgress}</p></div>
        <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-xs text-gray-400 uppercase font-mono">Resolved</p><p className="text-2xl font-display font-bold mt-1">{resolved}</p></div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-display font-semibold mb-4">Tickets from subscribers</h2>
        {tickets.length === 0 ? (
          <p className="text-sm text-gray-400">No support tickets yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100"><th className="py-2">Subscriber</th><th>Subject</th><th>Priority</th><th>Status</th><th>SLA</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {tickets.map((t) => (
                <tr key={t.id} onClick={() => setSelected(t)} className="cursor-pointer hover:bg-gray-50">
                  <td className="py-2.5 font-medium text-gray-800">{t.business_name}</td>
                  <td className="text-gray-600 max-w-xs truncate">{t.subject}</td>
                  <td><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${PRIORITY_SOFT[t.priority]}`}>{t.priority}</span></td>
                  <td><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_SOFT[t.status]}`}>{t.status.replace('_', ' ')}</span></td>
                  <td className="text-xs text-gray-500 font-mono">{slaLabel(t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && <TicketDrawer ticket={selected} onClose={() => setSelected(null)} onChanged={load} />}
    </div>
  );
};

const TicketDrawer: React.FC<{ ticket: SupportTicket; onClose: () => void; onChanged: () => void }> = ({ ticket, onClose, onChanged }) => {
  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => setMessages(await getTicketMessages(ticket.id));
  useEffect(() => { load(); }, [ticket.id]);

  const handleReply = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    await addTicketMessage(ticket.id, 'Admin', reply.trim());
    setReply('');
    setSending(false);
    load();
  };

  const handleResolve = async () => {
    await updateSupportTicketStatus(ticket.id, 'resolved');
    onChanged();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full sm:w-96 bg-white h-full shadow-2xl overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <div><h2 className="font-display font-bold text-lg">{ticket.business_name}</h2><p className="text-xs text-gray-400">{ticket.subject}</p></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-2 mb-5">
          {messages.length === 0 ? <p className="text-xs text-gray-400">No messages yet.</p> : messages.map((m) => (
            <div key={m.id} className={`rounded-lg px-3 py-2 text-xs ${m.sender === 'admin' ? 'bg-indigo-50 ml-6' : 'bg-gray-50 mr-6'}`}>
              <p className="font-semibold text-gray-700">{m.sender_name}</p>
              <p className="text-gray-600 mt-0.5">{m.message}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 mb-5">
          <input value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleReply()} placeholder="Reply..." className="flex-1 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg" />
          <button onClick={handleReply} disabled={sending} className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg disabled:opacity-40"><Send className="w-3.5 h-3.5" /></button>
        </div>
        {ticket.status !== 'resolved' && (
          <button onClick={handleResolve} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-lg">Mark resolved</button>
        )}
      </div>
    </div>
  );
};
