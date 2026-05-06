import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock @/lib/axios before importing the service
vi.mock("@/lib/axios", () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

import { get, post, put, patch, del } from "@/lib/axios";
import {
  createHoliday,
  deleteHoliday,
  getHolidayById,
  getHolidays,
  toggleHolidayStatus,
  updateHoliday,
} from "@/lib/api/holidayService";
import { HOLIDAY_ENDPOINTS } from "@/constants/apiURL";

const FAKE_ID = "4bde79fd-0df8-44a8-8f58-62726d57c8f2";

const sampleHoliday = {
  id: FAKE_ID,
  name: "Tết Nguyên Đán",
  startDate: "2026-02-16",
  endDate: "2026-02-20",
  description: "Nghỉ Tết",
  isActive: true,
};

describe("holidayService", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getHolidays", () => {
    it("calls GET without query params when no options given", async () => {
      vi.mocked(get).mockResolvedValue({ isSuccess: true, data: [sampleHoliday] });

      await getHolidays();

      expect(get).toHaveBeenCalledWith(HOLIDAY_ENDPOINTS.GET_ALL);
    });

    it("appends isActive query param when provided", async () => {
      vi.mocked(get).mockResolvedValue({ isSuccess: true, data: [] });

      await getHolidays({ isActive: true });

      expect(get).toHaveBeenCalledWith(`${HOLIDAY_ENDPOINTS.GET_ALL}?isActive=true`);
    });

    it("appends from and to query params when provided", async () => {
      vi.mocked(get).mockResolvedValue({ isSuccess: true, data: [] });

      await getHolidays({ from: "2026-01-01", to: "2026-12-31" });

      expect(get).toHaveBeenCalledWith(
        `${HOLIDAY_ENDPOINTS.GET_ALL}?from=2026-01-01&to=2026-12-31`,
      );
    });

    it("returns the response from the API", async () => {
      const mockResponse = { isSuccess: true, data: [sampleHoliday] };
      vi.mocked(get).mockResolvedValue(mockResponse);

      const result = await getHolidays();

      expect(result).toBe(mockResponse);
    });
  });

  describe("getHolidayById", () => {
    it("calls GET with the correct endpoint", async () => {
      vi.mocked(get).mockResolvedValue({ isSuccess: true, data: sampleHoliday });

      await getHolidayById(FAKE_ID);

      expect(get).toHaveBeenCalledWith(HOLIDAY_ENDPOINTS.GET_BY_ID(FAKE_ID));
    });

    it("propagates rejection when the holiday is not found", async () => {
      vi.mocked(get).mockRejectedValue(new Error("Holiday.NotFound"));

      await expect(getHolidayById("missing-id")).rejects.toThrow("Holiday.NotFound");
    });
  });

  describe("createHoliday", () => {
    it("calls POST with the correct endpoint and payload", async () => {
      vi.mocked(post).mockResolvedValue({ isSuccess: true, data: sampleHoliday });

      const payload = {
        name: "Tết Nguyên Đán",
        startDate: "2026-02-16",
        endDate: "2026-02-20",
        isActive: true,
      };

      await createHoliday(payload);

      expect(post).toHaveBeenCalledWith(HOLIDAY_ENDPOINTS.CREATE, payload);
    });
  });

  describe("updateHoliday", () => {
    it("calls PUT with the correct endpoint and payload", async () => {
      vi.mocked(put).mockResolvedValue({ isSuccess: true, data: sampleHoliday });

      const payload = {
        name: "Tết Updated",
        startDate: "2026-02-16",
        endDate: "2026-02-22",
        isActive: true,
      };

      await updateHoliday(FAKE_ID, payload);

      expect(put).toHaveBeenCalledWith(HOLIDAY_ENDPOINTS.UPDATE(FAKE_ID), payload);
    });
  });

  describe("toggleHolidayStatus", () => {
    it("calls PATCH with toggle-status endpoint and empty body", async () => {
      vi.mocked(patch).mockResolvedValue({
        isSuccess: true,
        data: { ...sampleHoliday, isActive: false },
      });

      await toggleHolidayStatus(FAKE_ID);

      expect(patch).toHaveBeenCalledWith(HOLIDAY_ENDPOINTS.TOGGLE_STATUS(FAKE_ID), {});
    });
  });

  describe("deleteHoliday", () => {
    it("calls DELETE with the correct endpoint", async () => {
      vi.mocked(del).mockResolvedValue({ isSuccess: true, data: { id: FAKE_ID, deleted: true } });

      await deleteHoliday(FAKE_ID);

      expect(del).toHaveBeenCalledWith(HOLIDAY_ENDPOINTS.DELETE(FAKE_ID));
    });

    it("returns the delete result", async () => {
      const mockResponse = { isSuccess: true, data: { id: FAKE_ID, deleted: true } };
      vi.mocked(del).mockResolvedValue(mockResponse);

      const result = await deleteHoliday(FAKE_ID);

      expect(result).toBe(mockResponse);
    });
  });
});
