import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CreditCard as Edit2, Calendar, Tag, Palette, ToggleLeft, ToggleRight, Loader2, Save, Gift, IndianRupee, Check } from 'lucide-react';
import {
  Campaign, PricingPlan,
  getAllCampaigns, createCampaign, updateCampaign, deleteCampaign,
  getAllPricingPlans, updatePricingPlan
} from '../services/campaignService';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'campaigns' | 'pricing';

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<Tab>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingPricing, setEditingPricing] = useState<PricingPlan | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    const [campaignsData, pricingData] = await Promise.all([
      getAllCampaigns(),
      getAllPricingPlans(),
    ]);
    setCampaigns(campaignsData);
    setPricingPlans(pricingData);
    setLoading(false);
  };

  if (!isOpen) return null;

  const handleToggleCampaign = async (campaign: Campaign) => {
    await updateCampaign(campaign.id, { is_active: !campaign.is_active });
    loadData();
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    await deleteCampaign(id);
    loadData();
  };

  const handleTogglePricingActive = async (plan: PricingPlan) => {
    await updatePricingPlan(plan.id, { is_active: !plan.is_active });
    loadData();
  };

  const handleSavePricing = async (plan: PricingPlan, updates: Partial<PricingPlan>) => {
    const result = await updatePricingPlan(plan.id, updates);
    if (result.success) {
      setSaveSuccess(true);
      setEditingPricing(null);
      setTimeout(() => setSaveSuccess(false), 2000);
      loadData();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-teal-900 px-8 py-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Gift className="w-7 h-7 text-teal-400" />
            <h2 className="text-2xl font-bold text-white">Admin Control Panel</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {saveSuccess && (
          <div className="bg-teal-50 border-b border-teal-200 text-teal-700 px-8 py-3 text-sm font-medium flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4" /> Changes saved successfully!
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-8">
          <button
            onClick={() => setTab('campaigns')}
            className={`py-4 px-6 font-semibold transition-colors relative ${
              tab === 'campaigns' ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Gift className="w-5 h-5 inline mr-2" />
            Campaigns
            {tab === 'campaigns' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></div>}
          </button>
          <button
            onClick={() => setTab('pricing')}
            className={`py-4 px-6 font-semibold transition-colors relative ${
              tab === 'pricing' ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <IndianRupee className="w-5 h-5 inline mr-2" />
            Pricing Plans
            {tab === 'pricing' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></div>}
          </button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
          ) : tab === 'campaigns' ? (
            <CampaignTab
              campaigns={campaigns}
              showForm={showCampaignForm}
              setShowForm={setShowCampaignForm}
              editingCampaign={editingCampaign}
              setEditingCampaign={setEditingCampaign}
              onToggle={handleToggleCampaign}
              onDelete={handleDeleteCampaign}
              onSaved={() => { setShowCampaignForm(false); setEditingCampaign(null); loadData(); }}
            />
          ) : (
            <PricingTab
              pricingPlans={pricingPlans}
              editingPricing={editingPricing}
              setEditingPricing={setEditingPricing}
              onToggle={handleTogglePricingActive}
              onSave={handleSavePricing}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// =====================
// Campaign Tab
// =====================
const CampaignTab: React.FC<{
  campaigns: Campaign[];
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  editingCampaign: Campaign | null;
  setEditingCampaign: (c: Campaign | null) => void;
  onToggle: (c: Campaign) => void;
  onDelete: (id: string) => void;
  onSaved: () => void;
}> = ({ campaigns, showForm, setShowForm, editingCampaign, setEditingCampaign, onToggle, onDelete, onSaved }) => {
  if (showForm || editingCampaign) {
    return (
      <CampaignForm
        campaign={editingCampaign}
        onClose={() => { setShowForm(false); setEditingCampaign(null); }}
        onSaved={onSaved}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Manage Campaigns</h3>
          <p className="text-sm text-gray-500">Create festive offers and promotional discounts</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> New Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Gift className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No campaigns yet. Create your first festive offer!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h4 className="font-bold text-gray-900">{c.title}</h4>
                    {c.festival_name && (
                      <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">{c.festival_name}</span>
                    )}
                    {c.discount_label && (
                      <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{c.discount_label}</span>
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{c.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(c.start_date).toLocaleDateString()} - {new Date(c.end_date).toLocaleDateString()}</span>
                    {c.discount_percentage > 0 && <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> {c.discount_percentage}% off</span>}
                    {c.fixed_price !== null && <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" /> Fixed ₹{c.fixed_price}</span>}
                    <span className="flex items-center gap-1"><Palette className="w-3.5 h-3.5" /> <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: c.banner_color }}></span></span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => onToggle(c)} className="text-gray-400 hover:text-teal-600 transition-colors p-2" title={c.is_active ? 'Deactivate' : 'Activate'}>
                    {c.is_active ? <ToggleRight className="w-6 h-6 text-teal-600" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                  <button onClick={() => setEditingCampaign(c)} className="text-gray-400 hover:text-teal-600 transition-colors p-2" title="Edit">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => onDelete(c.id)} className="text-gray-400 hover:text-red-600 transition-colors p-2" title="Delete">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// =====================
// Campaign Form
// =====================
const CampaignForm: React.FC<{
  campaign: Campaign | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ campaign, onClose, onSaved }) => {
  const [form, setForm] = useState({
    title: campaign?.title || '',
    description: campaign?.description || '',
    discount_label: campaign?.discount_label || '',
    discount_percentage: campaign?.discount_percentage || 0,
    fixed_price: campaign?.fixed_price || null as number | null,
    banner_color: campaign?.banner_color || '#0F766E',
    cta_text: campaign?.cta_text || 'Grab Offer Now',
    festival_name: campaign?.festival_name || '',
    start_date: campaign?.start_date ? new Date(campaign.start_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    end_date: campaign?.end_date ? new Date(campaign.end_date).toISOString().slice(0, 10) : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    is_active: campaign?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const colorOptions = ['#0F766E', '#D97706', '#DC2626', '#7C3AED', '#2563EB', '#059669', '#DB2777', '#EA580C'];

  const handleSubmit = async () => {
    setSaving(true);
    setError('');

    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.');
      setSaving(false);
      return;
    }

    const payload = {
      ...form,
      fixed_price: form.fixed_price === null ? null : Number(form.fixed_price),
      discount_percentage: Number(form.discount_percentage),
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
    };

    let result;
    if (campaign) {
      result = await updateCampaign(campaign.id, payload);
    } else {
      result = await createCampaign(payload as any);
    }

    if (!result.success) {
      setError(result.error || 'Failed to save campaign.');
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-bold text-gray-900">{campaign ? 'Edit Campaign' : 'New Campaign'}</h3>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      <div className="space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="e.g., Diwali Special Offer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Festival Name</label>
            <input
              type="text"
              value={form.festival_name}
              onChange={(e) => setForm({ ...form, festival_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="e.g., Diwali, New Year, Navratri"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            placeholder="Describe the promotional offer..."
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount Label</label>
            <input
              type="text"
              value={form.discount_label}
              onChange={(e) => setForm({ ...form, discount_label: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="e.g., 25% OFF"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.discount_percentage}
              onChange={(e) => setForm({ ...form, discount_percentage: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fixed Price (optional)</label>
            <input
              type="number"
              min="0"
              value={form.fixed_price ?? ''}
              onChange={(e) => setForm({ ...form, fixed_price: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Override price"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">CTA Button Text</label>
            <input
              type="text"
              value={form.cta_text}
              onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="e.g., Grab Offer Now"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Banner Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  onClick={() => setForm({ ...form, banner_color: color })}
                  className={`w-9 h-9 rounded-lg transition-all ${form.banner_color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <button
            onClick={() => setForm({ ...form, is_active: !form.is_active })}
            className={form.is_active ? 'text-teal-600' : 'text-gray-300'}
          >
            {form.is_active ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
          </button>
          <span className="text-sm font-medium text-gray-700">Campaign is active</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {campaign ? 'Update Campaign' : 'Create Campaign'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================
// Pricing Tab
// =====================
const PricingTab: React.FC<{
  pricingPlans: PricingPlan[];
  editingPricing: PricingPlan | null;
  setEditingPricing: (p: PricingPlan | null) => void;
  onToggle: (p: PricingPlan) => void;
  onSave: (plan: PricingPlan, updates: Partial<PricingPlan>) => void;
}> = ({ pricingPlans, editingPricing, setEditingPricing, onToggle, onSave }) => {
  if (editingPricing) {
    return <PricingEditForm plan={editingPricing} onClose={() => setEditingPricing(null)} onSave={onSave} />;
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">Manage Pricing Plans</h3>
        <p className="text-sm text-gray-500">Set discounted prices for festive campaigns. Original prices stay unchanged.</p>
      </div>

      <div className="space-y-4">
        {pricingPlans.map((plan) => (
          <div key={plan.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-900">{plan.name}</h4>
                  {plan.is_popular && <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">Popular</span>}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-900">₹{plan.original_price}</span>
                  {plan.discounted_price && plan.discounted_price < plan.original_price && (
                    <>
                      <span className="text-sm text-gray-400 line-through">₹{plan.original_price}</span>
                      <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">₹{plan.discounted_price}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onToggle(plan)} className="text-gray-400 hover:text-teal-600 transition-colors p-2" title={plan.is_active ? 'Deactivate' : 'Activate'}>
                  {plan.is_active ? <ToggleRight className="w-6 h-6 text-teal-600" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
                <button onClick={() => setEditingPricing(plan)} className="text-gray-400 hover:text-teal-600 transition-colors p-2" title="Edit price">
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PricingEditForm: React.FC<{
  plan: PricingPlan;
  onClose: () => void;
  onSave: (plan: PricingPlan, updates: Partial<PricingPlan>) => void;
}> = ({ plan, onClose, onSave }) => {
  const [discountedPrice, setDiscountedPrice] = useState(plan.discounted_price?.toString() || '');

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-bold text-gray-900">Edit Pricing: {plan.name}</h3>
      </div>

      <div className="space-y-5 max-w-md">
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
          <p className="text-sm text-teal-800">
            <strong>Original Price:</strong> ₹{plan.original_price} (cannot be changed)
          </p>
          <p className="text-xs text-teal-600 mt-1">
            Set a discounted price for festive campaigns. Leave blank to use original price.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Discounted Price (₹)</label>
          <input
            type="number"
            min="0"
            max={plan.original_price}
            value={discountedPrice}
            onChange={(e) => setDiscountedPrice(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder={`Original: ₹${plan.original_price}`}
          />
          {discountedPrice && parseInt(discountedPrice) < plan.original_price && (
            <p className="text-sm text-amber-600 mt-2">
              Savings: ₹{plan.original_price - parseInt(discountedPrice)} ({Math.round((1 - parseInt(discountedPrice) / plan.original_price) * 100)}% off)
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onSave(plan, { discounted_price: discountedPrice ? parseInt(discountedPrice) : null })}
            className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" /> Save Price
          </button>
          <button onClick={onClose} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
