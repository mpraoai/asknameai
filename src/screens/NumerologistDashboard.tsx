import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, Settings, LogOut } from 'lucide-react';
import { getCurrentProfile, signOut, UserProfile } from '../services/authService';
import {
  getMyNumerologistProfile,
  getMyLeads,
  updateLeadStatus,
  updateBranding,
  NumerologistProfile,
  Lead,
} from '../services/numerologistService';

export default function NumerologistDashboard() {
  const [profile, setProfile] = useState<NumerologistProfile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingBranding, setSavingBranding] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    await getCurrentProfile();

    const numerologistProfile = await getMyNumerologistProfile();
    setProfile(numerologistProfile);

    if (numerologistProfile) {
      const myLeads = await getMyLeads(numerologistProfile.id);
      setLeads(myLeads);
    }
    setLoading(false);
  };

  const handleStatusChange = async (leadId: string, status: Lead['status']) => {
    await updateLeadStatus(leadId, status);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
  };

  const handleBrandColorChange = async (color: string) => {
    if (!profile) return;
    setSavingBranding(true);
    await updateBranding(profile.id, { brand_color: color });
    setProfile({ ...profile, brand_color: color });
    setSavingBranding(false);
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading your dashboard...</div>;
  }

  if (!profile) {
    return (
      <div className="text-center py-20 text-gray-500">
        No numerologist profile found for this account. Please complete onboarding first.
      </div>
    );
  }

  const newLeadsCount = leads.filter((l) => l.status === 'new').length;
  const convertedCount = leads.filter((l) => l.status === 'converted').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: profile.brand_color }}>
              {profile.business_name}
            </h1>
            <p className="text-xs text-gray-400 capitalize">{profile.subscription_status} plan</p>
          </div>
          <button onClick={() => signOut()} className="text-gray-400 hover:text-red-600">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Users className="w-6 h-6 text-indigo-600 mb-2" />
            <p className="text-2xl font-bold">{leads.length}</p>
            <p className="text-sm text-gray-500">Total leads assigned</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <TrendingUp className="w-6 h-6 text-amber-500 mb-2" />
            <p className="text-2xl font-bold">{newLeadsCount}</p>
            <p className="text-sm text-gray-500">New, not yet contacted</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Settings className="w-6 h-6 text-green-600 mb-2" />
            <p className="text-2xl font-bold">{convertedCount}</p>
            <p className="text-sm text-gray-500">Converted to customers</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">My Leads</h2>
          {leads.length === 0 ? (
            <p className="text-sm text-gray-400">No leads assigned to you yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {leads.map((lead) => (
                <div key={lead.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-800">
                      {lead.first_name} {lead.last_name}
                    </p>
                    <p className="text-gray-400">{lead.mobile_number || lead.email}</p>
                  </div>
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value as Lead['status'])}
                    className="border border-gray-200 rounded-lg px-3 py-1 text-sm"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Branding</h2>
          <label className="text-sm text-gray-500 block mb-2">
            Accent color (used on your client-facing reports)
          </label>
          <input
            type="color"
            value={profile.brand_color}
            onChange={(e) => handleBrandColorChange(e.target.value)}
            disabled={savingBranding}
            className="w-16 h-10 border border-gray-200 rounded cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}