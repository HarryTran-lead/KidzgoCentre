// lib/data.ts
import { Users, Award, Clock, Globe, Star, GraduationCap } from "lucide-react";

export const STATS = [
  { num: "10,000+", label: "Học viên" },
  { num: "50+", label: "Giáo viên" },
  { num: "95%", label: "Hài lòng" },
];

export const WHY = [
  {
    icon: Users,
    title: "Lớp nhỏ",
    desc: "Tối đa 8 học viên – cá nhân hoá cao.",
  },
  {
    icon: Award,
    title: "GV chuẩn quốc tế",
    desc: "Kinh nghiệm luyện thi & giao tiếp cho trẻ em.",
  },
  { icon: Clock, title: "Lịch linh hoạt", desc: "Sáng/chiều/tối & cuối tuần." },
  { icon: Globe, title: "Ứng dụng thực tế", desc: "Dự án – CLB – field trip." },
  {
    icon: Star,
    title: "Kết quả đo lường",
    desc: "Theo dõi tiến bộ hàng tuần.",
  },
  {
    icon: GraduationCap,
    title: "Test đầu vào/ra",
    desc: "Miễn phí & chính xác.",
  },
];

export const COURSES = [
  {
    title: "General English",
    level: "All Levels",
    time: "2 × 90’ / tuần",
    badge: "Adults",
    img: "https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1400&auto=format&fit=crop",
  },
  {
    title: "IELTS Intensive",
    level: "Intermediate+",
    time: "3 × 90’ / tuần",
    badge: "Exam",
    img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1400&auto=format&fit=crop",
    highlight: true,
  },
  {
    title: "Kids & Teens",
    level: "6–17 tuổi",
    time: "2 × 60’ / tuần",
    badge: "Young Learners",
    img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1400&auto=format&fit=crop",
  },
];

export const PROGRAM_BOXES = [
  {
    title: "1. Cambridge (Starters–Movers–Flyers)",
    bullets: [
      "Mục tiêu học bổng",
      "Đánh vần chuẩn Mỹ – phát âm tự nhiên",
      "Song song Cambridge → IELTS",
    ],
  },
  {
    title: "2. Giao tiếp phản xạ",
    bullets: [
      "Tình huống & role-play",
      "Tăng vốn từ và flow khi nói",
      "Speaking task mỗi buổi",
    ],
  },
  {
    title: "3. Khơi dậy yêu thích",
    bullets: [
      "Trò chơi, âm nhạc, kể chuyện",
      "Hình thành thói quen nghe–nói",
      "Báo cáo tiến bộ cho PH",
    ],
  },
  {
    title: "4. Kỹ năng & Dự án",
    bullets: [
      "Kỹ năng mềm, phản biện",
      "Dự án văn hoá bằng TA",
      "Review hàng tuần",
    ],
  },
  {
    title: "5. Hoạt động ngoại khoá",
    bullets: [
      "City tour, field trip",
      "Tự lập & teamwork",
      "Ứng dụng TA ngoài lớp",
    ],
  },
];

export const TESTIMONIALS = [
  {
    name: "Minh Anh",
    score: "5.5 → 7.5",
    quote: "Giáo viên tận tâm, phương pháp dễ hiểu – tiến bộ rất nhanh!",
  },
  {
    name: "Thanh Long",
    score: "Beginner → B2",
    quote: "Tự tin giao tiếp sau 3 tháng. Lớp nhỏ nên được sửa rất kỹ.",
  },
  {
    name: "Mai Linh",
    score: "6.0 → 8.0",
    quote: "Đậu trường mơ ước. Cảm ơn thầy cô đã đồng hành!",
  },
];

export const BLOGS = [
  {
    title: "5 mẹo sửa phát âm cho bé tại nhà",
    img: "https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=1200&auto=format&fit=crop",
    excerpt: "Hoạt động đơn giản giúp bé tự tin nói tiếng Anh mỗi ngày.",
    tag: "Kỹ năng",
  },
  {
    title: "Cambridge: Starters → Movers → Flyers",
    img: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1200&auto=format&fit=crop",
    excerpt: "Cấu trúc đề & cách luyện đều – chắc – vui tại KidzGo.",
    tag: "Cambridge",
  },
  {
    title: "Checklist xin học bổng trung học Mỹ",
    img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop",
    excerpt: "Chuẩn bị hồ sơ, hoạt động ngoại khoá & chứng chỉ.",
    tag: "Học bổng",
  },
];

export const GALLERY = Array.from(
  { length: 12 },
  (_, i) => `/image/Club${i + 1}.jpg`
);
