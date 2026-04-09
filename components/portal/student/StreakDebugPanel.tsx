"use client";

import { useState } from "react";
import { Flame, Settings, X } from "lucide-react";
import { todayDateOnly } from "@/lib/datetime";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string;
  totalLogins: number;
}

interface StreakDebugPanelProps {
  onShowOverlay: (data: StreakData) => void;
}

export default function StreakDebugPanel({ onShowOverlay }: StreakDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [streakValue, setStreakValue] = useState(1);

  const presetStreaks = [
    { label: "1 ngày", value: 1, description: "Lần đầu" },
    { label: "3 ngày", value: 3, description: "Mới bắt đầu" },
    { label: "7 ngày", value: 7, description: "1 tuần" },
    { label: "15 ngày", value: 15, description: "2 tuần" },
    { label: "30 ngày", value: 30, description: "1 tháng" },
    { label: "50 ngày", value: 50, description: "Xuất sắc" },
    { label: "100 ngày", value: 100, description: "Huyền thoại" },
    { label: "365 ngày", value: 365, description: "1 năm!" },
  ];

  const handleTestStreak = (value: number) => {
    const today = todayDateOnly();
    const testData: StreakData = {
      currentStreak: value,
      longestStreak: Math.max(value, 100),
      lastLoginDate: today,
      totalLogins: value * 2,
    };
    onShowOverlay(testData);
  };

  const handleResetStreak = () => {
    if (confirm("Bạn có chắc muốn reset streak về 0?")) {
      localStorage.removeItem("student_login_streak");
      alert("Đã reset streak! Refresh trang để bắt đầu lại.");
    }
  };

  const handleSetCustomStreak = () => {
    const today = todayDateOnly();
    const customData: StreakData = {
      currentStreak: streakValue,
      longestStreak: Math.max(streakValue, 100),
      lastLoginDate: today,
      totalLogins: streakValue * 2,
    };
    
    localStorage.setItem("student_login_streak", JSON.stringify(customData));
    alert(`Đã set streak = ${streakValue}! Refresh trang để xem kết quả.`);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[9998] p-3 bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full shadow-lg transition-all hover:scale-110"
        title="Streak Debug Panel"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Flame className="w-6 h-6" />}
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-[9998] w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-orange-500 to-red-500 p-4 text-white">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              <h3 className="font-bold text-lg">Streak Debug Panel</h3>
            </div>
            <p className="text-xs opacity-90 mt-1">Test các trường hợp streak khác nhau</p>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {/* Preset Buttons */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">⚡ Test nhanh:</h4>
              <div className="grid grid-cols-2 gap-2">
                {presetStreaks.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleTestStreak(preset.value)}
                    className="p-3 bg-linear-to-br from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 border border-orange-200 rounded-lg text-left transition-all hover:scale-105"
                  >
                    <div className="text-sm font-bold text-orange-600">{preset.label}</div>
                    <div className="text-xs text-gray-600">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Streak */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">🎯 Custom streak:</h4>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={streakValue}
                  onChange={(e) => setStreakValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Nhập số ngày"
                />
                <button
                  onClick={() => handleTestStreak(streakValue)}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                >
                  Test
                </button>
              </div>
              <button
                onClick={handleSetCustomStreak}
                className="w-full mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Lưu vào localStorage
              </button>
            </div>

            {/* Reset Button */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">🔄 Actions:</h4>
              <button
                onClick={handleResetStreak}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Reset Streak
              </button>
            </div>

            {/* Instructions */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>💡 Hướng dẫn:</strong>
                <br />• "Test": Hiển thị overlay ngay lập tức
                <br />• "Lưu vào localStorage": Lưu giá trị, refresh để xem
                <br />• "Reset": Xóa hết dữ liệu streak
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
