import React, { useEffect, useState } from 'react';
import { UserCog, UserPlus, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { TeamMember, getMyTeam, inviteTeamMember, removeTeamMember, recheckInvite } from '../services/teamService';

interface TeamPanelProps {
  numerologistId: string;
  isOwner: boolean;
}

export const TeamPanel: React.FC<TeamPanelProps> = ({ numerologistId, isOwner }) => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobile, setMobile] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    load();
  }, [numerologistId]);

  const load = async () => {
    setLoading(true);
    setTeam(await getMyTeam(numerologistId));
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!/^\d{7,15}$/.test(mobile)) {
      setError('Enter a valid mobile number (7-15 digits).');
      return;
    }
    setError('');
    setMessage('');
    setInviting(true);
    const res = await inviteTeamMember(numerologistId, mobile);
    setInviting(false);
    if (!res.success) {
      setError(res.error || 'Could not add team member.');
      return;
    }
    setMessage(
      res.status === 'active'
        ? 'Added! They already have an AskNameAI account and can see the dashboard now.'
        : "Saved as invited — they'll need to create an AskNameAI account with this mobile number first, then you can recheck below."
    );
    setMobile('');
    load();
  };

  const handleRecheck = async (member: TeamMember) => {
    const res = await recheckInvite(member.id, member.mobile_number);
    if (res.nowActive) load();
  };

  const handleRemove = async (id: string) => {
    await removeTeamMember(id);
    load();
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-400 text-sm">Loading team...</div>;
  }

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-lime-400">
          <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-lime-600" />
            Add Team Member
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            They'll see the same dashboard, scoped to your leads and pipeline. They need an AskNameAI account with this mobile number.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 15))}
              placeholder="Mobile number"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 flex-1 min-w-[200px]"
            />
            <button
              onClick={handleInvite}
              disabled={inviting || !mobile}
              className="bg-lime-600 hover:bg-lime-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              {inviting && <Loader2 className="w-4 h-4 animate-spin" />}
              Add
            </button>
          </div>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          {message && <p className="text-xs text-green-700 mt-2">{message}</p>}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-lime-400">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <UserCog className="w-4 h-4 text-lime-600" />
          Team
        </h2>
        {team.length === 0 ? (
          <p className="text-sm text-gray-400">No team members yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {team.map((member) => (
              <div key={member.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-800">{member.member_name || member.mobile_number}</p>
                  <p className="text-gray-400 text-xs">{member.mobile_number}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {member.status}
                  </span>
                  {isOwner && member.status === 'invited' && (
                    <button onClick={() => handleRecheck(member)} title="Recheck if they've registered" className="text-gray-400 hover:text-indigo-600">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  {isOwner && (
                    <button onClick={() => handleRemove(member.id)} title="Remove" className="text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
