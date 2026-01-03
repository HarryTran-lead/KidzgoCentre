"use client";

import { useState, useEffect } from "react";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string;
  totalLogins: number;
}

const STREAK_STORAGE_KEY = "student_login_streak";

export function useLoginStreak() {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    const storedData = localStorage.getItem(STREAK_STORAGE_KEY);

    if (!storedData) {
      // First time login
      const newStreakData: StreakData = {
        currentStreak: 1,
        longestStreak: 1,
        lastLoginDate: today,
        totalLogins: 1,
      };
      localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(newStreakData));
      setStreakData(newStreakData);
      setShowOverlay(true);
      return;
    }

    const data: StreakData = JSON.parse(storedData);
    const lastLogin = new Date(data.lastLoginDate);
    const currentDate = new Date(today);
    
    // Calculate days difference
    const daysDiff = Math.floor(
      (currentDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) {
      // Same day login - don't show overlay
      setStreakData(data);
      setShowOverlay(false);
    } else if (daysDiff === 1) {
      // Consecutive day login - increase streak
      const newStreak = data.currentStreak + 1;
      const updatedData: StreakData = {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, data.longestStreak),
        lastLoginDate: today,
        totalLogins: data.totalLogins + 1,
      };
      localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(updatedData));
      setStreakData(updatedData);
      setShowOverlay(true);
    } else {
      // Streak broken - reset to 1
      const updatedData: StreakData = {
        currentStreak: 1,
        longestStreak: data.longestStreak,
        lastLoginDate: today,
        totalLogins: data.totalLogins + 1,
      };
      localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(updatedData));
      setStreakData(updatedData);
      setShowOverlay(true);
    }
  }, []);

  const closeOverlay = () => {
    setShowOverlay(false);
  };

  return {
    streakData,
    showOverlay,
    closeOverlay,
  };
}
