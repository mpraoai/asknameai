import React, { useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { LayoutGrid, List, ChevronDown, ChevronUp, Coins, Phone, Mail, Sparkles, Loader2, AlertTriangle, ClipboardList, Settings2 } from 'lucide-react';
import { CrmStage, Deal, Activity, getStages, getMyDeals, moveDealStage, updateDealValue, getActivitiesForLead, addNote, logTouch } from '../services/crmService';
import { generateAndSaveReport } from '../services/reportsService';
import { Snippet, getSnippets } from '../services/snippetService';
import { NumerologyResult } from '../lib/numerology';
import { formatMoney } from '../utils/locale';
import { ManageStagesModal } from './ManageStagesModal';
import { draftClientMessage, draftRetentionMessage } from '../services/newAgents/aiAssistantService';

interface CrmBoardProps {
  numerologistId: string;
  currencyCode?: string;
  isOwner?: boolean;
  businessName?: string;
}

const STALL_DAYS = 7;

const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

export const CrmBoard: React.FC<CrmBoardProps> = ({ numerologistId, currencyCode = 'INR', isOwner = false, businessName }) => {
  const formatValue = (value: number) => (value ? formatMoney(value, currencyCode) : 'No value set');
  const [showManageStages, setShowManageStages] = useState(false);
  const [stages, setStages] = useState<CrmStage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [noteText, setNoteText] = useState('');
  const [reportDob, setReportDob] = useState('');
  const [reportGender, setReportGender] = useState<'male' | 'female' | 'other'>('male');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportResult, setReportResult] = useState<NumerologyResult | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [clientMessageDraft, setClientMessageDraft] = useState('');
  const [draftingClientMessage, setDraftingClientMessage] = useState(false);
  const [retentionDrafts, setRetentionDrafts] = useState<Record<string, string>>({});
  const [draftingRetentionId, setDraftingRetentionId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  useEffect(() => {
    load();
  }, [numerologistId]);

  const load = async () => {
    setLoading(true);
    const [stageList, dealList, snippetList] = await Promise.all([getStages(numerologistId), getMyDeals(numerologistId), getSnippets(numerologistId)]);
    setStages(stageList);
    setDeals(dealList);
    setSnippets(snippetList);
    setLoading(false);
  };

  const handleMoveStage = async (dealId: string, stageId: string) => {
    const targetStage = stages.find((s) => s.id === stageId);
    if (targetStage?.is_lost) {
      const reason = window.prompt(`Why is this "${targetStage.name}"? This is added to the lead's activity log.`);
      if (reason === null) return; // cancelled — do not move
      const deal = deals.find((d) => d.id === dealId);
      if (deal && reason.trim()) {
        await addNote(deal.lead_id, `Marked as ${targetStage.name}: ${reason.trim()}`);
        if (expandedDealId === dealId) {
          const acts = await getActivitiesForLead(deal.lead_id);
          setActivities(acts);
        }
      }
    }
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage_id: stageId, updated_at: new Date().toISOString() } : d)));
    await moveDealStage(dealId, stageId);
  };

  const handleValueChange = async (dealId: string, value: number) => {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, value } : d)));
    await updateDealValue(dealId, value);
  };

  const toggleExpand = async (dealId: string) => {
    if (expandedDealId === dealId) {
      setExpandedDealId(null);
      return;
    }
    setExpandedDealId(dealId);
    setReportResult(null);
    setReportDob('');
    setClientMessageDraft('');
    const deal = deals.find((d) => d.id === dealId);
    if (deal) {
      const acts = await getActivitiesForLead(deal.lead_id);
      setActivities(acts);
    }
  };

  const handleGenerateReport = async (deal: Deal) => {
    if (!reportDob || !deal.lead) return;
    setGeneratingReport(true);
    const res = await generateAndSaveReport(numerologistId, deal.lead_id, {
      firstName: deal.lead.first_name || 'Client',
      lastName: deal.lead.last_name || '',
      dob: reportDob,
      gender: reportGender,
    });
    setGeneratingReport(false);
    if (res.success && res.result) {
      setReportResult(res.result);
      const acts = await getActivitiesForLead(deal.lead_id);
      setActivities(acts);
    }
  };

  // Numerologist Assistant Agent: drafts the message to go with a just-generated report - reviewed and sent by hand, never auto-sent.
  const handleDraftClientMessage = async (deal: Deal) => {
    if (!reportResult || !deal.lead || draftingClientMessage) return;
    setDraftingClientMessage(true);
    const res = await draftClientMessage({
      numerologistBusinessName: businessName || 'your numerologist',
      clientFirstName: deal.lead.first_name || 'there',
      driver: reportResult.driver,
      conductor: reportResult.conductor,
      verdict: reportResult.isAuspicious ? 'Name is auspicious' : 'Name correction recommended',
    });
    setDraftingClientMessage(false);
    setClientMessageDraft(res.success ? (res.message || '') : `Could not draft a message: ${res.error}`);
  };

  // Retention Agent: drafts a win-back message for a stalled deal - reviewed and sent by hand, since there's no outbound messaging integration yet.
  const handleDraftRetention = async (deal: Deal) => {
    if (!deal.lead || draftingRetentionId) return;
    setDraftingRetentionId(deal.id);
    const stage = stages.find((s) => s.id === deal.stage_id);
    const res = await draftRetentionMessage({
      leadFirstName: deal.lead.first_name || 'there',
      daysSinceContact: daysSince(deal.updated_at),
      leadStatus: stage?.name || 'new',
      numerologistBusinessName: businessName,
    });
    setDraftingRetentionId(null);
    setRetentionDrafts((prev) => ({ ...prev, [deal.id]: res.success ? (res.message || '') : `Could not draft a message: ${res.error}` }));
  };

  const handleAddNote = async (leadId: string) => {
    if (!noteText.trim()) return;
    await addNote(leadId, noteText.trim());
    setNoteText('');
    const acts = await getActivitiesForLead(leadId);
    setActivities(acts);
  };

  // Until D4 (Voice AI) logs calls automatically, this is how a touch gets
  // recorded as its own activity type rather than lumped into a generic
  // note - "Rang, no answer" reads as a call in the timeline, not a note.
  const handleLogTouch = async (leadId: string, type: 'call' | 'message') => {
    const label = type === 'call' ? 'Rang, no answer' : 'Sent a message';
    const description = noteText.trim() || label;
    await logTouch(leadId, type, description);
    setNoteText('');
    const acts = await getActivitiesForLead(leadId);
    setActivities(acts);
  };

  const STAGE_COLORS: Record<string, { header: string; dot: string; border: string }> = {
    'New': { header: 'text-blue-700 bg-blue-50', dot: 'bg-blue-500', border: 'border-t-blue-400' },
    'Contacted': { header: 'text-amber-700 bg-amber-50', dot: 'bg-amber-500', border: 'border-t-amber-400' },
    'Qualified': { header: 'text-purple-700 bg-purple-50', dot: 'bg-purple-500', border: 'border-t-purple-400' },
    'Proposal Sent': { header: 'text-orange-700 bg-orange-50', dot: 'bg-orange-500', border: 'border-t-orange-400' },
    'Won': { header: 'text-emerald-700 bg-emerald-50', dot: 'bg-emerald-500', border: 'border-t-emerald-400' },
    'Lost': { header: 'text-red-700 bg-red-50', dot: 'bg-red-500', border: 'border-t-red-400' },
  };
  const getStageColors = (stage: CrmStage) => {
    if (STAGE_COLORS[stage.name]) return STAGE_COLORS[stage.name];
    if (stage.is_won) return STAGE_COLORS['Won'];
    if (stage.is_lost) return STAGE_COLORS['Lost'];
    return { header: 'text-gray-700 bg-gray-50', dot: 'bg-gray-400', border: 'border-t-gray-300' };
  };

  const SCORE_HOVER: Record<string, string> = {
    hot: 'hover:border-red-300 hover:shadow-md hover:bg-red-50/30',
    warm: 'hover:border-amber-300 hover:shadow-md hover:bg-amber-50/30',
    cold: 'hover:border-blue-300 hover:shadow-md hover:bg-blue-50/30',
  };

  const isStalled = (deal: Deal) => {
    const stage = stages.find((s) => s.id === deal.stage_id);
    return !!stage && !stage.is_won && !stage.is_lost && daysSince(deal.updated_at) >= STALL_DAYS;
  };

  const stalledDeals = deals.filter(isStalled).sort((a, b) => daysSince(b.updated_at) - daysSince(a.updated_at));

  // Card body: only what answers "which deal, how much, whose, is it in trouble."
  // Value edit, manual stage move, report generator and activity all live behind the expand toggle,
  // not on the card face — dragging is how a stage actually changes.
  const dealCardBody = (deal: Deal) => {
    const lead = deal.lead;
    const isExpanded = expandedDealId === deal.id;
    const stalled = isStalled(deal);
    return (
      <>
        <button onClick={() => toggleExpand(deal.id)} className="w-full text-left">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-gray-800 text-[15px] leading-snug min-w-0 break-words">
              {lead?.first_name || 'Unknown'} {lead?.last_name || ''}
            </p>
            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />}
          </div>
          <p className="text-sm font-medium text-gray-600 mt-1 flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-gray-400" />
            {formatValue(deal.value)}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded-full">
              {lead?.channel?.replace('_', ' ') || 'other'}
            </span>
            {stalled && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {daysSince(deal.updated_at)}d stalled
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1.5 truncate" title={lead?.mobile_number || lead?.email || ''}>
            {lead?.mobile_number || lead?.email || '—'}
          </div>
        </button>

        {isExpanded && (
          <div className="pt-3 mt-2 border-t border-gray-100 space-y-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  lead?.lead_score === 'hot'
                    ? 'bg-red-100 text-red-700'
                    : lead?.lead_score === 'warm'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {lead?.lead_score || 'warm'} lead
              </span>
              {lead?.mobile_number && (
                <span className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{lead.mobile_number}</span>
              )}
              {lead?.email && (
                <span className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>
              )}
            </div>

            {stalled && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {daysSince(deal.updated_at)} days quiet — needs a follow-up
                </p>
                {retentionDrafts[deal.id] ? (
                  <p className="text-xs text-gray-600 whitespace-pre-wrap">{retentionDrafts[deal.id]}</p>
                ) : (
                  <button
                    onClick={() => handleDraftRetention(deal)}
                    disabled={draftingRetentionId === deal.id}
                    className="text-xs text-amber-700 hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    {draftingRetentionId === deal.id && <Loader2 className="w-3 h-3 animate-spin" />}
                    <Sparkles className="w-3 h-3" />
                    Draft a follow-up with AI
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 flex-shrink-0">Deal value</label>
              <input
                type="number"
                value={deal.value || ''}
                onChange={(e) => handleValueChange(deal.id, parseFloat(e.target.value) || 0)}
                placeholder="Deal value"
                className="w-full text-sm border border-gray-200 rounded px-2 py-1 text-gray-900"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Move to stage</label>
              <select
                value={deal.stage_id}
                onChange={(e) => handleMoveStage(deal.id, e.target.value)}
                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 text-gray-900 mt-1"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {(() => {
              const currentStage = stages.find((s) => s.id === deal.stage_id);
              if (!currentStage?.playbook) return null;
              return (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5 mb-1">
                    <ClipboardList className="w-3.5 h-3.5" />
                    What to say/ask at "{currentStage.name}"
                  </p>
                  <p className="text-xs text-blue-900 whitespace-pre-wrap">{currentStage.playbook}</p>
                </div>
              );
            })()}

            <div className="bg-violet-50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-violet-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Generate Numerology Report
              </p>
              {reportResult ? (
                <div className="text-xs text-gray-700 space-y-1 bg-white rounded-md p-2 border border-violet-100">
                  <p><span className="text-gray-400">Driver:</span> <b>{reportResult.driver}</b> &nbsp; <span className="text-gray-400">Conductor:</span> <b>{reportResult.conductor}</b></p>
                  <p className={reportResult.isAuspicious ? 'text-emerald-600' : 'text-amber-600'}>
                    {reportResult.isAuspicious ? '✓ Name is auspicious' : '⚠ Name correction recommended'}
                  </p>
                  <button onClick={() => setReportResult(null)} className="text-violet-600 hover:underline">Generate another</button>

                  {clientMessageDraft ? (
                    <div className="mt-2 pt-2 border-t border-violet-100">
                      <p className="text-[10px] font-bold text-violet-600 uppercase mb-1">Draft message (review before sending)</p>
                      <p className="text-gray-600 whitespace-pre-wrap">{clientMessageDraft}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDraftClientMessage(deal)}
                      disabled={draftingClientMessage}
                      className="mt-1 text-violet-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      {draftingClientMessage && <Loader2 className="w-3 h-3 animate-spin" />}
                      <Sparkles className="w-3 h-3" />
                      Draft message with AI
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="date"
                    value={reportDob}
                    onChange={(e) => setReportDob(e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-1.5 text-gray-900"
                  />
                  <select
                    value={reportGender}
                    onChange={(e) => setReportGender(e.target.value as 'male' | 'female' | 'other')}
                    className="text-xs border border-gray-200 rounded px-2 py-1.5 text-gray-900"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <button
                    onClick={() => handleGenerateReport(deal)}
                    disabled={!reportDob || generatingReport}
                    className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded hover:bg-violet-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    {generatingReport && <Loader2 className="w-3 h-3 animate-spin" />}
                    Generate
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs font-semibold text-gray-600">Activity</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {activities.length === 0 && <p className="text-xs text-gray-400">No activity yet.</p>}
              {activities.map((a) => (
                <div key={a.id} className="text-xs text-gray-500 flex justify-between gap-2">
                  <span className="capitalize min-w-0 break-words">{a.type.replace('_', ' ')}{['note', 'call', 'message'].includes(a.type) ? `: ${(a.payload as any).note}` : ''}</span>
                  <span className="text-gray-300 flex-shrink-0">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="What happened? (optional - a call/message logs a default line without it)"
                className="w-full text-xs border border-gray-200 rounded px-2 py-1 text-gray-900"
              />
              {snippets.length > 0 && (
                <select
                  onChange={(e) => { if (e.target.value) setNoteText(e.target.value); e.target.value = ''; }}
                  defaultValue=""
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1 text-gray-500 bg-white"
                >
                  <option value="" disabled>Insert a snippet...</option>
                  {snippets.map((s) => (
                    <option key={s.id} value={s.body}>{s.title}</option>
                  ))}
                </select>
              )}
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleAddNote(deal.lead_id)}
                  className="flex-1 text-xs bg-indigo-600 text-white px-2 py-1.5 rounded hover:bg-indigo-700"
                >
                  Add note
                </button>
                <button
                  onClick={() => handleLogTouch(deal.lead_id, 'call')}
                  className="flex-1 text-xs bg-white border border-gray-200 text-gray-600 px-2 py-1.5 rounded hover:bg-gray-50 flex items-center justify-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  Log call
                </button>
                <button
                  onClick={() => handleLogTouch(deal.lead_id, 'message')}
                  className="flex-1 text-xs bg-white border border-gray-200 text-gray-600 px-2 py-1.5 rounded hover:bg-gray-50 flex items-center justify-center gap-1"
                >
                  <Mail className="w-3 h-3" />
                  Log message
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const DraggableDealCard: React.FC<{ deal: Deal }> = ({ deal }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
    const lead = deal.lead;
    const hoverClass = SCORE_HOVER[lead?.lead_score || 'warm'];
    const style: React.CSSProperties = {
      transform: transform ? CSS.Translate.toString(transform) : undefined,
      opacity: isDragging ? 0.4 : 1,
    };
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={`bg-white rounded-lg border border-gray-200 shadow-sm p-3.5 space-y-1 transition-colors touch-none cursor-grab active:cursor-grabbing ${hoverClass}`}
      >
        {dealCardBody(deal)}
      </div>
    );
  };

  const DroppableColumn: React.FC<{ stage: CrmStage; children: React.ReactNode }> = ({ stage, children }) => {
    const { setNodeRef, isOver } = useDroppable({ id: stage.id });
    return (
      <div
        ref={setNodeRef}
        className={`space-y-3 min-h-[80px] rounded-lg transition-colors ${isOver ? 'bg-indigo-50/70 ring-2 ring-indigo-300' : ''}`}
      >
        {children}
      </div>
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;
    const dealId = String(active.id);
    const targetStageId = String(over.id);
    const deal = deals.find((d) => d.id === dealId);
    if (deal && deal.stage_id !== targetStageId) {
      handleMoveStage(dealId, targetStageId);
    }
  };

  const activeDeal = deals.find((d) => d.id === activeDragId);

  if (loading) {
    return <div className="text-center py-10 text-gray-400 text-sm">Loading pipeline...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">Lead Pipeline</h2>
        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              onClick={() => setShowManageStages(true)}
              className="text-xs font-semibold text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Manage Stages
            </button>
          )}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('kanban')}
            className={`p-1.5 rounded transition-colors ${view === 'kanban' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-indigo-500 hover:bg-white/60'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded transition-colors ${view === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-indigo-500 hover:bg-white/60'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
        </div>
      </div>

      {stalledDeals.length > 0 && (
        <div className="mb-4">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Needs attention
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {stalledDeals.map((d) => (
              <button
                key={d.id}
                onClick={() => { setView('list'); toggleExpand(d.id); }}
                className="flex-shrink-0 text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-3 py-1 whitespace-nowrap transition-colors"
              >
                {d.lead?.first_name || 'Unknown'} {d.lead?.last_name || ''} · {daysSince(d.updated_at)}d
              </button>
            ))}
          </div>
        </div>
      )}

      {deals.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No deals yet — they'll appear here as leads come in.</p>
      ) : view === 'kanban' ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {stages.map((stage) => {
              const stageDeals = deals.filter((d) => d.stage_id === stage.id);
              const colors = getStageColors(stage);
              return (
                <div key={stage.id} className={`w-[300px] flex-shrink-0 rounded-lg border-t-4 ${colors.border} bg-gray-50/60 p-2`}>
                  <div className={`flex items-center justify-between mb-2 px-2 py-1.5 rounded-md ${colors.header}`}>
                    <p className="text-xs font-bold uppercase flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      {stage.name}
                    </p>
                    <span className="text-xs font-bold bg-white/70 rounded-full px-2">{stageDeals.length}</span>
                  </div>
                  <DroppableColumn stage={stage}>
                    {stageDeals.map((deal) => <DraggableDealCard key={deal.id} deal={deal} />)}
                  </DroppableColumn>
                </div>
              );
            })}
          </div>
          <DragOverlay>
            {activeDeal ? (
              <div className="bg-white rounded-lg border border-indigo-300 shadow-xl p-3.5 space-y-1 w-[276px] rotate-2">
                {dealCardBody(activeDeal)}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="space-y-3">
          {deals.map((deal) => (
            <div key={deal.id} className={`bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-1 transition-colors ${SCORE_HOVER[deal.lead?.lead_score || 'warm']}`}>
              {dealCardBody(deal)}
            </div>
          ))}
        </div>
      )}

      {showManageStages && (
        <ManageStagesModal numerologistId={numerologistId} stages={stages} onClose={() => setShowManageStages(false)} onChanged={load} />
      )}
    </div>
  );
};
