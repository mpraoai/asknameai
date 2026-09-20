import React, { useEffect, useState } from 'react';
import { X, Phone, Mail, Sparkles, Clock, Tag, Plus, LifeBuoy, Calculator } from 'lucide-react';
import { Lead, setLeadTags } from '../services/numerologistService';
import { Activity, getActivitiesForLead } from '../services/crmService';
import { NumerologyReport, getReportsForLead } from '../services/reportsService';
import { Ticket, getTicketsForLead, createTicket, updateTicketStatus } from '../services/ticketService';

interface LeadDetailPanelProps {
  lead: Lead;
  onClose: () => void;
  onLeadUpdated?: () => void;
  onOpenNumerologyTools?: (lead: Lead) => void;
}

export const LeadDetailPanel: React.FC<LeadDetailPanelProps> = ({ lead, onClose, onLeadUpdated, onOpenNumerologyTools }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [reports, setReports] = useState<NumerologyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<string[]>(lead.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketSubject, setTicketSubject] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [acts, reps, tix] = await Promise.all([getActivitiesForLead(lead.id), getReportsForLead(lead.id), getTicketsForLead(lead.id)]);
      setActivities(acts);
      setReports(reps);
      setTickets(tix);
      setLoading(false);
    })();
  }, [lead.id]);

  const handleCreateTicket = async () => {
    if (!ticketSubject.trim() || !lead.assigned_numerologist_id) return;
    await createTicket(lead.assigned_numerologist_id, lead.id, ticketSubject.trim());
    setTicketSubject('');
    setTickets(await getTicketsForLead(lead.id));
    const acts = await getActivitiesForLead(lead.id);
    setActivities(acts);
  };

  const handleTicketStatus = async (ticketId: string, status: Ticket['status']) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)));
    await updateTicketStatus(ticketId, status);
  };

  useEffect(() => {
    setTags(lead.tags || []);
  }, [lead.id, lead.tags]);

  const handleAddTag = async () => {
    const clean = tagInput.trim();
    if (!clean || tags.includes(clean)) {
      setTagInput('');
      return;
    }
    const next = [...tags, clean];
    setTags(next);
    setTagInput('');
    await setLeadTags(lead.id, next);
    onLeadUpdated?.();
  };

  const handleRemoveTag = async (tag: string) => {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    await setLeadTags(lead.id, next);
    onLeadUpdated?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:w-[420px] bg-white h-full shadow-2xl overflow-y-auto">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 text-white sticky top-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold">{lead.first_name} {lead.last_name}</h2>
          <div className="mt-2 space-y-1 text-sm text-indigo-100">
            {lead.mobile_number && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{lead.mobile_number}</p>}
            {lead.email && <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{lead.email}</p>}
          </div>
          <div className="flex gap-2 mt-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 uppercase">{lead.lead_score}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 uppercase">{lead.status}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 capitalize">{lead.channel}</span>
          </div>
          {onOpenNumerologyTools && (
            <button
              onClick={() => onOpenNumerologyTools(lead)}
              className="mt-3 w-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5"
            >
              <Calculator className="w-3.5 h-3.5" />
              Run Numerology Tools for {lead.first_name}
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-fuchsia-500" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.length === 0 && <p className="text-xs text-gray-400">No tags yet — use tags to segment your list, e.g. "VIP" or "Diwali campaign".</p>}
                  {tags.map((tag) => (
                    <span key={tag} className="text-xs bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100 rounded-full pl-2.5 pr-1.5 py-1 flex items-center gap-1">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-fuchsia-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                    placeholder="Add a tag..."
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-900"
                  />
                  <button onClick={handleAddTag} className="text-xs bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-orange-500" />
                  Support Tickets ({tickets.filter((t) => t.status !== 'resolved').length} open)
                </h3>
                {tickets.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {tickets.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-2 bg-orange-50/60 border border-orange-100 rounded-lg px-3 py-2">
                        <span className={`text-xs text-gray-700 ${t.status === 'resolved' ? 'line-through text-gray-400' : ''}`}>{t.subject}</span>
                        <select
                          value={t.status}
                          onChange={(e) => handleTicketStatus(t.id, e.target.value as Ticket['status'])}
                          className="text-[11px] border border-orange-200 rounded px-1.5 py-0.5 text-gray-700 bg-white flex-shrink-0"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateTicket(); } }}
                    placeholder="New ticket, e.g. 'Report has wrong DOB'"
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-900"
                  />
                  <button onClick={handleCreateTicket} className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  Numerology Reports ({reports.length})
                </h3>
                {reports.length === 0 ? (
                  <p className="text-xs text-gray-400">No reports generated for this lead yet — open them in the Pipeline board to generate one.</p>
                ) : (
                  <div className="space-y-3">
                    {reports.map((r) => (
                      <div key={r.id} className="bg-violet-50 rounded-lg p-3 text-xs">
                        <div className="flex justify-between text-gray-500 mb-1">
                          <span>{new Date(r.created_at).toLocaleDateString()}</span>
                          <span>DOB: {r.dob}</span>
                        </div>
                        <p className="text-gray-700">
                          Driver <b>{r.result.driver}</b> &middot; Conductor <b>{r.result.conductor}</b> &middot;{' '}
                          <span className={r.result.isAuspicious ? 'text-emerald-600' : 'text-amber-600'}>
                            {r.result.isAuspicious ? 'Auspicious' : 'Needs correction'}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Activity Timeline
                </h3>
                {activities.length === 0 ? (
                  <p className="text-xs text-gray-400">No activity recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {activities.map((a) => (
                      <div key={a.id} className="flex justify-between text-xs border-b border-gray-100 pb-2">
                        <span className="capitalize text-gray-700">
                          {a.type.replace('_', ' ')}{['note', 'call', 'message'].includes(a.type) ? `: ${(a.payload as any).note}` : ''}
                        </span>
                        <span className="text-gray-300 flex-shrink-0 ml-2">{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
