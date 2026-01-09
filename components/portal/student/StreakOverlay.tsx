"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Flame, X, Trophy, Calendar, Star } from "lucide-react";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string;
  totalLogins: number;
}

interface StreakOverlayProps {
  streakData: StreakData;
  onClose: () => void;
}

export default function StreakOverlay({ streakData, onClose }: StreakOverlayProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Trigger confetti animation
    if (show && streakData.currentStreak > 0) {
      // Tạo canvas cho confetti với z-index cao hơn
      const canvas = document.createElement("canvas");
      canvas.style.position = "fixed";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.zIndex = "99999"; // Cao hơn overlay
      canvas.style.pointerEvents = "none"; // Không chặn click
      document.body.appendChild(canvas);

      const myConfetti = confetti.create(canvas, {
        resize: true,
        useWorker: true,
      });

      const duration = 4000;
      const animationEnd = Date.now() + duration;
      
      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        // Bắn pháo hoa từ nhiều vị trí
        myConfetti({
          particleCount,
          startVelocity: 35,
          spread: 360,
          ticks: 200,
          gravity: 0.8,
          origin: {
            x: randomInRange(0.1, 0.9),
            y: Math.random() - 0.2,
          },
          colors: ["#FFD700", "#FFA500", "#FF6347", "#FF69B4", "#00CED1", "#9333EA", "#22C55E"],
          shapes: ["circle", "square", "star"],
          scalar: randomInRange(1, 1.5),
        });
      }, 200);

      return () => {
        clearInterval(interval);
        // Cleanup canvas sau khi unmount
        setTimeout(() => {
          if (canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
        }, 100);
      };
    }
  }, [show, streakData.currentStreak]);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  const isNewRecord = streakData.currentStreak === streakData.longestStreak && streakData.currentStreak > 1;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="relative max-w-2xl w-full mx-4 bg-linear-to-br from-orange-500 via-red-500 to-pink-500 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Content */}
            <div className="relative p-8 md:p-12">
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
              </div>

              {/* Main content */}
              <div className="relative text-center text-white space-y-6">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="flex justify-center"
                >
                  <div className="relative">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
                    >
                      <Flame className="w-20 h-20 text-yellow-300 drop-shadow-lg" fill="currentColor" />
                    </motion.div>
                    
                    {/* Streak number badge */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                      className="absolute -bottom-2 -right-2 bg-yellow-400 text-orange-600 font-black text-2xl w-16 h-16 rounded-full flex items-center justify-center border-4 border-white shadow-xl"
                    >
                      {streakData.currentStreak}
                    </motion.div>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h1 className="text-4xl md:text-5xl font-black mb-2">
                    {isNewRecord ? "KỶ LỤC MỚI 🏆" : "TIẾP TỤC PHÁT HUY 🔥"}
                  </h1>
                  <p className="text-xl md:text-2xl font-semibold">
                    Bạn đã đăng nhập{" "}
                    <span className="text-yellow-300 font-black text-3xl">
                      {streakData.currentStreak}
                    </span>{" "}
                    ngày liên tiếp!
                  </p>
                </motion.div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-3 gap-4 py-6"
                >
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
                    <p className="text-sm opacity-90">Streak hiện tại</p>
                    <p className="text-2xl font-black">{streakData.currentStreak}</p>
                  </div>
                  
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                    <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
                    <p className="text-sm opacity-90">Kỷ lục</p>
                    <p className="text-2xl font-black">{streakData.longestStreak}</p>
                  </div>
                  
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                    <Star className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
                    <p className="text-sm opacity-90">Tổng đăng nhập</p>
                    <p className="text-2xl font-black">{streakData.totalLogins}</p>
                  </div>
                </motion.div>

                {/* <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
                >
                  <p className="text-lg font-semibold">
                    {getMotivationalMessage(streakData.currentStreak)}
                  </p>
                </motion.div> */}

                {/* Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={handleClose}
                  className="bg-white text-orange-600 font-black text-lg px-8 py-4 rounded-full hover:bg-yellow-300 hover:scale-105 transition-all shadow-xl"
                >
                  Tiếp tục học tập! 🚀
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getMotivationalMessage(streak: number): string {
  if (streak === 1) {
    return "🎉 Chào mừng bạn quay lại! Hãy tiếp tục duy trì streak này nhé!";
  } else if (streak < 7) {
    return `🌟 Tuyệt vời! Còn ${7 - streak} ngày nữa để đạt 1 tuần streak!`;
  } else if (streak === 7) {
    return "🎊 Xuất sắc! Bạn đã hoàn thành 1 tuần đăng nhập liên tiếp!";
  } else if (streak < 30) {
    return `🔥 Đỉnh cao! Bạn đang trên đà chinh phục 1 tháng streak! (${30 - streak} ngày nữa)`;
  } else if (streak === 30) {
    return "👑 HUYỀN THOẠI! Bạn đã đạt 1 tháng streak! Không gì có thể cản bạn!";
  } else if (streak < 100) {
    return `💎 Không thể tin được! Streak của bạn đã vượt xa mong đợi! Tiếp tục phát huy nhé!`;
  } else {
    return "🌈 BẠN LÀ HUYỀN THOẠI SỐNG! Streak 100+ ngày là thành tích phi thường!";
  }
}
