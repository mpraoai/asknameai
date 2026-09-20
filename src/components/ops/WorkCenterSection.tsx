import React, { useEffect, useState } from 'react';
import { getWorkCenterStats, getRecentToolUsage, WorkCenterStats, ToolUsageRow } from '../../services/opsModulesService';
import { PlatformModule } from '../../services/opsModulesService';

export const WorkCenterSection: React.FC<{ module: PlatformModule }> = ({ module }) => {
  const [stats, setStats] = useState<WorkCenterStats | null>(null);
  const [recent, setRecent] = useState<ToolUsageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const [s, r] = await Promise.all([getWorkCenterStats(module.code, module.monthly_price_inr), getRecentToolUsage(module.code)]);
      setStats(s);
      setRecent(r);
      setLoading(false);
    })();
  }, [module.code]);

  if (loading || !stats) return <p className="text-sm text-gray-400">Loading...</p>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 max-w-xl">{module.description}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase font-mono">Uses this month</p>
          <p className="text-2xl font-display font-bold mt-1">{stats.reportsThisMonth}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase font-mono">MRR from this module</p>
          <p className="text-2xl font-display font-bold mt-1">₹{stats.revenueThisMonth.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase font-mono">Subscribers with this on</p>
          <p className="text-2xl font-display font-bold mt-1">{stats.subscriberCount} <span className="text-sm text-gray-400 font-normal">of {stats.totalSubscribers}</span></p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase font-mono">Add-on price</p>
          <p className="text-2xl font-display font-bold mt-1">{module.is_core ? 'Included' : `₹${module.monthly_price_inr.toLocaleString('en-IN')}/mo`}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-display font-semibold mb-4">Recent uses</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-400">No uses logged yet for this module.</p>
        ) : (
          <ul className="space-y-1.5">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-600">{module.name} calculation run</span>
                <span className="text-gray-400 font-mono">{new Date(r.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
