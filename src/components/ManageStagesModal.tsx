import React, { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { CrmStage, addStage, updateStage, deleteStage } from '../services/crmService';

interface ManageStagesModalProps {
  numerologistId: string;
  stages: CrmStage[];
  onClose: () => void;
  onChanged: () => void;
}

/**
 * Pipeline configuration - matching the numerologist's actual funnel
 * instead of a fixed shared one, per the Nestarmy CRM PRD's Pillar C
 * ("Custom pipeline matching your actual funnel"). Also carries each
 * stage's playbook (what to say/ask - shown in the deal view) and
 * forecast probability (feeds the weighted pipeline value on Analytics).
 */
export const ManageStagesModal: React.FC<ManageStagesModalProps> = ({ numerologistId, stages, onClose, onChanged }) => {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { name: string; playbook: string; probability_pct: number }>>(
    Object.fromEntries(stages.map((s) => [s.id, { name: s.name, playbook: s.playbook, probability_pct: s.probability_pct }]))
  );

  const setDraft = (id: string, field: 'name' | 'playbook' | 'probability_pct', value: string | number) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSaveStage = async (stage: CrmStage) => {
    const draft = drafts[stage.id];
    if (!draft?.name.trim()) return;
    setSaving(stage.id);
    await updateStage(stage.id, { name: draft.name.trim(), playbook: draft.playbook, probability_pct: draft.probability_pct });
    setSaving(null);
    onChanged();
  };

  const handleDelete = async (stage: CrmStage) => {
    if (stage.is_won || stage.is_lost) {
      setError(`"${stage.name}" is a built-in outcome stage and can't be deleted.`);
      return;
    }
    if (!window.confirm(`Delete "${stage.name}"? Any deals must be moved out of it first.`)) return;
    const res = await deleteStage(stage.id);
    if (!res.success) {
      setError(res.error || 'Could not delete that stage.');
      return;
    }
    onChanged();
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setError('');
    const res = await addStage(numerologistId, newName.trim());
    if (!res.success) {
      setError(res.error || 'Could not add that stage.');
      return;
    }
    setNewName('');
    onChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-white font-bold">Manage Pipeline Stages</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          <p className="text-xs text-gray-400">
            Rename, reorder value, add a script for staff, or set how likely a deal at this stage is to close (feeds the weighted forecast on Analytics).
          </p>
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3">{error}</div>}

          {stages.map((stage) => {
            const draft = drafts[stage.id] || { name: stage.name, playbook: stage.playbook, probability_pct: stage.probability_pct };
            return (
              <div key={stage.id} className="border border-gray-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft(stage.id, 'name', e.target.value)}
                    className="flex-1 text-sm font-semibold border border-gray-200 rounded-lg px-3 py-1.5 text-gray-900"
                  />
                  {stage.is_won && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">Won outcome</span>}
                  {stage.is_lost && <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full uppercase">Lost outcome</span>}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={draft.probability_pct}
                      onChange={(e) => setDraft(stage.id, 'probability_pct', Math.max(0, Math.min(100, Number(e.target.value))))}
                      className="w-16 text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-900"
                    />
                    <span className="text-xs text-gray-400">%</span>
                  </div>
                </div>
                <textarea
                  value={draft.playbook}
                  onChange={(e) => setDraft(stage.id, 'playbook', e.target.value)}
                  placeholder="What should staff say or ask at this stage? (optional)"
                  rows={2}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                />
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleSaveStage(stage)}
                    disabled={saving === stage.id}
                    className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                  {!stage.is_won && !stage.is_lost && (
                    <button onClick={() => handleDelete(stage)} className="text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New stage name, e.g. 'Report Delivered'"
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
            />
            <button onClick={handleAdd} className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add stage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
