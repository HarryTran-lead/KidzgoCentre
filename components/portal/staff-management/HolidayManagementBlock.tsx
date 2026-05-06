"use client";

import { CalendarDays, Pencil, RefreshCw, Save, Trash2 } from "lucide-react";
import { getMessagesFromPath } from "@/lib/dict";
import type { Holiday } from "@/types/holiday";
import type { HolidayUpsertPayload } from "@/types/holiday";

export type HolidayFormState = HolidayUpsertPayload & { id?: string | null };

type Props = {
  holidays: Holiday[];
  holidaysLoading: boolean;
  holidaySubmitting: boolean;
  holidayForm: HolidayFormState;
  onFormChange: (update: Partial<HolidayFormState>) => void;
  onSubmit: () => void;
  onResetForm: () => void;
  onEdit: (holiday: Holiday) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function HolidayManagementBlock({
  holidays,
  holidaysLoading,
  holidaySubmitting,
  holidayForm,
  onFormChange,
  onSubmit,
  onResetForm,
  onEdit,
  onToggle,
  onDelete,
}: Props) {
  const t = getMessagesFromPath().adminPages.staffManagement.holiday;

  return (
    <div className="rounded-2xl border border-red-200 bg-white shadow-sm p-4 space-y-3 xl:col-span-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <CalendarDays size={16} className="text-red-600" />
          {t.sectionTitle}
        </div>
        <div className="text-xs text-gray-500">
          {holidaysLoading ? t.loading : `${holidays.length} holiday`}
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <input
          value={holidayForm.name}
          onChange={(e) => onFormChange({ name: e.target.value })}
          placeholder={t.namePlaceholder}
          className="h-10 rounded-xl border border-red-200 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 md:col-span-2"
        />
        <input
          type="date"
          value={holidayForm.startDate}
          onChange={(e) => onFormChange({ startDate: e.target.value })}
          className="h-10 rounded-xl border border-red-200 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
        />
        <input
          type="date"
          value={holidayForm.endDate}
          onChange={(e) => onFormChange({ endDate: e.target.value })}
          className="h-10 rounded-xl border border-red-200 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
        />
        <label className="h-10 rounded-xl border border-red-200 px-3 inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={holidayForm.isActive}
            onChange={(e) => onFormChange({ isActive: e.target.checked })}
            className="h-4 w-4"
          />
          {t.activeLabel}
        </label>
      </div>

      <input
        value={holidayForm.description ?? ""}
        onChange={(e) => onFormChange({ description: e.target.value })}
        placeholder={t.descriptionPlaceholder}
        className="h-10 w-full rounded-xl border border-red-200 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={holidaySubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition-all disabled:opacity-50"
        >
          {holidaySubmitting ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {holidayForm.id ? t.btnUpdate : t.btnCreate}
        </button>
        {holidayForm.id ? (
          <button
            type="button"
            onClick={onResetForm}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
          >
            {t.btnCancelEdit}
          </button>
        ) : null}
      </div>

      {/* List */}
      <div className="max-h-56 overflow-auto rounded-xl border border-red-100">
        <table className="w-full">
          <thead className="bg-red-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">{t.colName}</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">{t.colDateRange}</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">{t.colStatus}</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">{t.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-red-100">
            {holidays.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-2 text-sm text-gray-800">
                  <div className="font-medium">{item.name}</div>
                  {item.description ? (
                    <div className="text-xs text-gray-500">{item.description}</div>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-sm text-gray-700">
                  {item.startDate} - {item.endDate}
                </td>
                <td className="px-3 py-2 text-sm">
                  <span
                    className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold ${
                      item.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {item.isActive ? t.statusActive : t.statusInactive}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700"
                    >
                      <Pencil size={12} />
                      {t.btnEdit}
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggle(item.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700"
                    >
                      <RefreshCw size={12} />
                      {t.btnToggle}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                    >
                      <Trash2 size={12} />
                      {t.btnDelete}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!holidaysLoading && holidays.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-sm text-gray-500">
                  {t.noData}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
