import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Phone, Mail, Command } from 'lucide-react';
import { Lead } from '../services/numerologistService';

interface GlobalSearchProps {
  leads: Lead[];
  open: boolean;
  onClose: () => void;
  onSelectLead: (leadId: string) => void;
}

/**
 * HubSpot's signature "search everything" pattern (Cmd/Ctrl+K), scoped to
 * what this CRM actually holds - leads and customers by name, mobile,
 * email, or tag. Client-side since the whole list is already in memory
 * for a single numerologist's book of business.
 */
export const GlobalSearch: React.FC<GlobalSearchProps> = ({ leads, open, onClose, onSelectLead }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return leads
      .filter((l) => {
        const name = `${l.first_name || ''} ${l.last_name || ''}`.toLowerCase();
        const mobile = l.mobile_number || '';
        const email = (l.email || '').toLowerCase();
        const tags = (l.tags || []).join(' ').toLowerCase();
        return name.includes(q) || mobile.includes(q) || email.includes(q) || tags.includes(q);
      })
      .slice(0, 8);
  }, [leads, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads and customers by name, mobile, email, or tag..."
            className="flex-1 text-sm text-gray-900 outline-none min-w-0"
          />
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query.trim() === '' ? (
            <p className="text-xs text-gray-400 px-4 py-6 text-center">Start typing to search your whole book of business.</p>
          ) : results.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-6 text-center">No matches for "{query}".</p>
          ) : (
            results.map((lead) => (
              <button
                key={lead.id}
                onClick={() => { onSelectLead(lead.id); onClose(); }}
                className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 flex items-center justify-between gap-3 border-b border-gray-50 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{lead.first_name} {lead.last_name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    {lead.mobile_number && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.mobile_number}</span>}
                    {lead.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{lead.email}</span>}
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0 ${
                  lead.status === 'converted' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {lead.status}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-1.5 text-[11px] text-gray-400">
          <Command className="w-3 h-3" />
          <span>K to open · Esc to close</span>
        </div>
      </div>
    </div>
  );
};
