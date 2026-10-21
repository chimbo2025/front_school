import React, { useEffect, useState } from 'react';
import { Settings, Save, AlertCircle, CheckCircle2, ArrowUp, ArrowDown } from 'lucide-react';
import { AllocationRule, CsvMapping } from '../types';
import { useApp } from '../context/AppContext';
import { authService } from '../services/auth';

interface SettingsPanelProps {
  className?: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ className = '' }) => {
  const { settings, updateSettings } = useApp();
  const [order, setOrder] = useState<AllocationRule[]>(settings.allocationOrder);
  const [notFoundDays, setNotFoundDays] = useState(settings.notFoundDays);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setOrder(settings.allocationOrder);
    setNotFoundDays(settings.notFoundDays);
  }, [settings.allocationOrder, settings.notFoundDays]);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...order];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next.map((r, i) => ({ ...r, priority: i + 1 })));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const partial: Partial<{ allocationOrder: AllocationRule[]; notFoundDays: number; csvMapping: CsvMapping | null }> = {
        allocationOrder: order,
        notFoundDays: Math.max(1, Math.min(90, notFoundDays)),
      };
      await updateSettings(partial, authService.getUser()?.username || 'admin');
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-600" />
          Verification Settings
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Fee allocation order and claim review rules. Changes are recorded in the audit trail.
        </p>
      </div>

      <div className="p-5 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Settings saved.
          </div>
        )}

        <div>
          <h4 className="text-sm font-bold text-slate-900">Fee Allocation Order</h4>
          <p className="text-xs text-slate-500 mt-0.5 mb-3">
            Money from a payment fills fee lines in this order. / Malipo hujazia mistari ya ada kwa mpangilio huu.
          </p>
          <div className="space-y-2">
            {order.map((rule, i) => (
              <div
                key={rule.feeGroupName}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <span className="w-6 h-6 rounded-full bg-[#7c3aed] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-semibold text-slate-800">{rule.feeGroupName}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="p-1.5 rounded-lg border border-slate-300 text-slate-500 hover:bg-white disabled:opacity-30"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === order.length - 1}
                    className="p-1.5 rounded-lg border border-slate-300 text-slate-500 hover:bg-white disabled:opacity-30"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-xs">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            NOT FOUND after (days) / Siku bila taarifa
          </label>
          <input
            type="number"
            min={1}
            max={90}
            value={notFoundDays}
            onChange={(e) => setNotFoundDays(Number(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            A claim with no statement row after this many days is marked NOT FOUND.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-xs font-semibold hover:bg-[#6d28d9] disabled:opacity-50 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
