import { describe, expect, it } from "vitest";

import {
  buildCreateClassPayload,
  buildUpdateClassPayload,
} from "@/lib/api/classPayload";

describe("classPayload", () => {
  const baseInput = {
    branchId: "da316382-35e8-4094-a99b-ce45e5f2627a",
    programId: "48eba459-7a08-4461-b1f9-acec097c6185",
    syllabusId: "fc9377a8-ff50-4390-9a80-cfe49cc61b4b",
    levelId: "fab421d5-89e0-43e7-b058-ab37f9d48a87",
    startModuleId: "a4850df1-5ce3-4f97-a63c-365d4aea5318",
    startSessionIndex: 1,
    code: "CLS-001",
    name: "Starters Mon-Wed 18:00",
    description: "string",
    mainTeacherId: "3a32f148-d21c-4a01-b346-cdc31df755b2",
    assistantTeacherId: "",
    roomId: "44444444-4444-4444-4444-444444444304",
    startDate: "2026-03-24",
    endDate: "2026-06-24",
    capacity: 20,
    sessionsToGenerate: 80,
    skipHolidays: true,
    weeklyScheduleSlots: [
      {
        dayOfWeek: "MO" as const,
        startTime: "18:00",
        durationMinutes: 90,
      },
      {
        dayOfWeek: "WE" as const,
        startTime: "18:00",
        durationMinutes: 90,
      },
    ],
  };

  it("builds create payload with syllabusId and null optional GUIDs", () => {
    expect(buildCreateClassPayload(baseInput)).toEqual({
      branchId: "da316382-35e8-4094-a99b-ce45e5f2627a",
      programId: "48eba459-7a08-4461-b1f9-acec097c6185",
      syllabusId: "fc9377a8-ff50-4390-9a80-cfe49cc61b4b",
      levelId: "fab421d5-89e0-43e7-b058-ab37f9d48a87",
      startModuleId: "a4850df1-5ce3-4f97-a63c-365d4aea5318",
      startSessionIndex: 1,
      code: "CLS-001",
      name: "Starters Mon-Wed 18:00",
      title: "Starters Mon-Wed 18:00",
      description: "string",
      mainTeacherId: "3a32f148-d21c-4a01-b346-cdc31df755b2",
      assistantTeacherId: null,
      roomId: "44444444-4444-4444-4444-444444444304",
      startDate: "2026-03-24",
      endDate: "2026-06-24",
      capacity: 20,
      sessionsToGenerate: 80,
      skipHolidays: true,
      weeklyScheduleSlots: [
        {
          dayOfWeek: "MO",
          startTime: "18:00",
          durationMinutes: 90,
        },
        {
          dayOfWeek: "WE",
          startTime: "18:00",
          durationMinutes: 90,
        },
      ],
    });
  });

  it("builds update payload without create-only fields", () => {
    expect(buildUpdateClassPayload(baseInput)).toEqual({
      branchId: "da316382-35e8-4094-a99b-ce45e5f2627a",
      programId: "48eba459-7a08-4461-b1f9-acec097c6185",
      syllabusId: "fc9377a8-ff50-4390-9a80-cfe49cc61b4b",
      levelId: "fab421d5-89e0-43e7-b058-ab37f9d48a87",
      startModuleId: "a4850df1-5ce3-4f97-a63c-365d4aea5318",
      startSessionIndex: 1,
      code: "CLS-001",
      name: "Starters Mon-Wed 18:00",
      title: "Starters Mon-Wed 18:00",
      description: "string",
      mainTeacherId: "3a32f148-d21c-4a01-b346-cdc31df755b2",
      assistantTeacherId: null,
      roomId: "44444444-4444-4444-4444-444444444304",
      startDate: "2026-03-24",
      endDate: "2026-06-24",
      capacity: 20,
      weeklyScheduleSlots: [
        {
          dayOfWeek: "MO",
          startTime: "18:00",
          durationMinutes: 90,
        },
        {
          dayOfWeek: "WE",
          startTime: "18:00",
          durationMinutes: 90,
        },
      ],
    });
  });

  it("throws when syllabusId is missing", () => {
    expect(() =>
      buildCreateClassPayload({
        ...baseInput,
        syllabusId: "   ",
      }),
    ).toThrow("Syllabus is required");
  });
});
