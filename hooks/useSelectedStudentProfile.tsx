"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserProfile } from "@/types/auth";

const STORAGE_KEY = "selectedProfile";
const EVENT_NAME = "selected-profile-changed";

type SelectedProfile = UserProfile | null;

const readSelectedProfile = (): SelectedProfile => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
};

const writeSelectedProfile = (profile: SelectedProfile) => {
  if (typeof window === "undefined") return;
  if (profile) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  window.dispatchEvent(new Event(EVENT_NAME));
};

export function useSelectedStudentProfile() {
  const [selectedProfile, setSelectedProfileState] = useState<SelectedProfile>(
    () => readSelectedProfile()
  );

  useEffect(() => {
    const handleChange = () => {
      setSelectedProfileState(readSelectedProfile());
    };

    window.addEventListener(EVENT_NAME, handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener(EVENT_NAME, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const setSelectedProfile = useCallback((profile: SelectedProfile) => {
    writeSelectedProfile(profile);
    setSelectedProfileState(profile);
  }, []);

  return { selectedProfile, setSelectedProfile };
}