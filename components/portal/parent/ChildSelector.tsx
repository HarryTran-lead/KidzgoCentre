"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/lightswind/avatar";
import { Badge } from "@/components/lightswind/badge";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";
import { getProfiles, selectStudent } from "@/lib/api/authService";
import { setAccessToken } from "@/lib/store/authToken";

import type { UserProfile } from "@/types/auth";

type Child = UserProfile;

export default function ChildSelector() {
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { selectedProfile, setSelectedProfile } = useSelectedStudentProfile();
 const lastSyncedProfileId = useRef<string | null>(null);
  const selectedChild = useMemo(
    () =>
      profiles.find((profile) => profile.id === selectedProfile?.id) ??
      selectedProfile,
);
const syncSelectedProfile = useCallback(
    async (child: Child) => {
      if (!child?.id) return;
      if (lastSyncedProfileId.current === child.id) return;
      lastSyncedProfileId.current = child.id;

      try {
        const response = await selectStudent({ profileId: child.id });
        const isSuccess = response.isSuccess ?? response.success ?? false;

        if (isSuccess) {
          if (response.data?.accessToken) {
            setAccessToken(response.data.accessToken);
          }

          const selected = response.data?.selectedProfile ?? child;
          const selectedWithStudentId = {
            ...selected,
            studentId: response.data?.studentId ?? selected.studentId,
          };
          setSelectedProfile(selectedWithStudentId);
          return;
        }

        setSelectedProfile(child);
      } catch (error) {
        console.error("Select student profile error:", error);
        setSelectedProfile(child);
      }
    },
    [setSelectedProfile]
  );  
  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const response = await getProfiles({ profileType: "Student" });
        const isSuccess = response.isSuccess ?? response.success ?? false;

        if (!isSuccess) {
          setErrorMessage(response.message ?? "Không thể tải danh sách học viên.");
          return;
        }

        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.profiles ?? [];

        const students = data.filter((profile) => profile.profileType === "Student");

        setProfiles(students);

        if (students.length > 0) {
          const storedSelected = selectedProfile;
          const hasSelected = storedSelected
            ? students.some((profile) => profile.id === storedSelected.id)
            : false;
const targetProfile = hasSelected ? storedSelected : students[0];

          if (targetProfile) {
            if (!hasSelected) {
              setSelectedProfile(targetProfile);
            }
            await syncSelectedProfile(targetProfile);
          }
        }
      } catch (error) {
        console.error("Fetch student profiles error:", error);
        setErrorMessage("Không thể tải danh sách học viên.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
}, [selectedProfile, setSelectedProfile, syncSelectedProfile]);
  const handleSelectChild = async (child: Child) => {
    try {
      const response = await selectStudent({ profileId: child.id });
      const isSuccess = response.isSuccess ?? response.success ?? false;

      if (isSuccess) {
         if (response.data?.accessToken) {
          setAccessToken(response.data.accessToken);
        }
        const selected = response.data?.selectedProfile ?? child;
const selectedWithStudentId = {
          ...selected,
          studentId: response.data?.studentId ?? selected.studentId,
        };
        setSelectedProfile(selectedWithStudentId);      } else {
        setSelectedProfile(child);
      }
    } catch (error) {
      console.error("Select student profile error:", error);
      setSelectedProfile(child);
    } finally {
      setOpen(false);
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        {/* Selected Child Button */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all"
          disabled={loading}
        >
          {selectedChild ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 border-2 border-slate-200 shrink-0">
                <AvatarImage src={selectedChild.avatarUrl} alt={selectedChild.displayName} />
                <AvatarFallback className="bg-slate-100 text-slate-700 font-semibold">
                  {selectedChild.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="text-left flex-1 min-w-0">
                <div className="font-semibold text-slate-900 truncate">
                  {selectedChild.displayName}
                </div>
                <Badge
                  variant="outline"
                  className="text-xs border-blue-300 text-blue-700 mt-1"
                >
                  Học viên
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              {loading ? "Đang tải học viên..." : "Chưa có học viên"}
            </div>
          )}

          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
              {errorMessage && (
                <div className="px-4 py-3 text-sm text-rose-600">{errorMessage}</div>
              )}

              {!errorMessage && profiles.length === 0 && !loading && (
                <div className="px-4 py-3 text-sm text-slate-500">
                  Không có học viên để hiển thị.
                </div>
              )}

              {profiles.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleSelectChild(child)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                    selectedProfile?.id === child.id ? "bg-blue-50" : ""
                  }`}
                >
                  <Avatar className="h-10 w-10 border-2 border-slate-200 shrink-0">
                    <AvatarImage src={child.avatarUrl} alt={child.displayName} />
                    <AvatarFallback className="bg-slate-100 text-slate-700 font-semibold">
                      {child.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="text-left flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">
                      {child.displayName}
                    </div>
                    <div className="text-xs text-slate-500 truncate">ID: {child.id}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}