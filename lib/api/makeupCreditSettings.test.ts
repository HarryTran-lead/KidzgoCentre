import { afterEach, describe, expect, it, vi } from "vitest";

// Mock @/lib/axios before importing the service
vi.mock("@/lib/axios", () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

import { get, put } from "@/lib/axios";
import { getMakeupSettings, updateMakeupSettings } from "@/lib/api/makeupCreditService";
import { MAKEUP_CREDIT_ENDPOINTS } from "@/constants/apiURL";

const sampleSettings = {
  creditExpiryDays: 7,
  createdAt: "2026-04-29T10:00:00+07:00",
  updatedAt: null,
};

describe("makeupCreditService — settings", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getMakeupSettings", () => {
    it("calls GET with the settings endpoint", async () => {
      vi.mocked(get).mockResolvedValue({ isSuccess: true, data: sampleSettings });

      await getMakeupSettings();

      expect(get).toHaveBeenCalledWith(MAKEUP_CREDIT_ENDPOINTS.SETTINGS);
    });

    it("returns the response from the API", async () => {
      const mockResponse = { isSuccess: true, data: sampleSettings };
      vi.mocked(get).mockResolvedValue(mockResponse);

      const result = await getMakeupSettings();

      expect(result).toBe(mockResponse);
    });

    it("propagates rejection when the API fails", async () => {
      vi.mocked(get).mockRejectedValue(new Error("Network error"));

      await expect(getMakeupSettings()).rejects.toThrow("Network error");
    });
  });

  describe("updateMakeupSettings", () => {
    it("calls PUT with the settings endpoint and payload", async () => {
      vi.mocked(put).mockResolvedValue({ isSuccess: true, data: { ...sampleSettings, creditExpiryDays: 14 } });

      await updateMakeupSettings({ creditExpiryDays: 14 });

      expect(put).toHaveBeenCalledWith(MAKEUP_CREDIT_ENDPOINTS.SETTINGS, { creditExpiryDays: 14 });
    });

    it("returns the updated settings response", async () => {
      const mockResponse = { isSuccess: true, data: { ...sampleSettings, creditExpiryDays: 14 } };
      vi.mocked(put).mockResolvedValue(mockResponse);

      const result = await updateMakeupSettings({ creditExpiryDays: 14 });

      expect(result).toBe(mockResponse);
    });

    it("propagates rejection when validation fails", async () => {
      vi.mocked(put).mockRejectedValue({ response: { data: { title: "MakeupSettings.InvalidCreditExpiryDays" } } });

      await expect(updateMakeupSettings({ creditExpiryDays: 0 })).rejects.toMatchObject({
        response: { data: { title: "MakeupSettings.InvalidCreditExpiryDays" } },
      });
    });
  });
});
