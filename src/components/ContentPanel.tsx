import React, { useEffect, useState } from 'react';
import { Sparkles, Copy, Check, Loader2, Calendar, Trash2, Instagram, Facebook, MessageCircle, Globe } from 'lucide-react';
import {
  ContentPost,
  ContentDraft,
  generateContentDrafts,
  saveContentPost,
  getMyContentPosts,
  scheduleContentPost,
  updateContentStatus,
  deleteContentPost,
} from '../services/contentService';
import { formatDate } from '../utils/locale';

interface ContentPanelProps {
  numerologistId: string;
  businessName: string;
}

const PLATFORM_META: Record<ContentPost['platform'], { label: string; icon: React.ElementType; color: string }> = {
  instagram: { label: 'Instagram', icon: Instagram, color: 'bg-pink-500' },
  facebook: { label: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
  whatsapp_status: { label: 'WhatsApp Status', icon: MessageCircle, color: 'bg-green-500' },
  other: { label: 'Other', icon: Globe, color: 'bg-gray-400' },
};

const STATUS_META: Record<ContentPost['status'], { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600' },
  scheduled: { label: 'Scheduled', color: 'bg-indigo-100 text-indigo-700' },
  posted: { label: 'Posted', color: 'bg-emerald-100 text-emerald-700' },
  skipped: { label: 'Skipped', color: 'bg-gray-100 text-gray-400' },
};

export const ContentPanel: React.FC<ContentPanelProps> = ({ numerologistId, businessName }) => {
  const [platform, setPlatform] = useState<ContentPost['platform']>('instagram');
  const [focus, setFocus] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [savedDraftIdx, setSavedDraftIdx] = useState<Set<number>>(new Set());
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    loadPosts();
  }, [numerologistId]);

  const loadPosts = async () => {
    setLoadingPosts(true);
    setPosts(await getMyContentPosts(numerologistId));
    setLoadingPosts(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError('');
    setDrafts([]);
    setSavedDraftIdx(new Set());
    const res = await generateContentDrafts(businessName, platform, focus.trim() || undefined);
    setGenerating(false);
    if (!res.success) {
      setGenError(res.error || 'Could not generate drafts right now.');
      return;
    }
    setDrafts(res.drafts || []);
  };

  const handleSaveDraft = async (draft: ContentDraft, idx: number) => {
    const res = await saveContentPost(numerologistId, { platform, caption: draft.caption, hashtags: draft.hashtags });
    if (res.success) {
      setSavedDraftIdx((prev) => new Set(prev).add(idx));
      loadPosts();
    }
  };

  const handleCopy = async (draft: ContentDraft, idx: number) => {
    const text = draft.hashtags ? `${draft.caption}\n\n${draft.hashtags}` : draft.caption;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1800);
    } catch {
      // clipboard API unavailable - silently ignore, the copy button just won't confirm
    }
  };

  const handleCopyPost = async (post: ContentPost) => {
    const text = post.hashtags ? `${post.caption}\n\n${post.hashtags}` : post.caption;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-violet-400">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-violet-500" />
          Content Ideas
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          AI drafts on-brand posts for {businessName || 'your practice'} — copy one to your own Instagram or Facebook.
          Nothing here ever posts on your behalf.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as ContentPost['platform'])}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
          >
            {(Object.keys(PLATFORM_META) as ContentPost['platform'][]).map((p) => (
              <option key={p} value={p}>{PLATFORM_META[p].label}</option>
            ))}
          </select>
          <input
            type="text"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="Optional theme — e.g. Diwali offer, new client testimonial"
            className="flex-1 min-w-[220px] text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
          >
            {generating && <Loader2 className="w-4 h-4 animate-spin" />}
            Generate 5 drafts
          </button>
        </div>

        {genError && <p className="text-xs text-red-600 mb-3">{genError}</p>}

        {drafts.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {drafts.map((draft, idx) => (
              <div key={idx} className="bg-violet-50/60 border border-violet-100 rounded-lg p-3 space-y-2">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{draft.caption}</p>
                {draft.hashtags && <p className="text-xs text-violet-600">{draft.hashtags}</p>}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleCopy(draft, idx)}
                    className="text-xs font-semibold text-violet-700 border border-violet-200 hover:bg-violet-100 px-2.5 py-1 rounded-lg flex items-center gap-1"
                  >
                    {copiedIdx === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedIdx === idx ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={() => handleSaveDraft(draft, idx)}
                    disabled={savedDraftIdx.has(idx)}
                    className="text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 px-2.5 py-1 rounded-lg"
                  >
                    {savedDraftIdx.has(idx) ? 'Saved to calendar' : 'Save to calendar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-violet-400">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-violet-500" />
          Content Calendar
        </h2>
        {loadingPosts ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-gray-400">No saved posts yet — generate a few drafts above and save the ones you like.</p>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => {
              const meta = PLATFORM_META[post.platform];
              const Icon = meta.icon;
              return (
                <div key={post.id} className="border border-gray-100 rounded-lg p-3 flex flex-wrap items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg ${meta.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-sm text-gray-800 line-clamp-2">{post.caption}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_META[post.status].color}`}>
                        {STATUS_META[post.status].label}
                      </span>
                      {post.scheduled_at && (
                        <span className="text-[11px] text-gray-400">
                          {formatDate(post.scheduled_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input
                      type="date"
                      value={post.scheduled_at ? post.scheduled_at.slice(0, 10) : ''}
                      onChange={async (e) => {
                        if (!e.target.value) return;
                        await scheduleContentPost(post.id, e.target.value);
                        loadPosts();
                      }}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-900"
                    />
                    <select
                      value={post.status}
                      onChange={async (e) => {
                        await updateContentStatus(post.id, e.target.value as ContentPost['status']);
                        loadPosts();
                      }}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-900"
                    >
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="posted">Posted</option>
                      <option value="skipped">Skipped</option>
                    </select>
                    <button
                      onClick={() => handleCopyPost(post)}
                      title="Copy caption"
                      className="text-gray-400 hover:text-violet-600 p-1.5"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => { await deleteContentPost(post.id); loadPosts(); }}
                      title="Delete"
                      className="text-gray-400 hover:text-red-600 p-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
