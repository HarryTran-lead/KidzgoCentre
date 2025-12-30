"use client";

import { useState } from "react";
import { useLoginStreak } from "@/hooks/useLoginStreak";
import StreakOverlay from "@/components/student/StreakOverlay";
import StreakDebugPanel from "@/components/student/StreakDebugPanel";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string;
  totalLogins: number;
}

export default function StudentStreakWrapper({ children }: { children: React.ReactNode }) {
  const { streakData, showOverlay, closeOverlay } = useLoginStreak();
  const [debugStreakData, setDebugStreakData] = useState<StreakData | null>(null);
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);

  const handleDebugShowOverlay = (data: StreakData) => {
    setDebugStreakData(data);
    setShowDebugOverlay(true);
  };

  const handleDebugCloseOverlay = () => {
    setShowDebugOverlay(false);
    setDebugStreakData(null);
  };

  return (
    <>
      {children}
      
      {/* Real streak overlay */}
      {showOverlay && streakData && (
        <StreakOverlay streakData={streakData} onClose={closeOverlay} />
      )}
      
      {/* Debug streak overlay */}
      {showDebugOverlay && debugStreakData && (
        <StreakOverlay streakData={debugStreakData} onClose={handleDebugCloseOverlay} />
      )}
      
      {/* Debug panel - chỉ hiển thị trong development */}
      {process.env.NODE_ENV === "development" && (
        <StreakDebugPanel onShowOverlay={handleDebugShowOverlay} />
      )}
    </>
  );
}
