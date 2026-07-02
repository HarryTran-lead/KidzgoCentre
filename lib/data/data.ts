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
    title: "Khơi dậy sự yêu thích tiếng Anh cho bé",
    level: "Tiền tiểu học",
    time: "2 × 60' / tuần",
    badge: "Làm quen tiếng Anh",
    desc: "Dành cho trẻ tiền tiểu học, giúp bé làm quen với tiếng Anh qua hoạt động vui nhộn, hình ảnh, trò chơi và giao tiếp tự nhiên.",
    img: "/image/Club1.JPG",
    href: "#contact",
    cta: "Nhận tư vấn",
    theme: "rose",
  },
  {
    title: "Cambridge Starters, Movers, Flyers",
    level: "Tiểu học",
    time: "2 × 90' / tuần",
    badge: "Cambridge",
    desc: "Chương trình xây nền tiếng Anh chuẩn Cambridge, phát triển đủ 4 kỹ năng Nghe – Nói – Đọc – Viết.",
    img: "/image/Club4.JPG",
    href: "#contact",
    cta: "Nhận tư vấn",
    highlight: true,
    theme: "amber",
  },
  {
    title: "KET, PET, Tiền IELTS",
    level: "Trung học",
    time: "2–3 buổi / tuần",
    badge: "Luyện thi quốc tế",
    desc: "Giúp học sinh nâng cấp năng lực tiếng Anh học thuật, làm quen dạng bài thi quốc tế và chuẩn bị nền tảng cho IELTS.",
    img: "/image/Club5.JPG",
    href: "#contact",
    cta: "Nhận tư vấn",
    theme: "sky",
  },
  {
    title: "Phonics",
    level: "Nền tảng phát âm",
    time: "2 × 60' / tuần",
    badge: "Phát âm chuẩn",
    desc: "Giúp học sinh phát âm chuẩn, nhận diện âm, ghép âm, đọc từ và cải thiện khả năng nghe – nói từ nền tảng.",
    img: "/image/Club6.JPG",
    href: "#contact",
    cta: "Nhận tư vấn",
    theme: "emerald",
  },
  {
    title: "Kèm LMS, chương trình tích hợp",
    level: "Theo chương trình học",
    time: "Linh hoạt theo lộ trình",
    badge: "Hỗ trợ trên lớp",
    desc: "Hỗ trợ học sinh theo sát chương trình trên lớp, củng cố kiến thức, luyện bài tập, cải thiện điểm số và khả năng tự học.",
    img: "/image/Club7.JPG",
    href: "#contact",
    cta: "Nhận tư vấn",
    theme: "violet",
  },
  {
    title: "Giao tiếp / Thuyết trình",
    level: "Speaking & Presentation",
    time: "2 × 90' / tuần",
    badge: "Tự tin giao tiếp",
    desc: "Giúp học sinh tự tin nói tiếng Anh, luyện phản xạ, trình bày ý tưởng và phát triển khả năng thuyết trình.",
    img: "/image/BackGroundStudent.png",
    href: "#contact",
    cta: "Nhận tư vấn",
    theme: "orange",
  },
  {
    title: "Kỹ năng phát triển bản thân / Ngoại khóa",
    level: "Kỹ năng mềm",
    time: "Theo hoạt động ngoại khóa",
    badge: "Phát triển toàn diện",
    desc: "Kết hợp tiếng Anh với hoạt động ngoại khóa, kỹ năng mềm, làm việc nhóm, tư duy sáng tạo và sự tự tin trong giao tiếp.",
    img: "/image/Club8.JPG",
    href: "#contact",
    cta: "Nhận tư vấn",
    theme: "cyan",
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
    excerpt: "Cấu trúc đề & cách luyện đều – chắc – vui tại Rex.",
    tag: "Cambridge",
  },
  {
    title: "Checklist xin học bổng trung học Mỹ",
    img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop",
    excerpt: "Chuẩn bị hồ sơ, hoạt động ngoại khoá & chứng chỉ.",
    tag: "Học bổng",
  },
];

// lib/data/data.ts
export const GALLERY = [
  "/image/Club1.JPG",
  "/image/Club13.JPG",
  "/image/Club15.JPG",   // convert từ HEIC
  "/image/Club4.JPG",
  "/image/Club5.JPG",
  "/image/Club6.JPG",
  "/image/Club7.JPG",
  "/image/Club8.JPG",
  "/image/Club9.JPG",
  "/image/Club10.JPG",
  "/image/Club16.JPG",  // convert từ HEIC
  "/image/Club12.JPG",
];
