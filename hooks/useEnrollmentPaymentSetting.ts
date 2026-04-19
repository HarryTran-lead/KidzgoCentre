"use client";

import { useCallback, useState } from "react";
import {
  getEnrollmentPaymentSetting,
  upsertEnrollmentPaymentSetting,
} from "@/lib/api/enrollmentPaymentSettingService";
import type {
  EnrollmentPaymentSetting,
  UpsertPaymentSettingRequest,
} from "@/types/registration";

export function useEnrollmentPaymentSetting() {
  const [setting, setSetting] = useState<EnrollmentPaymentSetting | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSetting = useCallback(async (branchId?: string | null) => {
    try {
      setIsLoading(true);
      setError(null);

      const next = await getEnrollmentPaymentSetting(branchId);
      setSetting(next);
      return next;
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Không thể tải cấu hình thanh toán.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSetting = useCallback(async (payload: UpsertPaymentSettingRequest) => {
    try {
      setIsSaving(true);
      setError(null);

      const next = await upsertEnrollmentPaymentSetting(payload);
      setSetting(next);
      return next;
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Không thể lưu cấu hình thanh toán.";
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    setting,
    isLoading,
    isSaving,
    error,
    fetchSetting,
    saveSetting,
  };
}
