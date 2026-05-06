"use client";

import { Clock3, RefreshCw, Save } from "lucide-react";
import { getMessagesFromPath } from "@/lib/dict";
import type { MakeupSettings } from "@/types/makeupCredit";

type Props = {
  settings: MakeupSettings | null;
  loading: boolean;
  saving: boolean;
  expiryDaysInput: string;
  onExpiryDaysChange: (val: string) => void;
  onSave: () => void;
};

export default function MakeupSettingsBlock({
  settings,
  loading,
  saving,
  expiryDaysInput,
  onExpiryDaysChange,
  onSave,
}: Props) {
  const t = getMessagesFromPath().adminPages.staffManagement.settings;

  return (
    <div className="rounded-2xl border border-red-200 bg-white shadow-sm p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <Clock3 size={16} className="text-red-600" />
        {t.sectionTitle}
      </div>

      <div className="text-xs text-gray-500">{t.description}</div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={expiryDaysInput}
          onChange={(e) => onExpiryDaysChange(e.target.value)}
          className="h-10 w-28 rounded-xl border border-red-200 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
        />
        <span className="text-sm text-gray-600">{t.daysUnit}</span>
      </div>

      <div className="text-xs text-gray-500">
        {loading
          ? t.loadingText
          : `${t.currentValue} ${settings?.creditExpiryDays ?? "-"} ${t.daysUnit}`}
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={saving || loading}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition-all disabled:opacity-50"
      >
        {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
        {t.btnSave}
      </button>
    </div>
  );
}
