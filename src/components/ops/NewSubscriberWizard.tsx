import React, { useEffect, useState } from 'react';
import { X, Loader2, Check } from 'lucide-react';
import { getPlatformModules, PlatformModule } from '../../services/opsModulesService';
import { getSubscriptionPlans, SubscriptionPlan } from '../../services/subscriptionService';
import { provisionSubscriber } from '../../services/opsProvisionService';

interface WizardState {
  step: number;
  first_name: string;
  last_name: string;
  business_name: string;
  mobile_number: string;
  email: string;
  module_codes: string[];
  plan_id: string;
}

const EMPTY: Omit<WizardState, 'plan_id'> = { step: 1, first_name: '', last_name: '', business_name: '', mobile_number: '', email: '', module_codes: [] };

export const NewSubscriberWizard: React.FC<{ onClose: () => void; onProvisioned: () => void }> = ({ onClose, onProvisioned }) => {
  const [modules, setModules] = useState<PlatformModule[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [wiz, setWiz] = useState<WizardState>({ ...EMPTY, plan_id: '' });
  const [error, setError] = useState('');
  const [provisioning, setProvisioning] = useState(false);
  const [provisionSteps, setProvisionSteps] = useState<number>(0);
  const [done, setDone] = useState<{ invoice_number: string; monthly_total_inr: number } | null>(null);

  useEffect(() => {
    (async () => {
      const [m, p] = await Promise.all([getPlatformModules(), getSubscriptionPlans()]);
      setModules(m);
      setPlans(p);
      setWiz((w) => ({ ...w, plan_id: p[1]?.id || p[0]?.id || '' }));
    })();
  }, []);

  const addOnModules = modules.filter((m) => !m.is_core);
  const selectedPlan = plans.find((p) => p.id === wiz.plan_id);
  const addOnTotal = wiz.module_codes.reduce((sum, code) => sum + (modules.find((m) => m.code === code)?.monthly_price_inr || 0), 0);
  const planBaseRupees = selectedPlan ? Math.round(selectedPlan.price_monthly_inr / 100) : 0;
  const total = planBaseRupees + addOnTotal;

  const toggleModule = (code: string) => {
    setWiz((w) => ({ ...w, module_codes: w.module_codes.includes(code) ? w.module_codes.filter((c) => c !== code) : [...w.module_codes, code] }));
  };

  const next = () => {
    if (wiz.step === 1) {
      if (!wiz.first_name.trim() || !wiz.business_name.trim() || !wiz.mobile_number.trim() || !wiz.email.trim()) {
        setError('Please fill in name, business name, mobile, and email.');
        return;
      }
    }
    setError('');
    setWiz((w) => ({ ...w, step: w.step + 1 }));
  };
  const back = () => setWiz((w) => ({ ...w, step: w.step - 1 }));

  const finish = async () => {
    setProvisioning(true);
    setProvisionSteps(1);
    const timer = setInterval(() => setProvisionSteps((s) => Math.min(s + 1, 3)), 500);
    const res = await provisionSubscriber({
      first_name: wiz.first_name, last_name: wiz.last_name, business_name: wiz.business_name,
      mobile_number: wiz.mobile_number, email: wiz.email, plan_id: wiz.plan_id, module_codes: wiz.module_codes,
    });
    clearInterval(timer);
    setProvisioning(false);
    if (!res.success) {
      setError(res.error || 'Could not provision this subscriber');
      setProvisionSteps(0);
      return;
    }
    setProvisionSteps(4);
    setDone({ invoice_number: res.invoice_number || '', monthly_total_inr: res.monthly_total_inr || total });
    setTimeout(() => { onProvisioned(); onClose(); }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100 z-10">
          <h2 className="font-display font-bold text-lg">New subscriber</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex gap-1.5 mb-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i < wiz.step ? 'bg-indigo-600' : i === wiz.step ? 'bg-indigo-300' : 'bg-gray-100'}`} />
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          {wiz.step === 1 && (
            <div className="space-y-3">
              <Field label="Numerologist first name"><input value={wiz.first_name} onChange={(e) => setWiz({ ...wiz, first_name: e.target.value })} placeholder="e.g. Priya" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-300" /></Field>
              <Field label="Last name (optional)"><input value={wiz.last_name} onChange={(e) => setWiz({ ...wiz, last_name: e.target.value })} placeholder="e.g. Deshmukh" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-300" /></Field>
              <Field label="Business name"><input value={wiz.business_name} onChange={(e) => setWiz({ ...wiz, business_name: e.target.value })} placeholder="e.g. Priya's Numerology Studio" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-300" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Mobile"><input value={wiz.mobile_number} onChange={(e) => setWiz({ ...wiz, mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="10-digit number" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-300" /></Field>
                <Field label="Email"><input type="email" value={wiz.email} onChange={(e) => setWiz({ ...wiz, email: e.target.value })} placeholder="name@studio.com" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-300" /></Field>
              </div>
            </div>
          )}

          {wiz.step === 2 && (
            <div>
              <p className="text-xs text-gray-400 mb-3">Numerology is included in every plan. Add the modules this subscriber needs — cost updates as you pick.</p>
              <div className="space-y-2">
                {addOnModules.map((m) => {
                  const checked = wiz.module_codes.includes(m.code);
                  return (
                    <div
                      key={m.code}
                      role="checkbox"
                      aria-checked={checked}
                      tabIndex={0}
                      onClick={() => toggleModule(m.code)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleModule(m.code); } }}
                      className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border cursor-pointer ${checked ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'}`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{m.name}</p>
                        <p className="text-xs text-gray-400">{m.description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-mono font-semibold">₹{m.monthly_price_inr}/mo</span>
                        {/* Plain span styled as a checkbox, not a real <input>, so there's no
                            native label/control click-forwarding to double-fire the toggle. */}
                        <span className={`w-4 h-4 rounded flex items-center justify-center border ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                          {checked && <Check className="w-3 h-3 text-white" />}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 bg-gray-50 rounded-lg p-3 flex justify-between text-sm font-semibold">
                <span>Add-on cost so far</span><span>₹{addOnTotal}/mo</span>
              </div>
            </div>
          )}

          {wiz.step === 3 && (
            <div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {plans.map((p) => (
                  <button key={p.id} onClick={() => setWiz({ ...wiz, plan_id: p.id })} className={`border rounded-lg p-3 text-center ${wiz.plan_id === p.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
                    <p className="text-sm font-bold">{p.name}</p>
                    <p className="text-sm font-mono font-semibold">₹{Math.round(p.price_monthly_inr / 100)}/mo</p>
                    <p className="text-[10px] text-gray-400 mt-1">{p.reports_limit_per_month} reports/mo</p>
                  </button>
                ))}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>{selectedPlan?.name} plan base</span><span>₹{planBaseRupees}</span></div>
                {wiz.module_codes.map((code) => {
                  const m = modules.find((mm) => mm.code === code);
                  return m ? <div key={code} className="flex justify-between text-gray-500"><span>{m.name}</span><span>₹{m.monthly_price_inr}</span></div> : null;
                })}
                <div className="flex justify-between font-bold border-t border-gray-200 pt-1.5 mt-1.5"><span>Total per month</span><span>₹{total}</span></div>
              </div>
            </div>
          )}

          {wiz.step === 4 && (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subscriber</span><span className="font-semibold">{wiz.first_name} {wiz.last_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Business</span><span>{wiz.business_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Plan</span><span>{selectedPlan?.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Modules</span><span>{wiz.module_codes.length ? wiz.module_codes.join(', ') : 'Numerology only'}</span></div>
              </div>
              <div className="border border-dashed border-gray-300 rounded-lg p-3">
                <p className="text-[10px] font-mono uppercase text-gray-400 mb-2">First invoice</p>
                <div className="flex justify-between text-sm font-bold"><span>Total due</span><span>₹{total}</span></div>
              </div>
              <p className="text-xs text-gray-400">The contract and invoice are created for real when you finish this wizard — nothing is sent by email yet (no e-signature/email integration wired up).</p>
            </div>
          )}

          {wiz.step === 5 && (
            <div>
              <p className="text-xs text-gray-400 mb-3">Granting access creates a real login, unlocks exactly the modules paid for, and adds this subscriber to your list.</p>
              {done ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                  <Check className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-emerald-800">Provisioned — invoice {done.invoice_number} for ₹{done.monthly_total_inr}/mo.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {['Dashboard account created', (wiz.module_codes.length ? wiz.module_codes.join(', ') : 'Numerology') + ' unlocked', 'Added to Subscribers list'].map((label, i) => (
                    <li key={label} className="flex items-center gap-2 text-sm">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${provisionSteps > i ? 'bg-emerald-500 text-white' : 'border border-gray-300 text-gray-300'}`}>{provisionSteps > i ? '✓' : ''}</span>
                      <span className={provisionSteps > i ? 'text-gray-800' : 'text-gray-400'}>{label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        </div>

        <div className="sticky bottom-0 bg-white flex items-center justify-between px-6 py-4 border-t border-gray-100">
          {wiz.step > 1 && !done ? <button onClick={back} className="text-sm font-semibold text-gray-500">Back</button> : <span />}
          {wiz.step < 5 ? (
            <button onClick={next} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg">Continue</button>
          ) : !done ? (
            <button onClick={finish} disabled={provisioning} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50 flex items-center gap-2">
              {provisioning && <Loader2 className="w-4 h-4 animate-spin" />}
              {provisioning ? 'Provisioning...' : 'Grant system access'}
            </button>
          ) : <span />}
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-xs font-semibold text-gray-500 mb-1 block">{label}</label>
    {children}
  </div>
);
