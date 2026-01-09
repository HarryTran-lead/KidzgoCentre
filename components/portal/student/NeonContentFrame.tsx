'use client';

import { ReactNode } from "react";

type NeonContentFrameProps = {
  children: ReactNode;
  className?: string;
};

export default function NeonContentFrame({ children, className = "" }: NeonContentFrameProps) {
  // Màu cơ bản vẫn là Cyan và Blue, nhưng chúng ta sẽ dùng nhiều màu trắng hơn trong filter
  const neonBase = '0, 229, 255'; // Cyan
  const neonAccent = '0, 100, 255'; // Blue

  return (
    <div className={`relative h-full ${className}`}>
      {/* Neon border frame - Đặt z-index cao hơn để nổi lên trên */}
      <div 
        className="absolute inset-0 rounded-[2rem] pointer-events-none z-20"
        style={{
          // CẬP NHẬT 1: Gradient thêm nhiều SẮC TRẮNG (#ffffff) xen kẽ để tạo lõi sáng chói
          background: `linear-gradient(90deg, rgb(${neonBase}), #ffffff, rgb(${neonAccent}), #ffffff, rgb(${neonBase}))`,
          
          padding: '3px', 
          
          // Masking giữ nguyên để tạo viền rỗng
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          
          // CẬP NHẬT 2: Bộ lọc Filter tạo hiệu ứng LÓA TRẮNG mạnh mẽ
          // Xếp chồng nhiều lớp bóng trắng ở gần để tạo độ chói
          filter: `
            drop-shadow(0 0 1px rgba(255, 255, 255, 1.0))   /* Lõi trắng tinh khiết cực nét */
            drop-shadow(0 0 3px rgba(255, 255, 255, 1.0))   /* Hào quang trắng lóa ngay sát viền */
            drop-shadow(0 0 10px rgba(${neonBase}, 0.9))    /* Lớp màu chính sáng rực */
            drop-shadow(0 0 30px rgba(${neonAccent}, 0.6))  /* Lớp lan tỏa màu xanh rộng hơn */
            drop-shadow(0 0 60px rgba(255, 255, 255, 0.4))  /* Lớp sương trắng ngoài cùng tạo cảm giác chói mắt */
            brightness(1.2) /* Tăng tổng độ sáng lên 20% */
          `,
          animation: 'neonPulseGlare 3s ease-in-out infinite'
        }}
      />
      
      {/* CẬP NHẬT 3: Giảm mạnh opacity các góc sáng 
         Để chúng chỉ là ánh sáng nhẹ, không làm đục/mờ nền 
      */}
      <div className="absolute top-0 left-0 w-40 h-40 rounded-tl-[2rem] bg-cyan-400/10 blur-3xl pointer-events-none mix-blend-screen z-10" />
      <div className="absolute top-0 right-0 w-40 h-40 rounded-tr-[2rem] bg-blue-400/10 blur-3xl pointer-events-none mix-blend-screen z-10" />
      <div className="absolute bottom-0 left-0 w-40 h-40 rounded-bl-[2rem] bg-cyan-400/10 blur-3xl pointer-events-none mix-blend-screen z-10" />
      <div className="absolute bottom-0 right-0 w-40 h-40 rounded-br-[2rem] bg-blue-400/10 blur-3xl pointer-events-none mix-blend-screen z-10" />

      <div className="relative h-full rounded-[2rem] overflow-hidden z-0">
        {children}
      </div>

      <style jsx>{`
        // CẬP NHẬT 5: Animation mới phù hợp với độ lóa cao
        @keyframes neonPulseGlare {
          0%, 100% {
            opacity: 1;
            filter: 
                drop-shadow(0 0 1px rgba(255, 255, 255, 1.0))
                drop-shadow(0 0 3px rgba(255, 255, 255, 1.0))
                drop-shadow(0 0 10px rgba(${neonBase}, 0.9)) 
                drop-shadow(0 0 30px rgba(${neonAccent}, 0.6))
                drop-shadow(0 0 60px rgba(255, 255, 255, 0.4))
                brightness(1.2);
          }
          50% {
            opacity: 2;
            filter: 
                drop-shadow(0 0 1px rgba(255, 255, 255, 0.9))
                drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))
                drop-shadow(0 0 8px rgba(${neonBase}, 0.7)) 
                drop-shadow(0 0 25px rgba(${neonAccent}, 0.4))
                drop-shadow(0 0 50px rgba(255, 255, 255, 0.2))
                brightness(1);
          }
        }
      `}</style>
    </div>
  );
}